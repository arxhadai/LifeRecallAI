import { ActivityEvent, RawWindowData } from '../types/activity.types';
import { ActivityNormalizer } from '../normalizers/activity.normalizer';
import { ActivityRepository } from '../persistence/activity.repository';
import { BrowserMonitor } from './browser.monitor';

export class SessionMonitor {
    private currentSession: ActivityEvent | null = null;
    private normalizer: ActivityNormalizer;
    private repository: ActivityRepository;
    private browserMonitor: BrowserMonitor;

    constructor(repository: ActivityRepository) {
        this.repository = repository;
        this.normalizer = new ActivityNormalizer();
        this.browserMonitor = new BrowserMonitor();
    }

    /**
     * Processes a new snapshot of window data.
     * Manages session logic: start, extend, or end.
     */
    processSnapshot(raw: RawWindowData | null): void {
        const timestamp = new Date();

        // CASE 1: No active window (System Idle or Error)
        if (!raw) {
            this.closeCurrentSession(timestamp);
            return;
        }

        // Convert raw data to potential new session
        let incomingEvent: ActivityEvent;
        if (this.browserMonitor.isBrowser(raw.appName)) {
            incomingEvent = this.browserMonitor.process(raw);
        } else {
            incomingEvent = this.normalizer.normalize(raw);
        }

        // CASE 2: No current session exists -> Start one
        if (!this.currentSession) {
            this.currentSession = incomingEvent;
            return;
        }

        // CASE 3: Active session exists
        // Check if we should extend it (Same App AND Same Title)
        // Note: We compare "source" (app name) and "title".
        const isSameApp = this.currentSession.source === incomingEvent.source;
        const isSameTitle = this.currentSession.title === incomingEvent.title;

        if (isSameApp && isSameTitle) {
            // Extend session: Just update the "temporary" end time or do nothing until close.
            // We don't verify duration here, we just implicitly continue.
            return;
        } else {
            // Context switch detected -> Close old, Start new
            this.closeCurrentSession(timestamp); // Close old at current time
            this.currentSession = incomingEvent; // Start new
            // Adjust start time of new session to match close time of old? 
            // Yes, logical flow. IncomingEvent has "now" as start time.
        }
    }

    /**
     * Closes the current session if it exists and persists it.
     */
    private closeCurrentSession(endTime: Date): void {
        if (this.currentSession) {
            this.currentSession.endTime = endTime;

            // Filter out micro-sessions? (e.g. < 1 second)
            // For now, persist everything as per requirements.
            this.repository.saveActivity(this.currentSession);

            this.currentSession = null;
        }
    }
}
