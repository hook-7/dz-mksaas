import { OrdersPageClient } from '@/components/admin/orders-page-client';
import { getDb } from '@/db';
import { order } from '@/db/schema';
import { desc } from 'drizzle-orm';

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '';
  // 使用 ISO 字符串并做字符串裁剪，避免时区差异导致的 SSR/CSR 不一致
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export default async function AdminOrdersPage() {
  const db = await getDb();

  const rows = await db
    .select()
    .from(order)
    .orderBy(desc(order.createdAt))
    .limit(200);

  const data = rows.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    userId: o.userId,
    productName: o.productName,
    productType: o.productType,
    quantity: o.quantity,
    originalAmount: o.originalAmount,
    discountAmount: o.discountAmount,
    otherDiscountAmount: o.otherDiscountAmount,
    finalAmount: o.finalAmount,
    paidAmount: o.paidAmount,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    createdAt: formatDateTime(o.createdAt),
    paidAt: formatDateTime(o.paidAt),
  }));

  return (
    <div className="flex flex-col gap-6">
      <OrdersPageClient initialData={data} />
    </div>
  );
}
