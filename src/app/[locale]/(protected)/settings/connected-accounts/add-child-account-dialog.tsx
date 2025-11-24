'use client';

import { createInviteLinkAction } from '@/actions/create-invite-link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizePhoneNumber } from '@/lib/phone';
import { CopyIcon, Loader2Icon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

export function AddChildAccountButton() {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPhoneNumber('');
      setInviteLink(null);
      setExpiresAt(null);
      setError(null);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone || normalizedPhone.length < 6) {
      setError('请输入有效的手机号');
      return;
    }

    startTransition(async () => {
      setError(null);
      setInviteLink(null);
      setExpiresAt(null);

      const result = await createInviteLinkAction();
      const payload = result?.data;

      if (!payload?.success || !payload.data) {
        setError(payload?.error ?? '生成链接失败，请稍后再试');
        return;
      }

      setInviteLink(payload.data.link);
      setExpiresAt(payload.data.expiresAt);
      toast.success('分享链接已生成');
    });
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast.success('链接已复制');
  };

  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleString()
    : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          添加子账号
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加子账号</DialogTitle>
          <DialogDescription>
            输入对方手机号后生成分享链接，发送给对方即可完成绑定。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="child-phone">子账号手机号</Label>
            <Input
              id="child-phone"
              type="tel"
              placeholder="请输入手机号"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              disabled={isPending}
              autoComplete="tel"
              required
            />
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                我们不会保存手机号，只用于确认邀请对象。
              </p>
            )}
          </div>

          {inviteLink ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Label>分享链接</Label>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCopy}
                  className="whitespace-nowrap"
                >
                  <CopyIcon className="mr-2 size-4" />
                  复制
                </Button>
              </div>
              {expiresLabel ? (
                <p className="text-xs text-muted-foreground">
                  链接将在 {expiresLabel} 过期
                </p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  正在生成...
                </>
              ) : (
                '生成分享链接'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
