import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import SEO from '@/components/SEO';
import OrcadorInteligente from '@/components/OrcadorInteligente';
import { useTranslation } from 'react-i18next';
import { Sparkles, Users, Briefcase } from 'lucide-react';
import { WG_PRODUCT_MESSAGES } from '@/data/company';
import { useWGContext } from '@/providers/ContextProvider';

const SoliciteProposta = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { context: wgContext } = useWGContext() || { context: {} };
  const requestedService = searchParams.get('service') || '';
  const requestedContext = searchParams.get('context') || '';
  const requestedIntent = searchParams.get('intent') || '';
  const requestedPropertyType = searchParams.get('propertyType') || '';

  const contextCopy = {
    moodboard: 'Você chegou pela jornada de moodboard. Vamos traduzir essa direção estética em briefing, proposta e próximo passo real.',
    room: 'Você chegou pela visualização de ambientes. Agora podemos transformar a leitura visual em escopo, proposta ou atendimento assistido.',
    buildtech: 'Você chegou pela frente BuildTech. Vamos enquadrar essa experiência como solução aplicada ao seu contexto comercial ou operacional.',
    process: 'Você chegou pela metodologia de processo. Agora vamos conectar essa leitura a um atendimento assistido e à proposta mais coerente.',
    architecture: 'Você chegou pela frente de arquitetura. Podemos usar a camada de experiência visual para acelerar alinhamento estético, briefing e aprovação.',
    engineering: 'Você chegou pela frente de engenharia. Vamos conectar a decisão visual à lógica de execução, compras críticas e liberação de frentes.',
    carpentry: 'Você chegou pela frente de marcenaria. Podemos estruturar a experiência visual para reduzir retrabalho em medição, aprovação e produção.',
    turnkey: 'Você chegou pela jornada turn key. Agora vamos somar a camada de experiência visual ao fluxo de projeto, obra e entrega integrada.',
    'vila-nova': 'Você chegou por uma página de interiores premium. Podemos transformar essa leitura estética em briefing, curadoria e proposta assistida.',
  };

  const intentCopy = {
    obra: 'Você demonstrou interesse em obra e reforma. Vamos dimensionar o seu projeto com custo, prazo e proposta técnica detalhada.',
    marcenaria: 'Você demonstrou interesse em marcenaria sob medida. Podemos iniciar com um briefing visual e partir para medição e proposta.',
    design: 'Você demonstrou interesse em experiência visual e design. Vamos usar seu guia de estilo como ponto de partida para o projeto.',
    investimento: 'Você demonstrou interesse em análise de investimento. Podemos estruturar o EVF, AVM e custo de obra em uma única proposta.',
  };

  const introLabel = requestedContext
    ? contextCopy[requestedContext] || WG_PRODUCT_MESSAGES.wgExperienceAddon
    : requestedIntent && intentCopy[requestedIntent]
      ? intentCopy[requestedIntent]
      : wgContext?.interesse && !requestedContext && intentCopy[wgContext.interesse]
        ? intentCopy[wgContext.interesse]
        : '';

  return (
    <>
      <SEO
        pathname="/solicite-proposta"
        title="Solicite Proposta | Grupo WG Almeida"
        description="Obtenha um orçamento detalhado para seu projeto de arquitetura, engenharia ou marcenaria de luxo."
      />

      <section className="pt-32 pb-20 bg-wg-gray-light min-h-screen">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="text-wg-orange text-[11px] tracking-[0.22em] uppercase mb-4 block font-light">
              Passo a Passo
            </span>
            <h1 className="text-4xl md:text-5xl font-light text-wg-black mb-6 tracking-tight">
              Vamos construir seu orçamento.
            </h1>
            <p className="text-wg-gray text-lg font-light leading-relaxed">
              Responda a 4 perguntas rápidas e nossa inteligência artificial ajudará nossa equipe técnica a preparar a melhor proposta para o seu perfil.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-10"
          >
            {[
              {
                icon: Sparkles,
                title: 'Experiência visual',
                text: WG_PRODUCT_MESSAGES.wgExperienceSystem,
              },
              {
                icon: Users,
                title: 'Add-on por público',
                text: WG_PRODUCT_MESSAGES.wgExperienceAddon,
              },
              {
                icon: Briefcase,
                title: 'Conversão em ação',
                text: WG_PRODUCT_MESSAGES.wgExperienceConversion,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.8rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(30,24,20,0.05)]">
                <div className="w-11 h-11 rounded-2xl bg-wg-orange/10 text-wg-orange flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-light text-wg-black mb-2">{item.title}</h2>
                <p className="text-sm text-wg-gray font-light leading-relaxed">{item.text}</p>
              </div>
            ))}
          </motion.div>

          <OrcadorInteligente
            initialService={requestedService}
            initialPropertyType={requestedPropertyType}
            sourceContext={requestedContext}
            introLabel={introLabel}
          />
        </div>
      </section>
    </>
  );
};

export default SoliciteProposta;
