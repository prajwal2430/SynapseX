"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAndNormalizeTimestamp = parseAndNormalizeTimestamp;
function parseAndNormalizeTimestamp(rawTimestamp, rawTimezone) {
    let originalTimestamp;
    let detectedTimezone = rawTimezone?.trim() || 'UTC';
    if (rawTimestamp instanceof Date) {
        originalTimestamp = rawTimestamp.toISOString();
        return {
            normalizedTimestamp: new Date(rawTimestamp.getTime()),
            originalTimestamp,
            timezone: detectedTimezone,
        };
    }
    if (typeof rawTimestamp === 'number') {
        originalTimestamp = String(rawTimestamp);
        const timeMs = rawTimestamp < 1e11 ? rawTimestamp * 1000 : rawTimestamp;
        const date = new Date(timeMs);
        return {
            normalizedTimestamp: isNaN(date.getTime()) ? new Date() : date,
            originalTimestamp,
            timezone: detectedTimezone,
        };
    }
    originalTimestamp = String(rawTimestamp || '').trim();
    const offsetMatch = originalTimestamp.match(/([+-]\d{2}:?\d{2}|Z)$/i);
    if (offsetMatch && (!rawTimezone || rawTimezone === 'UTC')) {
        detectedTimezone = offsetMatch[1].toUpperCase() === 'Z' ? 'UTC' : offsetMatch[1];
    }
    let parsedDate;
    parsedDate = new Date(originalTimestamp);
    if (isNaN(parsedDate.getTime())) {
        const formattedIso = originalTimestamp.replace(' ', 'T');
        parsedDate = new Date(formattedIso);
    }
    if (isNaN(parsedDate.getTime())) {
        const formattedIsoUtc = `${originalTimestamp.replace(' ', 'T')}Z`;
        parsedDate = new Date(formattedIsoUtc);
    }
    if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
    }
    return {
        normalizedTimestamp: parsedDate,
        originalTimestamp,
        timezone: detectedTimezone,
    };
}
//# sourceMappingURL=timeline-normalizer.js.map