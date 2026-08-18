import { afterEach, describe, expect, it, vi } from 'vitest';

const originalNodeEnv = process.env.NODE_ENV;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  vi.resetModules();
});

describe('database configuration', () => {
  it('rejects a missing DATABASE_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const { getPool } = await import('@/lib/db');
    expect(() => getPool()).toThrow('生产环境必须设置 DATABASE_URL');
  });
});
