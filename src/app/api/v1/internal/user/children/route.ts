/**
 * Get Children Users API
 *
 * GET /api/v1/internal/user/children
 * 查询子账号列表（仅签名，不加密）：HMAC 签名 + 时间戳 + Nonce
 *
 * Query:
 * - parent_user_id: string (required)
 * - store_id: string (optional) 只查询某个店铺下的绑定关系
 */

import { getDb } from '@/db';
import { storeUserRelationship, user as userTable } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import {
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../../middleware';

export interface InternalChildAccount {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  tkSaasUserId: string | null;
  synced: boolean;
  banned: boolean | null;
  relationshipRole: string | null;
  storeIds: string[];
  joinedAt: number; // ms
}

export async function GET(request: NextRequest) {
  try {
    // 1. 验证签名（GET 请求：body 为空字符串）
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2. 解析 query
    const parentUserId = request.nextUrl.searchParams.get('parent_user_id');
    const storeId = request.nextUrl.searchParams.get('store_id');
    if (!parentUserId) {
      return errorResponse('Missing query: parent_user_id', 400);
    }

    const db = await getDb();

    // 3. 查关系
    const relationships = await db
      .select({
        childUserId: storeUserRelationship.childUserId,
        storeId: storeUserRelationship.storeId,
        relationshipRole: storeUserRelationship.relationshipRole,
        createdAt: storeUserRelationship.createdAt,
      })
      .from(storeUserRelationship)
      .where(
        storeId
          ? and(
              eq(storeUserRelationship.parentUserId, parentUserId),
              eq(storeUserRelationship.storeId, storeId)
            )
          : eq(storeUserRelationship.parentUserId, parentUserId)
      );

    if (relationships.length === 0) {
      return successResponse(
        {
          parent_user_id: parentUserId,
          children: [] as InternalChildAccount[],
        },
        '查询成功'
      );
    }

    // 4. 查子用户信息
    const childUserIds = [...new Set(relationships.map((r) => r.childUserId))];
    const childUsers = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        phoneNumber: userTable.phoneNumber,
        tkSaasUserId: userTable.tkSaasUserId,
        synced: userTable.synced,
        banned: userTable.banned,
      })
      .from(userTable)
      .where(inArray(userTable.id, childUserIds));

    const byUserId = new Map<string, InternalChildAccount>();

    for (const u of childUsers) {
      byUserId.set(u.id, {
        id: u.id,
        name: u.name ?? null,
        email: u.email,
        phoneNumber: u.phoneNumber ?? null,
        tkSaasUserId: u.tkSaasUserId ?? null,
        synced: u.synced,
        banned: u.banned ?? null,
        relationshipRole: null,
        storeIds: [],
        joinedAt: Date.now(),
      });
    }

    for (const r of relationships) {
      const item = byUserId.get(r.childUserId);
      if (!item) continue;
      if (!item.storeIds.includes(r.storeId)) item.storeIds.push(r.storeId);
      // role：如果有多个，优先保留第一个
      if (!item.relationshipRole) item.relationshipRole = r.relationshipRole;
      // joinedAt：取最早绑定时间
      const t = r.createdAt.getTime();
      if (!item.joinedAt || t < item.joinedAt) item.joinedAt = t;
    }

    return successResponse(
      {
        parent_user_id: parentUserId,
        children: Array.from(byUserId.values()),
      },
      '查询成功'
    );
  } catch (error) {
    console.error('internal user children error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
