import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "disconnected";

  try {
    // Lightweight ping to check database connection
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";

    return NextResponse.json(
      {
        status: "ok",
        database: dbStatus,
        timestamp,
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        timestamp,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
