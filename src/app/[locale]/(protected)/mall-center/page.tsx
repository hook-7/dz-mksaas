import Container from '@/components/layout/container';
import { MallCenterContent } from '@/components/mall/mall-center-content';
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

  return (
    <Container className="mt-8 max-w-7xl px-4 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <MallCenterContent />
    </Container>
  );
}
