import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcwIcon, SearchIcon } from 'lucide-react';
import { AddChildAccountButton } from './add-child-account-dialog';

// Mock data for demonstration
const connectedAccounts = [
  {
    id: '1',
    nickname: 'wuzexin2000',
    shops: ['Goodfinds.shop', 'Findexploer'],
    status: '正常',
    joinedAt: '2025/01/01',
    lastLogin: '2025-10-10 10:20:10',
  },
  {
    id: '2',
    nickname: 'zhangsan2024',
    shops: ['Myshop.store'],
    status: '正常',
    joinedAt: '2025/02/15',
    lastLogin: '2025-10-11 09:30:00',
  },
];

export default function ConnectedAccountsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-lg border shadow-sm">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-lg font-semibold">关联账号</h2>
        </div>
        <AddChildAccountButton />
      </div>

      {/* Search Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-md border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm font-medium whitespace-nowrap">
            手机号码:
          </span>
          <Input placeholder="请输入" className="h-9 w-full sm:w-[240px]" />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-9 px-4 gap-2">
            <SearchIcon className="size-3.5" />
            搜索
          </Button>
          <Button size="sm" variant="outline" className="h-9 px-4 gap-2">
            <RotateCcwIcon className="size-3.5" />
            重置
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium">账号昵称</TableHead>
              <TableHead className="font-medium">关联店铺</TableHead>
              <TableHead className="font-medium text-center">
                账号状态
              </TableHead>
              <TableHead className="font-medium text-center">
                加入时间
              </TableHead>
              <TableHead className="font-medium text-center">
                最近登录时间
              </TableHead>
              <TableHead className="font-medium text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connectedAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">
                  {account.nickname}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {account.shops.map((shop) => (
                      <span
                        key={shop}
                        className="text-sm text-muted-foreground"
                      >
                        {shop}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border">
                    {account.status}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground text-sm">
                  {account.joinedAt}
                </TableCell>
                <TableCell className="text-center text-muted-foreground text-sm">
                  {account.lastLogin}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="link"
                    className="text-primary h-auto p-0 text-sm hover:no-underline hover:opacity-80"
                  >
                    取消关联
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {connectedAccounts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
