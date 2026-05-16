import { z } from "zod";

export const lineItemSchema = z.object({
  id: z.string(),
  hsnCode: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  qty: z.number().min(0),
  weight: z.number().min(0).optional(),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  address: z.string().optional(),
  gst: z.string().optional(),
  stateCode: z.string().optional(),
  transport: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
});

export const invoiceSchema = z.object({
  id: z.string().optional(), // Internal ID for the app
  status: z.enum(["Paid", "Pending", "Overdue"]).default("Pending"),
  financialYear: z.string().optional(),

  // Seller Details
  sellerName: z.string().min(1, "Company Name is required"),
  sellerHindiName: z.string().optional(),
  sellerSubtitle: z.string().optional(), // "GENERAL MERCHANT & COMMISSION AGENT"
  sellerAddress: z.string().optional(),
  sellerPan: z.string().optional(),
  sellerGst: z.string().optional(),
  sellerContact1: z.string().optional(), // "Ashish : ..."
  sellerContact2: z.string().optional(), // "Dipak : ..."

  // Buyer Details
  buyerName: z.string().min(1, "Buyer Name is required"),
  buyerAddress: z.string().optional(),
  buyerThrough: z.string().optional(), // Transport
  buyerGst: z.string().optional(),
  buyerStateCode: z.string().optional(),

  // Invoice Details
  invoiceNo: z.string().min(1, "Invoice No is required"),
  date: z.string().min(1, "Date is required"), // YYYY-MM-DD or DD/MM/YYYY
  vehicleNo: z.string().optional(),

  // Line Items
  items: z.array(lineItemSchema),

  // Totals
  discount: z.number().min(0).default(0),
  discountLabel: z.string().default("Discount"), // Custom label for discount
  cgstRate: z.number().min(0).default(0),
  sgstRate: z.number().min(0).default(0),
  igstRate: z.number().min(0).default(0),

  // Calculated fields (usually computed, but can be overridden if needed)
  // We will compute these on the fly in the component, but store manual overrides if we want. 
  // For now, let's just store the inputs.

  advance: z.number().min(0).default(0),
  advanceLabel: z.string().default("Advance"), // Custom label for advance

  otherCharges: z.number().min(0).default(0),
  otherChargesLabel: z.string().default("Freight / Labour"), // Editable label for extra charges

  // Bank Details
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankBranch: z.string().optional(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type ClientData = z.infer<typeof clientSchema>;

// Product type for catalog
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  unit: string;
  defaultRate: number;
  hsnCode?: string | null;
  taxRate: number;
  category?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const defaultInvoice: InvoiceData = {
  status: "Pending",
  sellerName: "M/S. LALCHAND NEMICHAND BHANDARI",
  sellerHindiName: "मे. लालचंद नेमीचंद भंडारी",
  sellerSubtitle: "GENERAL MERCHANT & COMMISSION AGENT",
  sellerAddress: "A/p. Shrigonda, Tal. Shrigonda, Dist. Ahmednagar - 413 701",
  sellerPan: "AEOPB3732L",
  sellerGst: "27AEOPB3732L1ZC",
  sellerContact1: "Ashish : 9422228205",
  sellerContact2: "Dipak : 9422223745",

  buyerName: "",
  buyerAddress: "",
  buyerThrough: "",
  buyerGst: "",
  buyerStateCode: "27",

  invoiceNo: "2005",
  date: new Date().toISOString().split('T')[0],
  vehicleNo: "",

  items: [
    { id: "1", hsnCode: "", description: "Example Item", qty: 1, weight: 22.00, rate: 22.00, amount: 484.00 }
  ],

  discount: 0,
  discountLabel: "Discount",
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  advance: 0,
  advanceLabel: "Advance",
  otherCharges: 0,
  otherChargesLabel: "Freight / Labour",

  bankName: "Ahmednagar Merchant Co-Op. Bank Ltd.",
  bankAccountNo: "010001100000008",
  bankIfsc: "AMDN0000110",
  bankBranch: "Shrigonda, Dist. Ahmednagar"
};

// Hamali Types
export interface HamaliCategory {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}

export interface HamaliRecordItem {
  categoryId: string;
  categoryName: string;
  rate: number;
  bags: number;
  total: number;
  comment?: string;
}

export interface HamaliDailyRecord {
  id: string;
  date: string;
  totalAmount: number;
  items: HamaliRecordItem[];
  createdAt: string;
  comment?: string;
}



export interface Transporter {
  id: string;
  name: string;
  vehicleNo: string | null;
  mobile: string | null;
  createdAt: string;
}

// Delivery Challan Types

export const challanItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  bags: z.number().min(0),
  weight: z.number().min(0),
  totalFreight: z.number().min(0),
  givenFreight: z.number().min(0),
  remainingFreight: z.number().min(0),
});

export const deliveryChallanSchema = z.object({
  id: z.string().optional(),
  challanNo: z.string().min(1, "Challan No is required"),
  financialYear: z.string().optional(),
  date: z.string().min(1, "Date is required"),

  // Header / Company Details (Reusing Seller Details concepts usually)
  companyName: z.string().min(1, "Company Name is required"),
  companyAddress: z.string().optional(),
  companyGst: z.string().optional(),
  companyContact: z.string().optional(),

  // Client Details
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),

  // Transport Details
  driverName: z.string().optional(),
  driverMobile: z.string().optional(),
  vehicleNo: z.string().optional(),

  // Items
  items: z.array(challanItemSchema),

  // Freight Summary (Auto-calculated, but can be overridden/stored)
  totalFreightSum: z.number().default(0),
  totalGivenFreightSum: z.number().default(0),
  totalRemainingFreightSum: z.number().default(0),
  netFreight: z.number().default(0),

  expenseReason: z.string().optional(),
  expenseAmount: z.number().default(0),
  notes: z.string().optional(),
  hideFreight: z.boolean().default(false),

  payments: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    note: z.string().optional()
  })).optional().default([]),
});

export type DeliveryChallanData = z.infer<typeof deliveryChallanSchema>;
export type ChallanItem = z.infer<typeof challanItemSchema>;

export const defaultChallan: DeliveryChallanData = {
  challanNo: "",
  date: new Date().toISOString().split('T')[0],

  companyName: "M/S. LALCHAND NEMICHAND BHANDARI",
  companyAddress: "A/p. Shrigonda, Tal. Shrigonda, Dist. Ahmednagar - 413 701",
  companyGst: "27AEOPB3732L1ZC",
  companyContact: "Ashish : 9422228205 | Dipak : 9422223745",

  clientName: "",
  clientAddress: "",

  driverName: "",
  driverMobile: "",
  vehicleNo: "",

  items: [
    {
      id: "1",
      description: "",
      bags: 0,
      weight: 0,
      totalFreight: 0,
      givenFreight: 0,
      remainingFreight: 0
    }
  ],

  totalFreightSum: 0,
  totalGivenFreightSum: 0,
  totalRemainingFreightSum: 0,
  netFreight: 0,

  expenseReason: "",
  expenseAmount: 0,
  notes: "",
  hideFreight: false,
  payments: []
};


