export class PrivacyFilter {
    // List of sensitive applications to mask
    private readonly SENSITIVE_APPS = new Set([
        'KeePass',
        'KeePassXC',
        'Bitwarden',
        '1Password',
        'Authy',
        'LastPass',
        'Enpass',
        'Dashlane',
        'RoboForm',
        'Keysmith',
        'Private/Incognito', // Generic keyword often in titles
    ]);

    /**
     * Determines if an activity is sensitive based on its source (app name) or title.
     */
    isSensitive(appName: string, windowTitle?: string): boolean {
        if (this.SENSITIVE_APPS.has(appName)) {
            return true;
        }

        // Heuristic: Check for common "private" keywords in title
        if (windowTitle) {
            const lowerTitle = windowTitle.toLowerCase();
            if (
                lowerTitle.includes('incognito') ||
                lowerTitle.includes('private browsing') ||
                lowerTitle.includes('inprivate')
            ) {
                return true;
            }
        }

        return false;
    }
}
