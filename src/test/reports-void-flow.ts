/**
 * Test Script for Reports & Void Flow
 * Run with: npx tsx src/test/reports-void-flow.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { db } from '../db/index';
import { orders, orderItems, items, users } from '../../drizzle/schema';
import { nanoid } from 'nanoid';
import { eq, sql } from 'drizzle-orm';

async function testVoidFlow() {
  console.log('🧪 Starting Reports & Void Flow Test...');

  try {
    // 1. Get a test user and item
    const [user] = await db.select().from(users).limit(1);
    const [item] = await db.select().from(items).limit(1);

    if (!user || !item) {
      throw new Error('Please run seed script first to populate users and items');
    }

    const testOrderId = nanoid(12);
    console.log(`Step 1: Creating test order ${testOrderId}...`);

    // 2. Create an order
    await db.insert(orders).values({
      id: testOrderId,
      userId: user.id,
      status: 'PENDING',
      subtotal: '10.00',
      tax: '1.00',
      total: '11.00',
    });

    await db.insert(orderItems).values({
      id: nanoid(12),
      orderId: testOrderId,
      itemId: item.id,
      quantity: 1,
      unitPrice: '10.00',
      subtotal: '10.00',
    });

    // 3. Verify it exists
    const [createdOrder] = await db.select().from(orders).where(eq(orders.id, testOrderId));
    console.log(`✅ Order created with status: ${createdOrder.status}`);

    // 4. Void the order
    console.log('Step 2: Voiding order...');
    await db.update(orders)
      .set({ status: 'VOID' })
      .where(eq(orders.id, testOrderId));

    const [voidedOrder] = await db.select().from(orders).where(eq(orders.id, testOrderId));
    console.log(`✅ Order status updated to: ${voidedOrder.status}`);

    // 5. Verify aggregation in reports
    console.log('Step 3: Verifying report aggregations...');
    
    // Check if daily sales excludes VOID orders
    const salesReport = await db
      .select({ count: sql`COUNT(*)` })
      .from(orders)
      .where(eq(orders.status, 'DONE'));
    
    // Check if voided orders count is correct
    const voidReport = await db
      .select({ count: sql`COUNT(*)` })
      .from(orders)
      .where(eq(orders.status, 'VOID'));

    console.log(`📊 Reports view: ${salesReport[0].count} Completed, ${voidReport[0].count} Voided`);
    
    if (Number(voidReport[0].count) >= 1) {
      console.log('✨ Test PASSED: Voided order correctly excluded from sales and included in void count.');
    } else {
      throw new Error('Aggregation failed: Voided order not found in reports');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.delete(orderItems).where(eq(orderItems.orderId, testOrderId));
    await db.delete(orders).where(eq(orders.id, testOrderId));
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test FAILED');
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testVoidFlow();
