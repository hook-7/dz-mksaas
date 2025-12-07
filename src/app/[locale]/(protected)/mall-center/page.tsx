import Container from '@/components/layout/container';
import { MallCenterContent } from '@/components/mall/mall-center-content';
import { getAllCreditPackages } from '@/credits/server';
import type { CreditPackage } from '@/credits/types';
import { getAllSubscriptionPlans, productToPricePlan } from '@/lib/product';
import type { PricePlan } from '@/payment/types';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard.mallCenter',
  });

  return {
    title: t('title'),
  };
}

export default async function MallCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard.mallCenter',
  });

  // 从数据库获取订阅产品及对应的 Stripe Price，用于商城中心的会员 Checkout
  const products = await getAllSubscriptionPlans();
  const rawPlans: PricePlan[] = products.map(productToPricePlan);
  const targetIds = new Set(['personal', 'business', 'pro-seller']);

  const planStripePrices: Record<
    string,
    {
      planId: string;
      priceId: string;
    }
  > = {};

  for (const plan of rawPlans) {
    if (!targetIds.has(plan.id)) continue;
    const activePrice = plan.prices.find((p) => !p.disabled);
    if (!activePrice) continue;
    planStripePrices[plan.id] = {
      planId: plan.id,
      priceId: activePrice.priceId,
    };
  }

  // 从数据库获取积分包，用于商城中心的「积分」页面展示与购买
  const creditProducts = await getAllCreditPackages();
  // 只展示未禁用的积分包
  const creditPackages: CreditPackage[] = creditProducts.filter(
    (pkg) => !pkg.disabled
  );

  return (
    <Container className="mt-8 max-w-7xl px-4 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <MallCenterContent
        planStripePrices={planStripePrices}
        creditPackages={creditPackages}
      />
    </Container>
  );
}
