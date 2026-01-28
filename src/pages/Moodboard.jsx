import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Moodboard | Crie sua Visão de Design - WG Almeida"
        description="Crie seu moodboard de design de interiores. Selecione cores, estilos e referências para visualizar sua visão de decoração."
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Crie Seu <span className="text-wg-orange">Moodboard</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Selecione cores e estilos para criar a visão perfeita do seu espaço.
              Visualize suas cores aplicadas em ambientes reais.
            </p>
          </motion.div>
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

      {/* CTA Section */}
      {hasContent && (
        <section className="py-16 bg-wg-orange">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-4">
                Quer ver seu moodboard aplicado em um espaço real?
              </h2>
              <p className="text-white/90 mb-8 text-lg">
                Use nossa ferramenta de IA para visualizar seu ambiente com as cores e
                estilos que você escolheu!
              </p>
              <a
                href="/room-visualizer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-wg-orange rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Experiência WG
                <ArrowRight className="w-5 h-5" />
              </a>
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
