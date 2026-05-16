import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertInvoiceSchema, insertDeliveryChallanSchema, insertTransporterSchema } from "@shared/schema";
import { z } from "zod";

function getFinancialYear(dateInput: Date | string = new Date()): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return getFinancialYear(new Date());
  }
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 4) {
    // April to December
    return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
  } else {
    // January to March
    return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Removed auth protection middleware

  // Client Routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid client data", details: error.errors });
      } else {
        console.error("Error creating client:", error);
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      // Validate partial update
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);

      if (!client) {
        res.status(404).json({ error: "Client not found" });
        return;
      }

      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid client data", details: error.errors });
      } else {
        console.error("Error updating client:", error);
        res.status(500).json({ error: "Failed to update client" });
      }
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      await storage.deleteClient(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics/dashboard", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();

      // Calculate KPIs
      let totalRevenue = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;

      const customerRevenue: Record<string, { revenue: number; invoiceCount: number }> = {};
      const monthlyRevenue: Record<string, { revenue: number; paid: number; pending: number }> = {};

      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      invoices.forEach(inv => {
        // Calculate invoice total
        const items = inv.items as any[] || [];
        const subTotal = items.reduce((sum, item) => {
          const amount = item.amount || ((item.weight > 0 ? item.weight : item.qty) * item.rate);
          return sum + amount;
        }, 0);

        const discount = inv.discount || 0;
        const taxableAmount = Math.max(0, subTotal - discount);
        const cgstRate = inv.cgstRate || 0;
        const sgstRate = inv.sgstRate || 0;
        const igstRate = inv.igstRate || 0;
        const totalTaxRate = cgstRate + sgstRate + igstRate;
        const taxAmount = (taxableAmount * totalTaxRate) / 100;
        const grandTotal = taxableAmount + taxAmount;

        totalRevenue += grandTotal;

        // Payment status
        const invPaidAmount = (inv as any).paidAmount || 0;
        const invRemainingAmount = (inv as any).remainingAmount || grandTotal;

        paidAmount += invPaidAmount;

        if (inv.status === "Overdue") {
          overdueAmount += invRemainingAmount;
        } else if (inv.status === "Pending") {
          pendingAmount += invRemainingAmount;
        }

        // Customer revenue
        const customerName = inv.buyerName || "Unknown";
        if (!customerRevenue[customerName]) {
          customerRevenue[customerName] = { revenue: 0, invoiceCount: 0 };
        }
        customerRevenue[customerName].revenue += grandTotal;
        customerRevenue[customerName].invoiceCount += 1;

        // Monthly revenue (last 6 months)
        const invDate = new Date(inv.date);
        if (invDate >= sixMonthsAgo) {
          const monthKey = invDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
          if (!monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey] = { revenue: 0, paid: 0, pending: 0 };
          }
          monthlyRevenue[monthKey].revenue += grandTotal;
          monthlyRevenue[monthKey].paid += invPaidAmount;
          monthlyRevenue[monthKey].pending += invRemainingAmount;
        }
      });

      // Top 5 customers
      const topCustomers = Object.entries(customerRevenue)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Format monthly revenue
      const revenueByMonth = Object.entries(monthlyRevenue)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA.getTime() - dateB.getTime();
        });

      const analytics = {
        kpis: {
          totalRevenue,
          paidAmount,
          pendingAmount,
          overdueAmount,
          totalInvoices: invoices.length,
          averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        },
        revenueByMonth,
        paymentStatus: {
          paid: paidAmount,
          pending: pendingAmount,
          overdue: overdueAmount,
        },
        topCustomers,
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
      };
      const invoices = await storage.getInvoices(filters);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  // Daybook Route
  app.get("/api/daybook", async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      
      // Fetch all invoices to find today's invoices AND today's payments on past invoices
      const allInvoices = await storage.getInvoices();
      const allChallans = await storage.getDeliveryChallans();
      const allHamali = await storage.getHamaliDailyRecords();

      const daybookInvoices = allInvoices.filter(inv => inv.date === date);
      
      // Extract payments made on this date
      const daybookPayments: any[] = [];
      allInvoices.forEach(inv => {
        const payments = inv.payments as any[] || [];
        payments.forEach(payment => {
          if (payment.date === date) {
            daybookPayments.push({
              invoiceNo: inv.invoiceNo,
              buyerName: inv.buyerName,
              amount: payment.amount,
              note: payment.note
            });
          }
        });
      });

      const daybookChallans = allChallans.filter(ch => ch.date === date);
      const daybookHamali = allHamali.filter(h => h.date === date);

      res.json({
        date,
        invoices: daybookInvoices,
        payments: daybookPayments,
        challans: daybookChallans,
        hamali: daybookHamali
      });
    } catch (error) {
      console.error("Error fetching daybook:", error);
      res.status(500).json({ error: "Failed to fetch daybook" });
    }
  });

  // Ledger Route
  app.get("/api/ledger/:buyerName", async (req, res) => {
    try {
      const buyerName = req.params.buyerName;
      const invoices = await storage.getInvoices({ buyerName });
      
      const ledgerEntries: any[] = [];
      
      invoices.forEach(inv => {
        // Add invoice as debit
        const items = inv.items as any[] || [];
        const subTotal = items.reduce((sum: number, item: any) => {
          const amount = item.amount || ((item.weight > 0 ? item.weight : item.qty) * item.rate);
          return sum + amount;
        }, 0);
        
        const discount = inv.discount || 0;
        const taxableAmount = Math.max(0, subTotal - discount);
        const totalTaxRate = (inv.cgstRate || 0) + (inv.sgstRate || 0) + (inv.igstRate || 0);
        const taxAmount = (taxableAmount * totalTaxRate) / 100;
        const otherCharges = inv.otherCharges || 0;
        const grandTotal = taxableAmount + taxAmount + otherCharges;

        ledgerEntries.push({
          date: inv.date,
          description: `Invoice #${inv.invoiceNo}`,
          type: 'debit',
          amount: grandTotal,
          invoiceId: inv.id,
          createdAt: inv.createdAt,
        });

        // Add advance if any
        if (inv.advance && inv.advance > 0) {
          ledgerEntries.push({
            date: inv.date, // Advance is typically paid on invoice date
            description: `Advance for Invoice #${inv.invoiceNo}`,
            type: 'credit',
            amount: inv.advance,
            invoiceId: inv.id,
            createdAt: inv.createdAt,
          });
        }

        // Add payments as credits
        const payments = inv.payments as any[] || [];
        payments.forEach(payment => {
          ledgerEntries.push({
            date: payment.date,
            description: `Payment ${payment.method ? `(${payment.method}) ` : ''}${payment.note ? `- ${payment.note}` : ''}`,
            type: 'credit',
            amount: payment.amount,
            invoiceId: inv.id,
            createdAt: new Date(payment.date).toISOString(), // Use payment date for sorting if possible
          });
        });
      });

      // Sort entries by date
      ledgerEntries.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA === dateB) {
          // If same date, debit (invoice) comes before credit (payment)
          if (a.type === 'debit' && b.type === 'credit') return -1;
          if (a.type === 'credit' && b.type === 'debit') return 1;
          return 0;
        }
        return dateA - dateB;
      });

      // Calculate running balance
      let runningBalance = 0;
      const ledgerWithBalance = ledgerEntries.map(entry => {
        if (entry.type === 'debit') {
          runningBalance += entry.amount;
        } else {
          runningBalance -= entry.amount;
        }
        return {
          ...entry,
          balance: runningBalance
        };
      });

      res.json({
        buyerName,
        totalOutstanding: runningBalance,
        entries: ledgerWithBalance
      });
      
    } catch (error) {
      console.error("Error fetching ledger:", error);
      res.status(500).json({ error: "Failed to fetch ledger" });
    }
  });

  // Get suggested next invoice number
  app.get("/api/invoices/suggest-number", async (req, res) => {
    try {
      // Calculate current FY based on query param or today
      const dateParam = req.query.date as string || new Date().toISOString();
      const currentFY = getFinancialYear(dateParam);
      
      const settingObj = await storage.getSetting("invoicePrefix");
      const prefixSetting = settingObj ? settingObj.value : "";
      
      const invoices = await storage.getInvoices({ financialYear: currentFY });

      if (invoices.length === 0) {
        res.json({ suggestedNumber: `${prefixSetting}001` });
        return;
      }

      // Get the last invoice number and increment
      const lastInvoice = invoices[0]; // Already sorted by createdAt desc
      const lastNumber = lastInvoice.invoiceNo;

      // Extract numeric part and increment (we just use simple numbers now)
      const numericPart = parseInt(lastNumber) || 0;
      if (numericPart > 0 && !prefixSetting) {
        const nextNumber = numericPart + 1;
        const paddedNumber = String(nextNumber).padStart(lastNumber.length || 3, '0');
        res.json({ suggestedNumber: paddedNumber });
      } else {
        // Fallback if previous was not purely numeric, or if there's a prefix
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          const prefix = lastNumber.substring(0, match.index);
          const newPrefix = prefixSetting || prefix; // Override with new prefix if set
          const padded = String(num + 1).padStart(match[1].length, '0');
          res.json({ suggestedNumber: `${newPrefix}${padded}` });
        } else {
          res.json({ suggestedNumber: `${prefixSetting}001` });
        }
      }
    } catch (error) {
      console.error("Error suggesting invoice number:", error);
      res.status(500).json({ error: "Failed to suggest invoice number" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      // Strip unknown fields before parsing to prevent stale columns (e.g. removed broker_name)
      const { brokerName, commissionRate, commissionAmount, ...cleanBody } = req.body;
      const validatedData = insertInvoiceSchema.parse(cleanBody);

      // Calculate grand total for the invoice
      const items = validatedData.items || [];
      const subTotal = items.reduce((sum: number, item: any) => {
        const amount = item.amount || ((item.weight > 0 ? item.weight : item.qty) * item.rate);
        return sum + amount;
      }, 0);

      const discount = validatedData.discount || 0;
      const taxableAmount = Math.max(0, subTotal - discount);

      const cgstRate = validatedData.cgstRate || 0;
      const sgstRate = validatedData.sgstRate || 0;
      const igstRate = validatedData.igstRate || 0;
      const totalTaxRate = cgstRate + sgstRate + igstRate;

      const taxAmount = (taxableAmount * totalTaxRate) / 100;
      const otherCharges = validatedData.otherCharges || 0;
      const grandTotal = taxableAmount + taxAmount + otherCharges;

      // Calculate financial year
      const financialYear = getFinancialYear(validatedData.date);
      validatedData.financialYear = financialYear;

      let maxTries = 5;
      let currentInvoiceNo = validatedData.invoiceNo;
      let invoice;
      
      while (maxTries > 0) {
        try {
          const existing = await storage.getInvoiceByNo(currentInvoiceNo);
          if (existing) {
             const invoices = await storage.getInvoices({ financialYear });
             const lastInvoice = invoices[0];
             const lastNumber = lastInvoice?.invoiceNo || "000";
             const numericPart = parseInt(lastNumber) || 0;
             if (numericPart > 0) {
               currentInvoiceNo = String(numericPart + 1).padStart(lastNumber.length || 3, '0');
             } else {
               const match = lastNumber.match(/(\d+)$/);
               if (match) {
                 const num = parseInt(match[1]);
                 const prefix = lastNumber.substring(0, match.index);
                 currentInvoiceNo = `${prefix}${String(num + 1).padStart(match[1].length, '0')}`;
               } else {
                 currentInvoiceNo = `${currentInvoiceNo}-${6-maxTries}`;
               }
             }
             validatedData.invoiceNo = currentInvoiceNo;
             maxTries--;
             continue;
          }

          // Initialize payment tracking fields
          const invoiceWithPayments = {
            ...validatedData,
            invoiceNo: currentInvoiceNo,
            payments: [],
            paidAmount: 0,
            remainingAmount: grandTotal,
          };

          invoice = await storage.createInvoice(invoiceWithPayments as any);
          

          
          break; // Success
        } catch (e: any) {
          if (e.code === 'SQLITE_CONSTRAINT_UNIQUE' || e.message?.includes('UNIQUE')) {
            maxTries--;
            // On unique constraint error, we will just fetch the latest and retry
          } else {
            throw e;
          }
        }
      }

      if (!invoice) {
         res.status(409).json({ error: "Failed to generate unique invoice number after multiple attempts." });
         return;
      }

      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ error: "Failed to create invoice" });
      }
    }
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      // Strip unknown fields before parsing to prevent stale columns (e.g. removed broker_name)
      const { brokerName, commissionRate, commissionAmount, id, createdAt, updatedAt, ...cleanBody } = req.body;
      const updateData = insertInvoiceSchema.partial().parse(cleanBody);

      // Recalculate remaining amount if items or rates are changed
      const currentInvoice = await storage.getInvoice(req.params.id);
      if (currentInvoice) {
        const items = updateData.items || currentInvoice.items || [];
        const subTotal = (items as any[]).reduce((sum: number, item: any) => {
          const amount = item.amount || ((item.weight > 0 ? item.weight : item.qty) * item.rate);
          return sum + amount;
        }, 0);
        const discount = updateData.discount ?? currentInvoice.discount ?? 0;
        const taxableAmount = Math.max(0, subTotal - discount);
        const cgstRate = updateData.cgstRate ?? currentInvoice.cgstRate ?? 0;
        const sgstRate = updateData.sgstRate ?? currentInvoice.sgstRate ?? 0;
        const igstRate = updateData.igstRate ?? currentInvoice.igstRate ?? 0;
        const totalTaxRate = cgstRate + sgstRate + igstRate;
        const taxAmount = (taxableAmount * totalTaxRate) / 100;
        const otherCharges = updateData.otherCharges ?? currentInvoice.otherCharges ?? 0;
        const grandTotal = taxableAmount + taxAmount + otherCharges;
        
        const advance = updateData.advance ?? currentInvoice.advance ?? 0;
        const paidAmount = currentInvoice.paidAmount ?? 0;
        
        const newRemaining = Math.max(0, grandTotal - advance - paidAmount);
        (updateData as any).remainingAmount = newRemaining;
        
        if (newRemaining <= 0) {
           updateData.status = "Paid";
        } else if (updateData.status === "Paid" || updateData.status === "Overdue" || updateData.status === "Pending") {
           // We keep the original status or set to Pending if it was previously Paid but now has remaining balance
           if (currentInvoice.status === "Paid") {
              updateData.status = "Pending";
           }
        }
      }

      const invoice = await storage.updateInvoice(req.params.id, updateData);

      if (!invoice) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }



      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      } else {
        console.error("Error updating invoice:", error);
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update invoice" });
      }
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);


      await storage.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  // Invoice Payment Routes
  app.post("/api/invoices/:id/payments", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }

      const paymentSchema = z.object({
        date: z.string(),
        amount: z.number().positive(),
        method: z.string().optional(),
        note: z.string().optional(),
      });

      const payment = paymentSchema.parse(req.body);

      // Calculate true grand total from items
      const items = invoice.items as any[] || [];
      const subTotal = items.reduce((sum: number, item: any) => {
        const amount = item.amount || ((item.weight > 0 ? item.weight : item.qty) * item.rate);
        return sum + amount;
      }, 0);
      const discount = invoice.discount || 0;
      const taxableAmount = Math.max(0, subTotal - discount);
      const totalTaxRate = (invoice.cgstRate || 0) + (invoice.sgstRate || 0) + (invoice.igstRate || 0);
      const taxAmount = (taxableAmount * totalTaxRate) / 100;
      const grandTotal = taxableAmount + taxAmount;
      
      const advance = invoice.advance || 0;
      const currentPaidAmount = invoice.paidAmount || 0;
      const trueRemaining = Math.max(0, grandTotal - advance - currentPaidAmount);

      // Validate payment amount doesn't exceed true remaining
      if (payment.amount > trueRemaining) {
        res.status(400).json({
          error: "Payment amount exceeds remaining balance",
          remaining: trueRemaining
        });
        return;
      }

      const updatedPayments = [...(invoice.payments as any[] || []), payment];
      const newPaidAmount = currentPaidAmount + payment.amount;
      const newRemainingAmount = Math.max(0, trueRemaining - payment.amount);

      // Auto-update status to Paid if fully paid
      const newStatus = newRemainingAmount <= 0 ? "Paid" : invoice.status;

      const updatedInvoice = await storage.updateInvoice(req.params.id, {
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      } as any);

      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid payment data", details: error.errors });
      } else {
        console.error("Error adding payment:", error);
        res.status(500).json({ error: "Failed to add payment" });
      }
    }
  });

  app.delete("/api/invoices/:id/payments/:index", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        res.status(404).json({ error: "Invoice not found" });
        return;
      }

      const paymentIndex = parseInt(req.params.index);
      const payments = (invoice.payments as any[] || []);

      if (paymentIndex < 0 || paymentIndex >= payments.length) {
        res.status(400).json({ error: "Invalid payment index" });
        return;
      }

      const updatedPayments = payments.filter((_, idx) => idx !== paymentIndex);
      const newPaidAmount = updatedPayments.reduce((sum, p: any) => sum + p.amount, 0);

      // Recalculate remaining (need to get total from somewhere)
      // For now, add back the deleted payment amount
      const deletedAmount = payments[paymentIndex].amount;
      const newRemainingAmount = (invoice.remainingAmount || 0) + deletedAmount;

      // Update status back to Pending if no longer fully paid
      const newStatus = newRemainingAmount > 0 ? "Pending" : "Paid";

      const updatedInvoice = await storage.updateInvoice(req.params.id, {
        payments: updatedPayments,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      } as any);

      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ error: "Failed to delete payment" });
    }
  });

  // Hamali Routes

  // Categories
  app.get("/api/hamali/categories", async (req, res) => {
    try {
      const categories = await storage.getHamaliCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching hamali categories:", error);
      res.status(500).json({ error: "Failed to fetch hamali categories" });
    }
  });

  app.post("/api/hamali/categories", async (req, res) => {
    try {
      // Basic validation since we don't have schema export for insert here yet or we can use generic object
      // We should ideally import insertHamaliCategorySchema, but let's assume body is correct or validate manually if import fails
      const category = await storage.createHamaliCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating hamali category:", error);
      res.status(500).json({ error: "Failed to create hamali category" });
    }
  });

  app.patch("/api/hamali/categories/:id", async (req, res) => {
    try {
      const category = await storage.updateHamaliCategory(req.params.id, req.body);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating hamali category:", error);
      res.status(500).json({ error: "Failed to update hamali category" });
    }
  });

  app.delete("/api/hamali/categories/:id", async (req, res) => {
    try {
      await storage.deleteHamaliCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hamali category:", error);
      res.status(500).json({ error: "Failed to delete hamali category" });
    }
  });

  // Daily Records
  app.get("/api/hamali/records", async (req, res) => {
    try {
      const records = await storage.getHamaliDailyRecords();
      res.json(records);
    } catch (error) {
      console.error("Error fetching hamali records:", error);
      res.status(500).json({ error: "Failed to fetch hamali records" });
    }
  });

  app.post("/api/hamali/records", async (req, res) => {
    try {
      const record = await storage.createHamaliDailyRecord(req.body);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating hamali record:", error);
      res.status(500).json({ error: "Failed to create hamali record" });
    }
  });

  app.delete("/api/hamali/records/:id", async (req, res) => {
    try {
      await storage.deleteHamaliDailyRecord(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hamali record:", error);
      res.status(500).json({ error: "Failed to delete hamali record" });
    }
  });

  app.patch("/api/hamali/records/:id", async (req, res) => {
    try {
      const record = await storage.updateHamaliDailyRecord(req.params.id, req.body);
      if (!record) {
        res.status(404).json({ error: "Record not found" });
        return;
      }
      res.json(record);
    } catch (error) {
      console.error("Error updating hamali record:", error);
      res.status(500).json({ error: "Failed to update hamali record" });
    }
  });

  // Delivery Challan Routes
  app.get("/api/delivery-challans", async (req, res) => {
    try {
      const challans = await storage.getDeliveryChallans();
      res.json(challans);
    } catch (error) {
      console.error("Error fetching delivery challans:", error);
      res.status(500).json({ error: "Failed to fetch delivery challans" });
    }
  });

  app.post("/api/delivery-challans", async (req, res) => {
    try {
      const validatedData = insertDeliveryChallanSchema.parse(req.body);

      // Check for uniqueness
      const existing = await storage.getDeliveryChallanByNo(validatedData.challanNo);
      if (existing) {
        res.status(409).json({ error: "Challan number already exists" });
        return;
      }

      const challan = await storage.createDeliveryChallan(validatedData);
      res.status(201).json(challan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid challan data", details: error.errors });
      } else {
        console.error("Error creating delivery challan:", error);
        res.status(500).json({ error: "Failed to create delivery challan" });
      }
    }
  });

  app.patch("/api/delivery-challans/:id", async (req, res) => {
    try {
      const updateData = insertDeliveryChallanSchema.partial().parse(req.body);
      const challan = await storage.updateDeliveryChallan(req.params.id, updateData);

      if (!challan) {
        res.status(404).json({ error: "Delivery challan not found" });
        return;
      }

      res.json(challan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid challan data", details: error.errors });
      } else {
        console.error("Error updating delivery challan:", error);
        res.status(500).json({ error: "Failed to update delivery challan" });
      }
    }
  });

  app.delete("/api/delivery-challans/:id", async (req, res) => {
    try {
      await storage.deleteDeliveryChallan(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting delivery challan:", error);
      res.status(500).json({ error: "Failed to delete delivery challan" });
    }
  });

  // Transporter Routes
  app.get("/api/transporters", async (req, res) => {
    try {
      const transporters = await storage.getTransporters();
      res.json(transporters);
    } catch (error) {
      console.error("Error fetching transporters:", error);
      res.status(500).json({ error: "Failed to fetch transporters" });
    }
  });

  app.post("/api/transporters", async (req, res) => {
    try {
      const validatedData = insertTransporterSchema.parse(req.body);
      const transporter = await storage.createTransporter(validatedData);
      res.status(201).json(transporter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transporter data", details: error.errors });
      } else {
        console.error("Error creating transporter:", error);
        res.status(500).json({ error: "Failed to create transporter" });
      }
    }
  });

  app.patch("/api/transporters/:id", async (req, res) => {
    try {
      const validatedData = insertTransporterSchema.partial().parse(req.body);
      const transporter = await storage.updateTransporter(req.params.id, validatedData);
      if (!transporter) {
        res.status(404).json({ error: "Transporter not found" });
        return;
      }
      res.json(transporter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid transporter data", details: error.errors });
      } else {
        console.error("Error updating transporter:", error);
        res.status(500).json({ error: "Failed to update transporter" });
      }
    }
  });

  app.delete("/api/transporters/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTransporter(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transporter:", error);
      res.status(500).json({ error: "Failed to delete transporter" });
    }
  });

  // Product Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.json([]);
        return;
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Backup & Export Routes
  app.get("/api/backup/database", async (req, res) => {
    try {
      const fs = await import("fs");
      const path = await import("path");

      const dbPath = path.join(process.cwd(), "sqlite.db");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `invoice-backup-${timestamp}.db`;

      if (fs.existsSync(dbPath)) {
        res.download(dbPath, backupFileName, (err) => {
          if (err) {
            console.error("Error downloading database:", err);
            res.status(500).json({ error: "Failed to download database backup" });
          }
        });
      } else {
        res.status(404).json({ error: "Database file not found" });
      }
    } catch (error) {
      console.error("Error creating database backup:", error);
      res.status(500).json({ error: "Failed to create database backup" });
    }
  });

  app.get("/api/export/json", async (req, res) => {
    try {
      const [invoicesData, challansData, clientsData, hamaliCategories, hamaliRecords, transportersData] = await Promise.all([
        storage.getInvoices(),
        storage.getDeliveryChallans(),
        storage.getClients(),
        storage.getHamaliCategories(),
        storage.getHamaliDailyRecords(),
        storage.getTransporters()
      ]);

      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          invoices: invoicesData,
          deliveryChallans: challansData,
          clients: clientsData,
          hamaliCategories,
          hamaliRecords,
          transporters: transportersData
        }
      };

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `invoice-data-${timestamp}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  app.get("/api/export/csv/invoices", async (req, res) => {
    try {
      const invoicesData = await storage.getInvoices();

      // CSV headers
      const headers = [
        "Invoice No", "Date", "Buyer Name", "Buyer GST", "Status",
        "Discount", "Advance", "Vehicle No", "Created At"
      ];

      // Convert to CSV
      const csvRows = [headers.join(",")];

      for (const inv of invoicesData) {
        const row = [
          `"${inv.invoiceNo}"`,
          inv.date,
          `"${inv.buyerName}"`,
          `"${inv.buyerGst || ""}"`,
          inv.status,
          inv.discount || 0,
          inv.advance || 0,
          `"${inv.vehicleNo || ""}"`,
          inv.createdAt?.toISOString() || ""
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `invoices-${timestamp}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting invoices CSV:", error);
      res.status(500).json({ error: "Failed to export invoices" });
    }
  });

  app.get("/api/export/csv/challans", async (req, res) => {
    try {
      const challansData = await storage.getDeliveryChallans();

      // CSV headers
      const headers = [
        "Challan No", "Date", "Client Name", "Vehicle No",
        "Total Freight", "Given Freight", "Remaining Freight", "Created At"
      ];

      // Convert to CSV
      const csvRows = [headers.join(",")];

      for (const challan of challansData) {
        const row = [
          `"${challan.challanNo}"`,
          challan.date,
          `"${challan.clientName || ""}"`,
          `"${challan.vehicleNo || ""}"`,
          challan.totalFreightSum || 0,
          challan.totalGivenFreightSum || 0,
          challan.totalRemainingFreightSum || 0,
          challan.createdAt?.toISOString() || ""
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `delivery-challans-${timestamp}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting challans CSV:", error);
      res.status(500).json({ error: "Failed to export delivery challans" });
    }
  });

  // Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settingsList = await storage.getSettings();
      // Convert array of {key, value} to an object
      const settingsObj = settingsList.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);
      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Only admins can update settings" });
      }
      
      const updates = req.body; // Expecting { key: "value", key2: "value2" }
      for (const [key, value] of Object.entries(updates)) {
        await storage.setSetting(key, String(value));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Audit Logs Route
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });



  return httpServer;
}
