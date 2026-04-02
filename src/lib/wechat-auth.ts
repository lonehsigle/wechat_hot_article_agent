import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const QR_CODE_PATH = path.join(process.cwd(), 'public', 'wx_qrcode.png');
const LOCK_FILE_PATH = path.join(process.cwd(), 'data', 'lock.lock');

export interface AuthSession {
  cookies: Array<{ name: string; value: string; domain: string; path: string }>;
  cookiesStr: string;
  token: string;
  expiry: {
    expiryTime: string;
    expiresIn: number;
  } | null;
}

export class WechatAuthController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isRunning = false;

  async startBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
    
    this.context = await this.browser.newContext({
      locale: 'zh-CN',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    
    this.page = await this.context.newPage();
  }

  async generateQRCode(): Promise<string> {
    if (!this.page) {
      throw new Error('浏览器未启动');
    }
    
    await this.page.goto('https://mp.weixin.qq.com/', {
      waitUntil: 'domcontentloaded',
    });
    
    const qrSelector = '.login__type__container__scan__qrcode';
    await this.page.waitForSelector(qrSelector, { timeout: 10000 });
    
    await this.page.waitForTimeout(3000);
    
    const qrcode = await this.page.$(qrSelector);
    if (!qrcode) {
      throw new Error('未找到二维码元素');
    }
    
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    await qrcode.screenshot({ path: QR_CODE_PATH });
    
    if (!fs.existsSync(QR_CODE_PATH)) {
      throw new Error('二维码文件未生成');
    }
    
    const stats = fs.statSync(QR_CODE_PATH);
    if (stats.size <= 364) {
      throw new Error(`二维码文件太小: ${stats.size} 字节`);
    }
    
    return `/wx_qrcode.png?t=${Date.now()}`;
  }

  async waitForLogin(timeout = 60000): Promise<boolean> {
    if (!this.page) {
      throw new Error('浏览器未启动');
    }
    
    try {
      await this.page.waitForURL('**/cgi-bin/home**', { timeout });
      return true;
    } catch {
      return false;
    }
  }

  async extractSession(): Promise<AuthSession | null> {
    if (!this.page || !this.context) {
      return null;
    }
    
    const currentUrl = this.page.url();
    const tokenMatch = currentUrl.match(/token=(\d+)/);
    let token = tokenMatch ? tokenMatch[1] : '';
    
    const cookies = await this.context.cookies();
    
    let cookiesStr = '';
    for (const cookie of cookies) {
      cookiesStr += `${cookie.name}=${cookie.value}; `;
      if (cookie.name.toLowerCase().includes('token')) {
        token = token || cookie.value;
      }
    }
    
    let expiry: AuthSession['expiry'] | null = null;
    const sessionCookie = cookies.find(c => c.name === 'slave_sid');
    if (sessionCookie && sessionCookie.expires) {
      const expiresAt = new Date(sessionCookie.expires * 1000);
      const now = new Date();
      const expiresIn = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
      expiry = {
        expiryTime: expiresAt.toISOString(),
        expiresIn,
      };
    }
    
    return {
      cookies: cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
      })),
      cookiesStr,
      token,
      expiry,
    };
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('关闭浏览器失败:', error);
    }
  }

  isBrowserRunning(): boolean {
    return this.browser !== null && this.context !== null && this.page !== null;
  }
}

let authController: WechatAuthController | null = null;
let authPromise: Promise<AuthSession | null> | null = null;

export function getAuthController(): WechatAuthController {
  if (!authController) {
    authController = new WechatAuthController();
  }
  return authController;
}

export function setAuthController(controller: WechatAuthController | null): void {
  authController = controller;
}

export function getAuthPromise(): Promise<AuthSession | null> | null {
  return authPromise;
}

export function setAuthPromise(promise: Promise<AuthSession | null> | null): void {
  authPromise = promise;
}

export function qrCodeExists(): boolean {
  return fs.existsSync(QR_CODE_PATH);
}

export function cleanQRCode(): void {
  try {
    if (fs.existsSync(QR_CODE_PATH)) {
      fs.unlinkSync(QR_CODE_PATH);
    }
  } catch (error) {
    console.error('清理二维码失败:', error);
  }
}

export function checkLock(): boolean {
  if (fs.existsSync(LOCK_FILE_PATH)) {
    try {
      const lockTime = parseInt(fs.readFileSync(LOCK_FILE_PATH, 'utf-8'));
      const now = Date.now();
      if (now - lockTime > 180000) {
        releaseLock();
        cleanQRCode();
        return false;
      }
      return true;
    } catch {
      releaseLock();
      cleanQRCode();
      return false;
    }
  }
  
  if (qrCodeExists()) {
    try {
      const stats = fs.statSync(QR_CODE_PATH);
      const now = Date.now();
      if (now - stats.mtimeMs > 180000) {
        cleanQRCode();
        return false;
      }
      return true;
    } catch {
      cleanQRCode();
      return false;
    }
  }
  
  return false;
}

export function setLock(): void {
  const dataDir = path.dirname(LOCK_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(LOCK_FILE_PATH, Date.now().toString());
}

export function releaseLock(): void {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
    }
  } catch (error) {
    console.error('释放锁失败:', error);
  }
}
