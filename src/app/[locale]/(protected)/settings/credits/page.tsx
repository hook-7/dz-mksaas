import CreditsPageClient from '@/components/settings/credits/credits-page-client';
import { websiteConfig } from '@/config/website';
import type { CreditPackage } from '@/credits/types';
import { getAllCreditPackages, productToCreditPackage } from '@/lib/product';
import { Routes } from '@/routes';
import { redirect } from 'next/navigation';

/**
 * Credits page, show credit balance and transactions
 */
export default async function CreditsPage() {
  // If credits are disabled, redirect to billing page
  if (!websiteConfig.credits.enableCredits) {
    redirect(Routes.SettingsBilling);
  }

  // 从数据库获取所有积分包产品
  const products = await getAllCreditPackages();
  const rawPackages = products
    .filter((p) => p.stripePriceId)
    .map(productToCreditPackage);

  // 这里不再做多语言映射，直接使用数据库中的名称和描述
  const creditPackages: CreditPackage[] = rawPackages;

  return <CreditsPageClient creditPackages={creditPackages} />;
}
