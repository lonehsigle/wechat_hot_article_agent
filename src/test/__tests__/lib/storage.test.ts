import { describe, it, expect, beforeEach, vi } from 'vitest';
import { persistentStorage, cookieStorage, STORAGE_VERSION } from '@/lib/utils/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window
global.window = {} as Window & typeof globalThis;

describe('persistentStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('stores and retrieves data', () => {
    persistentStorage.set('test-key', { name: 'test' });
    const result = persistentStorage.get<{ name: string }>('test-key');
    expect(result?.name).toBe('test');
    expect(result?._version).toBe(STORAGE_VERSION);
  });

  it('returns null for missing key', () => {
    const result = persistentStorage.get('non-existent');
    expect(result).toBeNull();
  });

  it('handles version mismatch', () => {
    localStorageMock.setItem('versioned-key', JSON.stringify({
      data: 'value',
      _version: '0.5',
      _updatedAt: new Date().toISOString(),
    }));
    const result = persistentStorage.get('versioned-key', '1.0');
    expect(result).toBeNull();
  });

  it('removes data', () => {
    persistentStorage.set('remove-me', { a: 1 });
    persistentStorage.remove('remove-me');
    const result = persistentStorage.get('remove-me');
    expect(result).toBeNull();
  });

  it('returns raw data without metadata', () => {
    persistentStorage.set('raw-test', { val: 42 });
    const raw = persistentStorage.getRaw<{ val: number }>('raw-test');
    expect(raw?.val).toBe(42);
  });

  it('checks key existence', () => {
    persistentStorage.set('exists', { x: 1 });
    expect(persistentStorage.has('exists')).toBe(true);
    expect(persistentStorage.has('missing')).toBe(false);
  });

  it('handles invalid JSON gracefully', () => {
    localStorageMock.setItem('bad-json', 'not valid json');
    const result = persistentStorage.get('bad-json');
    expect(result).toBeNull();
  });
});

describe('cookieStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('saves data to localStorage', () => {
    cookieStorage.save({ douyin: 'cookie1', xiaohongshu: 'cookie2' });
    const raw = localStorageMock.getItem('crawler_cookies_v2');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.cookies.douyin).toBe('cookie1');
    expect(parsed.cookies.xiaohongshu).toBe('cookie2');
  });

  it('loads cookies when version matches', () => {
    localStorageMock.setItem('crawler_cookies_v2', JSON.stringify({
      cookies: { weibo: 'wb-cookie' },
      _version: '2.0',
      _updatedAt: new Date().toISOString(),
    }));
    const loaded = cookieStorage.load();
    expect(loaded.weibo).toBe('wb-cookie');
  });

  it('saves platform-specific cookie', () => {
    localStorageMock.setItem('crawler_cookies_v2', JSON.stringify({
      cookies: {},
      _version: '2.0',
      _updatedAt: new Date().toISOString(),
    }));
    cookieStorage.savePlatform('weibo', 'wb-cookie');
    const raw = localStorageMock.getItem('crawler_cookies_v2');
    const parsed = JSON.parse(raw!);
    expect(parsed.cookies.weibo).toBe('wb-cookie');
  });

  it('clears all cookies', () => {
    cookieStorage.save({ a: '1' });
    cookieStorage.clear();
    expect(Object.keys(cookieStorage.load())).toHaveLength(0);
  });
});
