import fs from 'node:fs';
import path from 'node:path';
import { Check } from 'lucide-react';
import Image from 'next/image';

const heroBgFile =
  'images/hero/4740e545c73640489e84284c22f18bfa_mergeImage.png';
const featureCardBgFile =
  'images/hero/SketchPng5b281d467652fb7854f564f3ee2d86a5253060ef7832cc8e57244a3345fb481b.png';
const bulletIconFile =
  'images/hero/SketchPngc87bb0220e7b4932f617b4e6f8b4d5fae235e2fbf9c81958cfe23e6fa8dab5ee.png';
const dividerFile =
  'images/hero/SketchPng6496c9d68ff48e1ec22eae35a7ecbaedf54b77dc47c95343e496e49d663cd28b.png';

const featurePoints = [
  '全自动：覆盖达人合作100%业务流程',
  '真AI：AI 24小时回复，准确率90%',
  '简单易用：浏览器插件模式，多店铺、多账号、多设备运行',
];

const featureCards = [
  {
    title: '全自动化营销解决方案',
    descriptionParts: [
      { text: '达人筛选、计划创建、智能回复、效果追踪', color: '#666' },
      { text: '一站式完成', color: '#474DFF' },
    ],
  },
  {
    title: '真AI agent',
    descriptionParts: [
      { text: 'AI驱动达人筛选、脚本生成、样品审核', color: '#666' },
      { text: '全链路赋能', color: '#474DFF' },
    ],
  },
  {
    title: '首月免费开放体验',
    descriptionParts: [
      { text: '全功能服务，不限店铺/设备/账号零门槛启用', color: '#333' },
      { text: '价值499元', color: '#333' },
    ],
  },
];

export default function Hero() {
  const heroBgExists = fs.existsSync(
    path.join(process.cwd(), 'public', heroBgFile)
  );
  const featureBgExists = fs.existsSync(
    path.join(process.cwd(), 'public', featureCardBgFile)
  );
  const bulletIconExists = fs.existsSync(
    path.join(process.cwd(), 'public', bulletIconFile)
  );
  const dividerExists = fs.existsSync(
    path.join(process.cwd(), 'public', dividerFile)
  );

  const featureCardStyle = featureBgExists
    ? {
        backgroundImage: `url(/${featureCardBgFile})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { backgroundColor: '#f5f6fb' };

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{
        minHeight: 760,
        background: 'linear-gradient(135deg, #e6f0ff 0%, #ffffff 60%)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(160% 120% at 50% 20%, rgba(71,77,255,0.12) 0%, rgba(71,77,255,0) 50%), radial-gradient(120% 120% at 10% 80%, rgba(0,163,255,0.12) 0%, rgba(0,163,255,0) 45%), radial-gradient(140% 140% at 90% 70%, rgba(52,131,255,0.1) 0%, rgba(52,131,255,0) 40%)',
          maskImage:
            'radial-gradient(circle at 50% 60%, rgba(255,255,255,0.8), transparent 65%)',
        }}
      />

      <div
        className="relative mx-auto max-w-[1240px] px-6 lg:px-8"
        style={{ paddingTop: 120, paddingBottom: 60 }}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6 text-left text-[#333]">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-[54px] font-semibold leading-none md:text-[60px]">
                达人营销
              </span>
              <span className="text-[54px] font-semibold leading-none text-[#474DFF] md:text-[60px]">
                Agent
              </span>
            </div>

            <p className="text-[28px] leading-[1.35] md:text-[32px]">
              真AI，全业务流，免费用
            </p>

            <div className="space-y-3 text-[16px] leading-[32px]">
              {featurePoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  {bulletIconExists ? (
                    <Image
                      src={`/${bulletIconFile}`}
                      alt=""
                      width={14}
                      height={14}
                      className="flex-shrink-0"
                    />
                  ) : (
                    <span className="inline-flex h-[16px] w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                      <Check className="h-[10px] w-[10px] text-white stroke-[3]" />
                    </span>
                  )}
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[380px] items-center justify-center">
            {heroBgExists ? (
              <div className="relative h-full w-full max-h-[520px]">
                <Image
                  src={`/${heroBgFile}`}
                  alt="达人营销机器人"
                  fill
                  sizes="(min-width: 1024px) 560px, 100vw"
                  priority
                  className="object-contain drop-shadow-xl"
                />
              </div>
            ) : (
              <div className="relative h-full w-full max-w-[520px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#cfe0ff]/80 via-white/70 to-white/90 blur-3xl" />
                <div className="absolute left-10 top-6 h-16 w-16 rounded-2xl bg-[#5a6bff]/30 backdrop-blur" />
                <div className="absolute right-6 top-16 h-14 w-14 rounded-full bg-[#7bd7ff]/40 backdrop-blur" />
                <div className="absolute left-16 bottom-10 h-20 w-20 rounded-full bg-[#5be6b4]/30 backdrop-blur" />
                <div className="absolute right-14 bottom-8 h-16 w-24 rounded-full bg-[#7c8dff]/35 blur-md" />

                <div className="absolute left-12 top-12 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0f1f4b] shadow-lg">
                  搜索
                </div>
                <div className="absolute right-10 top-24 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0f1f4b] shadow-lg">
                  AI
                </div>
                <div className="absolute left-20 bottom-20 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0f1f4b] shadow-lg">
                  计划
                </div>
                <div className="absolute right-16 bottom-16 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-[#0f1f4b] shadow-lg">
                  达人
                </div>

                <div className="relative mx-auto mt-10 flex h-[260px] w-[260px] items-center justify-center rounded-full bg-gradient-to-br from-white to-[#dfe8ff] shadow-2xl">
                  <div className="h-[180px] w-[180px] rounded-full bg-gradient-to-tr from-[#6f8bff] via-white to-[#7be6ff] opacity-90" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-[72px] mb-[1px] flex flex-col gap-6 rounded-2xl bg-white/70 p-2 shadow-[0_20px_60px_rgba(30,64,175,0.08)] backdrop-blur lg:flex-row">
          {featureCards.map((card, index) => (
            <div
              key={card.title}
              className="flex w-full items-stretch lg:flex-1"
            >
              <div
                className="flex flex-1 flex-col justify-center gap-3 px-6 py-6 text-left text-[#333]"
                style={featureCardStyle}
              >
                <h3 className="text-[20px] font-semibold leading-tight">
                  {card.title}
                </h3>
                <p className="text-[15px] leading-[30px]">
                  {card.descriptionParts.map((part, partIndex) => (
                    <span key={partIndex} style={{ color: part.color }}>
                      {part.text}
                      {partIndex === 0 && ' '}
                    </span>
                  ))}
                </p>
              </div>
              {index < featureCards.length - 1 ? (
                <div className="hidden lg:flex w-px items-stretch" aria-hidden>
                  {dividerExists ? (
                    <Image
                      src={`/${dividerFile}`}
                      alt=""
                      width={1}
                      height={140}
                      className="h-full"
                    />
                  ) : (
                    <div className="h-full w-px bg-[#d8dae2]" />
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
