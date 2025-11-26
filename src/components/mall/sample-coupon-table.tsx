'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type CouponPackage = {
  id: '100' | '300' | '500';
  price: string;
  originalPrice: string;
  unitPrice: string;
};

const packages: CouponPackage[] = [
  {
    id: '100',
    price: '150元',
    originalPrice: '300',
    unitPrice: '1.5元',
  },
  {
    id: '300',
    price: '250元',
    originalPrice: '900',
    unitPrice: '0.8元',
  },
  {
    id: '500',
    price: '350元',
    originalPrice: '950',
    unitPrice: '0.7元',
  },
];

interface SampleCouponTableProps {
  onPurchase?: (pkg: { name: string; price: string }) => void;
}

export function SampleCouponTable({ onPurchase }: SampleCouponTableProps) {
  const t = useTranslations('Dashboard.mallCenter.coupons');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <Card
          key={pkg.id}
          className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Left horizontal text section - Coupon stub look */}
          <div className="flex w-24 flex-shrink-0 flex-col items-center justify-center border-r border-dashed bg-primary/5 p-2 text-primary">
            <span className="text-lg font-bold text-center">样品券</span>
          </div>

          {/* Right content section */}
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">{t(`items.${pkg.id}`)}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">
                  {pkg.price}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {t('originalPrice', { price: pkg.originalPrice })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('lowTo', { price: pkg.unitPrice })}
              </p>
            </div>

            {onPurchase && (
              <Button
                size="lg"
                className="w-full mt-4" // Added mt-4 for spacing
                onClick={() =>
                  onPurchase({ name: t(`items.${pkg.id}`), price: pkg.price })
                }
              >
                {t('buyNow')}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
