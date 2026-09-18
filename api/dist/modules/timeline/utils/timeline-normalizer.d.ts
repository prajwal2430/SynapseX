export interface NormalizedTimestampResult {
    normalizedTimestamp: Date;
    originalTimestamp: string;
    timezone: string;
}
export declare function parseAndNormalizeTimestamp(rawTimestamp: string | Date | number, rawTimezone?: string): NormalizedTimestampResult;
