export class BrowserPrivacyFilter {
    private readonly SENSITIVE_DOMAINS = [
        'accounts.google.com',
        'myaccount.google.com',
        'login.live.com',
        'github.com/login',
        'vault.bitwarden.com',
        '1password.com',
        'lastpass.com',
        'bank', // simplistic keyword match
        'paypal.com',
        'stripe.com',
        'coinbase.com',
        'binance.com'
    ];

    isUrlSensitive(url: string | null): boolean {
        if (!url) return false;

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();

            return this.SENSITIVE_DOMAINS.some(domain => hostname.includes(domain));
        } catch (e) {
            // Invalid URL, treat as safe or fallback? Treat as safe content wise, but maybe log error?
            return false;
        }
    }
}
