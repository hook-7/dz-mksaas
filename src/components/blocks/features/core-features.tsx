import { HeaderSection } from '@/components/layout/header-section';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  FilePenLine,
  FlaskConical,
  LineChart,
  Megaphone,
  MessageSquare,
  PlaySquare,
  Send,
  UserCheck,
} from 'lucide-react';

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  inDevelopment?: boolean;
};

const features: FeatureItem[] = [
  {
    title: '评内容',
    description:
      '对达人的拍摄内容进行折解，结合视频播放、转化数据输出分析结果；基于分析结果输出改进计划，自动发送给达人。',
    icon: LineChart,
    inDevelopment: true,
  },
  {
    title: '审样品',
    description:
      'ai智能分析达人数据，生成样品匹配结论。深度分析报告，辅助BD决策。',
    icon: FlaskConical,
    inDevelopment: true,
  },
  {
    title: '写脚本',
    description:
      'ai为你的每个商品撰写爆款视频脚本，并自动发送给领样达人，引导达人创造优质的内容！',
    icon: FilePenLine,
  },
  {
    title: '选达人',
    description:
      '用户自行设置达人筛选条件；ai根据店铺、商品等级匹配投入产出比最高达人。',
    icon: UserCheck,
  },
  {
    title: '出分析',
    description:
      '对达人的拍摄内容进行折解，结合视频播放、转化数据输出分析结果；基于分析结果输出改进计划，自动发送给达人。',
    icon: LineChart,
    inDevelopment: true,
  },
  {
    title: '建计划',
    description:
      'ai 7*24小时建计划，无须人工介入，高效、省心！注:邀请达人数量取决于您的店铺限额。',
    icon: ClipboardCheck,
  },
  {
    title: '考BD',
    description:
      'BD考核工具，多维度，全面覆盖过程及结果数据。从达人数量、样品发送数量、样品成本到合作达人产出、利润等。',
    icon: Send,
    inDevelopment: true,
  },
  {
    title: '发信息',
    description:
      '不同合作阶段发送不同话术；免费为您构建专属问答知识库，定制合作内容；AI秒级响应，回复精准，沟通省心更高效。',
    icon: MessageSquare,
  },
  {
    title: '投广告',
    description:
      'ai筛选出优质潜力内容进行加热；ai筛选劣质内容进行及时移除，降低空耗成本。',
    icon: Megaphone,
    inDevelopment: true,
  },
];

export default function CoreFeaturesSection() {
  return (
    <section id="core-features" className="px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-10 lg:space-y-16">
        <HeaderSection
          title="核心功能"
          subtitle="达人营销 Agent"
          subtitleAs="h2"
          description="真AI，全业务流，免费用。从筛选达人到内容优化、计划搭建与沟通协同，一站式完成。"
          descriptionAs="p"
        />

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c0f4f] via-[#142966] to-[#090f2c] px-6 py-14 shadow-lg">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute right-0 top-0 h-32 w-48 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-[-60px] left-1/4 h-32 w-64 rotate-12 rounded-full bg-primary/25 blur-3xl" />
          </div>

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 text-center text-white">
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              <span className="leading-none">产品视频介绍</span>
            </div>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
              <div className="flex size-16 items-center justify-center rounded-full bg-white/15 shadow-inner ring-2 ring-white/20">
                <PlaySquare className="size-7" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  一分钟了解核心能力闭环
                </h3>
                <p className="text-sm text-white/70 sm:text-base">
                  直观演示AI如何串联达人筛选、脚本生成、投放与复盘，全流程降本增效。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
                  <feature.icon className="size-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    {feature.inDevelopment ? (
                      <Badge
                        variant="secondary"
                        className="bg-muted text-foreground"
                      >
                        开发中
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 translate-y-4 bg-gradient-to-t from-primary/5 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
