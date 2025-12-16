export interface ActivityEvent {
  type: 'APP' | 'URL' | 'FILE' | 'NOTE' | 'TASK';
  source: string; // App name or Domain
  title?: string;
  content?: string | null;
  startTime: Date;
  endTime?: Date;
  isSensitive: boolean;
  captureMethod?: string;
}

export interface RawWindowData {
  appName: string;
  appPath: string;
  bundleId: string | null;
  title: string;
  url?: string;
  platform: string;
  timestamp: number;
  memoryUsage?: number;
}
