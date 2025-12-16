const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../database/liferecall.sqlite');

function migrate() {
    console.log('🔄 Running Migration: Add capture_method column...');
    try {
        const db = new Database(DB_PATH);

        // Check if column exists
        const tableInfo = db.pragma('table_info(activities)');
        const hasColumn = tableInfo.some(col => col.name === 'capture_method');

        if (!hasColumn) {
            db.exec(`ALTER TABLE activities ADD COLUMN capture_method TEXT DEFAULT 'window_api'`);
            console.log('✅ Column `capture_method` added successfully.');
        } else {
            console.log('ℹ️ Column `capture_method` already exists.');
        }

        db.close();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
