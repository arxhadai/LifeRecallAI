/**
 * Utility for handling UTC to Local Time conversions for UI display.
 */
export const DateUtils = {
    /**
     * Converts a UTC date string (e.g. from SQLite) to a system local time string.
     * 
     * SQLite stores dates as 'YYYY-MM-DD HH:MM:SS'.
     * JS Date assumes local time if 'Z' is missing.
     * We append 'Z' to treat the input as UTC.
     */
    toLocalTime: (utcDateString: string): string => {
        if (!utcDateString) return '';

        // Safely handle already-ISO strings or simple SQLite strings
        let cleanStr = utcDateString;
        if (!cleanStr.endsWith('Z') && !cleanStr.includes('+')) {
            cleanStr += 'Z';
        }

        const date = new Date(cleanStr);
        if (isNaN(date.getTime())) {
            return utcDateString; // Fallback to raw if parsing fails
        }

        return date.toLocaleString(); // Uses system locale and timezone
    },

    /**
     * Returns the current time as a UTC ISO string suitable for DB storage.
     */
    nowUTC: (): string => {
        return new Date().toISOString();
    }
};
