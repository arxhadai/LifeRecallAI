import { BrowserStrategy } from './browser/base.strategy';
import { ChromeStrategy } from './browser/chrome.strategy';
import { FirefoxStrategy } from './browser/firefox.strategy';
import { RawWindowData, ActivityEvent } from '../types/activity.types';
import { BrowserPrivacyFilter } from '../filters/browser-privacy.filter';

export class BrowserMonitor {
    private strategies: BrowserStrategy[];
    private privacyFilter: BrowserPrivacyFilter;

    constructor() {
        this.strategies = [
            new ChromeStrategy(),
            new FirefoxStrategy()
        ];
        this.privacyFilter = new BrowserPrivacyFilter();
    }

    /**
     * Checks if the given app is a known browser.
     */
    isBrowser(appName: string): boolean {
        return this.strategies.some(s => s.isSupported(appName));
    }

    /**
     * Processes raw window data using appropriate browser strategy.
     */
    process(raw: RawWindowData): ActivityEvent {
        const strategy = this.strategies.find(s => s.isSupported(raw.appName));

        // Default values if no specific strategy found (Fallback)
        let docTitle = raw.title;
        let docUrl: string | null = null;
        let method = 'fallback'; // effectively 'window_api' but simplified logic

        if (strategy) {
            // RawWindowData from active-win might contain 'url' property if we type it correctly in previous steps
            // But we didn't add 'url' to RawWindowData interface formally in previous step?
            // Wait, we need to check interface. active-win returns { url?: string }.
            // We need to cast or update RawWindowData in activity.types.ts to support 'url'
            const activeWinRaw = raw as any; // Temporary cast until type update

            const result = strategy.process(raw.appName, raw.title, activeWinRaw.url);
            docTitle = result.title;
            docUrl = result.url;
            method = result.captureMethod;
        }

        const isSensitive = this.privacyFilter.isUrlSensitive(docUrl);
        const finalTitle = isSensitive ? 'Restricted Site' : docTitle;
        const finalContent = isSensitive ? null : docUrl;

        return {
            type: 'URL', // Browser activity is consistently type 'URL' if it's a browser
            source: raw.appName,
            title: finalTitle,
            content: finalContent, // This is the URL
            startTime: new Date(raw.timestamp),
            endTime: undefined,
            isSensitive: isSensitive,
            // We need to pass captureMethod out.
            // But ActivityEvent doesn't have it yet. 
            // We will need to update ActivityEvent interface too.
        } as any; // Cast as any because we are adding dynamic props before updating type file
    }
}
