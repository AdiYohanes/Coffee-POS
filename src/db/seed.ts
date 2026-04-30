import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./index";
import { users, categories, items } from "../../drizzle/schema";
import { nanoid } from "nanoid";
import { hash } from "@node-rs/argon2";

const seed = async () => {
  console.log("🌱 Seeding database...");

  // 1. Create Admin User
  const adminId = nanoid(12);
  const adminPasswordHash = await hash("Admin@123456");
  await db
    .insert(users)
    .values({
      id: adminId,
      name: "Admin User",
      email: "admin@coffeepos.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    })
    .onConflictDoNothing();
  
  // 1b. Create Barista User
  const baristaId = nanoid(12);
  const baristaPasswordHash = await hash("Barista@123456");
  await db
    .insert(users)
    .values({
      id: baristaId,
      name: "Barista User",
      email: "barista@coffeepos.com",
      passwordHash: baristaPasswordHash,
      role: "BARISTA",
    })
    .onConflictDoNothing();

  // 1c. Create Cashier User
  const cashierId = nanoid(12);
  const cashierPasswordHash = await hash("Cashier@123456");
  await db
    .insert(users)
    .values({
      id: cashierId,
      name: "Cashier User",
      email: "cashier@coffeepos.com",
      passwordHash: cashierPasswordHash,
      role: "CASHIER",
    })
    .onConflictDoNothing();

  // 2. Create Category
  const categoryId = nanoid(12);
  await db
    .insert(categories)
    .values({
      id: categoryId,
      name: "Coffee",
      sortOrder: 1,
    })
    .onConflictDoNothing();

  // 3. Create Items
  const coffeeItems = [
    { name: "Espresso", price: "3.00" },
    { name: "Latte", price: "4.50" },
    { name: "Cappuccino", price: "4.00" },
  ];

  for (const item of coffeeItems) {
    await db
      .insert(items)
      .values({
        id: nanoid(12),
        categoryId: categoryId,
        name: item.name,
        basePrice: item.price,
      })
      .onConflictDoNothing();
  }

  console.log("✅ Seeding completed");
  process.exit(0);
};

seed().catch((err) => {
  console.error("❌ Seeding failed");
  console.error(err);
  process.exit(1);
});
