import activeWin from 'active-win';
import { RawWindowData } from '../types/activity.types';

export class WindowMonitor {
    /**
     * Captures the currently active window.
     * Returns null if no window is active or on error.
     */
    async getActiveWindow(): Promise<RawWindowData | null> {
        try {
            const result = await activeWin();

            if (!result) {
                return null;
            }

            const owner = result.owner;
            const bundleId = 'bundleId' in owner ? (owner as any).bundleId : null;

            return {
                appName: owner.name,
                appPath: owner.path,
                bundleId,
                title: result.title,
                url: (result as any).url, // active-win types might optionally include url
                platform: process.platform,
                timestamp: Date.now(),
                memoryUsage: result.memoryUsage,
            };
        } catch (error) {
            console.error('WindowMonitor: Failed to capture active window', error);
            return null;
        }
    }
}
