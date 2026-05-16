import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
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
  email: text("email"),
  mobile: text("mobile"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const selectClientSchema = createSelectSchema(clients);

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Transporters table
export const transporters = sqliteTable("transporters", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  vehicleNo: text("vehicle_no"),
  mobile: text("mobile"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertTransporterSchema = createInsertSchema(transporters).omit({
  id: true,
  createdAt: true,
});

export const selectTransporterSchema = createSelectSchema(transporters);
export type InsertTransporter = z.infer<typeof insertTransporterSchema>;
export type Transporter = typeof transporters.$inferSelect;

// Invoices table
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  invoiceNo: text("invoice_no").notNull().unique(),
  status: text("status").notNull().default("Pending"),
  financialYear: text("financial_year"), // e.g. "25-26" // Paid, Pending, Overdue
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
  otherCharges: real("other_charges").default(0),

  // Payment tracking
  payments: text("payments", { mode: "json" }).$defaultFn(() => []),
  paidAmount: real("paid_amount").default(0),
  remainingAmount: real("remaining_amount").default(0),

  // Bank details
  bankName: text("bank_name"),
  bankAccountNo: text("bank_account_no"),
  bankIfsc: text("bank_ifsc"),
  bankBranch: text("bank_branch"),

  // Labels
  discountLabel: text("discount_label").default("Discount"),
  advanceLabel: text("advance_label").default("Advance"),
  otherChargesLabel: text("other_charges_label").default("Other Charges"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAmount: true,
  remainingAmount: true,
}).extend({
  items: z.array(z.any()) // Allow array of objects for JSON column
}).strip();

export const selectInvoiceSchema = createSelectSchema(invoices);

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Hamali Categories table
export const hamaliCategories = sqliteTable("hamali_categories", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  rate: real("rate").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
});

export const insertHamaliCategorySchema = createInsertSchema(hamaliCategories);
export const selectHamaliCategorySchema = createSelectSchema(hamaliCategories);
export type InsertHamaliCategory = z.infer<typeof insertHamaliCategorySchema>;
export type HamaliCategory = typeof hamaliCategories.$inferSelect;

// Hamali Daily Records table
export const hamaliDailyRecords = sqliteTable("hamali_daily_records", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  date: text("date").notNull(), // stored as ISO string or YYYY-MM-DD
  totalAmount: real("total_amount").notNull(),
  items: text("items", { mode: "json" }).notNull(), // JSON array of items { categoryName, rate, bags, total }
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertHamaliDailyRecordSchema = createInsertSchema(hamaliDailyRecords).omit({
  id: true,
  createdAt: true,
}).extend({
  items: z.array(z.any())
});
export const selectHamaliDailyRecordSchema = createSelectSchema(hamaliDailyRecords);
export type InsertHamaliDailyRecord = z.infer<typeof insertHamaliDailyRecordSchema>;
export type HamaliDailyRecord = typeof hamaliDailyRecords.$inferSelect;

// Delivery Challans table
export const deliveryChallans = sqliteTable("delivery_challans", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  challanNo: text("challan_no").notNull().unique(),
  financialYear: text("financial_year"), // e.g. "25-26"
  date: text("date").notNull(),

  // Header / Company Details
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address"),
  companyGst: text("company_gst"),
  companyContact: text("company_contact"),

  // Client Details
  clientName: text("client_name"),
  clientAddress: text("client_address"),

  // Transport Details
  driverName: text("driver_name"),
  driverMobile: text("driver_mobile"),
  vehicleNo: text("vehicle_no"),

  // Items stored as JSON
  items: text("items", { mode: "json" }).notNull(),

  // Totals
  totalFreightSum: real("total_freight_sum").default(0),
  totalGivenFreightSum: real("total_given_freight_sum").default(0),
  totalRemainingFreightSum: real("total_remaining_freight_sum").default(0),

  // Expenses & Notes
  expenseReason: text("expense_reason"),
  expenseAmount: real("expense_amount").default(0),
  notes: text("notes"),

  // Visibility
  hideFreight: integer("hide_freight", { mode: "boolean" }).default(false),

  // Payments stored as JSON: { date, amount, note }[]
  payments: text("payments", { mode: "json" }).$defaultFn(() => []),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertDeliveryChallanSchema = createInsertSchema(deliveryChallans).omit({
  id: true,
  createdAt: true,
}).extend({
  items: z.array(z.any()),
  payments: z.array(z.any()).optional()
});

export const selectDeliveryChallanSchema = createSelectSchema(deliveryChallans);
export type InsertDeliveryChallan = z.infer<typeof insertDeliveryChallanSchema>;
export type DeliveryChallan = typeof deliveryChallans.$inferSelect;

// Products table
export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").default("pcs"), // pcs, kg, meter, liter, etc.
  defaultRate: real("default_rate").notNull(),
  hsnCode: text("hsn_code"),
  taxRate: real("tax_rate").default(0), // Default tax percentage
  category: text("category"), // Optional categorization
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),

  // Inventory fields
  trackInventory: integer("track_inventory", { mode: "boolean" }).default(false),
  currentStock: real("current_stock").default(0),
  minStockLevel: real("min_stock_level").default(0),
  maxStockLevel: real("max_stock_level"),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectProductSchema = createSelectSchema(products);

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Inventory Transactions table
export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  productId: text("product_id").notNull(),
  type: text("type").notNull(), // "purchase", "sale", "adjustment", "return"
  quantity: real("quantity").notNull(), // Positive for additions, negative for deductions
  previousStock: real("previous_stock").notNull(),
  newStock: real("new_stock").notNull(),
  referenceType: text("reference_type"), // "invoice", "manual", etc.
  referenceId: text("reference_id"), // Invoice ID, etc.
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export const selectInventoryTransactionSchema = createSelectSchema(inventoryTransactions);

export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// Settings table
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingsSchema = createInsertSchema(settings);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Audit Logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE
  entityType: text("entity_type").notNull(), // INVOICE, CLIENT, etc.
  entityId: text("entity_id").notNull(),
  details: text("details"), // JSON string of changes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
