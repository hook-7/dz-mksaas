/**
 * Update User API
 *
 * PUT /api/v1/internal/user/update
 * 更新用户信息（HMAC 签名 + 时间戳 + Nonce + AES）
 */

import { getDb } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  decryptRequestData,
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../../middleware';

const updateUserSchema = z
  .object({
    bizhub_user_id: z.string().min(1),
    // 允许更新的字段（按需增减）
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    tk_saas_user_id: z.string().min(1).optional(),
    synced: z.boolean().optional(),
  })
  .refine(
    (v) =>
      typeof v.email !== 'undefined' ||
      typeof v.username !== 'undefined' ||
      typeof v.phone !== 'undefined' ||
      typeof v.tk_saas_user_id !== 'undefined' ||
      typeof v.synced !== 'undefined',
    {
      message: '至少需要提供一个可更新字段',
    }
  );

export async function PUT(request: NextRequest) {
  try {
    // 1. 验证签名（对加密请求：签 encrypted_data）
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解密数据
    const body = await request.text();
    const decrypted = await decryptRequestData<unknown>(body);
    const parsed = updateUserSchema.safeParse(decrypted);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const payload = parsed.data;
    const db = await getDb();

    // 3. 确认用户存在
    const [existing] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.id, payload.bizhub_user_id))
      .limit(1);

    if (!existing) {
      return errorResponse('用户不存在', 404);
    }

    // 4. 更新
    const now = new Date();
    const nextValues: Record<string, unknown> = {
      updatedAt: now,
    };

    if (typeof payload.email !== 'undefined') nextValues.email = payload.email;
    if (typeof payload.username !== 'undefined')
      nextValues.name = payload.username;
    if (typeof payload.phone !== 'undefined')
      nextValues.phoneNumber = payload.phone;
    if (typeof payload.tk_saas_user_id !== 'undefined') {
      nextValues.tkSaasUserId = payload.tk_saas_user_id;
    }
    if (typeof payload.synced !== 'undefined')
      nextValues.synced = payload.synced;

    await db
      .update(userTable)
      .set(nextValues)
      .where(eq(userTable.id, payload.bizhub_user_id));

    return successResponse(
      {
        updated: true,
        bizhub_user_id: payload.bizhub_user_id,
      },
      '更新成功'
    );
  } catch (error) {
    console.error('internal update user error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
