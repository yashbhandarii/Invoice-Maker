
import { db } from "./server/db";
import { hamaliDailyRecords } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Testing DB insertion with comment...");
    try {
        const testComment = "Test Comment " + Date.now();
        const result = await db.insert(hamaliDailyRecords).values({
            date: new Date().toISOString(),
            totalAmount: 100,
            items: [],
            comment: testComment
        }).returning();

        console.log("Inserted Record:", result[0]);

        if (result[0].comment === testComment) {
            console.log("SUCCESS: Comment was saved and retrieved.");
        } else {
            console.error("FAILURE: Comment was NOT saved. Value:", result[0].comment);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main();
