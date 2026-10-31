import { parseAndNormalizeTimestamp } from './timeline-normalizer';

describe('parseAndNormalizeTimestamp', () => {
  it('should parse ISO 8601 UTC string preserving original timestamp and UTC timezone', () => {
    const raw = '2026-09-06T01:15:30.000Z';
    const result = parseAndNormalizeTimestamp(raw);

    expect(result.originalTimestamp).toBe(raw);
    expect(result.timezone).toBe('UTC');
    expect(result.normalizedTimestamp.toISOString()).toBe('2026-09-06T01:15:30.000Z');
  });

  it('should parse ISO 8601 string with positive offset (+05:30) and correctly convert to UTC', () => {
    const raw = '2026-09-06T06:45:30+05:30';
    const result = parseAndNormalizeTimestamp(raw);

    expect(result.originalTimestamp).toBe(raw);
    expect(result.timezone).toBe('+05:30');
    // 06:45:30 minus 5h30m = 01:15:30 UTC
    expect(result.normalizedTimestamp.toISOString()).toBe('2026-09-06T01:15:30.000Z');
  });

  it('should parse ISO 8601 string with negative offset (-04:00) and correctly convert to UTC', () => {
    const raw = '2026-09-05T21:15:30-04:00';
    const result = parseAndNormalizeTimestamp(raw);

    expect(result.originalTimestamp).toBe(raw);
    expect(result.timezone).toBe('-04:00');
    // 21:15:30 on Sept 5 + 4h = 01:15:30 on Sept 6 UTC
    expect(result.normalizedTimestamp.toISOString()).toBe('2026-09-06T01:15:30.000Z');
  });

  it('should preserve explicit timezone when provided', () => {
    const raw = '2026-09-06T01:15:30Z';
    const result = parseAndNormalizeTimestamp(raw, 'Asia/Kolkata');

    expect(result.originalTimestamp).toBe(raw);
    expect(result.timezone).toBe('Asia/Kolkata');
  });

  it('should handle epoch milliseconds', () => {
    const date = new Date('2026-09-06T01:15:30.000Z');
    const result = parseAndNormalizeTimestamp(date.getTime());

    expect(result.normalizedTimestamp.toISOString()).toBe('2026-09-06T01:15:30.000Z');
    expect(result.originalTimestamp).toBe(String(date.getTime()));
  });

  it('should fallback gracefully on unparseable date strings', () => {
    const raw = 'not-a-valid-date';
    const result = parseAndNormalizeTimestamp(raw);

    expect(result.originalTimestamp).toBe(raw);
    expect(result.normalizedTimestamp instanceof Date).toBe(true);
    expect(isNaN(result.normalizedTimestamp.getTime())).toBe(false);
  });
});
