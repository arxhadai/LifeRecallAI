import path from 'path';
import { WindowMonitor } from './monitors/window.monitor';
import { SessionMonitor } from './monitors/session.monitor';
import { ActivityRepository } from './persistence/activity.repository';

// CONFIGURATION
const POLL_INTERVAL_MS = 1000; // 1 second
const DB_PATH = path.resolve(__dirname, '../../../database/liferecall.sqlite');
// Note: Path depends on build structure. 
// Assuming source is src/main/activity-logger/index.ts
// Rel to root: src/main/activity-logger -> src/main -> src -> root
// That is ../../../

export class ActivityLoggerService {
    private windowMonitor: WindowMonitor;
    private sessionMonitor: SessionMonitor;
    private repository: ActivityRepository;
    private intervalId: NodeJS.Timeout | null = null;

    constructor() {
        // Initialize dependencies
        this.windowMonitor = new WindowMonitor();
        this.repository = new ActivityRepository(DB_PATH);
        this.sessionMonitor = new SessionMonitor(this.repository);
    }

    /**
     * Starts the monitoring loop.
     */
    start(): void {
        if (this.intervalId) {
            return; // Already running
        }

        console.log('ActivityLogger: Starting monitoring loop...');
        this.intervalId = setInterval(async () => {
            await this.tick();
        }, POLL_INTERVAL_MS);
    }

    /**
     * Stops the monitoring loop.
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('ActivityLogger: Stopped.');
        }
    }

    /**
     * Single heartbeat of the logger.
     */
    private async tick(): Promise<void> {
        try {
            const rawWindow = await this.windowMonitor.getActiveWindow();
            this.sessionMonitor.processSnapshot(rawWindow);
        } catch (error) {
            console.error('ActivityLogger: Error in tick loop', error);
            // Resilience: Don't crash, just log and continue next tick
        }
    }
}

// Entry point for standalone testing or integration
if (require.main === module) {
    const logger = new ActivityLoggerService();
    logger.start();

    // keep alive for testing
    process.on('SIGINT', () => {
        logger.stop();
        process.exit(0);
    });
}
