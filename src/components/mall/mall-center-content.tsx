'use client';

import { PurchaseModal } from '@/components/mall/purchase-modal';
import { SampleCouponTable } from '@/components/mall/sample-coupon-table';
import { PricingTable } from '@/components/pricing/pricing-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function MallCenterContent() {
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
          <PricingTable onPurchase={handlePurchase} />
        </TabsContent>
        <TabsContent value="coupons">
          <SampleCouponTable />
        </TabsContent>
      </Tabs>

      {selectedPlan && (
        <PurchaseModal
          open={purchaseModalOpen}
          onOpenChange={setPurchaseModalOpen}
          title={t('tabs.membership')} // Contextual title
          price={selectedPlan.price}
          description={t('description')} // Or specific plan description if available
        />
      )}
    </div>
  );
}
