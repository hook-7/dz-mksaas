import { getDb } from '@/db';
import { product } from '@/db/schema';
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
  name: string;
  description: string | null;
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
    name: p.name,
    description: p.description,
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
    name: productRecord.name,
    description: productRecord.description,
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
