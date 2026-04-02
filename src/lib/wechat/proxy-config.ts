export interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'https' | 'socks5';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

const defaultConfig: ProxyConfig = {
  enabled: false,
  type: 'http',
  host: '',
  port: 7890,
};

let currentConfig: ProxyConfig = { ...defaultConfig };

export function getProxyConfig(): ProxyConfig {
  return { ...currentConfig };
}

export function setProxyConfig(config: Partial<ProxyConfig>): ProxyConfig {
  currentConfig = { ...currentConfig, ...config };
  return { ...currentConfig };
}

export function getProxyUrl(): string | undefined {
  if (!currentConfig.enabled || !currentConfig.host) {
    return undefined;
  }

  const auth = currentConfig.username && currentConfig.password
    ? `${encodeURIComponent(currentConfig.username)}:${encodeURIComponent(currentConfig.password)}@`
    : '';

  return `${currentConfig.type}://${auth}${currentConfig.host}:${currentConfig.port}`;
}

export function getProxyAgent(): string | undefined {
  return getProxyUrl();
}
