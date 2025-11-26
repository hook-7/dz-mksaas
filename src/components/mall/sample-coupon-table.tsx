'use client';

import { Button } from '@/components/ui/button';
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

export function SampleCouponTable() {
  const t = useTranslations('Dashboard.mallCenter.coupons');

  return (
    <div className="flex flex-col gap-4">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="relative flex w-full overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
        >
          {/* Left horizontal text section - Coupon stub look */}
          <div className="flex w-24 flex-row items-center justify-center border-r border-dashed bg-primary/5 p-2 text-primary">
            <span className="text-lg font-bold text-center">样品券</span>
          </div>

          {/* Right content section */}
          <div className="flex flex-1 items-center justify-between p-6">
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

            <Button size="lg" className="ml-4">
              {t('buyNow')}
            </Button>
          </div>

          {/* Decorative circles for perforation effect */}
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background" />
          <div className="absolute left-[3.5rem] top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
          <div className="absolute left-[3.5rem] bottom-0 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-background" />
        </div>
      ))}
    </div>
  );
}
