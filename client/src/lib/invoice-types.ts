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

export const invoiceSchema = z.object({
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
  cgstRate: z.number().min(0).default(0),
  sgstRate: z.number().min(0).default(0),
  igstRate: z.number().min(0).default(0),
  
  // Calculated fields (usually computed, but can be overridden if needed)
  // We will compute these on the fly in the component, but store manual overrides if we want. 
  // For now, let's just store the inputs.
  
  advance: z.number().min(0).default(0),

  // Bank Details
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankBranch: z.string().optional(),
});

export type InvoiceData = z.infer<typeof invoiceSchema>;
export type LineItem = z.infer<typeof lineItemSchema>;

export const defaultInvoice: InvoiceData = {
  sellerName: "M/S. LALCHAND NEMICHAND BHANDARI",
  sellerHindiName: "मे. लालचंद 네मिचंद भंडारी",
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
  cgstRate: 0,
  sgstRate: 0,
  igstRate: 0,
  advance: 0,
  
  bankName: "Ahmednagar Merchant Co-Op. Bank Ltd.",
  bankAccountNo: "010001100000008",
  bankIfsc: "AMDN0000110",
  bankBranch: "Shrigonda, Dist. Ahmednagar"
};
