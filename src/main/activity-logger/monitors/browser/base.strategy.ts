export interface BrowserActivityData {
    url: string | null;
    title: string;
    browserName: string;
    captureMethod: 'window_api' | 'accessibility' | 'fallback';
}

export abstract class BrowserStrategy {
    abstract isSupported(appName: string): boolean;
    abstract process(appName: string, title: string, rawUrl?: string): BrowserActivityData;
}
