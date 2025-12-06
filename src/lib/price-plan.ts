import {
  getAllSubscriptionPlans,
  getProductById,
  getProductByStripePriceId,
  productToPricePlan,
} from '@/lib/product';
import type { Price, PricePlan } from '@/payment/types';

/**
 * Get all price plans (without translations, like name/description/features)
 * NOTICE: This function can be used in server components only (async function).
 * @returns Array of price plans
 */
export const getAllPricePlans = async (): Promise<PricePlan[]> => {
  const products = await getAllSubscriptionPlans();
  return products.map(productToPricePlan);
};

/**
 * Get plan by plan ID
 * @param planId Plan ID (product name)
 * @returns Plan or undefined if not found
 */
export const findPlanByPlanId = async (
  planId: string
): Promise<PricePlan | undefined> => {
  const plans = await getAllPricePlans();
  return plans.find((plan) => plan.id === planId);
};

/**
 * Find plan by price ID
 * @param priceId Price ID (Stripe price ID)
 * @returns Plan or undefined if not found
 */
export const findPlanByPriceId = async (
  priceId: string
): Promise<PricePlan | undefined> => {
  const product = await getProductByStripePriceId(priceId);
  if (!product || product.productType !== 'subscription_plan') {
    return undefined;
  }
  return productToPricePlan(product);
};

/**
 * Find price in a plan by ID
 * @param planId Plan ID (product name)
 * @param priceId Price ID (Stripe price ID)
 * @returns Price or undefined if not found
 */
export const findPriceInPlan = async (
  planId: string,
  priceId: string
): Promise<Price | undefined> => {
  const plan = await findPlanByPlanId(planId);
  if (!plan) {
    console.error(`findPriceInPlan, Plan with ID ${planId} not found`);
    return undefined;
  }
  return plan.prices.find((price) => price.priceId === priceId);
};
