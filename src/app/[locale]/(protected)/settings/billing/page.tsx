import BillingCard from '@/components/settings/billing/billing-card';
import { getAllSubscriptionPlans, productToPricePlan } from '@/lib/product';
import type { PricePlan } from '@/payment/types';

/**
 * Billing page, show billing information
 */
export default async function BillingPage() {
  // 从数据库获取所有订阅产品
  const products = await getAllSubscriptionPlans();
  const rawPlans = products.map(productToPricePlan);

  // 这里不再做多语言映射，直接使用数据库中的名称
  const pricePlans: PricePlan[] = rawPlans;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BillingCard pricePlans={pricePlans} />
      </div>
    </div>
  );
}
