'use server';

import { getDb } from '@/db';
import { inviteLink } from '@/db/schema';
import type { InviteLink } from '@/db/types';
import { getBaseUrl } from '@/lib/urls/urls';
import { Routes } from '@/routes';
import { and, eq, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

function buildShareUrl(inviteId: string): string {
  return `${getBaseUrl()}${Routes.Register}?invite=${inviteId}`;
}

async function insertInviteLink(userId: string): Promise<InviteLink> {
  const db = await getDb();
  const inviteId = nanoid(21);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const [created] = await db
    .insert(inviteLink)
    .values({
      id: inviteId,
      userId,
      link: buildShareUrl(inviteId),
      expiresAt,
    })
    .returning();
  return created;
}

export async function getActiveInviteLinkForUser(
  userId: string
): Promise<InviteLink | null> {
  const db = await getDb();
  const now = new Date();
  const [record] = await db
    .select()
    .from(inviteLink)
    .where(and(eq(inviteLink.userId, userId), gt(inviteLink.expiresAt, now)))
    .limit(1);
  return record ?? null;
}

export async function ensureInviteLinkForUser(
  userId: string
): Promise<InviteLink> {
  const existing = await getActiveInviteLinkForUser(userId);
  if (existing) {
    return existing;
  }
  return insertInviteLink(userId);
}

export async function getActiveInviteLinkById(
  inviteId: string
): Promise<InviteLink | null> {
  const db = await getDb();
  const now = new Date();
  const [record] = await db
    .select()
    .from(inviteLink)
    .where(and(eq(inviteLink.id, inviteId), gt(inviteLink.expiresAt, now)))
    .limit(1);
  return record ?? null;
}
