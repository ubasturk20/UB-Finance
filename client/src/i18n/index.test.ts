import { describe, expect, it } from 'vitest';
import { formatCount, formatPercent, t } from './index';

describe('t', () => {
  it('returns the Turkish text, filling placeholders', () => {
    expect(t('common.save')).toBe('Kaydet');
    expect(formatCount(1234)).toBe('1.234');
    expect(formatPercent(0.125)).toBe('%12,5');
  });
});
