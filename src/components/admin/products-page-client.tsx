'use client';

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from '@/actions/admin-products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/hooks/use-products';
import { formatPrice } from '@/lib/formatter';
import type { ProductInfo } from '@/lib/product';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface ProductFormState {
  id?: string;
  name: string;
  description: string;
  productType: 'subscription_plan' | 'credit_package';
  amount: string; // 货币单位，字符串方便输入
  currency: string;
  paymentType: 'subscription' | 'one_time';
  interval: 'month' | 'year' | '';
  stripePriceId: string;
  popular: boolean;
  disabled: boolean;
  sortOrder: string;
  // subscription_plan
  isFree: boolean;
  isLifetime: boolean;
  creditsEnabled: boolean;
  creditsAmount: string;
  creditsExpireDays: string;
  // credit_package
  packageAmount: string;
  packageExpireDays: string;
}

function productToFormState(product?: ProductInfo): ProductFormState {
  if (!product) {
    return {
      name: '',
      description: '',
      productType: 'subscription_plan',
      amount: '0',
      currency: 'CNY',
      paymentType: 'subscription',
      interval: 'year',
      stripePriceId: '',
      popular: false,
      disabled: false,
      sortOrder: '0',
      isFree: false,
      isLifetime: false,
      creditsEnabled: false,
      creditsAmount: '0',
      creditsExpireDays: '30',
      packageAmount: '0',
      packageExpireDays: '30',
    };
  }

  const isSubscription = product.productType === 'subscription_plan';
  const config: any = product.config || {};

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    productType: product.productType,
    amount: (product.amount / 100).toString(),
    currency: product.currency,
    paymentType: product.paymentType,
    interval: (product.interval as 'month' | 'year') || '',
    stripePriceId: product.stripePriceId || '',
    popular: product.popular,
    disabled: product.disabled,
    sortOrder: product.sortOrder.toString(),
    isFree: !!config.isFree,
    isLifetime: !!config.isLifetime,
    creditsEnabled: !!config.credits?.enable,
    creditsAmount: (config.credits?.amount ?? 0).toString(),
    creditsExpireDays: (config.credits?.expireDays ?? 30).toString(),
    packageAmount: (config.amount ?? 0).toString(),
    packageExpireDays: (config.expireDays ?? 30).toString(),
  };
}

function normalizeNumber(value: string, defaultValue = 0): number {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? defaultValue : n;
}

export function ProductsPageClient() {
  const t = useTranslations('Dashboard.admin.products');
  const { data: products = [], isLoading, refetch } = useProducts();

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInfo | undefined>(
    undefined
  );
  const [form, setForm] = useState<ProductFormState>(productToFormState());

  const isEditMode = !!editingProduct;

  const handleOpenCreate = () => {
    setEditingProduct(undefined);
    setForm(productToFormState());
    setOpen(true);
  };

  const handleOpenEdit = (product: ProductInfo) => {
    setEditingProduct(product);
    setForm(productToFormState(product));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (
    key: keyof ProductFormState,
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const { execute: createProduct, isExecuting: isCreating } = useAction(
    createProductAction,
    {
      onSuccess: ({ data }) => {
        setTimeout(() => {
          if (data?.success) {
            toast.success(t('messages.createSuccess'));
            void refetch();
            setOpen(false);
          } else {
            toast.error(data?.error || t('messages.createFailed'));
          }
        }, 0);
      },
      onError: ({ error }) => {
        setTimeout(() => {
          console.error('createProductAction error:', error);
          toast.error(t('messages.createFailed'));
        }, 0);
      },
    }
  );

  const { execute: updateProduct, isExecuting: isUpdating } = useAction(
    updateProductAction,
    {
      onSuccess: ({ data }) => {
        setTimeout(() => {
          if (data?.success) {
            toast.success(t('messages.updateSuccess'));
            void refetch();
            setOpen(false);
          } else {
            toast.error(data?.error || t('messages.updateFailed'));
          }
        }, 0);
      },
      onError: ({ error }) => {
        setTimeout(() => {
          console.error('updateProductAction error:', error);
          toast.error(t('messages.updateFailed'));
        }, 0);
      },
    }
  );

  const { execute: deleteProduct, isExecuting: isDeleting } = useAction(
    deleteProductAction,
    {
      onSuccess: ({ data }) => {
        setTimeout(() => {
          if (data?.success) {
            toast.success(t('messages.deleteSuccess'));
            void refetch();
          } else {
            toast.error(data?.error || t('messages.deleteFailed'));
          }
        }, 0);
      },
      onError: ({ error }) => {
        setTimeout(() => {
          console.error('deleteProductAction error:', error);
          toast.error(t('messages.deleteFailed'));
        }, 0);
      },
    }
  );

  const handleSubmit = () => {
    const payload = {
      id: form.id,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      productType: form.productType,
      amount: normalizeNumber(form.amount, 0),
      currency: form.currency.trim() || 'CNY',
      paymentType: form.paymentType,
      interval:
        form.paymentType === 'subscription' && form.interval
          ? form.interval
          : null,
      stripePriceId: form.stripePriceId.trim() || null,
      popular: form.popular,
      disabled: form.disabled,
      sortOrder: normalizeNumber(form.sortOrder, 0),
      isFree: form.isFree,
      isLifetime: form.isLifetime,
      creditsEnabled: form.creditsEnabled,
      creditsAmount: normalizeNumber(form.creditsAmount, 0),
      creditsExpireDays: normalizeNumber(form.creditsExpireDays, 30),
      packageAmount: normalizeNumber(form.packageAmount, 0),
      packageExpireDays: normalizeNumber(form.packageExpireDays, 30),
    };

    if (!payload.name) {
      toast.error(t('messages.nameRequired'));
      return;
    }

    if (payload.amount < 0) {
      toast.error(t('messages.amountInvalid'));
      return;
    }

    if (isEditMode) {
      updateProduct(payload as any);
    } else {
      const { id, ...createPayload } = payload;
      createProduct(createPayload as any);
    }
  };

  const handleDelete = (product: ProductInfo) => {
    if (!confirm(t('messages.deleteConfirm', { name: product.name }))) {
      return;
    }
    deleteProduct({ id: product.id });
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.sortOrder - b.sortOrder),
    [products]
  );

  const isSaving = isCreating || isUpdating;

  return (
    <div className="w-full space-y-4">
      {/* Header card */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-base font-semibold leading-none tracking-tight">
              {t('title', { defaultValue: '产品管理' })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('description', { defaultValue: '管理订阅计划和积分包产品。' })}
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="cursor-pointer h-9 px-4 text-xs"
          >
            {t('actions.create', { defaultValue: '新建产品' })}
          </Button>
        </div>
      </div>

      {/* Table card – 对齐用户管理页的表格容器样式 */}
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  名称
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  类型
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  价格
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  支付方式
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  Stripe Price ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                  状态
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-xs text-muted-foreground"
                  >
                    {t('messages.loading', { defaultValue: '加载中...' })}
                  </td>
                </tr>
              ) : sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-xs text-muted-foreground"
                  >
                    {t('messages.empty', { defaultValue: '暂无产品。' })}
                  </td>
                </tr>
              ) : (
                sortedProducts.map((p, index) => (
                  <tr
                    key={p.id}
                    className={cn('border-t', index % 2 === 1 && 'bg-muted/20')}
                  >
                    <td className="px-4 py-3 align-top max-w-[160px] truncate">
                      <span className="text-[11px] text-muted-foreground">
                        {p.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium leading-tight">
                          {p.name}
                        </span>
                        {p.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {p.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5"
                      >
                        {p.productType === 'subscription_plan'
                          ? '订阅计划'
                          : '积分包'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {p.amount > 0 ? (
                        <span className="text-sm font-medium">
                          {formatPrice(p.amount / 100, p.currency)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          免费
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="text-xs text-muted-foreground">
                        {p.paymentType === 'subscription' ? '订阅' : '一次性'}
                        {p.paymentType === 'subscription' && p.interval && (
                          <span>
                            {p.interval === 'month' ? ' / 月' : ' / 年'}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top max-w-[200px] truncate">
                      <span className="text-[11px] text-muted-foreground">
                        {p.stripePriceId || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={p.disabled ? 'outline' : 'default'}
                            className="px-2 py-0.5 text-[11px]"
                          >
                            {p.disabled ? '已禁用' : '启用'}
                          </Badge>
                          {p.popular && (
                            <Badge
                              variant="secondary"
                              className="px-2 py-0.5 text-[11px]"
                            >
                              推荐
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-right space-x-2">
                      <Button
                        size="xs"
                        variant="outline"
                        className="cursor-pointer h-7 px-2 text-[11px]"
                        onClick={() => handleOpenEdit(p)}
                      >
                        {t('actions.edit', { defaultValue: '编辑' })}
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        className="cursor-pointer h-7 px-2 text-[11px]"
                        disabled={isDeleting}
                        onClick={() => handleDelete(p)}
                      >
                        {t('actions.delete', { defaultValue: '删除' })}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? t('actions.edit', { defaultValue: '编辑产品' })
                : t('actions.create', { defaultValue: '新建产品' })}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <select
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
                value={form.productType}
                onChange={(e) =>
                  handleChange(
                    'productType',
                    e.target.value as ProductFormState['productType']
                  )
                }
              >
                <option value="subscription_plan">订阅计划</option>
                <option value="credit_package">积分包</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>价格金额（元）</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>货币</Label>
              <Input
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>支付方式</Label>
              <select
                className={cn(
                  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
                value={form.paymentType}
                onChange={(e) =>
                  handleChange(
                    'paymentType',
                    e.target.value as ProductFormState['paymentType']
                  )
                }
              >
                <option value="subscription">订阅</option>
                <option value="one_time">一次性</option>
              </select>
            </div>
            {form.paymentType === 'subscription' && (
              <div className="space-y-2">
                <Label>订阅周期</Label>
                <select
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                  value={form.interval}
                  onChange={(e) =>
                    handleChange(
                      'interval',
                      e.target.value as ProductFormState['interval']
                    )
                  }
                >
                  <option value="month">按月</option>
                  <option value="year">按年</option>
                </select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>产品描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Stripe Price ID</Label>
              <Input
                value={form.stripePriceId}
                onChange={(e) => handleChange('stripePriceId', e.target.value)}
                placeholder="price_xxx（可为空，后续在 Stripe 配置）"
              />
            </div>

            <div className="space-y-2">
              <Label>排序（越小越靠前）</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => handleChange('sortOrder', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                checked={form.popular}
                onCheckedChange={(v) => handleChange('popular', v)}
              />
              <Label className="cursor-pointer">推荐计划</Label>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <Switch
                checked={form.disabled}
                onCheckedChange={(v) => handleChange('disabled', v)}
              />
              <Label className="cursor-pointer">禁用</Label>
            </div>

            {form.productType === 'subscription_plan' && (
              <>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    checked={form.isFree}
                    onCheckedChange={(v) => handleChange('isFree', v)}
                  />
                  <Label className="cursor-pointer">免费计划</Label>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    checked={form.isLifetime}
                    onCheckedChange={(v) => handleChange('isLifetime', v)}
                  />
                  <Label className="cursor-pointer">终身计划</Label>
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    checked={form.creditsEnabled}
                    onCheckedChange={(v) => handleChange('creditsEnabled', v)}
                  />
                  <Label className="cursor-pointer">启用每月积分</Label>
                </div>
                {form.creditsEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>每月积分数量</Label>
                      <Input
                        type="number"
                        value={form.creditsAmount}
                        onChange={(e) =>
                          handleChange('creditsAmount', e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>积分有效期（天）</Label>
                      <Input
                        type="number"
                        value={form.creditsExpireDays}
                        onChange={(e) =>
                          handleChange('creditsExpireDays', e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {form.productType === 'credit_package' && (
              <>
                <div className="space-y-2">
                  <Label>积分数量</Label>
                  <Input
                    type="number"
                    value={form.packageAmount}
                    onChange={(e) =>
                      handleChange('packageAmount', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>积分有效期（天）</Label>
                  <Input
                    type="number"
                    value={form.packageExpireDays}
                    onChange={(e) =>
                      handleChange('packageExpireDays', e.target.value)
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleClose}
              disabled={isSaving}
            >
              {t('actions.cancel', { defaultValue: '取消' })}
            </Button>
            <Button
              className="cursor-pointer"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isEditMode
                ? t('actions.save', { defaultValue: '保存' })
                : t('actions.create', { defaultValue: '创建' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
