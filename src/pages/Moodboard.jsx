import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, Briefcase, Brain, Layers3, Users } from 'lucide-react';
import { MoodboardProvider, useMoodboard } from '@/contexts/MoodboardContext';
import {
  ColorPicker,
  StyleGrid,
  MoodboardCanvas,
  ColorTransformer,
} from '@/components/moodboard';
import SEO from '@/components/SEO';

const MoodboardContent = () => {
  const {
    colors,
    styles,
    customImages,
    updateColors,
    updateStyles,
    addCustomImages,
    removeCustomImage,
    hasContent,
  } = useMoodboard();

  return (
    <div className="min-h-screen bg-gray-50 -mt-[var(--header-height)]">
      <SEO
        pathname="/moodboard"
        title="Moodboard | Crie sua Visão de Design de Interiores | WG Almeida"
        description="Crie seu moodboard de design de interiores. Selecione cores, estilos e referências para visualizar sua visão de decoração."
        keywords="moodboard decoracao, design de interiores, paleta de cores, estilos decoracao, criar moodboard"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-[calc(var(--header-height)+2rem)] md:pt-[calc(var(--header-height)+2.75rem)] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 mb-6 text-sm">
              Sistema de experiência estética
            </div>
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Transforme referências em um <span className="text-wg-orange">moodboard acionável</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Esta não é só uma ferramenta de inspiração. É a camada inicial de uma jornada que
              interpreta estilo, organiza decisões visuais e prepara o caminho para visualização,
              alinhamento e execução real.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: Brain,
                title: 'Perfil estético',
                text: 'Organiza preferências de estilo, cor e atmosfera em uma leitura coerente.',
              },
              {
                icon: Layers3,
                title: 'Base para composição',
                text: 'Estrutura a direção visual que depois alimenta ambientes, materiais e variações.',
              },
              {
                icon: Users,
                title: 'Compartilhamento claro',
                text: 'Gera uma base mais objetiva para alinhar decisões com família, equipe e parceiros.',
              },
              {
                icon: Briefcase,
                title: 'Pronto para projeto',
                text: 'Funciona como etapa de pré-briefing para arquitetura, interiores, obra ou compra.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="w-11 h-11 rounded-xl bg-wg-orange/10 text-wg-orange flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg text-gray-900 mb-2">{item.title}</h2>
                <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Style Grid Section - Full Width */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StyleGrid
              selectedStyles={styles}
              onStylesChange={updateStyles}
              maxStyles={3}
            />
          </motion.div>
        </div>
      </section>

      {/* Color Picker & Canvas Section - Same Height */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Color Picker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex"
            >
              <ColorPicker
                selectedColors={colors}
                onColorsChange={updateColors}
                maxColors={5}
                customImages={customImages}
                onImagesAdd={addCustomImages}
                onRemoveImage={removeCustomImage}
                maxImages={6}
              />
            </motion.div>

            {/* Canvas Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex"
            >
              <MoodboardCanvas
                colors={colors}
                styles={styles}
                customImages={customImages}
                onRemoveImage={removeCustomImage}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Color Transformer Section */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ColorTransformer externalColors={colors} />
          </motion.div>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <p className="text-sm uppercase tracking-[0.22em] text-wg-orange mb-3">
              Jornada aprovada para o site
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
              Da inspiração subjetiva para uma decisão visual mais segura
            </h2>
            <p className="text-lg text-gray-600">
              A experiência deve reduzir indecisão, sugerir próximos passos e manter a leitura
              elegante da marca: menos ruído, mais clareza e mais sensação de progresso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              '1. Escolha estilos, tons e referências com pouco esforço cognitivo.',
              '2. O sistema organiza o moodboard como direção visual, não só como colagem.',
              '3. A próxima camada aplica isso em ambientes, materiais e cenários reais.',
              '4. O resultado serve como ponte para briefing, projeto, compra ou obra.',
            ].map((step) => (
              <div key={step} className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-gray-700">
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {hasContent && (
        <section className="py-16 bg-wg-black text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light text-white mb-4">
                Quer transformar esse moodboard em uma decisão mais concreta?
              </h2>
              <p className="text-white/78 mb-8 text-lg">
                Avance para a camada de visualização e veja como a direção estética pode ganhar
                forma no ambiente antes de seguir para projeto, obra ou especificação.
              </p>
              <Link
                to="/room-visualizer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-wg-black rounded-xl font-light text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Experiência WG
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard"
                className="inline-flex items-center gap-3 px-8 py-4 border border-white/20 text-white rounded-xl font-light text-lg hover:bg-white/10 transition-colors"
              >
                Levar para proposta
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

const Moodboard = () => {
  return (
    <MoodboardProvider>
      <MoodboardContent />
    </MoodboardProvider>
  );
};

export default Moodboard;
