import { HeaderSection } from '@/components/layout/header-section';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Plan = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  daily: string;
  tag?: string;
  highlight?: string;
};

type FeatureRow = {
  label: string;
  values: string[];
};

const plans: Plan[] = [
  {
    id: 'trial',
    name: '首月免费版',
    price: '免费',
    daily: '0元/天【首月】',
  },
  {
    id: 'personal',
    name: '个人版',
    price: '999元/年',
    originalPrice: '1999元',
    daily: '2.7元/天【83/月】',
  },
  {
    id: 'pro-seller',
    name: '大卖版',
    price: '5999元/年',
    originalPrice: '9999元',
    daily: '16元/天【499/月】',
  },
  {
    id: 'business',
    name: '商家版',
    price: '2999元/年',
    originalPrice: '3999元',
    daily: '6.5元/天【199/月】',
    tag: '推荐',
    highlight: '100个样品/月',
  },
  {
    id: 'supreme',
    name: '至尊版',
    price: '6980元/年',
    daily: '19元/天【581/月】',
    highlight: '所有会员剩余时间可折现购买',
  },
];

const rawFeatures: FeatureRow[] = [
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

const reorderValuesForPlanOrder = (values: string[]) => [
  values[0],
  values[1],
  values[3],
  values[2],
  values[4],
];

const features: FeatureRow[] = rawFeatures.map((feature) => ({
  ...feature,
  values: reorderValuesForPlanOrder(feature.values),
}));

const supportTokens = ['支持', '无限制'];
const negativeTokens = ['不支持', '暂无', '无'];

function renderCell(value: string, isHighlighted: boolean) {
  if (supportTokens.includes(value)) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
          isHighlighted && 'ring-2 ring-offset-2 ring-offset-background'
        )}
      >
        <CheckIcon className="h-3.5 w-3.5" />
        {value}
      </span>
    );
  }

  if (negativeTokens.includes(value)) {
    return (
      <span className="inline-flex items-center justify-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-gray-200">
        <XIcon className="h-3.5 w-3.5" />
        {value}
      </span>
    );
  }

  return <span className="text-sm text-foreground/90">{value}</span>;
}

function PricingComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-muted-foreground">
                方案 / 权益
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={cn(
                    'px-4 py-4 text-center align-bottom',
                    plan.tag && 'bg-primary/5'
                  )}
                >
                  <div className="flex flex-col items-center gap-1 text-base font-semibold">
                    <div className="flex items-center gap-2">
                      <span>{plan.name}</span>
                      {plan.tag ? (
                        <Badge className="rounded-full px-2 py-1 text-[11px]">
                          {plan.tag}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xl font-bold leading-tight">
                      {plan.price}
                    </div>
                    {plan.originalPrice ? (
                      <div className="text-xs text-muted-foreground line-through">
                        {plan.originalPrice}
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {plan.daily}
                    </div>
                    {plan.highlight ? (
                      <div className="text-[11px] text-primary">
                        {plan.highlight}
                      </div>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, rowIndex) => (
              <tr
                key={feature.label}
                className={cn(
                  'border-b last:border-b-0',
                  rowIndex % 2 === 0 && 'bg-muted/10'
                )}
              >
                <td className="px-4 py-3 text-sm font-medium text-foreground/90">
                  {feature.label}
                </td>
                {feature.values.map((value, colIndex) => (
                  <td
                    key={`${feature.label}-${plans[colIndex].id}`}
                    className="px-4 py-3 text-center"
                  >
                    {renderCell(value, plans[colIndex].tag === '推荐')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PricingSection() {
  const t = useTranslations('HomePage.pricing');

  return (
    <section id="pricing" className="px-4 py-16">
      <div className="mx-auto max-w-6xl px-6 space-y-16">
        <HeaderSection
          subtitle={t('subtitle')}
          subtitleAs="h2"
          subtitleClassName="text-4xl font-bold"
          description={t('description')}
          descriptionAs="p"
        />

        <PricingComparisonTable />
      </div>
    </section>
  );
}
