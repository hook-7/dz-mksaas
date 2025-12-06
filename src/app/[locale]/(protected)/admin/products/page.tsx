import { ProductsPageClient } from '@/components/admin/products-page-client';
import { useTranslations } from 'next-intl';

/**
 * Products page
 *
 * 仅管理员可访问，用于管理订阅计划和积分包产品
 */
export default function AdminProductsPage() {
  // 使用与 Dashboard 其他页面一致的头部布局
  // 这里直接使用 div 容器，具体标题文案在客户端组件中处理
  return (
    <div className="flex flex-col gap-6">
      <ProductsPageClient />
    </div>
  );
}

