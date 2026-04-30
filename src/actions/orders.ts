"use server";

import { db } from "@/db";
import { orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth/server";

export async function finishOrderAction(orderId: string) {
  const { user } = await getCurrentSession();
  if (!user) return { success: false, error: "Unauthorized" };
  if (user.role !== "BARISTA" && user.role !== "ADMIN") {
    return { success: false, error: "Only baristas can finish orders" };
  }

  try {
    const finishedAt = new Date();
    await db.update(orders)
      .set({ status: "DONE" })
      .where(eq(orders.id, orderId));

    revalidatePath("/pos");
    revalidatePath("/reports");
    
    return { 
      success: true, 
      data: { finishedAt: finishedAt.toISOString() } 
    };
  } catch (error: any) {
    console.error("finishOrderAction error:", error);
    return { success: false, error: "Failed to finish order" };
  }
}
