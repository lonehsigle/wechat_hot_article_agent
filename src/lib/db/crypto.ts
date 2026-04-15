// 使用 Node.js 内置 crypto 模块的 AES-256-GCM 加密
const ALGORITHM = 'aes-256-gcm';

// 从环境变量读取加密密钥
const getEncryptionKey = (): Buffer => {
  const key = process.env.DB_ENCRYPTION_KEY;

  // 生产环境必须设置密钥
  if (process.env.NODE_ENV === 'production') {
    if (!key) {
      throw new Error('【安全警告】生产环境未设置 DB_ENCRYPTION_KEY 环境变量！\n请在生产环境配置文件中设置：openssl rand -base64 32');
    }
    if (key === 'content-monitor-default-key-32b!') {
      throw new Error('【安全警告】生产环境使用了默认加密密钥！\n请立即设置新的 DB_ENCRYPTION_KEY 并重新部署。');
    }
  }

  // 开发环境使用默认密钥但给出警告
  if (!key) {
    console.warn('【警告】未设置 DB_ENCRYPTION_KEY，使用默认密钥（仅适合开发环境）');
    return Buffer.from('content-monitor-default-key-32b!'.padEnd(32, '0').slice(0, 32), 'utf8');
  }

  // 确保密钥长度为32字节
  return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8');
};

export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  const crypto = require('crypto');
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // 格式: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  try {
    const crypto = require('crypto');
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext; // 未加密的数据直接返回
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // 解密失败，可能数据未加密或密钥错误
    if (process.env.NODE_ENV === 'production') {
      console.error('【安全警告】生产环境解密失败，可能原因：');
      console.error('1. 加密密钥与加密时不一致');
      console.error('2. 数据损坏');
      console.error('3. 数据使用旧密钥加密');
    }
    return ciphertext;
  }
}
