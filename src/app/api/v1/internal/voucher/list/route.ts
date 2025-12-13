/**
 * Voucher/Credits Transactions API
 *
 * GET /api/v1/internal/voucher/list
 * 查询积分流水（仅签名，不加密）：HMAC 签名 + 时间戳 + Nonce
 *
 * Query:
 * - user_id: string (required) Bizhub 用户 ID
 * - page: number (optional, default 1)
 * - page_size: number (optional, default 20, max 100)
 * - type: string (optional) CREDIT_TRANSACTION_TYPE
 */

import { getDb } from '@/db';
import { creditTransaction as creditTransactionTable } from '@/db/schema';
import { and, count, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../../middleware';

const querySchema = z.object({
  user_id: z.string().min(1),
  page: z.coerce.number().int().min(1).optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
  type: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1) 验证签名（GET：body 为空字符串）
    const verification = await verifyRequestSignature(request);
    if (!verification.valid) {
      return errorResponse(verification.error || 'Invalid signature', 401);
    }

    // 2) 解析 query
    const rawQuery = {
      user_id: request.nextUrl.searchParams.get('user_id') || '',
      page: request.nextUrl.searchParams.get('page') || undefined,
      page_size: request.nextUrl.searchParams.get('page_size') || undefined,
      type: request.nextUrl.searchParams.get('type') || undefined,
    };

    const parsed = querySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const { user_id: userId, page, page_size: pageSize, type } = parsed.data;
    const db = await getDb();

    const where = type
      ? and(eq(creditTransactionTable.userId, userId), eq(creditTransactionTable.type, type))
      : eq(creditTransactionTable.userId, userId);

    // 3) 总数
    const [totalRow] = await db
      .select({ c: count() })
      .from(creditTransactionTable)
      .where(where);
    const total = Number(totalRow?.c || 0);

    // 4) 分页查询
    const offset = (page - 1) * pageSize;
    const rows = await db
      .select({
        id: creditTransactionTable.id,
        type: creditTransactionTable.type,
        description: creditTransactionTable.description,
        amount: creditTransactionTable.amount,
        remainingAmount: creditTransactionTable.remainingAmount,
        paymentId: creditTransactionTable.paymentId,
        expirationDate: creditTransactionTable.expirationDate,
        createdAt: creditTransactionTable.createdAt,
        updatedAt: creditTransactionTable.updatedAt,
      })
      .from(creditTransactionTable)
      .where(where)
      .orderBy(desc(creditTransactionTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    return successResponse(
      {
        user_id: userId,
        page,
        page_size: pageSize,
        total,
        items: rows.map((r) => ({
          id: r.id,
          type: r.type,
          description: r.description,
          amount: r.amount,
          remaining_amount: r.remainingAmount,
          payment_id: r.paymentId,
          expiration_date: r.expirationDate ? r.expirationDate.getTime() : null,
          created_at: r.createdAt.getTime(),
          updated_at: r.updatedAt.getTime(),
        })),
      },
      '查询成功'
    );
  } catch (error) {
    console.error('internal voucher list error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}


