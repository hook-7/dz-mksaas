'use client';

import { CreditPackages } from '@/components/settings/credits/credit-packages';
import { PurchaseModal } from '@/components/mall/purchase-modal';
import { PricingTable } from '@/components/pricing/pricing-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CreditPackage } from '@/credits/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface MallCenterContentProps {
  // 来自服务端的计划 ID -> Stripe Price 映射，只用于发起 Checkout
  planStripePrices: Record<
    string,
    {
      planId: string;
      priceId: string;
    }
  >;
  // 来自服务端的积分包列表，用于积分购买
  creditPackages: CreditPackage[];
}

export function MallCenterContent({
  planStripePrices,
  creditPackages,
}: MallCenterContentProps) {
  const t = useTranslations('Dashboard.mallCenter');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
  } | null>(null);

  const handlePurchase = (plan: { name: string; price: string }) => {
    setSelectedPlan(plan);
    setPurchaseModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
          <TabsTrigger value="membership">{t('tabs.membership')}</TabsTrigger>
          <TabsTrigger value="coupons">{t('tabs.coupons')}</TabsTrigger>
        </TabsList>
        <TabsContent value="membership">
          <PricingTable
            onPurchase={handlePurchase}
            planStripePrices={planStripePrices}
          />
        </TabsContent>
        <TabsContent value="coupons">
          {/* 使用数据库中的积分包作为样品券页面的真实数据来源 */}
          <div className="mt-4">
            <CreditPackages creditPackages={creditPackages} />
          </div>
        </TabsContent>
      </Tabs>

      {selectedPlan && (
        <PurchaseModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          title={selectedPlan.name}
          price={selectedPlan.price}
          description={t('description')}
        />
      )}
    </div>
  );
}
