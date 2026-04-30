import * as dotenv from "dotenv";
dotenv.config();

const seed = async () => {
  const { db } = await import("./index");
  const { users, categories, items, modifiers, orders, orderItems } = await import("../../drizzle/schema");
  const { nanoid } = await import("nanoid");
  const { hash } = await import("@node-rs/argon2");

  console.log("🌱 Seeding realistic database...");

  // 1. Users
  const password = await hash("Coffee123!");
  const userData = [
    { id: nanoid(12), name: "Admin", email: "admin@coffee.com", role: "ADMIN" as const, passwordHash: password },
    { id: nanoid(12), name: "Cashier", email: "cashier@coffee.com", role: "CASHIER" as const, passwordHash: password },
    { id: nanoid(12), name: "Barista", email: "barista@coffee.com", role: "BARISTA" as const, passwordHash: password },
  ];

  for (const u of userData) {
    await db.insert(users).values(u).onConflictDoNothing();
  }

  // 2. Categories
  const catNames = ["Espresso", "Non-Coffee", "Pastry", "Light Meals", "Customizations"];
  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < catNames.length; i++) {
    const id = nanoid(12);
    categoryIds[catNames[i]] = id;
    await db.insert(categories).values({ id, name: catNames[i], sortOrder: i + 1 });
  }

  // 3. Items
  const menuItems = [
    // Espresso
    { name: "Americano", price: "25000", cat: "Espresso", img: "photo-1514432324608-a0967a256a31" },
    { name: "Caffe Latte", price: "32000", cat: "Espresso", img: "photo-1497935586351-b67a49e012bf" },
    { name: "Cappuccino", price: "30000", cat: "Espresso", img: "photo-1514432324608-a0967a256a31" },
    { name: "Flat White", price: "32000", cat: "Espresso", img: "photo-1497935586351-b67a49e012bf" },
    { name: "Espresso", price: "20000", cat: "Espresso", img: "photo-1514432324608-a0967a256a31" },
    // Non-Coffee
    { name: "Matcha Latte", price: "35000", cat: "Non-Coffee", img: "photo-1515822369408-4122d2503d7c" },
    { name: "Chocolate", price: "32000", cat: "Non-Coffee", img: "photo-1544787210-22bb840c5944" },
    { name: "Earl Grey Tea", price: "28000", cat: "Non-Coffee", img: "photo-1594631252845-29fc45863940" },
    { name: "Iced Lychee Tea", price: "30000", cat: "Non-Coffee", img: "photo-1556679343-c7306c1976bc" },
    // Pastry
    { name: "Butter Croissant", price: "28000", cat: "Pastry", img: "photo-1555507036-ab1f4038808a" },
    { name: "Almond Croissant", price: "35000", cat: "Pastry", img: "photo-1555507036-ab1f4038808a" },
    { name: "Pain au Chocolat", price: "32000", cat: "Pastry", img: "photo-1555507036-ab1f4038808a" },
    { name: "Cheese Danish", price: "30000", cat: "Pastry", img: "photo-1555507036-ab1f4038808a" },
    // Light Meals
    { name: "Avocado Toast", price: "45000", cat: "Light Meals", img: "photo-1525351484163-7529414344d8" },
    { name: "Club Sandwich", price: "55000", cat: "Light Meals", img: "photo-1528735602780-2552fd46c7af" },
    { name: "Caesar Salad", price: "42000", cat: "Light Meals", img: "photo-1512621776951-a57141f2eefd" },
    { name: "Beef Burger", price: "65000", cat: "Light Meals", img: "photo-1568901346375-23c9450c58cd" },
    // Customizations
    { name: "Extra Shot", price: "5000", cat: "Customizations", img: null },
    { name: "Oat Milk", price: "10000", cat: "Customizations", img: null },
    { name: "Almond Milk", price: "10000", cat: "Customizations", img: null },
  ];

  const itemIds: Record<string, string> = {};
  for (const item of menuItems) {
    const id = nanoid(12);
    itemIds[item.name] = id;
    await db.insert(items).values({
      id,
      categoryId: categoryIds[item.cat],
      name: item.name,
      basePrice: item.price,
      imageUrl: item.img ? `https://images.unsplash.com/${item.img}?w=400&h=300&fit=crop` : `https://placehold.co/400x300/8B5A2B/FFFFFF?text=${item.name.replace(/ /g, "+")}`,
    });
  }

  // 4. Modifiers (Standard ones linked to Caffe Latte)
  const latteId = itemIds["Caffe Latte"];
  const mods = [
    { name: "Size M", price: "0" },
    { name: "Size L", price: "5000" },
    { name: "Oat Milk", price: "10000" },
    { name: "Almond Milk", price: "10000" },
    { name: "Sugar 0%", price: "0" },
    { name: "Sugar 50%", price: "0" },
    { name: "Extra Shot", price: "5000" },
  ];

  for (const m of mods) {
    await db.insert(modifiers).values({
      id: nanoid(12),
      itemId: latteId,
      name: m.name,
      additionalPrice: m.price,
    });
  }

  // 5. Sample Orders (Last 7 days)
  console.log("📦 Creating sample orders...");
  const cashierId = userData[1].id;
  for (let i = 0; i < 10; i++) {
    const orderId = nanoid(12);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    await db.insert(orders).values({
      id: orderId,
      userId: cashierId,
      status: i < 7 ? "DONE" : "PENDING",
      subtotal: "60000",
      tax: "6000",
      total: "66000",
      createdAt: date,
    });

    await db.insert(orderItems).values({
      id: nanoid(12),
      orderId,
      itemId: itemIds["Caffe Latte"],
      quantity: 1,
      unitPrice: "32000",
      subtotal: "32000",
    });

    await db.insert(orderItems).values({
      id: nanoid(12),
      orderId,
      itemId: itemIds["Butter Croissant"],
      quantity: 1,
      unitPrice: "28000",
      subtotal: "28000",
    });
  }

  console.log("✅ Seed success!");
  process.exit(0);
};

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
