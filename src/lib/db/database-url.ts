const DEVELOPMENT_DATABASE_URL = 'postgresql://content_monitor:content_monitor_pass@localhost:5432/content_monitor_db';

export function getDatabaseUrl(): string {
  const configuredUrl = process.env.DATABASE_URL?.trim();
  if (configuredUrl) return configuredUrl;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境必须设置 DATABASE_URL');
  }
  return DEVELOPMENT_DATABASE_URL;
}
