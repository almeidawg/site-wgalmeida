import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Lightbulb, PenTool, Hammer, CheckCircle, Users, FileText, Monitor, Camera, MessagesSquare, FolderOpen, Calendar, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';

const Process = () => {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Lightbulb,
      title: t('processPage.steps.0.title'),
      description: t('processPage.steps.0.description'),
    },
    {
      icon: PenTool,
      title: t('processPage.steps.1.title'),
      description: t('processPage.steps.1.description'),
    },
    {
      icon: FileText,
      title: t('processPage.steps.2.title'),
      description: t('processPage.steps.2.description'),
    },
    {
      icon: Users,
      title: t('processPage.steps.3.title'),
      description: t('processPage.steps.3.description'),
    },
    {
      icon: Hammer,
      title: t('processPage.steps.4.title'),
      description: t('processPage.steps.4.description'),
    },
    {
      icon: CheckCircle,
      title: t('processPage.steps.5.title'),
      description: t('processPage.steps.5.description'),
    },
  ];

  return (
    <>
      <SEO pathname="/processo" schema={SCHEMAS.breadcrumbProcess} />

      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            alt={t('processPage.hero.imageAlt')}
           src="https://images.unsplash.com/photo-1581093196867-ca3dba3c721b" />
          <div className="absolute inset-0 bg-wg-black/60"></div>
        </div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-oswald font-bold mb-4"
          >
            {t('processPage.hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl font-poppins max-w-3xl mx-auto"
          >
            {t('processPage.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-oswald font-bold text-wg-black mb-4">
              {t('processPage.stepsTitle')}
            </h2>
            <p className="text-lg text-wg-gray max-w-2xl mx-auto font-roboto">
              {t('processPage.stepsSubtitle')}
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-wg-orange hidden lg:block"></div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex items-center mb-12 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                <div className={`w-full lg:w-5/12 ${index % 2 === 0 ? 'lg:pr-12' : 'lg:pl-12'}`}>
                  <div className="bg-wg-gray-light p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <step.icon className="w-12 h-12 text-wg-orange mb-4" />
                    <h3 className="text-2xl font-oswald font-bold text-wg-black mb-3">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-wg-gray font-roboto leading-relaxed">{step.description}</p>
                  </div>
                </div>

                <div className="hidden lg:flex w-2/12 justify-center">
                  <div className="w-8 h-8 bg-wg-orange rounded-full border-4 border-white shadow-lg"></div>
                </div>

                <div className="hidden lg:block w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ONBOARDING ARQUITETÔNICO ========== */}
      <section className="section-padding bg-wg-black text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
              {t('processPage.onboarding.kicker')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light mb-6 tracking-tight">
              {t('processPage.onboarding.title')}
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
              {t('processPage.onboarding.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Sparkles, title: t('processPage.onboarding.items.0.title'), desc: t('processPage.onboarding.items.0.desc') },
              { icon: Camera, title: t('processPage.onboarding.items.1.title'), desc: t('processPage.onboarding.items.1.desc') },
              { icon: FolderOpen, title: t('processPage.onboarding.items.2.title'), desc: t('processPage.onboarding.items.2.desc') },
              { icon: Calendar, title: t('processPage.onboarding.items.3.title'), desc: t('processPage.onboarding.items.3.desc') },
              { icon: Monitor, title: t('processPage.onboarding.items.4.title'), desc: t('processPage.onboarding.items.4.desc') },
              { icon: MessagesSquare, title: t('processPage.onboarding.items.5.title'), desc: t('processPage.onboarding.items.5.desc') },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-wg-orange/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-wg-orange/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-wg-orange/30 transition-colors">
                  <item.icon className="w-6 h-6 text-wg-orange" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== ENGENHARIA INTEGRADA ========== */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-wg-blue font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
                {t('processPage.engineering.kicker')}
              </span>
              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('processPage.engineering.title')}
              </h2>
              <p className="text-lg text-wg-gray leading-relaxed mb-6 font-light">
                {t('processPage.engineering.subtitle')}
              </p>
              <ul className="space-y-4">
                {[
                  t('processPage.engineering.items.0'),
                  t('processPage.engineering.items.1'),
                  t('processPage.engineering.items.2'),
                  t('processPage.engineering.items.3'),
                  t('processPage.engineering.items.4'),
                  t('processPage.engineering.items.5'),
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-wg-blue mt-0.5 flex-shrink-0" />
                    <span className="text-wg-gray">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-wg-gray-light rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">98%</div>
                    <p className="text-sm text-wg-gray">{t('processPage.engineering.stats.0')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">100%</div>
                    <p className="text-sm text-wg-gray">{t('processPage.engineering.stats.1')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">14+</div>
                    <p className="text-sm text-wg-gray">{t('processPage.engineering.stats.2')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-xl font-inter font-medium text-yellow-500">Sprints</span>
                    </div>
                    <p className="text-sm text-wg-gray">{t('processPage.engineering.stats.3')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
              {t('processPage.integration.title')}
            </h2>
            <p className="text-xl text-wg-gray font-light leading-relaxed mb-8">
              {t('processPage.integration.paragraph')}
            </p>
            <blockquote className="text-2xl font-inter font-light italic text-wg-black border-l-4 border-wg-orange pl-6 text-left">
              {t('processPage.integration.quote')}
            </blockquote>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Process;
