const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const DB_DIR = path.join(PROJECT_ROOT, 'database');
const DB_FILE = path.join(DB_DIR, 'liferecall.sqlite');
const SCHEMA_FILE = path.join(DB_DIR, 'schema.sql');

function initDatabase() {
    console.log('🔄 Starting Database Initialization...');

    // 1. Ensure database directory exists
    if (!fs.existsSync(DB_DIR)) {
        console.log(`📂 Creating directory: ${DB_DIR}`);
        fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // 2. Connect to Database (Creates file if missing)
    console.log(`🔌 Connecting to database: ${DB_FILE}`);
    let db;
    try {
        db = new Database(DB_FILE);
    } catch (err) {
        console.error('❌ Failed to create/connect to database:', err);
        process.exit(1);
    }

    // 3. Load Schema
    console.log(`📄 Reading schema from: ${SCHEMA_FILE}`);
    if (!fs.existsSync(SCHEMA_FILE)) {
        console.error('❌ Schema file not found!');
        process.exit(1);
    }

    const schema = fs.readFileSync(SCHEMA_FILE, 'utf-8');

    // 4. Execute Schema
    try {
        console.log('🚀 Executing schema...');
        db.exec(schema);
        console.log('✅ Schema applied successfully.');
    } catch (err) {
        console.error('❌ Error applying schema:', err);
        process.exit(1);
    }

    // 5. Verify Tables
    try {
        const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;").all();

        console.log('\n📊 Database Verification - Tables Found:');
        if (tables.length === 0) {
            console.warn('⚠️  No tables found! check your schema.');
        } else {
            tables.forEach(row => {
                console.log(`   - ${row.name}`);
            });
            console.log(`\n✅ Database initialized with ${tables.length} tables.`);
        }
    } catch (err) {
        console.error('❌ Error verifying tables:', err);
    } finally {
        db.close();
    }
}

initDatabase();
