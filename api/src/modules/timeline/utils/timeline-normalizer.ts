export interface NormalizedTimestampResult {
  normalizedTimestamp: Date;
  originalTimestamp: string;
  timezone: string;
}

/**
 * Parses and normalizes diverse forensic timestamp inputs into a standardized UTC Date,
 * while strictly preserving the raw source timestamp and timezone information.
 */
export function parseAndNormalizeTimestamp(
  rawTimestamp: string | Date | number,
  rawTimezone?: string,
): NormalizedTimestampResult {
  let originalTimestamp: string;
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
    // If epoch seconds (10 digits), convert to ms
    const timeMs = rawTimestamp < 1e11 ? rawTimestamp * 1000 : rawTimestamp;
    const date = new Date(timeMs);
    return {
      normalizedTimestamp: isNaN(date.getTime()) ? new Date() : date,
      originalTimestamp,
      timezone: detectedTimezone,
    };
  }

  originalTimestamp = String(rawTimestamp || '').trim();

  // Extract explicit offset if present in the string (e.g., +05:30, -04:00, Z)
  const offsetMatch = originalTimestamp.match(/([+-]\d{2}:?\d{2}|Z)$/i);
  if (offsetMatch && (!rawTimezone || rawTimezone === 'UTC')) {
    detectedTimezone = offsetMatch[1].toUpperCase() === 'Z' ? 'UTC' : offsetMatch[1];
  }

  let parsedDate: Date;

  // 1. Direct standard parsing (handles ISO 8601 with or without offsets)
  parsedDate = new Date(originalTimestamp);

  // 2. Fallback for "YYYY-MM-DD HH:mm:ss" or "YYYY/MM/DD HH:mm:ss" without ISO 'T'
  if (isNaN(parsedDate.getTime())) {
    const formattedIso = originalTimestamp.replace(' ', 'T');
    parsedDate = new Date(formattedIso);
  }

  // 3. Fallback for "YYYY-MM-DD HH:mm:ss" assuming UTC if no offset
  if (isNaN(parsedDate.getTime())) {
    const formattedIsoUtc = `${originalTimestamp.replace(' ', 'T')}Z`;
    parsedDate = new Date(formattedIsoUtc);
  }

  // 4. Final safety fallback
  if (isNaN(parsedDate.getTime())) {
    parsedDate = new Date();
  }

  return {
    normalizedTimestamp: parsedDate,
    originalTimestamp,
    timezone: detectedTimezone,
  };
}
