'use server';

import type { User } from '@/lib/auth-types';
import { ensureInviteLinkForUser } from '@/lib/invite-links';
import { userActionClient } from '@/lib/safe-action';

export const createInviteLinkAction = userActionClient.action(
  async ({ ctx }) => {
    try {
      const { user } = ctx as { user: User };
      const invite = await ensureInviteLinkForUser(user.id);

      return {
        success: true,
        data: {
          inviteId: invite.id,
          link: invite.link,
          expiresAt: invite.expiresAt,
        },
      };
    } catch (error) {
      console.error('create invite link error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create invite link',
      };
    }
  }
);
