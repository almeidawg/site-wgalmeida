import React, { useEffect, useState } from 'react';
import { Command, Link } from 'lucide-react';
import { fetchSeoHighlights } from '@/lib/aiSeoInsights';
import { useTranslation } from 'react-i18next';

const iconMap = {
  intent: Command,
  performance: Command,
  authority: Link,
};

const SeoAiInsights = () => {
  const { t } = useTranslation();
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    let active = true;

    fetchSeoHighlights().then((data) => {
      if (active) setInsights(data);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!insights.length) {
    return null;
  }

  return (
    <section className="section-padding bg-wg-apple-surface text-wg-apple-accent">
      <div className="container-custom space-y-10">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-wg-apple-muted">{t('seoAiInsights.kicker')}</p>
          <h2 className="text-3xl font-oswald tracking-tight">{t('seoAiInsights.title')}</h2>
          <p className="text-lg text-wg-apple-muted">
            {t('seoAiInsights.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {insights.map((insight) => {
            const Icon = iconMap[insight.id] ?? Command;
            return (
              <article
                key={insight.id}
                className="rounded-[32px] border border-wg-apple-highlight bg-white/90 p-6 shadow-apple-card"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-wg-apple-muted">
                    {insight.title}
                  </h3>
                  <Icon className="h-5 w-5 text-wg-apple-accent" />
                </div>
                <p className="mt-6 text-3xl font-light text-wg-apple-accent">{insight.value}</p>
                <p className="mt-3 text-sm text-wg-apple-muted leading-relaxed">{insight.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.3em] text-wg-orange">{insight.trend}</p>
              </article>
            );
          })}
        </div>

        <p className="text-sm text-wg-gray font-roboto">
          {t('seoAiInsights.footer')}
        </p>
      </div>
    </section>
  );
};

export default SeoAiInsights;
