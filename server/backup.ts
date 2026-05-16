import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'sqlite.db');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30;

export function initializeBackupSystem() {
  console.log("Initializing Auto-Backup System...");
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Initial backup on startup
  createBackup();

  // Schedule backup every 6 hours (6 * 60 * 60 * 1000 ms)
  setInterval(createBackup, 6 * 60 * 60 * 1000);
}

function createBackup() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("No database file found to backup.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `invoice-backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);

  try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup created successfully: ${backupPath}`);
    cleanOldBackups();
  } catch (error) {
    console.error("Failed to create database backup:", error);
  }
}

function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const dbBackups = files
      .filter(file => file.endsWith('.db') && file.startsWith('invoice-backup-'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    if (dbBackups.length > MAX_BACKUPS) {
      const toDelete = dbBackups.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
        console.log(`Deleted old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning old backups:", error);
  }
}
