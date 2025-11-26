'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

type PlanId = 'supreme' | 'trial' | 'personal' | 'business' | 'pro-seller';

type Plan = {
  id: PlanId;
  name: string;
  price: string;
  originalPrice?: string;
  daily: string;
  tag?: string;
  highlightNote?: string;
};

type FeatureRow = {
  label: string;
  values: string[]; // raw values follow basePlanOrder
};

// 原始数据按照设计稿（首月免费版、个人版、商家版、大卖版、至尊版）顺序
const basePlanOrder: PlanId[] = [
  'trial',
  'personal',
  'business',
  'pro-seller',
  'supreme',
];

// 页面展示顺序：至尊版 -> 首月免费版 -> 个人版 -> 商家版(推荐) -> 大卖版
const displayPlanOrder: PlanId[] = [
  'supreme',
  'trial',
  'personal',
  'business',
  'pro-seller',
];

const plans: Record<PlanId, Plan> = {
  supreme: {
    id: 'supreme',
    name: '至尊版',
    price: '6980元/年',
    daily: '19元/天【581/月】',
    highlightNote: '所有会员剩余时间可折现购买',
  },
  trial: {
    id: 'trial',
    name: '首月免费版',
    price: '免费',
    daily: '0元/天【首月】',
  },
  personal: {
    id: 'personal',
    name: '个人版',
    price: '999元/年',
    originalPrice: '1999元',
    daily: '2.7元/天【83/月】',
  },
  business: {
    id: 'business',
    name: '商家版',
    price: '2999元/年',
    originalPrice: '3999元',
    daily: '6.5元/天【199/月】',
    tag: '推荐',
    highlightNote: '100个样品/月',
  },
  'pro-seller': {
    id: 'pro-seller',
    name: '大卖版',
    price: '5999元/年',
    originalPrice: '9999元',
    daily: '16元/天【499/月】',
  },
};

const features: FeatureRow[] = [
  {
    label: '样品发送数量',
    values: [
      '30个样品/月',
      '30个样品/月',
      '100个样品/月',
      '600个样品/月',
      '不限',
    ],
  },
  { label: '子账号', values: ['4个', '无限制', '无限制', '无限制', '无限制'] },
  { label: '购买子账号', values: ['1200元/个', '0元', '0元', '0元', '0元'] },
  {
    label: '支持店铺数据',
    values: ['24', '无限制', '无限制', '无限制', '无限制'],
  },
  { label: '增加店铺', values: ['1500元/个', '0元', '0元', '0元', '0元'] },
  {
    label: '视频脚本生成',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI 创建计划',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI 筛选达人',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI消息回复',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI 独家知识库',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI达人发布视频分析',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI达人合作分析报告生成及发送',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: '24小时*7 建计划',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'Whatsapp消息发送',
    values: ['无', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: '支持店铺数量',
    values: ['1店铺/帐号', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI生成话术',
    values: ['100次/天', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: 'AI辅助回复',
    values: ['100次/天', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: '站点支持',
    values: ['全站点', '全站点', '全站点', '全站点', '全站点'],
  },
  {
    label: '邀约达人类',
    values: ['无限制', '无限制', '无限制', '无限制', '无限制'],
  },
  {
    label: '私信达人数',
    values: ['无限制', '无限制', '无限制', '无限制', '无限制'],
  },
  { label: '清理无效计划', values: ['不支持', '支持', '支持', '支持', '支持'] },
  {
    label: '旧计划补充达人',
    values: ['不支持', '支持', '支持', '支持', '支持'],
  },
  { label: '定时执行', values: ['不支持', '支持', '支持', '支持', '支持'] },
  { label: '极速私信', values: ['不支持', '支持', '支持', '支持', '支持'] },
  {
    label: '样品券',
    values: ['无', '无', '最低1元券', '最低0.7元券', '最低0.3元券'],
  },
  {
    label: '自有邮件发送数',
    values: ['暂无', '暂无', '暂无', '暂无', '10万/月'],
  },
  { label: '邮件代发数', values: ['暂无', '暂无', '暂无', '暂无', '5000封'] },
  { label: '达人黑名单', values: ['暂无', '暂无', '支持', '支持', '支持'] },
  { label: '设置达人标签', values: ['暂无', '暂无', '支持', '支持', '支持'] },
  {
    label: '样品达人审核&管理',
    values: ['暂无', '暂无', '支持', '支持', '支持'],
  },
  {
    label: '达人建联记录导出',
    values: ['暂无', '暂无', '支持', '支持', '支持'],
  },
  { label: 'TAP建◆◆模式', values: ['暂无', '暂无', '支持', '支持', '支持'] },
  { label: '私信订单买家', values: ['暂无', '暂无', '支持', '支持', '支持'] },
  {
    label: '新功能优先体验',
    values: ['不支持', '支持', '支持', '支持', '支持'],
  },
];

const highlightedPlanId: PlanId = 'business';
const positiveTokens = ['支持', '无限制'];
const negativeTokens = ['不支持', '暂无', '无'];

function mapValueToPlan(feature: FeatureRow, planId: PlanId): string {
  const index = basePlanOrder.indexOf(planId);
  return index === -1 ? '—' : (feature.values[index] ?? '—');
}

function renderCell(value: string, isHighlighted: boolean) {
  const isPositive = positiveTokens.some((token) => value.includes(token));
  const isNegative = negativeTokens.some((token) => value === token);

  if (isPositive) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center gap-2 text-sm font-medium text-emerald-700',
          isHighlighted && 'font-semibold'
        )}
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500" />
        {value}
      </span>
    );
  }

  if (isNegative) {
    return <span className="text-sm text-muted-foreground">{value}</span>;
  }

  return <span className="text-sm text-foreground">{value}</span>;
}

interface PricingTableProps {
  className?: string;
  onPurchase?: (plan: { name: string; price: string }) => void;
}

export function PricingTable({ className, onPurchase }: PricingTableProps) {
  const t = useTranslations('Dashboard.mallCenter.coupons'); // Using shared translation or generic

  return (
    <div
      className={cn(
        'rounded-2xl bg-card shadow-sm ring-1 ring-border',
        className
      )}
    >
      <div className="overflow-x-auto overflow-visible pt-8">
        <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-sm text-foreground">
          <thead>
            <tr>
              <th className="w-44 bg-card px-6 py-5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                方案 / 权益
              </th>
              {displayPlanOrder.map((planId) => {
                const plan = plans[planId];
                const isHighlighted = planId === highlightedPlanId;

                return (
                  <th
                    key={plan.id}
                    className={cn(
                      'relative px-6 py-5 text-center align-top border-t border-b border-border h-full',
                      isHighlighted
                        ? 'bg-card text-foreground border-l-2 border-r-2 border-t-2 border-primary shadow-lg z-10 rounded-t-xl transform -translate-y-1 dark:bg-muted/10'
                        : 'bg-card text-foreground border-r border-border'
                    )}
                  >
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div>
                        {isHighlighted ? (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
                            推荐
                          </span>
                        ) : null}

                        <div className="space-y-1">
                          <div className="text-base font-semibold">
                            {plan.name}
                          </div>
                          <div className="text-2xl font-bold leading-tight text-primary">
                            {plan.price}
                          </div>
                          {plan.originalPrice ? (
                            <div className="text-xs line-through text-muted-foreground">
                              {plan.originalPrice}
                            </div>
                          ) : (
                            <div className="h-4"></div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {plan.daily}
                          </div>
                          {plan.highlightNote ? (
                            <div className="text-[11px] text-orange-500 font-medium">
                              {plan.highlightNote}
                            </div>
                          ) : (
                            <div className="h-4"></div>
                          )}
                        </div>
                      </div>

                      {onPurchase && (
                        <Button
                          className="w-full mt-auto"
                          variant={isHighlighted ? 'default' : 'outline'}
                          onClick={() => onPurchase(plan)}
                        >
                          {t('buyNow')}
                        </Button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {features.map((feature, rowIndex) => (
              <tr
                key={feature.label}
                className="bg-card hover:bg-muted/50 transition-colors"
              >
                <td className="whitespace-nowrap border-b border-border px-6 py-3 text-left text-sm font-semibold text-foreground border-l border-border">
                  {feature.label}
                </td>

                {displayPlanOrder.map((planId) => {
                  const value = mapValueToPlan(feature, planId);

                  const isHighlighted = planId === highlightedPlanId;

                  return (
                    <td
                      key={`${feature.label}-${planId}`}
                      className={cn(
                        'border-b border-border px-6 py-3 text-center align-middle',

                        isHighlighted
                          ? 'bg-card border-l-2 border-r-2 border-primary dark:bg-muted/10'
                          : 'border-r border-border',

                        rowIndex === features.length - 1 &&
                          isHighlighted &&
                          'border-b-2 rounded-b-xl'
                      )}
                    >
                      {renderCell(value, isHighlighted)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
