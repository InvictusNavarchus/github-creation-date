import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('formats as "Mon D, YYYY" in en-US', () => {
    // Local-time constructor keeps the assertion independent of the machine's timezone.
    expect(formatDate(new Date(2020, 0, 5))).toBe('Jan 5, 2020');
    expect(formatDate(new Date(2021, 11, 31))).toBe('Dec 31, 2021');
  });

  it('throws RangeError on an invalid date (callers must not pass one)', () => {
    expect(() => formatDate(new Date('Unknown'))).toThrow(RangeError);
  });
});
