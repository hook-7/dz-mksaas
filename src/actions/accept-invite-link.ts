'use server';

import { getDb } from '@/db';
import { storeUserRelationship } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { getActiveInviteLinkById } from '@/lib/invite-links';
import { userActionClient } from '@/lib/safe-action';
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

      const db = await getDb();
      const relationshipId = nanoid();
      const relationshipRole = 'child';
      const storeId = '7495879613269968922';

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

      const [existingRelationship] = await db
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

      return {
        success: true,
        data: existingRelationship ?? null,
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
