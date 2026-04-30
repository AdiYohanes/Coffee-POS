"use server";

import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, items, categories } from "../../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, count, sum, ne } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";

// --- Schemas ---

const dateRangeSchema = z.object({
  start: z.coerce.date({ required_error: "Start date is required" }),
  end: z.coerce.date({ required_error: "End date is required" }),
});

const topItemsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
});

const voidOrderSchema = z.object({
  orderId: z.string().length(12, "Invalid order ID format"),
  reason: z.string().min(5, "Void reason must be at least 5 characters").max(200),
});

const receiptInputSchema = z.object({
  orderId: z.string().length(12, "Invalid order ID format"),
});

// --- Types ---

export type ActionResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

export type DailySalesData = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopItemData = {
  name: string;
  quantity: number;
  revenue: number;
};

export type ReceiptData = any; // Will be detailed in implementation

// --- Actions ---

/**
 * Fetches sales grouped by day within a date range.
 */
export async function getDailySalesAction(input: unknown): Promise<ActionResponse<DailySalesData[]>> {
  const { user } = await getCurrentSession();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  try {
    const validated = dateRangeSchema.parse(input);
    
    // Group by date logic using SQL aggregation
    // Converting to local date (simplified for this task)
    const data = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sql<number>`SUM(CASE WHEN ${orders.status} != 'VOID' THEN ${orders.total} ELSE 0 END)::float`,
        orders: sql<number>`COUNT(${orders.id})::int`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, validated.start),
          lte(orders.createdAt, validated.end)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    return { success: true, data: data as DailySalesData[] };
  } catch (error: any) {
    console.error("getDailySalesAction error:", error);
    return { success: false, error: error.message || "Failed to fetch daily sales" };
  }
}

/**
 * Fetches top selling items up to a limit.
 */
export async function getTopItemsAction(input: unknown): Promise<ActionResponse<TopItemData[]>> {
  const { user } = await getCurrentSession();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  try {
    const validated = topItemsSchema.parse(input);

    const data = await db
      .select({
        name: items.name,
        quantity: sql<number>`SUM(${orderItems.quantity})::int`,
        revenue: sql<number>`SUM(${orderItems.subtotal})::float`,
      })
      .from(orderItems)
      .innerJoin(items, eq(orderItems.itemId, items.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(ne(orders.status, "VOID"))
      .groupBy(items.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(validated.limit);

    return { success: true, data: data as TopItemData[] };
  } catch (error: any) {
    console.error("getTopItemsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch top items" };
  }
}

/**
 * Voids an order with a mandatory reason.
 * Note: Reason is logged since schema does not support void_reason field.
 */
export async function voidOrderAction(input: unknown): Promise<ActionResponse<any>> {
  const { user } = await getCurrentSession();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const validated = voidOrderSchema.parse(input);

    // Audit log (stdout for now as per schema constraints)
    console.log(`[AUDIT][${new Date().toISOString()}] User ${user.id} voided order ${validated.orderId}. Reason: ${validated.reason}`);

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: "VOID" })
      .where(eq(orders.id, validated.orderId))
      .returning();

    if (!updatedOrder) return { success: false, error: "Order not found" };

    revalidatePath("/orders");
    revalidatePath("/reports");
    
    return { success: true, data: updatedOrder };
  } catch (error: any) {
    console.error("voidOrderAction error:", error);
    return { success: false, error: error.message || "Failed to void order" };
  }
}

/**
 * Retrieves formatted receipt data.
 */
export async function getReceiptDataAction(input: unknown): Promise<ActionResponse<any>> {
  try {
    const validated = receiptInputSchema.parse(input);

    const orderData = await db.query.orders.findFirst({
      where: eq(orders.id, validated.orderId),
      with: {
        user: true,
        orderItems: {
          with: {
            item: true,
            orderModifiers: {
              with: {
                modifier: true
              }
            }
          }
        }
      }
    });

    if (!orderData) return { success: false, error: "Order not found" };

    return { success: true, data: orderData };
  } catch (error: any) {
    console.error("getReceiptDataAction error:", error);
    return { success: false, error: error.message || "Failed to fetch receipt data" };
  }
}

/**
 * Fetch KPI summary for dashboard
 */
export async function getKPISummaryAction(input: unknown): Promise<ActionResponse<any>> {
  const { user } = await getCurrentSession();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  try {
    const validated = dateRangeSchema.parse(input);

    const result = await db
      .select({
        revenue: sql<number>`SUM(CASE WHEN ${orders.status} != 'VOID' THEN ${orders.total} ELSE 0 END)::float`,
        count: sql<number>`COUNT(CASE WHEN ${orders.status} != 'VOID' THEN 1 ELSE NULL END)::int`,
        voidLoss: sql<number>`SUM(CASE WHEN ${orders.status} = 'VOID' THEN ${orders.total} ELSE 0 END)::float`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, validated.start),
          lte(orders.createdAt, validated.end)
        )
      );

    return { success: true, data: result[0] || { revenue: 0, count: 0, voidLoss: 0 } };
  } catch (error: any) {
    console.error("getKPISummaryAction error:", error);
    return { success: false, error: "Failed to fetch KPI summary" };
  }
}

/**
 * Fetch all orders for history
 */
export async function getOrderHistoryAction(): Promise<ActionResponse<any[]>> {
  const { user } = await getCurrentSession();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const history = await db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      limit: 100,
      with: {
        user: true,
        orderItems: {
          with: {
            item: true
          }
        }
      }
    });

    return { success: true, data: history };
  } catch (error: any) {
    console.error("getOrderHistoryAction error:", error);
    return { success: false, error: "Failed to fetch order history" };
  }
}
