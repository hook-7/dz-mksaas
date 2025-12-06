/**
 * Test Decrypt API
 *
 * POST /api/v1/internal/test-decrypt
 * 测试接口：用于测试加密通信是否正常
 */

import type { NextRequest } from 'next/server';
import {
  decryptRequestData,
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../middleware';

export async function POST(request: NextRequest) {
  try {
    // 1. 验证签名
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解密数据
    const body = await request.text();
    const data = await decryptRequestData<{
      message: string;
      timestamp: number;
    }>(body);

    console.log('Decrypted data:', data);

    // 3. 返回解密后的数据
    return successResponse(
      {
        received_message: data.message,
        received_timestamp: data.timestamp,
        server_timestamp: Date.now(),
        decryption_success: true,
      },
      '解密成功'
    );
  } catch (error) {
    console.error('Decryption error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Decryption failed',
      400
    );
  }
}
