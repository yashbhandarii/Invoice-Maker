import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/sqlite-schema";
import * as dotenv from "dotenv";
import path from 'path';

dotenv.config();

const dbPath = path.join(process.cwd(), 'sqlite.db');
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Initialize database schema if needed
export const db = drizzle(sqlite, { schema });


