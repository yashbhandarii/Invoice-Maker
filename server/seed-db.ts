import Database from 'better-sqlite3';
import path from 'path';
import { nanoid } from "nanoid";

export async function seedDatabase() {
  console.log("[v0] Seeding database with initial data...");
  
  try {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const sqlite = new Database(dbPath);

    // Check if data already exists
    const existingClients = sqlite.prepare("SELECT COUNT(*) as count FROM clients").get();
    if (existingClients && existingClients.count > 0) {
      console.log("[v0] Database already seeded, skipping...");
      return;
    }

    // Insert sample clients
    const clientId1 = nanoid();
    const clientId2 = nanoid();
    const now = Date.now();

    sqlite.prepare(`
      INSERT INTO clients (id, name, address, gst, state_code, transport, email, mobile, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      clientId1,
      "ABC Trading",
      "123 Business Street, Mumbai",
      "27AABCT1234H1Z0",
      "27",
      "Road",
      "contact@abctrading.com",
      "+91-9999999999",
      now
    );

    sqlite.prepare(`
      INSERT INTO clients (id, name, address, gst, state_code, transport, email, mobile, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      clientId2,
      "XYZ Enterprises",
      "456 Commerce Lane, Delhi",
      "07AABCT1234H1Z0",
      "07",
      "Rail",
      "info@xyzenterprises.com",
      "+91-8888888888",
      now
    );

    // Insert sample transporters
    const transporterId1 = nanoid();
    const transporterId2 = nanoid();

    sqlite.prepare(`
      INSERT INTO transporters (id, name, vehicle_no, mobile, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      transporterId1,
      "Fast Logistics",
      "MH-01-AB-1234",
      "+91-7777777777",
      now
    );

    sqlite.prepare(`
      INSERT INTO transporters (id, name, vehicle_no, mobile, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      transporterId2,
      "Express Freight",
      "DL-01-CD-5678",
      "+91-6666666666",
      now
    );

    // Insert sample products
    const productId1 = nanoid();
    const productId2 = nanoid();

    sqlite.prepare(`
      INSERT INTO products (id, name, description, unit, default_rate, hsn_code, tax_rate, category, is_active, track_inventory, current_stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId1,
      "Cotton Fabric",
      "Premium quality cotton fabric",
      "meters",
      500,
      "5208",
      18,
      "Textiles",
      1,
      1,
      1000,
      now,
      now
    );

    sqlite.prepare(`
      INSERT INTO products (id, name, description, unit, default_rate, hsn_code, tax_rate, category, is_active, track_inventory, current_stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      productId2,
      "Polyester Thread",
      "Durable polyester sewing thread",
      "spools",
      100,
      "5402",
      5,
      "Textiles",
      1,
      1,
      500,
      now,
      now
    );

    // Insert default settings
    sqlite.prepare(`
      INSERT OR IGNORE INTO settings (id, key, value)
      VALUES (?, ?, ?)
    `).run(nanoid(), "invoicePrefix", "INV-");

    sqlite.prepare(`
      INSERT OR IGNORE INTO settings (id, key, value)
      VALUES (?, ?, ?)
    `).run(nanoid(), "companyName", "Your Company Name");

    sqlite.prepare(`
      INSERT OR IGNORE INTO settings (id, key, value)
      VALUES (?, ?, ?)
    `).run(nanoid(), "companyGST", "27AABCT1234H1Z0");

    console.log("[v0] Database seeded successfully");
  } catch (error) {
    console.error("[v0] Failed to seed database:", error);
    throw error;
  }
}
