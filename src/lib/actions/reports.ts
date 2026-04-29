"use server";

import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, items } from "../../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/server";

// Validation Schemas
const voidOrderSchema = z.object({
  orderId: z.string().length(12),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(255),
});

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Retrieves daily sales aggregates within a given date range.
 */
export async function getDailySalesAction(startDate: Date, endDate: Date): Promise<ActionResponse> {
  try {
    const results = await db
      .select({
        date: sql<string>`DATE_TRUNC('day', ${orders.createdAt})::text`,
        total: sql<number>`SUM(${orders.total})::float`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "DONE"),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE_TRUNC('day', ${orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('day', ${orders.createdAt})`);

    return { success: true, data: results };
  } catch (error: any) {
    console.error("getDailySalesAction error:", error);
    return { success: false, error: "Failed to fetch daily sales" };
  }
}

/**
 * Retrieves the top selling items by quantity.
 */
export async function getTopItemsAction(limit: number = 5): Promise<ActionResponse> {
  try {
    const results = await db
      .select({
        name: items.name,
        quantity: sql<number>`SUM(${orderItems.quantity})::int`,
      })
      .from(orderItems)
      .innerJoin(items, eq(orderItems.itemId, items.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "DONE"))
      .groupBy(items.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);

    return { success: true, data: results };
  } catch (error: any) {
    console.error("getTopItemsAction error:", error);
    return { success: false, error: "Failed to fetch top items" };
  }
}

/**
 * Fetches order history based on provided filters.
 */
export async function getOrderHistoryAction(filters: { status?: "PENDING" | "DONE" | "VOID"; date?: Date }): Promise<ActionResponse> {
  try {
    const conditions = [];
    if (filters.status) conditions.push(eq(orders.status, filters.status));
    if (filters.date) {
      const dayStart = new Date(filters.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(filters.date);
      dayEnd.setHours(23, 59, 59, 999);
      conditions.push(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)));
    }

    const results = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(orders.createdAt)],
      with: {
        user: true,
        orderItems: {
          with: {
            item: true,
          }
        }
      },
      limit: 50,
    });

    return { success: true, data: results };
  } catch (error: any) {
    console.error("getOrderHistoryAction error:", error);
    return { success: false, error: "Failed to fetch order history" };
  }
}

/**
 * Voids a specific order.
 * Note: Reason is validated but not persisted as the schema does not support it.
 */
export async function voidOrderAction(orderId: string, reason: string): Promise<ActionResponse> {
  const { user } = await getCurrentSession();
  if (!user || (user.role !== "ADMIN" && user.role !== "CASHIER")) {
    return { success: false, error: "Unauthorized" };
  }

  const validated = voidOrderSchema.safeParse({ orderId, reason });
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  try {
    // Audit timestamp is implicitly orders.createdAt in this simple schema, 
    // but in a real app we'd have a voidedAt/voidedBy column.
    await db
      .update(orders)
      .set({ status: "VOID" })
      .where(eq(orders.id, orderId));

    console.log(`Order ${orderId} voided by ${user.name} for reason: ${reason} at ${new Date().toISOString()}`);

    revalidatePath("/orders");
    revalidatePath("/reports");
    return { success: true };
  } catch (error: any) {
    console.error("voidOrderAction error:", error);
    return { success: false, error: "Failed to void order" };
  }
}

/**
 * Fetches data required for printing a receipt.
 */
export async function getReceiptDataAction(orderId: string): Promise<ActionResponse> {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        user: true,
        orderItems: {
          with: {
            item: true,
            orderModifiers: {
              with: {
                modifier: true,
              }
            }
          }
        }
      }
    });

    if (!order) return { success: false, error: "Order not found" };

    return { success: true, data: order };
  } catch (error: any) {
    console.error("getReceiptDataAction error:", error);
    return { success: false, error: "Failed to fetch receipt data" };
  }
}
