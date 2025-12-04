/**
 * Bizhub API 调用示例
 *
 * 展示如何使用加密和签名工具与 Bizhub API 进行安全通信
 */

import { decryptData, encryptData, generateNonce } from './bizhub-crypto';
import { generateSignature, verifySignature } from './bizhub-signature';

// ============== 配置（从环境变量读取）==============
const SECRET_KEY =
  process.env.BIZHUB_SECRET_KEY ||
  'vyQVTdia3SmiT0FfuHMEmds64Q86zW-9M9LGSxgzgS9sYJUQqWac_WHQ8tm42f1I';

const AES_KEY =
  process.env.BIZHUB_AES_KEY || '60de7302c514a30b83d659ea1643e9b5'; // 32 字节

const TKSAAS_API_URL =
  process.env.TKSAAS_API_URL || 'https://api.bizhub.example.com';

// ============== 示例 1: 发送加密的 POST 请求 ==============
export async function sendEncryptedRequest<T>(
  endpoint: string,
  data: unknown
): Promise<T> {
  // 1. 加密数据
  const encryptedData = encryptData(data, AES_KEY);

  // 2. 生成签名参数
  const timestamp = Date.now();
  const nonce = generateNonce(32);
  const signature = generateSignature(
    timestamp,
    nonce,
    encryptedData,
    SECRET_KEY
  );

  // 3. 发送请求
  let response: Response;
  try {
    response = await fetch(`${TKSAAS_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': String(timestamp),
        'X-Nonce': nonce,
        'X-Signature': signature,
      },
      body: JSON.stringify({ encrypted_data: encryptedData }),
    });
  } catch (error) {
    throw new Error(
      `TKSAAS API 连接失败 (${TKSAAS_API_URL}${endpoint}): ${error instanceof Error ? error.message : 'Network error'}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error');
    throw new Error(
      `TKSAAS API 错误: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const result = await response.json();

  // 4. 如果响应也是加密的，解密它
  if (result.encrypted_data) {
    return decryptData<T>(result.encrypted_data, AES_KEY);
  }

  return result as T;
}

// ============== 示例 2: 发送 GET 请求（无加密，仅签名）==============
export async function sendSignedGetRequest<T>(endpoint: string): Promise<T> {
  // 1. 生成签名参数（GET 请求 body 为空字符串）
  const timestamp = Date.now();
  const nonce = generateNonce(32);
  const signature = generateSignature(timestamp, nonce, '', SECRET_KEY);

  // 2. 发送请求
  const response = await fetch(`${TKSAAS_API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'X-Timestamp': String(timestamp),
      'X-Nonce': nonce,
      'X-Signature': signature,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Bizhub API 错误: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

// ============== 示例 3: 验证 Webhook 签名（服务端）==============
export function verifyWebhookRequest(
  timestamp: string,
  nonce: string,
  signature: string,
  body: string
): boolean {
  const timestampNum = Number.parseInt(timestamp, 10);

  if (Number.isNaN(timestampNum)) {
    console.error('Invalid timestamp');
    return false;
  }

  return verifySignature(
    timestampNum,
    nonce,
    body,
    signature,
    SECRET_KEY,
    5 * 60 * 1000 // 5 分钟有效期
  );
}

// ============== 示例 4: 解密 Webhook 数据（服务端）==============
export function decryptWebhookData<T>(encryptedData: string): T {
  return decryptData<T>(encryptedData, AES_KEY);
}

// ============== 使用示例 ==============

// POST 请求示例
async function examplePostRequest() {
  const userData = {
    user_id: '12345',
    action: 'update_profile',
    data: {
      name: '张三',
      email: 'zhangsan@example.com',
    },
  };

  try {
    const result = await sendEncryptedRequest<{ success: boolean }>(
      '/api/v1/users/update',
      userData
    );
    console.log('更新结果:', result);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// GET 请求示例
async function exampleGetRequest() {
  try {
    const result = await sendSignedGetRequest<{ users: Array<{ id: string }> }>(
      '/api/v1/users/list'
    );
    console.log('用户列表:', result.users);
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// Webhook 验证示例（Next.js API Route）
/*
// src/app/api/webhooks/bizhub/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookRequest, decryptWebhookData } from '@/lib/bizhub-client.example';

export async function POST(request: NextRequest) {
  // 1. 获取请求头
  const timestamp = request.headers.get('X-Timestamp');
  const nonce = request.headers.get('X-Nonce');
  const signature = request.headers.get('X-Signature');

  if (!timestamp || !nonce || !signature) {
    return NextResponse.json(
      { error: 'Missing required headers' },
      { status: 400 }
    );
  }

  // 2. 获取请求体
  const body = await request.text();

  // 3. 验证签名
  if (!verifyWebhookRequest(timestamp, nonce, signature, body)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // 4. 解析和解密数据
  const payload = JSON.parse(body);
  const decryptedData = decryptWebhookData(payload.encrypted_data);

  console.log('Webhook 数据:', decryptedData);

  // 5. 处理业务逻辑
  // ...

  return NextResponse.json({ success: true });
}
*/
