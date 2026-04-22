import { describe, it, expect } from 'vitest';
import { generateId, formatNumber, getPlatformColor } from '@/lib/utils/helpers';

describe('Helpers - generateId', () => {
  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });

  it('includes timestamp component', () => {
    const now = Date.now();
    const id = generateId();
    const prefix = id.slice(0, now.toString(36).length);
    const prefixTime = parseInt(prefix, 36);
    expect(prefixTime).toBeGreaterThanOrEqual(now - 1000);
    expect(prefixTime).toBeLessThanOrEqual(now + 1000);
  });
});

describe('Helpers - formatNumber', () => {
  it('formats numbers less than 10000 as-is', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(9999)).toBe('9999');
    expect(formatNumber(500)).toBe('500');
  });

  it('formats numbers >= 10000 with w suffix', () => {
    expect(formatNumber(10000)).toBe('1.0w');
    expect(formatNumber(15000)).toBe('1.5w');
    expect(formatNumber(100000)).toBe('10.0w');
  });
});

describe('Helpers - getPlatformColor', () => {
  it('returns correct colors for known platforms', () => {
    expect(getPlatformColor('抖音')).toBe('#ff0050');
    expect(getPlatformColor('小红书')).toBe('#ff2442');
    expect(getPlatformColor('微博')).toBe('#ff9900');
    expect(getPlatformColor('B站')).toBe('#00a1d6');
    expect(getPlatformColor('微信公众号')).toBe('#07c160');
    expect(getPlatformColor('知乎')).toBe('#0084ff');
    expect(getPlatformColor('快手')).toBe('#ff4906');
    expect(getPlatformColor('视频号')).toBe('#07c160');
  });

  it('returns default color for unknown platform', () => {
    expect(getPlatformColor('Unknown')).toBe('#666');
    expect(getPlatformColor('')).toBe('#666');
  });
});
