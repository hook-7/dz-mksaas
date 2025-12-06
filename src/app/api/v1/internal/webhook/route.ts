/**
 * Webhook API
 *
 * POST /api/v1/internal/webhook
 * 接收来自外部系统的 Webhook 通知
 */

import type { NextRequest } from 'next/server';
import {
  decryptRequestData,
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../middleware';

/**
 * Webhook 数据格式
 */
interface WebhookPayload {
  event_type: string;
  event_id: string;
  timestamp: number;
  data: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证签名
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      console.error(
        'Webhook signature verification failed:',
        verification.error
      );
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解密数据
    const body = await request.text();
    const payload = await decryptRequestData<WebhookPayload>(body);

    console.log('Received webhook:', {
      event_type: payload.event_type,
      event_id: payload.event_id,
    });

    // 3. 根据事件类型处理
    switch (payload.event_type) {
      case 'user.created':
        await handleUserCreated(payload.data);
        break;
      case 'user.updated':
        await handleUserUpdated(payload.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(payload.data);
        break;
      default:
        console.warn(`Unknown webhook event type: ${payload.event_type}`);
    }

    return successResponse(
      {
        received: true,
        event_id: payload.event_id,
      },
      'Webhook processed successfully'
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

/**
 * 处理用户创建事件
 */
async function handleUserCreated(data: unknown) {
  console.log('Handling user created event:', data);
  // TODO: 实现业务逻辑
}

/**
 * 处理用户更新事件
 */
async function handleUserUpdated(data: unknown) {
  console.log('Handling user updated event:', data);
  // TODO: 实现业务逻辑
}

/**
 * 处理用户删除事件
 */
async function handleUserDeleted(data: unknown) {
  console.log('Handling user deleted event:', data);
  // TODO: 实现业务逻辑
}
