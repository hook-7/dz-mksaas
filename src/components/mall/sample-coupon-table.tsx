'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <Card
          key={pkg.id}
          className="flex flex-col items-center text-center hover:shadow-lg transition-shadow"
        >
          <CardHeader>
            <CardTitle className="text-2xl">{t(`items.${pkg.id}`)}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-4xl font-bold text-primary">
                {pkg.price}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {t('originalPrice', { price: pkg.originalPrice })}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('lowTo', { price: pkg.unitPrice })}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg">
              {t('buyNow')}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
