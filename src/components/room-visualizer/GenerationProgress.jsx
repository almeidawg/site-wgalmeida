import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check, Sparkles, Palette, Wand2, Image } from 'lucide-react';

const GENERATION_STEPS = [
  {
    id: 'analyzing',
    label: 'Analisando ambiente',
    description: 'Identificando elementos e estrutura do espaço',
    icon: Image,
  },
  {
    id: 'applying_colors',
    label: 'Aplicando paleta de cores',
    description: 'Recolorindo elementos com suas cores escolhidas',
    icon: Palette,
  },
  {
    id: 'applying_style',
    label: 'Aplicando estilo',
    description: 'Integrando referências de design selecionadas',
    icon: Sparkles,
  },
  {
    id: 'rendering',
    label: 'Renderizando imagem',
    description: 'Gerando visualização fotorrealista',
    icon: Wand2,
  },
];

const GenerationProgress = ({ currentStep, progress = 0, error = null }) => {
  const currentStepIndex = GENERATION_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4"
        >
          <Sparkles className="w-full h-full text-wg-orange" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-800">Gerando sua visualização</h3>
        <p className="text-gray-500 text-sm mt-1">
          Nossa IA está trabalhando na sua imagem
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-wg-orange to-orange-400 rounded-full"
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">{Math.round(progress)}%</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {GENERATION_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: isPending ? 0.5 : 1,
              }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                isCurrent ? 'bg-wg-orange/10' : ''
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-wg-orange text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                      ? 'text-wg-orange'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-100 rounded-xl"
        >
          <p className="text-red-700 font-medium">Erro na geração</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </motion.div>
      )}

      {/* Tip */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> O processo pode levar de 30 segundos a 2 minutos dependendo
          da complexidade do ambiente e das referências selecionadas.
        </p>
      </div>
    </div>
  );
};

export default GenerationProgress;
