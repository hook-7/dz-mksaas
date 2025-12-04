import { createHmac } from 'node:crypto';

/**
 * Bizhub API 签名工具
 *
 * 使用 HMAC-SHA256 签名，与 Python/Postman 端兼容
 * 签名格式：{timestamp}\n{nonce}\n{body}
 */

/**
 * 生成 HMAC-SHA256 签名
 *
 * @param timestamp - 毫秒级时间戳
 * @param nonce - 随机字符串
 * @param body - 请求体内容（加密后的数据或空字符串）
 * @param secretKey - HMAC 密钥
 * @returns 签名的 hex 字符串
 */
export function generateSignature(
  timestamp: number,
  nonce: string,
  body: string,
  secretKey: string
): string {
  // 构建签名字符串：{timestamp}\n{nonce}\n{body}
  const signString = `${timestamp}\n${nonce}\n${body}`;

  // 计算 HMAC-SHA256
  const hmac = createHmac('sha256', secretKey);
  hmac.update(signString);

  return hmac.digest('hex');
}

/**
 * 验证 HMAC-SHA256 签名
 *
 * @param timestamp - 毫秒级时间戳
 * @param nonce - 随机字符串
 * @param body - 请求体内容
 * @param signature - 待验证的签名
 * @param secretKey - HMAC 密钥
 * @param maxAgeMs - 最大允许时间差（毫秒，默认 5 分钟）
 * @returns 签名是否有效
 */
export function verifySignature(
  timestamp: number,
  nonce: string,
  body: string,
  signature: string,
  secretKey: string,
  maxAgeMs = 5 * 60 * 1000 // 默认 5 分钟
): boolean {
  // 1. 验证时间戳（防止重放攻击）
  const now = Date.now();
  const timeDiff = Math.abs(now - timestamp);
  if (timeDiff > maxAgeMs) {
    console.warn(
      `Timestamp 过期: 时间差 ${timeDiff}ms 超过允许范围 ${maxAgeMs}ms`
    );
    return false;
  }

  // 2. 计算期望的签名
  const expectedSignature = generateSignature(
    timestamp,
    nonce,
    body,
    secretKey
  );

  // 3. 使用恒定时间比较（防止时序攻击）
  try {
    const actual = Buffer.from(signature, 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (actual.length !== expected.length) {
      return false;
    }
    // Node.js 的 crypto.timingSafeEqual 提供恒定时间比较
    const crypto = require('node:crypto');
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * 生成完整的请求头（用于客户端调用）
 *
 * @param body - 请求体（已加密的数据或空字符串）
 * @param secretKey - HMAC 密钥
 * @returns 包含 X-Timestamp, X-Nonce, X-Signature 的对象
 */
export function generateRequestHeaders(
  body: string,
  secretKey: string
): {
  'X-Timestamp': string;
  'X-Nonce': string;
  'X-Signature': string;
} {
  const timestamp = Date.now();
  const nonce = generateNonceString(32);
  const signature = generateSignature(timestamp, nonce, body, secretKey);

  return {
    'X-Timestamp': String(timestamp),
    'X-Nonce': nonce,
    'X-Signature': signature,
  };
}

/**
 * 生成随机 Nonce 字符串（内部辅助函数）
 */
function generateNonceString(length: number): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const crypto = require('node:crypto');
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(bytes[i] % chars.length);
  }
  return result;
}
