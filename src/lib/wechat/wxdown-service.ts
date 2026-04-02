export interface WxdownCredentials {
  biz: string;
  name: string;
  avatar: string;
  url: string;
  set_cookie: string;
  timestamp: number;
}

export interface WxdownConfig {
  enabled: boolean;
  websocketUrl: string;
  proxyUrl: string;
}

const defaultConfig: WxdownConfig = {
  enabled: false,
  websocketUrl: 'ws://127.0.0.1:65001',
  proxyUrl: 'http://127.0.0.1:65000',
};

let currentConfig: WxdownConfig = { ...defaultConfig };
let wsConnection: WebSocket | null = null;
let credentialsStore: Map<string, WxdownCredentials> = new Map();

export function getWxdownConfig(): WxdownConfig {
  return { ...currentConfig };
}

export function setWxdownConfig(config: Partial<WxdownConfig>): WxdownConfig {
  currentConfig = { ...currentConfig, ...config };
  return { ...currentConfig };
}

export function getCredentials(biz: string): WxdownCredentials | null {
  return credentialsStore.get(biz) || null;
}

export function getAllCredentials(): WxdownCredentials[] {
  return Array.from(credentialsStore.values());
}

export function addCredentials(credential: WxdownCredentials): void {
  credentialsStore.set(credential.biz, credential);
}

export function clearCredentials(): void {
  credentialsStore.clear();
}

export function parseSetCookieHeader(setCookie: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const parts = setCookie.split(/,(?=\s*[a-zA-Z0-9_-]+=)/);
  
  for (const part of parts) {
    const cookiePart = part.split(';')[0].trim();
    const [key, value] = cookiePart.split('=');
    if (key && value) {
      cookies[key.trim()] = value.trim();
    }
  }
  
  return cookies;
}

export function extractCredentialParams(url: string): {
  __biz: string;
  uin: string;
  key: string;
  pass_ticket: string;
} | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    return {
      __biz: params.get('__biz') || '',
      uin: params.get('uin') || '',
      key: params.get('key') || '',
      pass_ticket: params.get('pass_ticket') || '',
    };
  } catch {
    return null;
  }
}
