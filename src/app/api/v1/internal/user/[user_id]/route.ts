/**
 * Get User API
 *
 * GET /api/v1/internal/user/{user_id}
 * 查询用户信息（仅签名，不加密）：HMAC 签名 + 时间戳 + Nonce
 */

import { getDb } from '@/db';
import { user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { errorResponse, successResponse, verifyRequestSignature } from '../../middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    // 1. 验证签名
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解析参数
    const { user_id: userId } = await params;
    if (!userId) {
      return errorResponse('Missing user_id', 400);
    }

    // 3. 查询用户
    const db = await getDb();
    const [user] = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        phoneNumber: userTable.phoneNumber,
        phoneNumberVerified: userTable.phoneNumberVerified,
        role: userTable.role,
        banned: userTable.banned,
        banReason: userTable.banReason,
        banExpires: userTable.banExpires,
        customerId: userTable.customerId,
        tkSaasUserId: userTable.tkSaasUserId,
        synced: userTable.synced,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse('用户不存在', 404);
    }

    return successResponse(user, '查询成功');
  } catch (error) {
    console.error('internal get user error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}


