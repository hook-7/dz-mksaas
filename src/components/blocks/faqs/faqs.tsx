'use client';

import { HeaderSection } from '@/components/layout/header-section';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { IconName } from 'lucide-react/dynamic';
import { useTranslations } from 'next-intl';

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FaqSection() {
  const t = useTranslations('HomePage.faqs');

  const faqItems: FAQItem[] = [
    {
      id: 'item-1',
      icon: 'calendar-clock',
      question: '使用达A怎样创建计划？',
      answer:
        '1.达人营销全流程自动化；2.找达人、建计划、达人消息回复、催发视频、AD code获取、合作效果监控及反馈…',
    },
    {
      id: 'item-2',
      icon: 'wallet',
      question: '怎样才能使用 AI 自动化创建计划？',
      answer:
        '1.达人营销全流程自动化；2.找达人、建计划、达人消息回复、催发视频、AD code获取、合作效果监控及反馈…',
    },
    {
      id: 'item-3',
      icon: 'refresh-cw',
      question: '怎样才能使用达A的AI回复whatsapp消息？（HOT）',
      answer:
        '1.达人营销全流程自动化；2.找达人、建计划、达人消息回复、催发视频、AD code获取、合作效果监控及反馈…',
    },
    {
      id: 'item-4',
      icon: 'hand-coins',
      question: '怎样使用某秘的抵扣现金计划？（HOT）',
      answer:
        '1.达人营销全流程自动化；2.找达人、建计划、达人消息回复、催发视频、AD code获取、合作效果监控及反馈…',
    },
  ];

  return (
    <section id="faqs" className="px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <HeaderSection
          title={t('title')}
          titleAs="h2"
          subtitle={t('subtitle')}
          subtitleAs="p"
        />

        <div className="mx-auto max-w-4xl mt-12">
          <Accordion
            type="single"
            collapsible
            className="ring-muted w-full rounded-2xl border px-8 py-3 shadow-sm ring-4 dark:ring-0"
          >
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-dashed"
              >
                <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-base text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
