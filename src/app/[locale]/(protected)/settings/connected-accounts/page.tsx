import { AddChildAccountButton } from './add-child-account-dialog';

export default function ConnectedAccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">关联子账号</h2>
          <p className="text-sm text-muted-foreground">
            通过邀请链接将团队成员添加为子账号，协作管理店铺。
          </p>
        </div>
        <AddChildAccountButton />
      </div>

      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        暂无子账号。使用“添加子账号”按钮生成分享链接并邀请对方加入。
      </div>
    </div>
  );
}
