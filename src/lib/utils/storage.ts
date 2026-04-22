/**
 * 持久化存储工具 - 封装 localStorage 操作
 * 支持自动 JSON 序列化/反序列化、版本控制
 */

export const STORAGE_VERSION = '1.0';

interface StorageMetadata {
  _version: string;
  _updatedAt: string;
}

type StorageValue<T> = T & StorageMetadata;

export const persistentStorage = {
  /**
   * 存储数据，自动添加版本元数据
   */
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const wrapped: StorageValue<T> = {
        ...value,
        _version: STORAGE_VERSION,
        _updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(wrapped));
    } catch (error) {
      console.error(`[storage] Failed to set ${key}:`, error);
    }
  },

  /**
   * 获取数据，自动处理版本兼容性
   * 如果版本不匹配或数据损坏，返回 null
   */
  get<T>(key: string, expectedVersion?: string): (T & Partial<StorageMetadata>) | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as StorageValue<T>;

      // 检查版本兼容性
      if (expectedVersion && parsed._version !== expectedVersion) {
        console.warn(
          `[storage] Version mismatch for ${key}: expected ${expectedVersion}, got ${parsed._version}`
        );
        return null;
      }

      return parsed;
    } catch (error) {
      console.error(`[storage] Failed to parse ${key}:`, error);
      return null;
    }
  },

  /**
   * 移除数据
   */
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  /**
   * 获取原始值（不包含版本元数据）
   */
  getRaw<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * 检查键是否存在且版本匹配
   */
  has(key: string, expectedVersion?: string): boolean {
    return this.get(key, expectedVersion) !== null;
  },
};

/**
 * Cookie 专用存储 - 带版本控制和加密提示
 */
export const cookieStorage = {
  KEY: 'crawler_cookies_v2',
  VERSION: '2.0',

  /**
   * 保存 Cookie 映射
   * cookies: Record<platform, cookieString>
   */
  save(cookies: Record<string, string>): void {
    persistentStorage.set(this.KEY, {
      cookies,
      version: this.VERSION,
    });
  },

  /**
   * 加载 Cookie 映射
   */
  load(): Record<string, string> {
    const data = persistentStorage.get<{ cookies: Record<string, string> }>(this.KEY, this.VERSION);
    if (!data || !data.cookies) return {};
    return data.cookies;
  },

  /**
   * 保存单个平台的 Cookie
   */
  savePlatform(platform: string, cookie: string): void {
    const existing = this.load();
    existing[platform] = cookie;
    this.save(existing);
  },

  /**
   * 获取单个平台的 Cookie
   */
  getPlatform(platform: string): string | undefined {
    return this.load()[platform];
  },

  /**
   * 清除所有 Cookie 数据
   */
  clear(): void {
    persistentStorage.remove(this.KEY);
  },
};
