import Database from 'better-sqlite3';
import path from 'path';

export async function initializeDatabase() {
  console.log("[v0] Initializing SQLite database schema...");
  
  try {
    const dbPath = path.join(process.cwd(), 'sqlite.db');
    const sqlite = new Database(dbPath);

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);

    // Create clients table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        gst TEXT,
        state_code TEXT,
        transport TEXT,
        email TEXT,
        mobile TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Create transporters table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transporters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        vehicle_no TEXT,
        mobile TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Create invoices table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_no TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'Pending',
        financial_year TEXT,
        date TEXT NOT NULL,
        seller_name TEXT NOT NULL,
        seller_hindi_name TEXT,
        seller_subtitle TEXT,
        seller_address TEXT,
        seller_pan TEXT,
        seller_gst TEXT,
        seller_contact1 TEXT,
        seller_contact2 TEXT,
        buyer_name TEXT NOT NULL,
        buyer_address TEXT,
        buyer_through TEXT,
        buyer_gst TEXT,
        buyer_state_code TEXT,
        vehicle_no TEXT,
        items TEXT NOT NULL,
        discount REAL DEFAULT 0 NOT NULL,
        cgst_rate REAL DEFAULT 0 NOT NULL,
        sgst_rate REAL DEFAULT 0 NOT NULL,
        igst_rate REAL DEFAULT 0 NOT NULL,
        advance REAL DEFAULT 0 NOT NULL,
        other_charges REAL DEFAULT 0,
        payments TEXT,
        paid_amount REAL DEFAULT 0,
        remaining_amount REAL DEFAULT 0,
        bank_name TEXT,
        bank_account_no TEXT,
        bank_ifsc TEXT,
        bank_branch TEXT,
        discount_label TEXT DEFAULT 'Discount',
        advance_label TEXT DEFAULT 'Advance',
        other_charges_label TEXT DEFAULT 'Other Charges',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create hamali_categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS hamali_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    // Create hamali_daily_records table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS hamali_daily_records (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        category_id TEXT NOT NULL,
        bags INTEGER NOT NULL,
        rate REAL NOT NULL,
        total REAL NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // Create delivery_challans table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS delivery_challans (
        id TEXT PRIMARY KEY,
        challan_no TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'Pending',
        date TEXT NOT NULL,
        seller_name TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_address TEXT,
        transporter_id TEXT,
        vehicle_no TEXT,
        items TEXT NOT NULL,
        payments TEXT DEFAULT '[]',
        paid_amount REAL DEFAULT 0,
        remaining_amount REAL DEFAULT 0,
        remarks TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create products table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        unit TEXT DEFAULT 'pcs',
        default_rate REAL NOT NULL,
        hsn_code TEXT,
        tax_rate REAL DEFAULT 0,
        category TEXT,
        is_active INTEGER DEFAULT 1 NOT NULL,
        track_inventory INTEGER DEFAULT 0,
        current_stock REAL DEFAULT 0,
        min_stock_level REAL DEFAULT 0,
        max_stock_level REAL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create inventory_transactions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        notes TEXT,
        reference_type TEXT,
        reference_id TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    // Create settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL
      )
    `);

    // Create audit_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        changes TEXT,
        user_id TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    console.log("[v0] Database schema initialized successfully");
  } catch (error) {
    console.error("[v0] Failed to initialize database schema:", error);
    throw error;
  }
}
