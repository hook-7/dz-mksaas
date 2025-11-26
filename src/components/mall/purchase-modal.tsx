'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  price: string;
  description?: string;
}

export function PurchaseModal({
  open,
  onOpenChange,
  title,
  price,
  description,
}: PurchaseModalProps) {
  const t = useTranslations('Dashboard.mallCenter.purchase');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { item: title })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">{t('item')}</span>
              <span className="font-medium">{title}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">{t('price')}</span>
              <span className="text-xl font-bold text-primary">{price}</span>
            </div>
            {description && (
              <div className="text-sm text-muted-foreground pt-2">
                {description}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 p-6 bg-muted/30 rounded-lg border border-dashed">
            <div className="w-40 h-40 bg-white flex items-center justify-center rounded-md shadow-sm">
              {/* Placeholder for QR Code */}
              <span className="text-xs text-muted-foreground">QR Code</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {t('scanToPay')}
            </span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t('confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
