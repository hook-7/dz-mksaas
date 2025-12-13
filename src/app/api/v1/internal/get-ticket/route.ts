/**
 * Get SSO Ticket API
 *
 * POST /api/v1/internal/get-ticket
 * 获取 SSO 票据（仅签名，不加密）：HMAC 签名 + 时间戳 + Nonce
 */

import { getDb } from '@/db';
import { user as userTable, verification as verificationTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse, successResponse, verifyRequestSignature } from '../middleware';

// 默认 2 分钟有效期（可按需改成环境变量）
const DEFAULT_TICKET_TTL_MS = 2 * 60 * 1000;

const getTicketSchema = z
  .object({
    bizhub_user_id: z.string().min(1).optional(),
    tk_saas_user_id: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(1).optional(),
  })
  .refine(
    (v) => Boolean(v.bizhub_user_id || v.tk_saas_user_id || v.email || v.phone),
    {
      message:
        '需要至少提供一个用户标识：bizhub_user_id | tk_saas_user_id | email | phone',
    }
  );

export async function POST(request: NextRequest) {
  try {
    // 1. 验证签名
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解析 body（不解密）
    const rawBody = await request.text();
    const json = rawBody ? (JSON.parse(rawBody) as unknown) : {};
    const parsed = getTicketSchema.safeParse(json);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const input = parsed.data;
    const db = await getDb();

    // 3. 找到用户
    const where = input.bizhub_user_id
      ? eq(userTable.id, input.bizhub_user_id)
      : input.tk_saas_user_id
        ? eq(userTable.tkSaasUserId, input.tk_saas_user_id)
        : input.email
          ? eq(userTable.email, input.email)
          : eq(userTable.phoneNumber, input.phone!);

    const [user] = await db
      .select({
        id: userTable.id,
      })
      .from(userTable)
      .where(where)
      .limit(1);

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    // 4. 生成 ticket 并落库到 verification 表（避免新增表）
    // identifier: sso_ticket:{ticket}
    // value: userId
    const ticket = nanoid(32);
    const now = new Date();
    const expiresAt = new Date(Date.now() + DEFAULT_TICKET_TTL_MS);

    await db.insert(verificationTable).values({
      id: nanoid(),
      identifier: `sso_ticket:${ticket}`,
      value: user.id,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return successResponse(
      {
        ticket,
        expires_at: expiresAt.getTime(),
      },
      '获取票据成功'
    );
  } catch (error) {
    console.error('get-ticket error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}


