import { RawWindowData, ActivityEvent } from '../types/activity.types';
import { PrivacyFilter } from '../filters/privacy.filter';

export class ActivityNormalizer {
    private privacyFilter: PrivacyFilter;

    constructor() {
        this.privacyFilter = new PrivacyFilter();
    }

    /**
     * Converts raw window data into a structured ActivityEvent.
     * Applies privacy filtering logic.
     */
    normalize(raw: RawWindowData): ActivityEvent {
        const appName = raw.appName;
        const isSensitive = this.privacyFilter.isSensitive(appName, raw.title);

        // Default content policy: Window Title (if not sensitive)
        // If sensitive, we strip the title/content to protect privacy
        const title = isSensitive ? 'Restricted Activity' : raw.title;
        const content = isSensitive ? null : raw.title; // For MVP, content is just title. Later could be URL/clipboard.

        return {
            type: 'APP', // Default type for window activities
            source: appName,
            title: title,
            content: content,
            startTime: new Date(),
            endTime: undefined, // Will be set when session ends
            isSensitive: isSensitive,
        };
    }
}
