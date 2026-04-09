// 使用 Node.js 内置 crypto 模块的 AES-256-GCM 加密
const ALGORITHM = 'aes-256-gcm';
// 从环境变量读取加密密钥，如果没有则使用默认密钥(仅开发环境)
const getEncryptionKey = (): Buffer => {
  const key = process.env.DB_ENCRYPTION_KEY || 'content-monitor-default-key-32b!';
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
  } catch {
    // 解密失败，可能数据未加密，直接返回原文
    return ciphertext;
  }
}
