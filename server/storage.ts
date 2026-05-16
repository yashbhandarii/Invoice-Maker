import {
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Invoice,
  type InsertInvoice,
  type HamaliCategory,
  type InsertHamaliCategory,
  type HamaliDailyRecord,
  type InsertHamaliDailyRecord,
  users,
  clients,
  invoices,
  hamaliCategories,
  hamaliDailyRecords,
  deliveryChallans,
  type DeliveryChallan,
  type InsertDeliveryChallan,
  type Transporter,
  type InsertTransporter,
  transporters,
  type Product,
  type InsertProduct,
  products,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  inventoryTransactions,
  type Settings,
  type InsertSettings,
  settings,
  type AuditLog,
  type InsertAuditLog,
  auditLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, lte, gte, and, or, like } from "drizzle-orm";

export interface IStorage {
  // User methods (keeping for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Client methods
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;

  // Invoice methods
  getInvoices(filters?: { search?: string, status?: string, fromDate?: string, toDate?: string, buyerName?: string, financialYear?: string }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNo(invoiceNo: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;

  // Hamali methods
  getHamaliCategories(): Promise<HamaliCategory[]>;
  createHamaliCategory(category: InsertHamaliCategory): Promise<HamaliCategory>;
  updateHamaliCategory(id: string, category: Partial<InsertHamaliCategory>): Promise<HamaliCategory | undefined>;
  deleteHamaliCategory(id: string): Promise<void>;

  getHamaliDailyRecords(): Promise<HamaliDailyRecord[]>;
  createHamaliDailyRecord(record: InsertHamaliDailyRecord): Promise<HamaliDailyRecord>;
  updateHamaliDailyRecord(id: string, record: Partial<InsertHamaliDailyRecord>): Promise<HamaliDailyRecord | undefined>;
  deleteHamaliDailyRecord(id: string): Promise<void>;

  // Delivery Challan methods
  getDeliveryChallans(): Promise<DeliveryChallan[]>;
  getDeliveryChallanByNo(challanNo: string): Promise<DeliveryChallan | undefined>;
  createDeliveryChallan(challan: InsertDeliveryChallan): Promise<DeliveryChallan>;
  updateDeliveryChallan(id: string, challan: Partial<InsertDeliveryChallan>): Promise<DeliveryChallan | undefined>;
  deleteDeliveryChallan(id: string): Promise<void>;

  // Transporter methods
  getTransporters(): Promise<Transporter[]>;
  getTransporter(id: string): Promise<Transporter | undefined>;
  createTransporter(transporter: InsertTransporter): Promise<Transporter>;
  updateTransporter(id: string, transporter: Partial<InsertTransporter>): Promise<Transporter | undefined>;
  deleteTransporter(id: string): Promise<void>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;

  // Inventory methods
  adjustInventory(productId: string, quantity: number, type: string, notes?: string, referenceType?: string, referenceId?: string): Promise<Product | undefined>;
  receiveStock(productId: string, quantity: number, notes?: string): Promise<Product | undefined>;
  getInventoryTransactions(productId: string): Promise<InventoryTransaction[]>;
  getLowStockProducts(): Promise<Product[]>;

  // Settings
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  setSetting(key: string, value: string): Promise<Settings>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Client methods
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Invoice methods
  async getInvoices(filters?: { search?: string, status?: string, fromDate?: string, toDate?: string, buyerName?: string, financialYear?: string }): Promise<Invoice[]> {
    let query = db.select().from(invoices).$dynamic();
    const conditions = [];

    if (filters) {
      if (filters.search) {
        conditions.push(
          or(
            like(invoices.buyerName, `%${filters.search}%`),
            like(invoices.invoiceNo, `%${filters.search}%`),
            like(invoices.vehicleNo, `%${filters.search}%`)
          )
        );
      }
      if (filters.status && filters.status !== 'all') {
        conditions.push(eq(invoices.status, filters.status));
      }
      if (filters.buyerName) {
        conditions.push(eq(invoices.buyerName, filters.buyerName));
      }
      if (filters.fromDate) {
        conditions.push(gte(invoices.date, filters.fromDate));
      }
      if (filters.toDate) {
        conditions.push(lte(invoices.date, filters.toDate));
      }
      if (filters.financialYear) {
        conditions.push(eq(invoices.financialYear, filters.financialYear));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return invoice;
  }

  async getInvoiceByNo(invoiceNo: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNo, invoiceNo)).limit(1);
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }
  // Hamali methods
  async getHamaliCategories(): Promise<HamaliCategory[]> {
    return await db.select().from(hamaliCategories).orderBy(desc(hamaliCategories.name));
  }

  async createHamaliCategory(category: InsertHamaliCategory): Promise<HamaliCategory> {
    const [newCategory] = await db.insert(hamaliCategories).values(category).returning();
    return newCategory;
  }

  async updateHamaliCategory(id: string, category: Partial<InsertHamaliCategory>): Promise<HamaliCategory | undefined> {
    const [updatedCategory] = await db
      .update(hamaliCategories)
      .set(category)
      .where(eq(hamaliCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteHamaliCategory(id: string): Promise<void> {
    await db.delete(hamaliCategories).where(eq(hamaliCategories.id, id));
  }

  async getHamaliDailyRecords(): Promise<HamaliDailyRecord[]> {
    return await db.select().from(hamaliDailyRecords).orderBy(desc(hamaliDailyRecords.date));
  }

  async createHamaliDailyRecord(record: InsertHamaliDailyRecord): Promise<HamaliDailyRecord> {
    const [newRecord] = await db.insert(hamaliDailyRecords).values(record).returning();
    return newRecord;
  }

  async deleteHamaliDailyRecord(id: string): Promise<void> {
    await db.delete(hamaliDailyRecords).where(eq(hamaliDailyRecords.id, id));
  }

  async updateHamaliDailyRecord(id: string, updateData: Partial<InsertHamaliDailyRecord>): Promise<HamaliDailyRecord | undefined> {
    const [record] = await db
      .update(hamaliDailyRecords)
      .set(updateData)
      .where(eq(hamaliDailyRecords.id, id))
      .returning();
    return record;
  }

  // Delivery Challan methods
  async getDeliveryChallans(): Promise<DeliveryChallan[]> {
    return await db.select().from(deliveryChallans).orderBy(desc(deliveryChallans.createdAt));
  }

  async getDeliveryChallanByNo(challanNo: string): Promise<DeliveryChallan | undefined> {
    const [challan] = await db.select().from(deliveryChallans).where(eq(deliveryChallans.challanNo, challanNo)).limit(1);
    return challan;
  }

  async createDeliveryChallan(insertChallan: InsertDeliveryChallan): Promise<DeliveryChallan> {
    const [challan] = await db.insert(deliveryChallans).values(insertChallan).returning();
    return challan;
  }

  async updateDeliveryChallan(id: string, updateData: Partial<InsertDeliveryChallan>): Promise<DeliveryChallan | undefined> {
    const [challan] = await db
      .update(deliveryChallans)
      .set({ ...updateData })
      .where(eq(deliveryChallans.id, id))
      .returning();
    return challan;
  }

  async deleteDeliveryChallan(id: string): Promise<void> {
    await db.delete(deliveryChallans).where(eq(deliveryChallans.id, id));
  }

  // Transporter methods
  async getTransporters(): Promise<Transporter[]> {
    return await db.select().from(transporters).orderBy(desc(transporters.createdAt));
  }

  async getTransporter(id: string): Promise<Transporter | undefined> {
    const [transporter] = await db.select().from(transporters).where(eq(transporters.id, id)).limit(1);
    return transporter;
  }

  async createTransporter(insertTransporter: InsertTransporter): Promise<Transporter> {
    const [transporter] = await db.insert(transporters).values(insertTransporter).returning();
    return transporter;
  }

  async updateTransporter(id: string, updateData: Partial<InsertTransporter>): Promise<Transporter | undefined> {
    const [transporter] = await db
      .update(transporters)
      .set(updateData)
      .where(eq(transporters.id, id))
      .returning();
    return transporter;
  }

  async deleteTransporter(id: string): Promise<void> {
    await db.delete(transporters).where(eq(transporters.id, id));
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    // Soft delete - set isActive to false
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  }

  async searchProducts(query: string): Promise<Product[]> {
    // Simple search by name (case-insensitive)
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));
    return allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  }

  // Inventory methods
  async adjustInventory(
    productId: string,
    quantity: number,
    type: string,
    notes?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<Product | undefined> {
    return await db.transaction(async (tx) => {
      const product = await tx.select().from(products).where(eq(products.id, productId)).get();
      if (!product || !product.trackInventory) {
        return undefined;
      }

      const previousStock = product.currentStock || 0;
      const newStock = previousStock + quantity;

      // Update product stock
      const [updatedProduct] = await tx
        .update(products)
        .set({ currentStock: newStock, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();

      // Create transaction record
      await tx.insert(inventoryTransactions).values({
        productId,
        type,
        quantity,
        previousStock,
        newStock,
        referenceType,
        referenceId,
        notes,
      });

      return updatedProduct;
    });
  }

  async receiveStock(productId: string, quantity: number, notes?: string): Promise<Product | undefined> {
    return this.adjustInventory(productId, quantity, "purchase", notes);
  }

  async getInventoryTransactions(productId: string): Promise<InventoryTransaction[]> {
    return await db
      .select()
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.productId, productId))
      .orderBy(desc(inventoryTransactions.createdAt));
  }

  async getLowStockProducts(): Promise<Product[]> {
    const allProducts = await db.select().from(products).where(eq(products.isActive, true));
    return allProducts.filter(p =>
      p.trackInventory &&
      (p.currentStock || 0) <= (p.minStockLevel || 0)
    );
  }

  // Settings
  async getSettings(): Promise<Settings[]> {
    return await db.select().from(settings);
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(key: string, value: string): Promise<Settings> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(settings).set({ value }).where(eq(settings.key, key)).returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values({ key, value }).returning();
      return created;
    }
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }
}

export const storage = new PostgresStorage();
