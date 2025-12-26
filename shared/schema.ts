import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
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
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  address: text("address"),
  gst: text("gst"),
  stateCode: text("state_code"),
  transport: text("transport"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const selectClientSchema = createSelectSchema(clients);

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Invoices table
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
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
  items: text("items", { mode: "json" }).notNull(),

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

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  items: z.any() // Allow array of objects for JSON column
});

export const selectInvoiceSchema = createSelectSchema(invoices);

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
