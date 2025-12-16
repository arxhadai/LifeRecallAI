import Database from 'better-sqlite3';
import { ActivityEvent } from '../types/activity.types';
import path from 'path';

export class ActivityRepository {
    private db: Database.Database;

    constructor(dbPath: string) {
        // Ensure DB is loaded from the correct path. 
        // In production, this path needs to be resolved carefully relative to appData.
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        // Ensure WAL mode is on (idempotent)
        this.db.pragma('journal_mode = WAL');
    }

    /**
     * Persists a completed activity session to the database.
     */
    saveActivity(activity: ActivityEvent): void {
        if (!activity.endTime) {
            console.warn('ActivityRepository: Attempted to save activity without endTime', activity);
            return;
        }

        try {
            const stmt = this.db.prepare(`
        INSERT INTO activities (
          type, 
          source, 
          title, 
          content, 
          start_time, 
          end_time,
          is_sensitive,
          processing_status,
          capture_method
        ) VALUES (
          @type,
          @source,
          @title,
          @content,
          @startTime,
          @endTime,
          @isSensitive,
          'PENDING',
          @captureMethod
        )
      `);

            stmt.run({
                type: activity.type,
                source: activity.source,
                title: activity.title,
                content: activity.content,
                // formatted as ISO string or suitable for SQLite
                startTime: activity.startTime.toISOString(),
                endTime: activity.endTime.toISOString(),
                isSensitive: activity.isSensitive ? 1 : 0,
                captureMethod: activity.captureMethod || 'window_api',
            });

        } catch (error) {
            console.error('ActivityRepository: Failed to save activity', error);
            throw error;
        }
    }


    /**
     * Retrieves recent activities for display/verification.
     * Adds a virtual property 'created_at_local' for UI consumption.
     */
    getRecentActivities(limit: number = 10): any[] {
        // We use 'any' temporarily or a new interface if strictness required.
        // For MVP verification, returning raw rows + mapped prop is sufficient.

        try {
            const rows = this.db.prepare(`
                SELECT * FROM activities 
                ORDER BY created_at DESC 
                LIMIT ?
            `).all(limit);

            // Lazy import to avoid circular dependencies if any (though utils is shared)
            // But we should import at top level. Let's assume top level import added.
            const { DateUtils } = require('../../../shared/utils/date.utils');

            return rows.map((row: any) => ({
                ...row,
                created_at_local: DateUtils.toLocalTime(row.created_at)
            }));
        } catch (error) {
            console.error('ActivityRepository: Failed to fetch recent activities', error);
            return [];
        }
    }
}
