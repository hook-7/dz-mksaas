/**
 * Internal API Middleware
 *
 * 用于验证内部 API 请求的签名和权限
 */

import { verifySignature } from '@/lib/signature-utils';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 验证请求签名
 *
 * @param request - Next.js 请求对象
 * @returns 验证结果和错误信息
 */
export async function verifyRequestSignature(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
}> {
  // 1. 获取请求头
  const timestamp = request.headers.get('X-Timestamp');
  const nonce = request.headers.get('X-Nonce');
  const signature = request.headers.get('X-Signature');

  if (!timestamp || !nonce || !signature) {
    return {
      valid: false,
      error: 'Missing required headers: X-Timestamp, X-Nonce, X-Signature',
    };
  }

  // 2. 获取请求体
  let body = '';
  try {
    const clonedRequest = request.clone();
    body = await clonedRequest.text();
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to read request body',
    };
  }

  // 2.1 兼容加密请求：客户端签名的 body 是 encrypted_data（不是完整 JSON）
  // - EncryptedApiClient / Postman 脚本都是对 encrypted_data 做签名
  // - 兼容：如果不是加密格式，就保持原始 body
  let bodyForSignature = body;
  try {
    const parsed = JSON.parse(body) as { encrypted_data?: unknown };
    if (typeof parsed?.encrypted_data === 'string') {
      bodyForSignature = parsed.encrypted_data;
    }
  } catch {
    // ignore: body 不是 JSON
  }

  // 3. 验证签名
  const timestampNum = Number.parseInt(timestamp, 10);
  if (Number.isNaN(timestampNum)) {
    return {
      valid: false,
      error: 'Invalid timestamp format',
    };
  }

  const secretKey = process.env.BIZHUB_SECRET_KEY;
  if (!secretKey) {
    console.error('BIZHUB_SECRET_KEY is not configured');
    return {
      valid: false,
      error: 'Server configuration error',
    };
  }

  const isValid = verifySignature(
    timestampNum,
    nonce,
    bodyForSignature,
    signature,
    secretKey,
    5 * 60 * 1000 // 5 分钟有效期
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'Invalid signature or expired timestamp',
    };
  }

  return { valid: true };
}

/**
 * 解密请求数据
 *
 * @param body - 请求体
 * @returns 解密后的数据
 */
export async function decryptRequestData<T = unknown>(
  body: string
): Promise<T> {
  const { decryptData } = await import('@/lib/crypto-utils');
  const aesKey = process.env.BIZHUB_AES_KEY;

  if (!aesKey) {
    throw new Error('BIZHUB_AES_KEY is not configured');
  }

  try {
    const payload = JSON.parse(body);
    if (payload.encrypted_data) {
      return decryptData<T>(payload.encrypted_data, aesKey);
    }
    return payload as T;
  } catch (error) {
    throw new Error(
      `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 统一的错误响应
 */
export function errorResponse(
  message: string,
  code = 400
): NextResponse<{ code: number; msg: string; data: null }> {
  return NextResponse.json(
    {
      code,
      msg: message,
      data: null,
    },
    { status: code }
  );
}

/**
 * 统一的成功响应
 */
export function successResponse<T>(
  data: T,
  message = 'Success'
): NextResponse<{ code: number; msg: string; data: T }> {
  return NextResponse.json({
    code: 200,
    msg: message,
    data,
  });
}
