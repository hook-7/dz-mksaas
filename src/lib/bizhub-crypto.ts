import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Bizhub API 加密/解密工具
 *
 * 使用 AES-256-GCM 加密，与 Python 端兼容
 * 输出格式：base64(nonce + tag + ciphertext)
 *   - nonce: 16 字节
 *   - tag: 16 字节
 *   - ciphertext: 变长
 */

/**
 * 递归排序对象的 keys（与 Python sort_keys=True 一致）
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  const sorted: Record<string, unknown> = {};
  Object.keys(obj as object)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    });
  return sorted;
}

/**
 * AES-256-GCM 加密
 *
 * @param data - 要加密的数据对象
 * @param key - AES 密钥（32 字节字符串）
 * @returns Base64 编码的加密数据
 */
export function encryptData(data: unknown, key: string): string {
  // 1. JSON 序列化：key 排序、无空格（与 Python 端一致）
  const plaintext = JSON.stringify(sortObjectKeys(data));

  // 2. 生成 16 字节随机 nonce (IV)
  const nonce = randomBytes(16);

  // 3. 创建 AES-256-GCM cipher
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'utf8'), nonce);

  // 4. 加密
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // 5. 获取 auth tag (16 字节)
  const tag = cipher.getAuthTag();

  // 6. 组合格式：nonce + tag + ciphertext（与 Python 端一致）
  const combined = Buffer.concat([nonce, tag, encrypted]);

  // 7. Base64 编码
  return combined.toString('base64');
}

/**
 * AES-256-GCM 解密
 *
 * @param encryptedBase64 - Base64 编码的加密数据
 * @param key - AES 密钥（32 字节字符串）
 * @returns 解密后的数据对象
 */
export function decryptData<T = unknown>(
  encryptedBase64: string,
  key: string
): T {
  // 1. Base64 解码
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  // 2. 分离组件
  const nonce = encrypted.subarray(0, 16); // 前 16 字节
  const tag = encrypted.subarray(16, 32); // 接下来 16 字节
  const ciphertext = encrypted.subarray(32); // 剩余部分

  // 3. 创建 decipher
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'utf8'),
    nonce
  );
  decipher.setAuthTag(tag);

  // 4. 解密
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  // 5. 解析 JSON
  return JSON.parse(decrypted.toString('utf8')) as T;
}

/**
 * 生成随机 Nonce 字符串
 *
 * @param length - 长度（默认 32）
 * @returns 随机字符串
 */
export function generateNonce(length = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}
