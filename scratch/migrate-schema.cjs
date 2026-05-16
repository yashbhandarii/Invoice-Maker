const fs = require('fs');
let content = fs.readFileSync('../shared/schema.ts', 'utf8');

content = content.replace(/import \{ sqliteTable, text, integer, real \} from "drizzle-orm\/sqlite-core";/, 
    'import { pgTable as sqliteTable, text, integer, doublePrecision as real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";');

content = content.replace(/integer\(([^,]+), \{ mode: "boolean" \}\)/g, 'boolean($1)');
content = content.replace(/integer\(([^,]+), \{ mode: "timestamp" \}\)/g, 'timestamp($1)');
content = content.replace(/text\(([^,]+), \{ mode: "json" \}\)/g, 'jsonb($1)');

fs.writeFileSync('../shared/schema.ts', content);
console.log('Schema updated successfully');
