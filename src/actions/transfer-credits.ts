'use server';

import { transferCredits } from '@/credits/credits';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import type { User } from '@/lib/auth-types';
import { userActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// transfer credits schema
const transferSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().min(1),
  description: z.string().optional(),
});

/**
 * Transfer credits from current user to another user
 * Users can only transfer credits from their own account
 */
export const transferCreditsAction = userActionClient
  .schema(transferSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { fromUserId, toUserId, amount, description } = parsedInput;
    const { user: currentUser } = ctx as { user: User };

    try {
      // Ensure user can only transfer from their own account
      if (fromUserId !== currentUser.id) {
        return {
          success: false,
          error: '只能从自己的账户转出积分',
        };
      }

      // Log for debugging
      console.log('Transfer credits request:', {
        fromUserId,
        toUserId,
        amount,
        description,
        currentUserId: currentUser.id,
      });

      const db = await getDb();

      const [fromUser, toUser] = await Promise.all([
        db.select().from(user).where(eq(user.id, fromUserId)).limit(1),
        db.select().from(user).where(eq(user.id, toUserId)).limit(1),
      ]);

      if (!fromUser[0]) {
        return {
          success: false,
          error: `转出用户不存在 (用户ID: ${fromUserId})`,
        };
      }
      if (!toUser[0]) {
        return {
          success: false,
          error: `转入用户不存在 (用户ID: ${toUserId})`,
        };
      }

      if (fromUserId === toUserId) {
        return {
          success: false,
          error: '不能向同一用户转移积分',
        };
      }

      await transferCredits({
        fromUserId,
        toUserId,
        amount,
        description: description || `Transfer credits: ${amount}`,
      });

      return { success: true };
    } catch (error) {
      console.error('transfer credits error:', error);

      // Provide more detailed error messages
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('Insufficient credits')) {
          return {
            success: false,
            error: `转出用户积分不足 (需要: ${amount})`,
          };
        }
        if (errorMessage.includes('Cannot transfer credits to the same user')) {
          return {
            success: false,
            error: '不能向同一用户转移积分',
          };
        }
        return {
          success: false,
          error: `转移失败: ${errorMessage}`,
        };
      }

      return {
        success: false,
        error: '积分转移失败，请稍后重试',
      };
    }
  });
