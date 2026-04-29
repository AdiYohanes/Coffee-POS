"use server";

import { z } from "zod";
import { db } from "@/db";
import { categories, items, modifiers, orders, orderItems, orderModifiers } from "../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

// Schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    modifiers: z.array(z.string()).optional(),
    price: z.number(),
    name: z.string()
  })).min(1, "Cart cannot be empty"),
  totalAmount: z.number().positive("Total must be positive"),
  subtotal: z.number(),
  tax: z.number(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(["PENDING", "DONE", "VOID"]),
});

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Fetch all categories with their items and modifiers for the menu.
 */
export async function getMenuAction(): Promise<ActionResponse> {
  try {
    const menu = await db.query.categories.findMany({
      where: isNull(categories.deletedAt),
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
      with: {
        items: {
          where: isNull(items.deletedAt),
          with: {
            modifiers: {
              where: isNull(modifiers.deletedAt),
            },
          },
        },
      },
    });
    return { success: true, data: menu };
  } catch (error: any) {
    console.error("getMenuAction error:", error);
    return { success: false, error: "Failed to fetch menu" };
  }
}

/**
 * Create a new order with items and modifiers.
 */
export async function createOrderAction(payload: z.infer<typeof createOrderSchema>): Promise<ActionResponse> {
  const { user } = await getCurrentSession();
  if (!user) return { success: false, error: "Unauthorized" };

  const validated = createOrderSchema.safeParse(payload);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  try {
    const orderId = nanoid(12);
    
    await db.transaction(async (tx) => {
      // Create Order
      await tx.insert(orders).values({
        id: orderId,
        userId: user.id,
        status: "PENDING",
        subtotal: payload.subtotal.toString(),
        tax: payload.tax.toString(),
        total: payload.totalAmount.toString(),
      });

      // Create Order Items
      for (const item of payload.items) {
        const orderItemId = nanoid(12);
        await tx.insert(orderItems).values({
          id: orderItemId,
          orderId,
          itemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price.toString(),
          subtotal: (item.price * item.quantity).toString(),
        });

        // Create Order Item Modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifierId of item.modifiers) {
            const [mod] = await tx.select().from(modifiers).where(eq(modifiers.id, modifierId));
            if (mod) {
              await tx.insert(orderModifiers).values({
                id: nanoid(12),
                orderItemId,
                modifierId,
                price: mod.additionalPrice,
              });
            }
          }
        }
      }
    });

    revalidatePath("/pos");
    return { success: true, data: { orderId } };
  } catch (error: any) {
    console.error("createOrderAction error:", error);
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Fetch all active (PENDING) orders.
 */
export async function getActiveOrdersAction(): Promise<ActionResponse> {
  try {
    const activeOrders = await db.query.orders.findMany({
      where: eq(orders.status, "PENDING"),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        orderItems: {
          with: {
            item: true,
            orderModifiers: {
              with: {
                modifier: true,
              }
            }
          }
        },
        user: true,
      }
    });
    return { success: true, data: activeOrders };
  } catch (error: any) {
    console.error("getActiveOrdersAction error:", error);
    return { success: false, error: "Failed to fetch active orders" };
  }
}

/**
 * Update order status (PENDING -> DONE / VOID).
 */
export async function updateOrderStatusAction(payload: z.infer<typeof updateOrderStatusSchema>): Promise<ActionResponse> {
  const { user } = await getCurrentSession();
  if (!user) return { success: false, error: "Unauthorized" };

  const validated = updateOrderStatusSchema.safeParse(payload);
  if (!validated.success) return { success: false, error: validated.error.issues[0].message };

  try {
    await db.update(orders)
      .set({ status: payload.status })
      .where(eq(orders.id, payload.orderId));

    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    console.error("updateOrderStatusAction error:", error);
    return { success: false, error: "Failed to update order status" };
  }
}
