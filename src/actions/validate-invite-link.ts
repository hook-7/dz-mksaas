'use server';

import { getActiveInviteLinkById } from '@/lib/invite-links';
import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';

const validateInviteSchema = z.object({
  inviteId: z.string().min(1, { message: 'Invite ID is required' }),
});

export const validateInviteLinkAction = actionClient
  .schema(validateInviteSchema)
  .action(async ({ parsedInput }) => {
    try {
      const invite = await getActiveInviteLinkById(parsedInput.inviteId);

      if (!invite) {
        return {
          success: false,
          error: 'Invite link is invalid or has expired',
        };
      }

      return {
        success: true,
        data: {
          inviteId: invite.id,
          link: invite.link,
          userId: invite.userId,
          expiresAt: invite.expiresAt,
        },
      };
    } catch (error) {
      console.error('validate invite link error:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to validate invite link',
      };
    }
  });
