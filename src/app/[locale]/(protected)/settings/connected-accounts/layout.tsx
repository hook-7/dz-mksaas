import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { getTranslations } from 'next-intl/server';
import type React from 'react';

interface ConnectedAccountsLayoutProps {
  children: React.ReactNode;
}

export default async function ConnectedAccountsLayout({
  children,
}: ConnectedAccountsLayoutProps) {
  const t = await getTranslations('Dashboard');

  const breadcrumbs = [
    {
      label: t('personalCenter.title'),
      isCurrentPage: false,
    },
    {
      label: t('personalCenter.connectedAccounts.title'),
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 space-y-8">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}
