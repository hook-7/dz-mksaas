'use client';

import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';

interface OrderRow {
  id: string;
  orderNo: string;
  userId: string;
  productName: string | null;
  productType: string | null;
  quantity: number;
  originalAmount: number;
  discountAmount: number;
  otherDiscountAmount: number | null;
  finalAmount: number;
  paidAmount: number | null;
  currency: string;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: string;
  paidAt: string | null;
}

interface OrdersPageClientProps {
  initialData: OrderRow[];
}

export function OrdersPageClient({ initialData }: OrdersPageClientProps) {
  const t = useTranslations('Dashboard.admin.orders');
  const data = initialData;

  const formatCurrency = (
    amount: number | null | undefined,
    currency: string
  ) => {
    if (amount == null) return '-';
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  const columns: ColumnDef<OrderRow>[] = [
    {
      id: 'orderNo',
      header: t('columns.orderNo'),
      accessorKey: 'orderNo',
      cell: ({ row }) => (
        <span className="font-mono text-xs md:text-sm">
          {row.original.orderNo}
        </span>
      ),
    },
    {
      id: 'userId',
      header: t('columns.userId'),
      accessorKey: 'userId',
      cell: ({ row }) => (
        <span className="font-mono text-xs md:text-sm text-muted-foreground">
          {row.original.userId}
        </span>
      ),
    },
    {
      id: 'productName',
      header: t('columns.productName'),
      accessorKey: 'productName',
    },
    {
      id: 'productType',
      header: t('columns.productType'),
      accessorKey: 'productType',
      cell: ({ row }) => row.original.productType ?? '-',
    },
    {
      id: 'quantity',
      header: t('columns.quantity'),
      accessorKey: 'quantity',
    },
    {
      id: 'finalAmount',
      header: t('columns.finalAmount'),
      accessorKey: 'finalAmount',
      cell: ({ row }) =>
        formatCurrency(row.original.finalAmount, row.original.currency),
    },
    {
      id: 'paidAmount',
      header: t('columns.paidAmount'),
      accessorKey: 'paidAmount',
      cell: ({ row }) =>
        formatCurrency(row.original.paidAmount, row.original.currency),
    },
    {
      id: 'paymentMethod',
      header: t('columns.paymentMethod'),
      accessorKey: 'paymentMethod',
      cell: ({ row }) => row.original.paymentMethod ?? '-',
    },
    {
      id: 'paymentStatus',
      header: t('columns.paymentStatus'),
      accessorKey: 'paymentStatus',
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        const label = t(
          `status.${status as 'pending' | 'paid' | 'failed' | 'refunded'}`,
          {
            defaultValue: status,
          }
        );

        return (
          <Badge
            className={cn('capitalize', {
              'bg-emerald-500/10 text-emerald-600 border-emerald-500/30':
                status === 'paid',
              'bg-yellow-500/10 text-yellow-700 border-yellow-500/30':
                status === 'pending',
              'bg-red-500/10 text-red-600 border-red-500/30':
                status === 'failed' || status === 'refunded',
            })}
            variant="outline"
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: 'createdAt',
      header: t('columns.createdAt'),
      accessorKey: 'createdAt',
      cell: ({ row }) => row.original.createdAt || '-',
    },
    {
      id: 'paidAt',
      header: t('columns.paidAt'),
      accessorKey: 'paidAt',
      cell: ({ row }) => row.original.paidAt || '-',
    },
  ];

  const table = useReactTable<OrderRow>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full space-y-4">
      {/* Header card - 对齐产品管理页面样式 */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-base font-semibold leading-none tracking-tight">
              {t('title', { defaultValue: '订单管理' })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('description', {
                defaultValue: '查看和管理系统内的所有订单记录。',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Table 区域增加左右内边距，避免紧贴左侧菜单 */}
      <div className="px-4 lg:px-6">
        <DataTable<OrderRow> table={table} />
      </div>
    </div>
  );
}
