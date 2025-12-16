import { BrowserStrategy, BrowserActivityData } from './base.strategy';

export class ChromeStrategy extends BrowserStrategy {
    private readonly SUPPORTED_BROWSERS = new Set<string>([
        'Google Chrome',
        'Microsoft Edge',
        'Brave Browser',
        'Opera',
        'Vivaldi',
        'Arc',
        'Cent Browser'
    ]);

    isSupported(appName: string): boolean {
        return this.SUPPORTED_BROWSERS.has(appName) || /chrome|edge|brave|opera/i.test(appName);
    }

    process(appName: string, title: string, rawUrl?: string): BrowserActivityData {
        // active-win provides URL for Chrome on Windows directly if accessibility is on
        // If rawUrl is null, we fallback to window title

        return {
            url: rawUrl || null,
            title: title,
            browserName: appName,
            captureMethod: rawUrl ? 'accessibility' : 'window_api' // On Windows active-win uses UI automation
        };
    }
}
