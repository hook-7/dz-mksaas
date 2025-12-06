'use server';

import { getDb } from '@/db';
import { storeUserRelationship, user as userTable } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { getActiveInviteLinkById } from '@/lib/invite-links';
import { userActionClient } from '@/lib/safe-action';
import { getShopList } from '@/lib/tksaas-client';
import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  inviteId: z.string().min(1, { message: 'Invite ID is required' }),
});

export const acceptInviteLinkAction = userActionClient
  .schema(acceptInviteSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { inviteId } = parsedInput;
      const { user } = ctx as { user: User };
      const invite = await getActiveInviteLinkById(inviteId);

      if (!invite) {
        return {
          success: false,
          error: '邀请链接无效或已过期',
        };
      }

      if (invite.userId === user.id) {
        return {
          success: false,
          error: '不能使用自己的邀请链接',
        };
      }

      // 查询邀请人的 tkSaasUserId
      const db = await getDb();
      const [inviterUser] = await db
        .select({
          id: userTable.id,
          tkSaasUserId: userTable.tkSaasUserId,
        })
        .from(userTable)
        .where(eq(userTable.id, invite.userId))
        .limit(1);

      if (!inviterUser || !inviterUser.tkSaasUserId) {
        return {
          success: false,
          error: '邀请人未同步到 TKSAAS，无法获取店铺列表',
        };
      }

      // 查询邀请人的店铺列表（使用 tkSaasUserId）
      const shopListResult = await getShopList({
        user_id: inviterUser.tkSaasUserId,
        id_type: 'bizhub',
      });

      if (shopListResult.code !== 200) {
        return {
          success: false,
          error: `获取店铺列表失败: ${shopListResult.msg}`,
        };
      }

      const shops = shopListResult.data.shops || [];
      if (shops.length === 0) {
        return {
          success: false,
          error: '邀请人没有任何店铺',
        };
      }

      const relationshipRole = 'child';
      const createdRelationships = [];

      // 为每个店铺创建绑定关系
      for (const shop of shops) {
        const storeId = shop.shop_id;
        const relationshipId = nanoid();

        try {
          await db
            .insert(storeUserRelationship)
            .values({
              id: relationshipId,
              storeId,
              parentUserId: invite.userId,
              childUserId: user.id,
              relationshipRole,
            })
            .onConflictDoNothing({
              target: [
                storeUserRelationship.storeId,
                storeUserRelationship.parentUserId,
                storeUserRelationship.childUserId,
              ],
            });

          // 查询已创建或已存在的关系
          const [relationship] = await db
            .select()
            .from(storeUserRelationship)
            .where(
              and(
                eq(storeUserRelationship.storeId, storeId),
                eq(storeUserRelationship.parentUserId, invite.userId),
                eq(storeUserRelationship.childUserId, user.id)
              )
            )
            .limit(1);

          if (relationship) {
            createdRelationships.push(relationship);
          }
        } catch (error) {
          console.error(`创建店铺绑定关系失败 (storeId: ${storeId}):`, error);
          // 继续处理其他店铺，不中断流程
        }
      }

      return {
        success: true,
        data: {
          shopsCount: shops.length,
          relationshipsCreated: createdRelationships.length,
          relationships: createdRelationships,
        },
      };
    } catch (error) {
      console.error('accept invite link error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to accept invite link',
      };
    }
  });
