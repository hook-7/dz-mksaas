/**
 * Voucher/Credits Usage Notify API
 *
 * POST /api/v1/internal/voucher/use
 * 样品券/积分使用通知：HMAC 签名 + 时间戳 + Nonce + AES（请求体加密）
 *
 * Body (decrypt 后):
 * - bizhub_user_id: string (required) 目标用户 id（本系统 user.id）
 * - order_id: string (required) 外部样品订单 id（用于幂等）
 * - amount: number (required) 本次扣减积分（正整数）
 * - scene: string (optional) 业务场景，例如 sample_grant
 * - description: string (optional) 自定义描述
 * - occurred_at: number (optional) 发生时间（ms）
 */

import { randomUUID } from 'crypto';
import { getDb } from '@/db';
import { creditTransaction, userCredit } from '@/db/schema';
import { and, asc, eq, gt, isNull, not, or } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  decryptRequestData,
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../../middleware';

const bodySchema = z.object({
  bizhub_user_id: z.string().min(1),
  order_id: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  scene: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  occurred_at: z.coerce.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1) 验证签名（加密请求：签名 body = encrypted_data）
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2) 解密 body
    const rawBody = await request.text();
    const payload = await decryptRequestData<unknown>(rawBody);
    const parsed = bodySchema.safeParse(payload);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const {
      bizhub_user_id: userId,
      order_id: orderId,
      amount,
      scene,
    } = parsed.data;
    const occurredAtMs = parsed.data.occurred_at;

    const paymentId = `sample_order:${orderId}`; // 幂等键：使用 paymentId 字段承载外部订单 id
    const description =
      parsed.data.description ||
      `Consume credits: ${amount}, scene=${scene || 'unknown'}, order_id=${orderId}`;

    const db = await getDb();

    const result = await db.transaction(async (tx) => {
      // 3) 幂等：同一订单只扣一次
      const [existing] = await tx
        .select({
          id: creditTransaction.id,
          amount: creditTransaction.amount,
          createdAt: creditTransaction.createdAt,
        })
        .from(creditTransaction)
        .where(
          and(
            eq(creditTransaction.userId, userId),
            eq(creditTransaction.type, 'USAGE'),
            eq(creditTransaction.paymentId, paymentId)
          )
        )
        .limit(1);

      if (existing) {
        const [creditRow] = await tx
          .select({ currentCredits: userCredit.currentCredits })
          .from(userCredit)
          .where(eq(userCredit.userId, userId))
          .limit(1);

        return {
          idempotent: true,
          transaction_id: existing.id,
          deducted: -existing.amount, // existing.amount 为负数
          balance: creditRow?.currentCredits ?? 0,
          created_at: existing.createdAt.getTime(),
        };
      }

      // 4) 校验余额（放在事务内，避免并发扣减）
      const [creditRow] = await tx
        .select({ currentCredits: userCredit.currentCredits })
        .from(userCredit)
        .where(eq(userCredit.userId, userId))
        .limit(1);

      const balance = creditRow?.currentCredits ?? 0;
      if (balance < amount) {
        throw new Error('Insufficient credits');
      }

      // 5) FIFO 扣减：从最早过期/最早创建的可用积分扣
      const now = new Date();
      const sources = await tx
        .select()
        .from(creditTransaction)
        .where(
          and(
            eq(creditTransaction.userId, userId),
            not(eq(creditTransaction.type, 'USAGE')),
            not(eq(creditTransaction.type, 'EXPIRE')),
            gt(creditTransaction.remainingAmount, 0),
            or(
              isNull(creditTransaction.expirationDate),
              gt(creditTransaction.expirationDate, now)
            )
          )
        )
        .orderBy(
          asc(creditTransaction.expirationDate),
          asc(creditTransaction.createdAt)
        );

      let remainingToDeduct = amount;
      for (const t of sources) {
        if (remainingToDeduct <= 0) break;
        const available = t.remainingAmount || 0;
        if (available <= 0) continue;
        const deduct = Math.min(available, remainingToDeduct);

        await tx
          .update(creditTransaction)
          .set({
            remainingAmount: available - deduct,
            updatedAt: now,
          })
          .where(eq(creditTransaction.id, t.id));

        remainingToDeduct -= deduct;
      }

      if (remainingToDeduct > 0) {
        // 理论上不会发生（余额已校验），但并发/脏数据时兜底
        throw new Error('Insufficient credits');
      }

      // 6) 更新余额
      await tx
        .update(userCredit)
        .set({ currentCredits: balance - amount, updatedAt: now })
        .where(eq(userCredit.userId, userId));

      // 7) 写入流水（USAGE，负数）
      const transactionId = randomUUID();
      await tx.insert(creditTransaction).values({
        id: transactionId,
        userId,
        type: 'USAGE',
        amount: -amount,
        remainingAmount: null,
        description,
        paymentId,
        expirationDate: null,
        expirationDateProcessedAt: null,
        createdAt: occurredAtMs ? new Date(occurredAtMs) : now,
        updatedAt: now,
      });

      return {
        idempotent: false,
        transaction_id: transactionId,
        deducted: amount,
        balance: balance - amount,
        created_at: occurredAtMs ? occurredAtMs : now.getTime(),
      };
    });

    return successResponse(
      {
        user_id: userId,
        order_id: orderId,
        payment_id: paymentId,
        amount,
        idempotent: result.idempotent,
        transaction_id: result.transaction_id,
        deducted: result.deducted,
        balance: result.balance,
        occurred_at: occurredAtMs ?? null,
        created_at: result.created_at,
      },
      '扣减成功'
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    if (message === 'Insufficient credits') {
      return errorResponse('Insufficient credits', 409);
    }
    console.error('internal voucher use error:', error);
    return errorResponse(message, 500);
  }
}
