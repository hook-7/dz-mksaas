import type { CreditPackage } from '@/credits/types';
import { getDb } from '@/db';
import { product } from '@/db/schema';
import type { Price, PricePlan } from '@/payment/types';
import { PaymentTypes, PlanIntervals } from '@/payment/types';
import { and, asc, eq } from 'drizzle-orm';

/**
 * 产品类型枚举
 */
export enum ProductTypes {
  SUBSCRIPTION_PLAN = 'subscription_plan',
  CREDIT_PACKAGE = 'credit_package',
}

/**
 * 产品类型
 */
export type ProductType =
  | ProductTypes.SUBSCRIPTION_PLAN
  | ProductTypes.CREDIT_PACKAGE;

/**
 * 订阅计划配置
 */
export interface SubscriptionPlanConfig {
  isFree: boolean;
  isLifetime: boolean;
  credits?: {
    enable: boolean;
    amount: number;
    expireDays: number;
  };
}

/**
 * 积分包配置
 */
export interface CreditPackageConfig {
  amount: number; // 积分数量
  expireDays: number; // 过期天数
}

/**
 * 产品信息（包含价格）
 */
export interface ProductInfo {
  id: string;
  // 商品ID（如 M001 / S001），可选
  sku?: string | null;
  name: string;
  description: string | null;
  // 额外说明字段，用于列表中的“商品说明B2”
  description2?: string | null;
  productType: ProductType;
  config: SubscriptionPlanConfig | CreditPackageConfig | null;
  // 价格信息
  stripePriceId: string | null;
  amount: number; // 价格金额（以最小货币单位，如分）
  currency: string;
  paymentType: 'subscription' | 'one_time';
  interval: string | null;
  trialPeriodDays: number | null;
  allowPromotionCode: boolean;
  originalAmount: number | null;
  discountRate: number | null;
  // 其他字段
  popular: boolean;
  disabled: boolean;
  sortOrder: number;
  // 目标会员等级限制（all | personal | business | pro-seller）
  targetMembershipCode?: string | null;
  // 库存
  stock?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 获取所有产品
 * @param productType - 可选，过滤产品类型
 * @param includeDisabled - 是否包含已禁用的产品，默认 false
 */
export async function getAllProducts(
  productType?: ProductType,
  includeDisabled = false
): Promise<ProductInfo[]> {
  const db = await getDb();

  // 构建查询条件
  const conditions = [];
  if (productType) {
    conditions.push(eq(product.productType, productType));
  }
  if (!includeDisabled) {
    conditions.push(eq(product.disabled, false));
  }

  // 查询产品
  const products = await db
    .select()
    .from(product)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(product.sortOrder), asc(product.createdAt));

  return products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    description2: (p as any).description2 ?? null,
    productType: p.productType as ProductType,
    config: p.config ? JSON.parse(p.config) : null,
    stripePriceId: p.stripePriceId,
    amount: p.amount,
    currency: p.currency,
    paymentType: p.paymentType as 'subscription' | 'one_time',
    interval: p.interval,
    trialPeriodDays: p.trialPeriodDays,
    allowPromotionCode: p.allowPromotionCode,
    originalAmount: p.originalAmount,
    discountRate: p.discountRate,
    popular: p.popular,
    disabled: p.disabled,
    sortOrder: p.sortOrder,
    targetMembershipCode: (p as any).targetMembershipCode ?? null,
    stock: (p as any).stock ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

/**
 * 根据 ID 获取产品
 * @param productId - 产品 ID
 */
export async function getProductById(
  productId: string
): Promise<ProductInfo | null> {
  const db = await getDb();

  const [productRecord] = await db
    .select()
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);

  if (!productRecord) {
    return null;
  }

  return {
    id: productRecord.id,
    sku: productRecord.sku,
    name: productRecord.name,
    description: productRecord.description,
    description2: (productRecord as any).description2 ?? null,
    productType: productRecord.productType as ProductType,
    config: productRecord.config ? JSON.parse(productRecord.config) : null,
    stripePriceId: productRecord.stripePriceId,
    amount: productRecord.amount,
    currency: productRecord.currency,
    paymentType: productRecord.paymentType as 'subscription' | 'one_time',
    interval: productRecord.interval,
    trialPeriodDays: productRecord.trialPeriodDays,
    allowPromotionCode: productRecord.allowPromotionCode,
    originalAmount: productRecord.originalAmount,
    discountRate: productRecord.discountRate,
    popular: productRecord.popular,
    disabled: productRecord.disabled,
    sortOrder: productRecord.sortOrder,
    targetMembershipCode: (productRecord as any).targetMembershipCode ?? null,
    stock: (productRecord as any).stock ?? null,
    createdAt: productRecord.createdAt,
    updatedAt: productRecord.updatedAt,
  };
}

/**
 * 根据 Stripe Price ID 获取产品
 * @param stripePriceId - Stripe Price ID
 */
export async function getProductByStripePriceId(
  stripePriceId: string
): Promise<ProductInfo | null> {
  const db = await getDb();

  const [productRecord] = await db
    .select()
    .from(product)
    .where(eq(product.stripePriceId, stripePriceId))
    .limit(1);

  if (!productRecord) {
    return null;
  }

  return getProductById(productRecord.id);
}

/**
 * 获取所有订阅计划
 */
export async function getAllSubscriptionPlans(): Promise<ProductInfo[]> {
  return getAllProducts(ProductTypes.SUBSCRIPTION_PLAN);
}

/**
 * 获取所有积分包
 */
export async function getAllCreditPackages(): Promise<ProductInfo[]> {
  return getAllProducts(ProductTypes.CREDIT_PACKAGE);
}

/**
 * 将 ProductInfo 转换为 PricePlan
 */
export function productToPricePlan(productInfo: ProductInfo): PricePlan {
  const config = productInfo.config as SubscriptionPlanConfig | null;

  // 构建价格数组
  const prices: Price[] = [];
  if (productInfo.stripePriceId) {
    const price: Price = {
      type:
        productInfo.paymentType === 'subscription'
          ? PaymentTypes.SUBSCRIPTION
          : PaymentTypes.ONE_TIME,
      priceId: productInfo.stripePriceId,
      amount: productInfo.amount / 100, // 转换为货币单位
      currency: productInfo.currency,
      trialPeriodDays: productInfo.trialPeriodDays || undefined,
      allowPromotionCode: productInfo.allowPromotionCode,
      disabled: productInfo.disabled,
    };

    // 如果是订阅类型，添加 interval
    if (productInfo.paymentType === 'subscription' && productInfo.interval) {
      price.interval =
        productInfo.interval === 'month'
          ? PlanIntervals.MONTH
          : PlanIntervals.YEAR;
    }

    prices.push(price);
  }

  return {
    id: productInfo.name, // 使用 name 作为 planId（与配置文件保持一致）
    prices,
    isFree: config?.isFree || false,
    isLifetime: config?.isLifetime || false,
    popular: productInfo.popular,
    disabled: productInfo.disabled,
    credits: config?.credits,
  };
}

/**
 * 将 ProductInfo 转换为 CreditPackage
 */
export function productToCreditPackage(
  productInfo: ProductInfo
): CreditPackage {
  const config = productInfo.config as CreditPackageConfig | null;

  if (!productInfo.stripePriceId) {
    throw new Error(`Product ${productInfo.name} has no stripePriceId`);
  }

  return {
    id: productInfo.name, // 使用 name 作为 packageId（与配置文件保持一致）
    amount: config?.amount || 0,
    price: {
      priceId: productInfo.stripePriceId,
      amount: productInfo.amount / 100, // 转换为货币单位
      currency: productInfo.currency,
      allowPromotionCode: productInfo.allowPromotionCode,
    },
    popular: productInfo.popular,
    expireDays: config?.expireDays,
    disabled: productInfo.disabled,
    targetMembershipCode: productInfo.targetMembershipCode ?? null,
    sku: productInfo.sku ?? null,
    description2: productInfo.description2 ?? null,
    stock: productInfo.stock ?? null,
  };
}
