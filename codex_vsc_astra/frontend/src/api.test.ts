import { describe, expect, it } from 'vitest';
import { titleBytes } from './api';
describe('Oracle UTF-8 title length', () => {
  it('counts Korean and emoji by bytes, trimming external whitespace', () => {
    expect(titleBytes(' 한글 ')).toBe(6);
    expect(titleBytes('가'.repeat(66))).toBe(198);
    expect(titleBytes('가'.repeat(67))).toBe(201);
    expect(titleBytes('🙂')).toBe(4);
  });
});
