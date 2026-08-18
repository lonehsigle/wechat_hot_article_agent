const REQUIRED_PRODUCTION_ENV = [
  'DATABASE_URL',
  'DB_ENCRYPTION_KEY',
  'PASSWORD_HASH_SALT',
  'AUTH_COOKIE_SECRET',
] as const;

export function validateProductionConfig(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = REQUIRED_PRODUCTION_ENV.filter(name => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`生产环境缺少必需配置: ${missing.join(', ')}`);
  }
  if (process.env.DB_ENCRYPTION_KEY === 'content-monitor-default-key-32b!') {
    throw new Error('生产环境禁止使用默认 DB_ENCRYPTION_KEY');
  }
}
