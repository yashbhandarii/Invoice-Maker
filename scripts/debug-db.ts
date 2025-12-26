
import { storage } from "../server/storage";
import { insertInvoiceSchema } from "../shared/schema";

async function runDebug() {
    console.log("Starting DB Debug...");

    const testInvoice = {
        invoiceNo: "TEST-" + Math.floor(Math.random() * 10000),
        status: "Pending",
        date: new Date().toISOString().split('T')[0],
        sellerName: "Test Seller",
        buyerName: "Test Buyer",
        items: [
            {
                id: "1",
                description: "Test Item",
                qty: 1,
                rate: 100,
                amount: 100,
                weight: 0
            }
        ],
        discount: 0,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        advance: 0
    };

    try {
        console.log("Attempting to create invoice...");
        const validatedCreate = insertInvoiceSchema.parse(testInvoice);
        const created = await storage.createInvoice(validatedCreate);
        console.log("Created Invoice ID:", created.id);

        console.log("Attempting to update invoice...");
        const updateData = {
            ...testInvoice,
            buyerName: "Updated Buyer",
            items: [
                {
                    id: "1",
                    description: "Updated Item",
                    qty: 2,
                    rate: 100,
                    amount: 200,
                    weight: 0
                }
            ]
        };

        // Validate update data as route does
        const validatedUpdate = insertInvoiceSchema.partial().parse(updateData);

        // Perform update
        const updated = await storage.updateInvoice(created.id, validatedUpdate);
        console.log("Updated Invoice:", updated?.buyerName);
        console.log("SUCCESS: DB Check Passed");

    } catch (error) {
        console.error("DEBUG FAILED:");
        console.error(error);
    }
}

runDebug().catch(console.error);
