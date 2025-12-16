import { BrowserStrategy, BrowserActivityData } from './base.strategy';

export class FirefoxStrategy extends BrowserStrategy {
    isSupported(appName: string): boolean {
        return /firefox|nightly|librewolf/i.test(appName);
    }

    process(appName: string, title: string, rawUrl?: string): BrowserActivityData {
        // Firefox on Windows also supported by active-win via UI Automation

        // Sanitize title: "Page Title - Mozilla Firefox" -> "Page Title"
        let cleanTitle = title;
        const separatorIndex = title.lastIndexOf(' — Mozilla Firefox');
        if (separatorIndex !== -1) {
            cleanTitle = title.substring(0, separatorIndex);
        } else {
            // Try standard dash if em-dash not used
            const dashIndex = title.lastIndexOf(' - Mozilla Firefox');
            if (dashIndex !== -1) {
                cleanTitle = title.substring(0, dashIndex);
            }
        }

        return {
            url: rawUrl || null,
            title: cleanTitle,
            browserName: appName,
            captureMethod: rawUrl ? 'accessibility' : 'window_api'
        };
    }
}
