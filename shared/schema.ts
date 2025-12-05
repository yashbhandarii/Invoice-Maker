import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing for compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  gst: text("gst"),
  stateCode: text("state_code"),
  transport: text("transport"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const selectClientSchema = createSelectSchema(clients);

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNo: text("invoice_no").notNull().unique(),
  status: text("status").notNull().default("Pending"), // Paid, Pending, Overdue
  date: text("date").notNull(),
  
  // Seller details
  sellerName: text("seller_name").notNull(),
  sellerHindiName: text("seller_hindi_name"),
  sellerSubtitle: text("seller_subtitle"),
  sellerAddress: text("seller_address"),
  sellerPan: text("seller_pan"),
  sellerGst: text("seller_gst"),
  sellerContact1: text("seller_contact1"),
  sellerContact2: text("seller_contact2"),
  
  // Buyer details
  buyerName: text("buyer_name").notNull(),
  buyerAddress: text("buyer_address"),
  buyerThrough: text("buyer_through"),
  buyerGst: text("buyer_gst"),
  buyerStateCode: text("buyer_state_code"),
  
  // Invoice meta
  vehicleNo: text("vehicle_no"),
  
  // Line items stored as JSON
  items: jsonb("items").notNull(),
  
  // Totals
  discount: real("discount").default(0).notNull(),
  cgstRate: real("cgst_rate").default(0).notNull(),
  sgstRate: real("sgst_rate").default(0).notNull(),
  igstRate: real("igst_rate").default(0).notNull(),
  advance: real("advance").default(0).notNull(),
  
  // Bank details
  bankName: text("bank_name"),
  bankAccountNo: text("bank_account_no"),
  bankIfsc: text("bank_ifsc"),
  bankBranch: text("bank_branch"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectInvoiceSchema = createSelectSchema(invoices);

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
