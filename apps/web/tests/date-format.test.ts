import { describe, expect, it } from 'vitest';

import { formatUtcDateTime } from '../lib/date-format';

describe('formatUtcDateTime', () => {
  it('formats timestamps deterministically in UTC for server/client hydration', () => {
    expect(formatUtcDateTime('2026-06-26T19:59:19.000Z')).toBe('Jun 26, 2026, 7:59:19 PM UTC');
  });

  it('returns fallback text for missing timestamps', () => {
    expect(formatUtcDateTime(null, 'No finish time')).toBe('No finish time');
  });
});
