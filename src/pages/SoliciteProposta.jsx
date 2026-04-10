import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import SEO from '@/components/SEO';
import OrcadorInteligente from '@/components/OrcadorInteligente';
import { useTranslation } from 'react-i18next';

const SoliciteProposta = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

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

          <OrcadorInteligente />
        </div>
      </section>
    </>
  );
};

export default SoliciteProposta;
