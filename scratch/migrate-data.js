import Database from 'better-sqlite3';
import postgres from 'postgres';

const sqlite = new Database('../sqlite.db');
const pgUrl = "postgresql://postgres.mylmgifbvtcviwgflydf:EGssG4bJ%23%26664zJ@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";
const sql = postgres(pgUrl, { prepare: false });

async function migrateTable(tableName) {
    let rows;
    try {
        rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
    } catch(e) {
        console.log(`Table ${tableName} does not exist in SQLite.`);
        return;
    }
    
    if (rows.length === 0) {
        console.log(`Table ${tableName} is empty, skipping.`);
        return;
    }
    
    console.log(`Migrating ${rows.length} rows from ${tableName}...`);
    
    const formattedRows = rows.map(row => {
        const newRow = { ...row };
        for (const [key, value] of Object.entries(newRow)) {
            if (typeof value === 'string' && value.trim().startsWith('[') && value.trim().endsWith(']')) {
                try { newRow[key] = JSON.parse(value); } catch (e) {}
            } else if (typeof value === 'string' && value.trim().startsWith('{') && value.trim().endsWith('}')) {
                try { newRow[key] = JSON.parse(value); } catch (e) {}
            }
            const boolCols = ['is_active', 'track_inventory', 'hide_freight', 'is_default'];
            if (boolCols.includes(key)) {
                newRow[key] = value === 1 ? true : false;
            }
            const timeCols = ['created_at', 'updated_at'];
            if (timeCols.includes(key) && value) {
                newRow[key] = new Date(value).toISOString();
            }
        }
        return newRow;
    });

    const CHUNK_SIZE = 50;
    for (let i = 0; i < formattedRows.length; i += CHUNK_SIZE) {
        const chunk = formattedRows.slice(i, i + CHUNK_SIZE);
        await sql`INSERT INTO ${sql(tableName)} ${sql(chunk)} ON CONFLICT DO NOTHING`;
    }
    console.log(`Successfully migrated ${tableName}.`);
}

async function run() {
    const tables = [
        "users", "clients", "transporters", "invoices",
        "hamali_categories", "hamali_daily_records", "delivery_challans",
        "products", "inventory_transactions", "settings", "audit_logs"
    ];
    for (const table of tables) {
        try {
            await migrateTable(table);
        } catch (error) {
            console.error(`Error migrating table ${table}:`, error.message);
        }
    }
    console.log("Migration complete.");
    process.exit(0);
}

run();
