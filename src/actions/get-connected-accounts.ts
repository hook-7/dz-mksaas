'use server';

import { getDb } from '@/db';
import { session, shop, storeUserRelationship, user } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { and, desc, eq, inArray } from 'drizzle-orm';

/**
 * 关联账号信息
 */
export interface ConnectedAccount {
  id: string;
  nickname: string;
  shops: string[];
  status: string;
  joinedAt: string;
  lastLogin: string | null;
}

export const getConnectedAccountsAction = userActionClient.action(
  async ({ ctx }) => {
    try {
      const { user: currentUser } = ctx as { user: User };
      const db = await getDb();

      // 查询当前用户作为 parent 的所有子账户关系
      const relationships = await db
        .select({
          relationshipId: storeUserRelationship.id,
          childUserId: storeUserRelationship.childUserId,
          storeId: storeUserRelationship.storeId,
          createdAt: storeUserRelationship.createdAt,
        })
        .from(storeUserRelationship)
        .where(eq(storeUserRelationship.parentUserId, currentUser.id));

      if (relationships.length === 0) {
        return {
          success: true,
          data: [] as ConnectedAccount[],
        };
      }

      // 获取所有子账户的唯一 ID
      const childUserIds = [
        ...new Set(relationships.map((r) => r.childUserId)),
      ];

      // 批量查询子账户信息（使用 inArray 优化）
      const allChildUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          banned: user.banned,
        })
        .from(user)
        .where(inArray(user.id, childUserIds));

      // 查询每个子账户的最后登录时间（最新的 session updatedAt）
      const lastLoginPromises = childUserIds.map(async (userId) => {
        const [latestSession] = await db
          .select({
            updatedAt: session.updatedAt,
          })
          .from(session)
          .where(eq(session.userId, userId))
          .orderBy(desc(session.updatedAt))
          .limit(1);

        return {
          userId,
          lastLogin: latestSession?.updatedAt || null,
        };
      });

      const lastLoginMap = new Map<string, Date | null>();
      (await Promise.all(lastLoginPromises)).forEach(
        ({ userId, lastLogin }) => {
          lastLoginMap.set(userId, lastLogin);
        }
      );

      // 为每个子账户获取店铺列表
      const accounts: ConnectedAccount[] = await Promise.all(
        allChildUsers.map(async (childUser) => {
          // 获取该子账户的店铺 ID 列表（从关系中）
          const userStoreIds = relationships
            .filter((r) => r.childUserId === childUser.id)
            .map((r) => r.storeId);

          // 从本地数据库查询店铺信息
          let shopNames: string[] = [];
          if (userStoreIds.length > 0) {
            try {
              const shops = await db
                .select({
                  id: shop.id,
                  shopName: shop.shopName,
                })
                .from(shop)
                .where(inArray(shop.id, userStoreIds));

              shopNames = shops.map((s) => s.shopName || s.id);
            } catch (error) {
              console.error(
                `Failed to query shops from database for user ${childUser.id}:`,
                error instanceof Error ? error.message : error
              );
              // 如果查询失败，使用 storeId 作为店铺名
              shopNames = userStoreIds;
            }
          } else {
            shopNames = userStoreIds;
          }

          // 获取加入时间（从最早的 relationship 创建时间）
          const earliestRelationship = relationships
            .filter((r) => r.childUserId === childUser.id)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

          const lastLogin = lastLoginMap.get(childUser.id);

          return {
            id: childUser.id,
            nickname: childUser.name || childUser.email || '未知用户',
            shops: shopNames.length > 0 ? shopNames : userStoreIds,
            status: childUser.banned ? '已禁用' : '正常',
            joinedAt: earliestRelationship?.createdAt
              ? new Date(earliestRelationship.createdAt).toLocaleDateString(
                  'zh-CN',
                  {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }
                )
              : new Date(childUser.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                }),
            lastLogin: lastLogin
              ? new Date(lastLogin).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : null,
          };
        })
      );

      return {
        success: true,
        data: accounts,
      };
    } catch (error) {
      console.error('get connected accounts error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get connected accounts',
        data: [] as ConnectedAccount[],
      };
    }
  }
);
