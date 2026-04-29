import { db } from "../db";
import { getMenuAction, getActiveOrdersAction } from "../lib/actions/pos";
import { orders, orderItems, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

async function runTest() {
  console.log("\n--- 🚀 POS Flow Test ---");

  try {
    // 1. Fetch Menu
    console.log("Step 1: Fetching menu...");
    const menuRes = await getMenuAction();
    if (!menuRes.success) throw new Error(`Failed to fetch menu: ${menuRes.error}`);
    console.log(`✅ Menu fetched. Categories: ${menuRes.data.length}`);

    // 2. Add items (Simulated selection)
    const firstCategory = menuRes.data[0];
    const firstItem = firstCategory?.items[0];
    if (!firstItem) throw new Error("No items found in menu to test.");
    console.log(`Step 2: Selected item "${firstItem.name}" at $${firstItem.basePrice}`);

    // 3. Checkout (Direct DB Insert since Server Actions with cookies() fail in Node)
    console.log("Step 3: Processing checkout (direct DB sync)...");
    const [testUser] = await db.select().from(users).limit(1);
    if (!testUser) throw new Error("No users found in DB. Run seed first.");

    const orderId = nanoid(12);
    const subtotal = parseFloat(firstItem.basePrice) * 2;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: orderId,
        userId: testUser.id,
        status: "PENDING",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      });

      await tx.insert(orderItems).values({
        id: nanoid(12),
        orderId,
        itemId: firstItem.id,
        quantity: 2,
        unitPrice: firstItem.basePrice,
        subtotal: subtotal.toFixed(2),
      });
    });
    console.log(`✅ Order ${orderId} inserted into database.`);

    // 4. Verify DB Record
    console.log("Step 4: Verifying DB record...");
    const [dbOrder] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!dbOrder) throw new Error("Order not found in DB after insertion.");
    console.log(`✅ DB verification passed. Status: ${dbOrder.status}, Total: ${dbOrder.total}`);

    // 5. Check Active Orders via Action
    console.log("Step 5: Checking active orders queue...");
    const activeRes = await getActiveOrdersAction();
    if (!activeRes.success) throw new Error(`Failed to fetch active orders: ${activeRes.error}`);
    
    const foundInQueue = activeRes.data.find((o: any) => o.id === orderId);
    if (!foundInQueue) throw new Error("Order not found in active queue.");
    console.log("✅ Order successfully appeared in the active queue.");

    console.log("\n--- ✨ POS Flow Test Passed! ---\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n--- ❌ POS Flow Test Failed ---");
    console.error(error.message);
    process.exit(1);
  }
}

runTest();
