// src/lib/utils/helpers.ts

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatNumber(num: number): string {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  return num.toString();
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    '抖音': '#ff0050',
    '小红书': '#ff2442',
    '微博': '#ff9900',
    'B站': '#00a1d6',
    '微信公众号': '#07c160',
    '知乎': '#0084ff',
    '快手': '#ff4906',
    '视频号': '#07c160',
  };
  return colors[platform] || '#666';
}
