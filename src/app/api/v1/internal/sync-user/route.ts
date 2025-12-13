/**
 * Sync User API
 *
 * POST /api/v1/internal/sync-user
 * 内部接口：用于同步用户信息（HMAC 签名 + 时间戳 + Nonce + AES）
 */

import { getDb } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  decryptRequestData,
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../middleware';

const syncUserSchema = z.object({
  // 业务侧用户 ID（本系统 user.id）
  bizhub_user_id: z.string().min(1),
  email: z.email(),
  username: z.string().min(1),
  phone: z.string().min(1),
  // 可选：对端系统用户 ID（如果不传，服务端会生成并写入 user.tkSaasUserId）
  tk_saas_user_id: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 验证签名
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解密数据
    const body = await request.text();
    const decrypted = await decryptRequestData<unknown>(body);
    const parsed = syncUserSchema.safeParse(decrypted);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const payload = parsed.data;
    const db = await getDb();
    const now = new Date();

    // 3. 查询是否存在
    const [existing] = await db
      .select({
        id: userTable.id,
        tkSaasUserId: userTable.tkSaasUserId,
      })
      .from(userTable)
      .where(eq(userTable.id, payload.bizhub_user_id))
      .limit(1);

    const isNew = !existing;
    const tkSaasUserId =
      payload.tk_saas_user_id || existing?.tkSaasUserId || nanoid(21);

    // 4. Upsert 用户信息
    await db
      .insert(userTable)
      .values({
        id: payload.bizhub_user_id,
        name: payload.username,
        email: payload.email,
        emailVerified: false,
        image: null,
        createdAt: now,
        updatedAt: now,
        role: null,
        banned: null,
        banReason: null,
        banExpires: null,
        customerId: null,
        phoneNumber: payload.phone,
        phoneNumberVerified: false,
        tkSaasUserId,
        synced: true,
      })
      .onConflictDoUpdate({
        target: userTable.id,
        set: {
          name: payload.username,
          email: payload.email,
          phoneNumber: payload.phone,
          tkSaasUserId,
          synced: true,
          updatedAt: now,
        },
      });

    return successResponse(
      {
        tk_saas_user_id: tkSaasUserId,
        is_new: isNew,
        synced: true,
      },
      '用户同步成功'
    );
  } catch (error) {
    console.error('sync-user error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
