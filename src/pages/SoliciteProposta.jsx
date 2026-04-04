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
            <span className="text-wg-orange font-bold text-sm tracking-widest uppercase mb-4 block">
              Passo a Passo
            </span>
            <h1 className="text-4xl md:text-5xl font-light mb-6 tracking-tight">
              Vamos construir seu <span className="font-bold">orçamento</span>.
            </h1>
            <p className="text-wg-gray text-lg">
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
