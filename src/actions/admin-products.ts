'use server';

import { getDb } from '@/db';
import { product } from '@/db/schema';
import { adminActionClient } from '@/lib/safe-action';
import type { ProductInfo } from '@/lib/product';
import { getAllProducts } from '@/lib/product';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// 公共的产品输入 schema（用于创建和更新）
const productInputSchema = z.object({
  id: z.string().optional(), // 更新时必填，创建时忽略
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  productType: z.enum(['subscription_plan', 'credit_package']),
  amount: z.number().nonnegative(), // 以货币单位（元/美元）传入
  currency: z.string().min(1),
  paymentType: z.enum(['subscription', 'one_time']),
  interval: z.enum(['month', 'year']).optional().nullable(),
  stripePriceId: z.string().optional().nullable(),
  popular: z.boolean().optional(),
  disabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
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

function buildConfig(input: z.infer<typeof productInputSchema>): string | null {
  if (input.productType === 'subscription_plan') {
    const config = {
      isFree: !!input.isFree,
      isLifetime: !!input.isLifetime,
      credits: {
        enable: !!input.creditsEnabled,
        amount: input.creditsEnabled ? input.creditsAmount ?? 0 : 0,
        expireDays: input.creditsEnabled ? input.creditsExpireDays ?? 30 : 30,
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
      const interval =
        parsedInput.paymentType === 'subscription'
          ? parsedInput.interval ?? 'month'
          : null;

      const config = buildConfig(parsedInput);

      await db.insert(product).values({
        id: randomUUID(),
        name: parsedInput.name,
        description: parsedInput.description ?? null,
        productType: parsedInput.productType,
        config,
        stripePriceId: parsedInput.stripePriceId?.trim() || null,
        amount: amountInCents,
        currency: parsedInput.currency,
        paymentType: parsedInput.paymentType,
        interval,
        trialPeriodDays: null,
        allowPromotionCode: false,
        originalAmount: null,
        discountRate: null,
        popular: !!parsedInput.popular,
        disabled: !!parsedInput.disabled,
        sortOrder: parsedInput.sortOrder ?? 0,
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
      const interval =
        parsedInput.paymentType === 'subscription'
          ? parsedInput.interval ?? 'month'
          : null;

      const config = buildConfig(parsedInput);

      await db
        .update(product)
        .set({
          name: parsedInput.name,
          description: parsedInput.description ?? null,
          productType: parsedInput.productType,
          config,
          stripePriceId: parsedInput.stripePriceId?.trim() || null,
          amount: amountInCents,
          currency: parsedInput.currency,
          paymentType: parsedInput.paymentType,
          interval,
          popular: !!parsedInput.popular,
          disabled: !!parsedInput.disabled,
          sortOrder: parsedInput.sortOrder ?? 0,
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


