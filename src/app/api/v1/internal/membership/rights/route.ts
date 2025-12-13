/**
 * Membership Rights API
 *
 * GET /api/v1/internal/membership/rights
 * 仅签名，不加密：HMAC 签名 + 时间戳 + Nonce
 *
 * Query:
 * - user_id: string (required) Bizhub 用户 ID
 */

import { getDb } from '@/db';
import {
  membershipTier as membershipTierTable,
  payment as paymentTable,
  storeUserRelationship,
  userCredit as userCreditTable,
} from '@/db/schema';
import { findPlanByPriceId, getAllPricePlans } from '@/lib/price-plan';
import {
  PaymentScenes,
  type PaymentStatus,
  PaymentTypes,
  type PlanInterval,
  type PricePlan,
  type Subscription,
} from '@/payment/types';
import { and, count, desc, eq, or } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  errorResponse,
  successResponse,
  verifyRequestSignature,
} from '../../middleware';

const querySchema = z.object({
  user_id: z.string().min(1),
});

type MembershipSource = 'lifetime' | 'subscription' | 'free';

async function getCurrentMembershipByUserId(userId: string): Promise<{
  source: MembershipSource;
  currentPlan: PricePlan | null;
  subscription: Subscription | null;
  // 用于展示“购买了什么 / 到期信息”
  selectedPayment: {
    id: string;
    priceId: string;
    type: string;
    scene: string | null;
    status: string;
    interval: string | null;
    periodStart: Date | null;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
    trialStart: Date | null;
    trialEnd: Date | null;
    createdAt: Date;
  } | null;
}> {
  const db = await getDb();
  const plans = await getAllPricePlans();
  const freePlan = plans.find((plan) => plan.isFree && !plan.disabled) || null;
  const lifetimePlanIds = new Set(
    plans.filter((plan) => plan.isLifetime).map((plan) => plan.id)
  );

  // 与 getCurrentPlanAction 保持一致：lifetime > subscription(active/trialing) > free
  const payments = await db
    .select({
      id: paymentTable.id,
      priceId: paymentTable.priceId,
      customerId: paymentTable.customerId,
      type: paymentTable.type,
      status: paymentTable.status,
      scene: paymentTable.scene,
      interval: paymentTable.interval,
      periodStart: paymentTable.periodStart,
      periodEnd: paymentTable.periodEnd,
      cancelAtPeriodEnd: paymentTable.cancelAtPeriodEnd,
      trialStart: paymentTable.trialStart,
      trialEnd: paymentTable.trialEnd,
      createdAt: paymentTable.createdAt,
    })
    .from(paymentTable)
    .where(
      and(
        eq(paymentTable.paid, true),
        eq(paymentTable.userId, userId),
        or(
          and(
            eq(paymentTable.type, PaymentTypes.ONE_TIME),
            eq(paymentTable.scene, PaymentScenes.LIFETIME),
            eq(paymentTable.status, 'completed')
          ),
          and(
            eq(paymentTable.type, PaymentTypes.SUBSCRIPTION),
            or(
              eq(paymentTable.status, 'active'),
              eq(paymentTable.status, 'trialing')
            )
          )
        )
      )
    )
    .orderBy(desc(paymentTable.createdAt));

  let userLifetimePlan: PricePlan | null = null;
  let lifetimePayment: (typeof payments)[number] | null = null;
  let activeSubscription: Subscription | null = null;
  let subscriptionPayment: (typeof payments)[number] | null = null;

  for (const p of payments) {
    if (
      p.type === PaymentTypes.ONE_TIME &&
      p.scene === PaymentScenes.LIFETIME &&
      p.status === 'completed' &&
      !userLifetimePlan
    ) {
      const pricePlan = await findPlanByPriceId(p.priceId);
      if (pricePlan && lifetimePlanIds.has(pricePlan.id)) {
        userLifetimePlan = pricePlan;
        lifetimePayment = p;
      }
    }

    if (
      !userLifetimePlan &&
      p.type === PaymentTypes.SUBSCRIPTION &&
      (p.status === 'active' || p.status === 'trialing') &&
      !activeSubscription
    ) {
      activeSubscription = {
        id: p.id,
        priceId: p.priceId,
        customerId: p.customerId,
        status: p.status as PaymentStatus,
        type: p.type as PaymentTypes,
        interval: p.interval as PlanInterval,
        currentPeriodStart: p.periodStart || undefined,
        currentPeriodEnd: p.periodEnd || undefined,
        cancelAtPeriodEnd: p.cancelAtPeriodEnd || false,
        trialStartDate: p.trialStart || undefined,
        trialEndDate: p.trialEnd || undefined,
        createdAt: p.createdAt,
      };
      subscriptionPayment = p;
    }
  }

  if (userLifetimePlan) {
    return {
      source: 'lifetime',
      currentPlan: userLifetimePlan,
      subscription: null,
      selectedPayment: lifetimePayment,
    };
  }

  if (activeSubscription) {
    const subscriptionPlan =
      plans.find((plan) =>
        plan.prices.find(
          (price) => price.priceId === activeSubscription!.priceId
        )
      ) || null;
    return {
      source: 'subscription',
      currentPlan: subscriptionPlan,
      subscription: activeSubscription,
      selectedPayment: subscriptionPayment,
    };
  }

  return {
    source: 'free',
    currentPlan: freePlan,
    subscription: null,
    selectedPayment: null,
  };
}

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
    };
    const parsed = querySchema.safeParse(rawQuery);
    if (!parsed.success) {
      return errorResponse(parsed.error.message, 400);
    }

    const userId = parsed.data.user_id;
    const db = await getDb();

    // 3) 账号层级：是否子账号、是否父账号、对应关系
    const [childRel] = await db
      .select({
        parentUserId: storeUserRelationship.parentUserId,
        storeId: storeUserRelationship.storeId,
        relationshipRole: storeUserRelationship.relationshipRole,
        createdAt: storeUserRelationship.createdAt,
      })
      .from(storeUserRelationship)
      .where(eq(storeUserRelationship.childUserId, userId))
      .limit(1);

    const [childrenAgg] = await db
      .select({ c: count() })
      .from(storeUserRelationship)
      .where(eq(storeUserRelationship.parentUserId, userId));

    const isChildAccount = Boolean(childRel);
    const childrenCount = Number(childrenAgg?.c || 0);
    const isParentAccount = childrenCount > 0;
    const accountRole: 'parent' | 'child' | 'standalone' = isParentAccount
      ? 'parent'
      : isChildAccount
        ? 'child'
        : 'standalone';

    // 4) 当前会员（对齐 getCurrentPlanAction）
    const membership = await getCurrentMembershipByUserId(userId);
    const membershipCode = membership.currentPlan?.id || 'free';

    // 5) 会员等级（折扣）
    const [tier] = await db
      .select({
        code: membershipTierTable.code,
        name: membershipTierTable.name,
        level: membershipTierTable.level,
        discountRate: membershipTierTable.discountRate,
        disabled: membershipTierTable.disabled,
      })
      .from(membershipTierTable)
      .where(eq(membershipTierTable.code, membershipCode))
      .limit(1);

    // 6) 当前积分
    const [credit] = await db
      .select({
        currentCredits: userCreditTable.currentCredits,
        updatedAt: userCreditTable.updatedAt,
      })
      .from(userCreditTable)
      .where(eq(userCreditTable.userId, userId))
      .limit(1);

    // 7) 到期时间（如果是 subscription，就从 periodEnd / trialEnd 中推导；lifetime/free 为 null）
    const expiresAt =
      membership.source === 'subscription'
        ? (membership.selectedPayment?.periodEnd?.getTime() ??
          membership.selectedPayment?.trialEnd?.getTime() ??
          null)
        : null;

    return successResponse(
      {
        user_id: userId,
        account: {
          role: accountRole,
          is_parent: isParentAccount,
          is_child: isChildAccount,
          parent_user_id: childRel?.parentUserId ?? null,
          relationship: childRel
            ? {
                store_id: childRel.storeId,
                relationship_role: childRel.relationshipRole,
                joined_at: childRel.createdAt.getTime(),
              }
            : null,
          children_count: childrenCount,
        },
        membership: {
          source: membership.source, // lifetime | subscription | free
          membership_code: membershipCode,
          tier: tier
            ? {
                code: tier.code,
                name: tier.name,
                level: tier.level,
                discount_rate: tier.discountRate,
                disabled: tier.disabled,
              }
            : null,
          plan: membership.currentPlan
            ? {
                id: membership.currentPlan.id,
                is_free: membership.currentPlan.isFree,
                is_lifetime: membership.currentPlan.isLifetime,
              }
            : null,
          subscription: membership.subscription
            ? {
                status: membership.subscription.status,
                interval: membership.subscription.interval ?? null,
                period_start: membership.subscription.currentPeriodStart
                  ? membership.subscription.currentPeriodStart.getTime()
                  : null,
                period_end: membership.subscription.currentPeriodEnd
                  ? membership.subscription.currentPeriodEnd.getTime()
                  : null,
                cancel_at_period_end:
                  membership.subscription.cancelAtPeriodEnd ?? false,
                trial_start: membership.subscription.trialStartDate
                  ? membership.subscription.trialStartDate.getTime()
                  : null,
                trial_end: membership.subscription.trialEndDate
                  ? membership.subscription.trialEndDate.getTime()
                  : null,
              }
            : null,
          expires_at: expiresAt,
          purchase: membership.selectedPayment
            ? {
                payment_id: membership.selectedPayment.id,
                price_id: membership.selectedPayment.priceId,
                type: membership.selectedPayment.type,
                scene: membership.selectedPayment.scene,
                status: membership.selectedPayment.status,
                created_at: membership.selectedPayment.createdAt.getTime(),
                period_start: membership.selectedPayment.periodStart
                  ? membership.selectedPayment.periodStart.getTime()
                  : null,
                period_end: membership.selectedPayment.periodEnd
                  ? membership.selectedPayment.periodEnd.getTime()
                  : null,
              }
            : null,
        },
        credits: {
          current_credits: credit?.currentCredits ?? 0,
          updated_at: credit?.updatedAt ? credit.updatedAt.getTime() : null,
        },
      },
      '查询成功'
    );
  } catch (error) {
    console.error('internal membership rights error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
