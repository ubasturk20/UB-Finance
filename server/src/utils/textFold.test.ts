import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { foldText } from './textFold';

describe('foldText', () => {
  it('lets Turkish spellings and plain ASCII capitals meet', () => {
    for (const s of ['MİGROS', 'MIGROS', 'Migros', 'mıgros']) expect(foldText(s)).toBe('migros');
    expect(foldText('ŞOK Süt Ürünleri ĞÇÖ')).toBe('sok sut urunleri gco');
    expect(foldText(null)).toBe('');
  });

  it('is the plain lowercase for ASCII text (property-based)', () => {
    const ascii = fc.string({
      unit: fc.integer({ min: 32, max: 126 }).map((c) => String.fromCharCode(c)),
    });
    fc.assert(
      fc.property(ascii, (s) => {
        expect(foldText(s)).toBe(s.toLowerCase());
      }),
    );
  });
});
