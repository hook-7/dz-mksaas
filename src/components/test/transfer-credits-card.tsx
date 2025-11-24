'use client';

import { transferCreditsAction } from '@/actions/transfer-credits';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCreditBalance } from '@/hooks/use-credits';
import { ArrowRightLeftIcon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function TransferCreditsCard() {
  const { data: balance = 0, isLoading: isLoadingBalance } = useCreditBalance();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState<string>('10');
  const [description, setDescription] = useState('');

  // 自动填充当前用户ID
  useEffect(() => {
    if (currentUser?.id) {
      setFromUserId(currentUser.id);
    }
  }, [currentUser]);

  // 重置表单（保留 fromUserId，因为它是自动填充的）
  const resetForm = () => {
    setToUserId('');
    setAmount('10');
    setDescription('');
  };

  const { execute, isExecuting, result } = useAction(transferCreditsAction, {
    onSuccess: ({ data }) => {
      // Use setTimeout to avoid flushSync issues during render
      setTimeout(() => {
        if (data?.success) {
          toast.success('积分转移成功！');
          resetForm();
          setOpen(false);
        } else {
          const errorMsg = data?.error || '积分转移失败';
          console.error('Transfer credits error:', data);
          toast.error(`积分转移失败: ${errorMsg}`);
        }
      }, 0);
    },
    onError: ({ error }) => {
      // Use setTimeout to avoid flushSync issues during render
      setTimeout(() => {
        const errorMsg =
          error?.serverError && typeof error.serverError === 'string'
            ? error.serverError
            : typeof error?.serverError === 'object' &&
                'error' in (error.serverError || {})
              ? (error.serverError as { error: string }).error
              : '积分转移失败';
        console.error('Transfer credits error:', error);
        toast.error(`积分转移失败: ${errorMsg}`);
      }, 0);
    },
  });

  const handleTransfer = async () => {
    if (!toUserId) {
      setTimeout(() => {
        toast.error('请填写转入用户ID');
      }, 0);
      return;
    }

    if (!fromUserId) {
      setTimeout(() => {
        toast.error('无法获取当前用户信息，请刷新页面重试');
      }, 0);
      return;
    }

    const amountNum = Number.parseInt(amount, 10);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setTimeout(() => {
        toast.error('请输入有效的积分数量');
      }, 0);
      return;
    }

    if (amountNum > balance) {
      setTimeout(() => {
        toast.error(`积分不足，当前余额: ${balance}`);
      }, 0);
      return;
    }

    execute({
      fromUserId,
      toUserId,
      amount: amountNum,
      description: description || undefined,
    });
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">积分转移测试</h3>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              // 关闭对话框时重置表单
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!currentUser?.id}>
              <ArrowRightLeftIcon className="w-4 h-4 mr-2" />
              转移积分
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>转移积分</DialogTitle>
              <DialogDescription>
                将您的积分转移给其他用户
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fromUserId">转出用户ID（当前用户）</Label>
                <Input
                  id="fromUserId"
                  placeholder="当前用户ID"
                  value={fromUserId}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  只能从自己的账户转出积分
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="toUserId">转入用户ID</Label>
                <Input
                  id="toUserId"
                  placeholder="输入转入用户的ID"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">积分数量</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="输入要转移的积分数量"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述（可选）</Label>
                <Textarea
                  id="description"
                  placeholder="输入转移说明（可选）"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isExecuting}
                >
                  取消
                </Button>
                <Button onClick={handleTransfer} disabled={isExecuting}>
                  {isExecuting ? '转移中...' : '确认转移'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <strong>当前用户余额:</strong> {isLoadingBalance ? '加载中...' : balance}
        </p>
        {currentUser && (
          <p className="text-xs text-muted-foreground">
            <strong>当前用户:</strong> {currentUser.name || currentUser.email} ({currentUser.id})
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          提示：只能从自己的账户转出积分给其他用户
        </p>
        {result?.serverError && (
          <p className="text-xs text-destructive">
            错误:{' '}
            {typeof result.serverError === 'string'
              ? result.serverError
              : typeof result.serverError === 'object' &&
                  'error' in (result.serverError || {})
                ? (result.serverError as { error: string }).error
                : '未知错误'}
          </p>
        )}
        {result?.data?.error && typeof result.data.error === 'string' && (
          <p className="text-xs text-destructive">错误: {result.data.error}</p>
        )}
      </div>
    </div>
  );
}
