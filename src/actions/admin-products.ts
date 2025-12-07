'use server';

import { randomUUID } from 'crypto';

import { getDb } from '@/db';
import { product } from '@/db/schema';
import type { ProductInfo } from '@/lib/product';
import { getAllProducts } from '@/lib/product';
import { adminActionClient } from '@/lib/safe-action';
import { eq } from 'drizzle-orm';
import { Stripe } from 'stripe';
import { z } from 'zod';

// 公共的产品输入 schema（用于创建和更新）
const productInputSchema = z.object({
  id: z.string().optional(), // 更新时必填，创建时忽略
  sku: z.string().optional().nullable(), // 商品ID，如 M001 / S001
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  description2: z.string().optional().nullable(),
  productType: z.enum(['subscription_plan', 'credit_package']),
  originalAmount: z.number().nonnegative().optional(), // 原价（元）
  amount: z.number().nonnegative(), // 以货币单位（元/美元）传入
  currency: z.string().min(1),
  paymentType: z.enum(['subscription', 'one_time']),
  interval: z.enum(['month', 'year']).optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  targetMembershipCode: z.string().optional().nullable(), // 可购买会员等级限制
  popular: z.boolean().optional(),
  disabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
  stock: z.number().optional(),
  // 订阅计划特定字段
  isFree: z.boolean().optional(),
  isLifetime: z.boolean().optional(),
  creditsEnabled: z.boolean().optional(),
  creditsAmount: z.number().optional(),
  creditsExpireDays: z.number().optional(),
  // 积分包特定字段
  packageAmount: z.number().optional(),
  packageExpireDays: z.number().optional(),
});

type ProductInput = z.infer<typeof productInputSchema>;

/**
 * 如果没有提供 stripePriceId，则在 Stripe 中创建对应的 Price 并返回其 ID
 * - 金额为 0（免费产品）时，不创建 Stripe Price，返回 null
 * - 已经填写了 stripePriceId 时，直接返回该值，不再创建
 */
async function createStripePriceIfNeeded(
  input: ProductInput
): Promise<string | null> {
  const existingId = input.stripePriceId?.trim();
  if (existingId) {
    return existingId;
  }

  // 免费产品不需要 Stripe Price
  if (!input.amount || input.amount <= 0) {
    return null;
  }

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not set, cannot create Stripe price');
  }

  const stripe = new Stripe(apiKey);
  const amountInCents = Math.round(input.amount * 100);

  const params: Stripe.PriceCreateParams = {
    unit_amount: amountInCents,
    currency: input.currency.toLowerCase(),
    product_data: {
      name: input.name,
      metadata: {
        productType: input.productType,
      },
    },
    nickname: input.name,
  };

  if (input.paymentType === 'subscription') {
    params.recurring = {
      interval: (input.interval ??
        'month') as Stripe.PriceCreateParams.Recurring.Interval,
    };
  }

  const price = await stripe.prices.create(params);
  return price.id;
}

function buildConfig(input: z.infer<typeof productInputSchema>): string | null {
  if (input.productType === 'subscription_plan') {
    const config = {
      isFree: !!input.isFree,
      isLifetime: !!input.isLifetime,
      credits: {
        enable: !!input.creditsEnabled,
        amount: input.creditsEnabled ? (input.creditsAmount ?? 0) : 0,
        expireDays: input.creditsEnabled ? (input.creditsExpireDays ?? 30) : 30,
      },
    };
    return JSON.stringify(config);
  }

  // credit_package
  const config = {
    amount: input.packageAmount ?? 0,
    expireDays: input.packageExpireDays ?? 30,
  };
  return JSON.stringify(config);
}

/**
 * 获取所有产品（包括已禁用），仅管理员可用
 */
export const getAllProductsAction = adminActionClient.action(
  async (): Promise<{
    success: boolean;
    data?: { items: ProductInfo[] };
    error?: string;
  }> => {
    try {
      const items = await getAllProducts(undefined, true);
      return {
        success: true,
        data: { items },
      };
    } catch (error) {
      console.error('getAllProductsAction error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch products',
      };
    }
  }
);

/**
 * 创建产品，仅管理员可用
 */
export const createProductAction = adminActionClient
  .schema(productInputSchema.omit({ id: true }))
  .action(async ({ parsedInput }) => {
    try {
      const db = await getDb();

      const amountInCents = Math.round(parsedInput.amount * 100);
      const originalAmountInCents =
        typeof parsedInput.originalAmount === 'number'
          ? Math.round(parsedInput.originalAmount * 100)
          : null;
      const interval =
        parsedInput.paymentType === 'subscription'
          ? (parsedInput.interval ?? 'month')
          : null;

      const config = buildConfig(parsedInput);

      // 如果没有填写 stripePriceId，则自动在 Stripe 中创建 Price 并同步 ID
      const stripePriceId = await createStripePriceIfNeeded(parsedInput);

      const id = randomUUID();

      await db.insert(product).values({
        id,
        sku: parsedInput.sku?.trim() || null,
        name: parsedInput.name,
        description: parsedInput.description ?? null,
        description2: parsedInput.description2 ?? null,
        productType: parsedInput.productType,
        config,
        stripePriceId,
        amount: amountInCents,
        currency: parsedInput.currency,
        paymentType: parsedInput.paymentType,
        interval,
        trialPeriodDays: null,
        allowPromotionCode: false,
        originalAmount: originalAmountInCents,
        discountRate: null,
        popular: !!parsedInput.popular,
        disabled: !!parsedInput.disabled,
        sortOrder: parsedInput.sortOrder ?? 0,
        targetMembershipCode: parsedInput.targetMembershipCode ?? 'all',
        stock: typeof parsedInput.stock === 'number' ? parsedInput.stock : null,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('createProductAction error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create product',
      };
    }
  });

/**
 * 更新产品，仅管理员可用
 */
export const updateProductAction = adminActionClient
  .schema(productInputSchema.extend({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      const db = await getDb();

      const amountInCents = Math.round(parsedInput.amount * 100);
      const originalAmountInCents =
        typeof parsedInput.originalAmount === 'number'
          ? Math.round(parsedInput.originalAmount * 100)
          : null;
      const interval =
        parsedInput.paymentType === 'subscription'
          ? (parsedInput.interval ?? 'month')
          : null;

      const config = buildConfig(parsedInput);

      // 如果没有填写 stripePriceId，则自动在 Stripe 中创建 Price 并同步 ID
      const stripePriceId = await createStripePriceIfNeeded(parsedInput);

      await db
        .update(product)
        .set({
          sku: parsedInput.sku?.trim() || null,
          name: parsedInput.name,
          description: parsedInput.description ?? null,
          description2: parsedInput.description2 ?? null,
          productType: parsedInput.productType,
          config,
          stripePriceId,
          amount: amountInCents,
          currency: parsedInput.currency,
          paymentType: parsedInput.paymentType,
          interval,
          originalAmount: originalAmountInCents,
          popular: !!parsedInput.popular,
          disabled: !!parsedInput.disabled,
          sortOrder: parsedInput.sortOrder ?? 0,
          targetMembershipCode: parsedInput.targetMembershipCode ?? 'all',
          stock:
            typeof parsedInput.stock === 'number' ? parsedInput.stock : null,
          updatedAt: new Date(),
        })
        .where(eq(product.id, parsedInput.id));

      return {
        success: true,
      };
    } catch (error) {
      console.error('updateProductAction error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update product',
      };
    }
  });

/**
 * 删除产品，仅管理员可用
 */
export const deleteProductAction = adminActionClient
  .schema(
    z.object({
      id: z.string().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      const db = await getDb();
      await db.delete(product).where(eq(product.id, parsedInput.id));

      return {
        success: true,
      };
    } catch (error) {
      console.error('deleteProductAction error:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete product',
      };
    }
  });
