import { ActivityRepository } from '../src/main/activity-logger/persistence/activity.repository';
import path from 'path';

// Adjust path relative to where script is run (Assuming root)
const DB_PATH = path.resolve(__dirname, '../database/liferecall.sqlite');
const TEST_LIMIT = 5;

async function runTest() {
    console.log('🕒 Testing Timestamp Handling...');
    console.log(`📂 Database: ${DB_PATH}`);

    const repo = new ActivityRepository(DB_PATH);

    // 1. Fetch Recent
    console.log(`\n🔍 Fetching last ${TEST_LIMIT} activities...`);
    const activities = repo.getRecentActivities(TEST_LIMIT);

    if (activities.length === 0) {
        console.log('⚠️ No activities found. Run the logger first.');
    } else {
        console.log('\n📊 Activity Log (UTC vs Local):');
        console.table(activities.map(a => ({
            ID: a.id,
            App: a.source,
            Title: a.title ? a.title.substring(0, 30) + '...' : 'N/A',
            'UTC (Stored)': a.created_at,
            'Local (Displayed)': a.created_at_local
        })));
    }

    // 2. Validate Timezone
    const sample = activities[0];
    if (sample) {
        console.log('\n🧪 Validation:');
        console.log(`   UTC:   ${sample.created_at}`);
        console.log(`   Local: ${sample.created_at_local}`);

        const systemTime = new Date().toLocaleString();
        console.log(`   System:${systemTime}`);
        console.log('   (Local should match System time formatted roughly same)');
    }
}

runTest();
