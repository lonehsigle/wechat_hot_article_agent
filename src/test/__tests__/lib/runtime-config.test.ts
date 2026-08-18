import { afterEach, describe, expect, it } from 'vitest';
import { validateProductionConfig } from '@/lib/runtime-config';

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DB_ENCRYPTION_KEY: process.env.DB_ENCRYPTION_KEY,
  PASSWORD_HASH_SALT: process.env.PASSWORD_HASH_SALT,
  AUTH_COOKIE_SECRET: process.env.AUTH_COOKIE_SECRET,
};

afterEach(() => {
  for (const [name, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('production runtime configuration', () => {
  it('fails fast with every missing required variable', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    delete process.env.DB_ENCRYPTION_KEY;
    delete process.env.PASSWORD_HASH_SALT;
    delete process.env.AUTH_COOKIE_SECRET;

    expect(() => validateProductionConfig()).toThrow(
      '生产环境缺少必需配置: DATABASE_URL, DB_ENCRYPTION_KEY, PASSWORD_HASH_SALT, AUTH_COOKIE_SECRET'
    );
  });

  it('does not require production variables in development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;
    delete process.env.DB_ENCRYPTION_KEY;
    delete process.env.PASSWORD_HASH_SALT;

    expect(() => validateProductionConfig()).not.toThrow();
  });
});
