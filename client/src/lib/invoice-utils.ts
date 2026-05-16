import { InvoiceData } from "./invoice-types";

// Types for calculation results
export interface InvoiceItemCalculated {
    amount: number;
}

export interface InvoiceTotals {
    subTotal: number;
    taxableAmount: number;
    taxAmount: number;
    grandTotal: number;
    totalWeight: number;
}

/**
 * Calculates the total amount for a single invoice item.
 * Logic: (Weight > 0 ? Weight : Qty) * Rate
 */
export function calculateItemAmount(qty: number = 0, weight: number = 0, rate: number = 0): number {
    return (weight > 0 ? weight : qty) * rate;
}

/**
 * Calculates all totals for an invoice.
 */
export function calculateInvoiceTotals(invoice: InvoiceData): InvoiceTotals {
    const items = invoice.items || [];

    // Calculate Subtotal and Total Weight
    const { subTotal, totalWeight } = items.reduce(
        (acc, item) => {
            const amount = item.amount || calculateItemAmount(item.qty, item.weight, item.rate);
            return {
                subTotal: acc.subTotal + amount,
                totalWeight: acc.totalWeight + (item.weight || 0)
            };
        },
        { subTotal: 0, totalWeight: 0 }
    );

    // Calculate Taxable Amount
    const discount = invoice.discount || 0;
    const taxableAmount = Math.max(0, subTotal - discount);

    // Calculate Taxes
    const cgstRate = invoice.cgstRate || 0;
    const sgstRate = invoice.sgstRate || 0;
    const igstRate = invoice.igstRate || 0;
    const totalTaxRate = cgstRate + sgstRate + igstRate;

    const taxAmount = (taxableAmount * totalTaxRate) / 100;

    // Calculate Grand Total
    // Advance is subtracted from "Due Amount", but otherCharges are added to the Invoice Total
    const otherCharges = Number(invoice.otherCharges) || 0;
    const grandTotal = taxableAmount + taxAmount + otherCharges;

    return {
        subTotal,
        taxableAmount,
        taxAmount,
        grandTotal,
        totalWeight
    };
}

/**
 * Calculates the due amount (Outstanding) for an invoice.
 * Logic: Grand Total - Advance
 */
export function calculateDueAmount(invoice: InvoiceData): number {
    const { grandTotal } = calculateInvoiceTotals(invoice);
    const advance = invoice.advance || 0;
    return grandTotal - advance;
}
