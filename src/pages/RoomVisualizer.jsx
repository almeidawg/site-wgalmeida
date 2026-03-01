import React, { useEffect } from 'react';
import { motion } from '@/lib/motion-lite';
import { Navigate } from 'react-router-dom';
import { Wand2, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { RoomVisualizerProvider, useRoomVisualizer } from '@/contexts/RoomVisualizerContext';
import {
  RoomTypeSelector,
  PhotoUploader,
  MoodboardImporter,
  GenerationProgress,
  ResultViewer,
} from '@/components/room-visualizer';
import SEO from '@/components/SEO';

const RoomVisualizerContent = () => {
  const { user } = useAuth();
  const {
    roomType,
    setRoomType,
    customRoomName,
    setCustomRoomName,
    photo,
    setPhoto,
    importedColors,
    importedStyles,
    importMoodboard,
    clearImportedMoodboard,
    generateVisualization,
    regenerate,
    generationStatus,
    generationProgress,
    generationError,
    isGenerating,
    canGenerate,
    result,
    reset,
  } = useRoomVisualizer();

  const handleGenerate = async () => {
    await generateVisualization();
  };

  const handleDownload = () => {
    if (result?.generatedImage) {
      const link = document.createElement('a');
      link.href = result.generatedImage;
      link.download = `visualizacao-wg-almeida-${Date.now()}.png`;
      link.click();
    }
  };

  const handleShare = async () => {
    if (result?.generatedImage && navigator.share) {
      try {
        const blob = await fetch(result.generatedImage).then((r) => r.blob());
        const file = new File([blob], 'visualizacao.png', { type: 'image/png' });
        await navigator.share({
          title: 'Minha Visualização - WG Almeida',
          text: 'Confira como ficou meu ambiente com as cores e estilos que escolhi!',
          files: [file],
        });
      } catch (err) {
        // Fallback para copiar link
        console.log('Share failed:', err);
      }
    }
  };

  const handleSave = async () => {
    // Já é salvo automaticamente no histórico do usuário
    console.log('Visualização salva no histórico');
  };

  // Se estiver gerando, mostra o progresso
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <GenerationProgress
            currentStep={generationStatus}
            progress={generationProgress}
            error={generationError}
          />
        </div>
      </div>
    );
  }

  // Se tiver resultado, mostra o viewer
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEO
          title="Resultado | Visualizador de Ambientes - WG Almeida"
          description="Visualização gerada por IA do seu ambiente"
        />

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={reset}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Nova visualização
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Sua Visualização</h1>
            <div />
          </div>

          <ResultViewer
            originalImage={result.originalImage}
            generatedImage={result.generatedImage}
            onRegenerate={regenerate}
            onSave={handleSave}
            onDownload={handleDownload}
            onShare={handleShare}
            isLoading={isGenerating}
          />

          {/* Info about the generation */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Detalhes da Geração</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ambiente</p>
                <p className="font-medium">{result.roomInfo.roomType?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Cores</p>
                <div className="flex gap-1 mt-1">
                  {result.moodboard.colors.map((c, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-gray-200"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-500">Estilos</p>
                <p className="font-medium">
                  {result.moodboard.styles.map((s) => s.name).join(', ')}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Gerado em</p>
                <p className="font-medium">
                  {new Date(result.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulário principal
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        pathname="/room-visualizer"
        title="Visualizador de Ambientes com IA | WG Almeida"
        description="Use inteligência artificial para visualizar seu ambiente com as cores e estilos do seu moodboard. Veja como ficará antes de executar!"
        keywords="visualizador ambientes ia, decoracao inteligencia artificial, antes depois reforma, visualizacao 3d decoracao"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-wg-orange/20 rounded-full text-wg-orange mb-6">
              <Wand2 className="w-5 h-5" />
              <span className="text-sm font-medium">Powered by AI</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Visualizador de <span className="text-wg-orange">Ambientes</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Envie uma foto do seu espaço e veja como ele ficará com as cores e estilos
              do seu moodboard. Tecnologia de IA fotorrealista.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[
              { num: 1, label: 'Importar Moodboard' },
              { num: 2, label: 'Enviar Foto' },
              { num: 3, label: 'Selecionar Ambiente' },
              { num: 4, label: 'Gerar Visualização' },
            ].map((step, i) => (
              <div key={step.num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    i === 0 && importedColors.length > 0
                      ? 'bg-green-500 text-white'
                      : i === 1 && photo
                      ? 'bg-green-500 text-white'
                      : i === 2 && roomType
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.num}
                </div>
                <span className="ml-2 text-sm text-gray-600 hidden sm:inline">
                  {step.label}
                </span>
                {i < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <MoodboardImporter
                importedColors={importedColors}
                importedStyles={importedStyles}
                onImport={importMoodboard}
                onClear={clearImportedMoodboard}
              />

              <PhotoUploader
                photo={photo}
                onPhotoChange={setPhoto}
                isProcessing={isGenerating}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <RoomTypeSelector
                selectedRoom={roomType}
                onSelectRoom={setRoomType}
                customRoomName={customRoomName}
                onCustomRoomChange={setCustomRoomName}
              />

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: canGenerate ? 1.02 : 1 }}
                whileTap={{ scale: canGenerate ? 0.98 : 1 }}
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-semibold text-lg transition-all ${
                  canGenerate
                    ? 'bg-wg-orange text-white hover:bg-wg-orange/90 shadow-lg shadow-wg-orange/30'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                Gerar Visualização com IA
              </motion.button>

              {!canGenerate && (
                <p className="text-center text-sm text-gray-500">
                  {!importedColors.length && !importedStyles.length
                    ? 'Importe um moodboard primeiro'
                    : !photo
                    ? 'Envie uma foto do ambiente'
                    : 'Selecione o tipo de ambiente'}
                </p>
              )}

              {generationError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
                  <p className="font-medium">Erro</p>
                  <p className="text-sm">{generationError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const RoomVisualizer = () => {
  const { user, loading } = useAuth();

  // Mostra loading enquanto verifica auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-wg-orange border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redireciona para login se não autenticado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-wg-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-wg-orange" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acesso Exclusivo
          </h2>
          <p className="text-gray-600 mb-6">
            O Visualizador de Ambientes IA é uma ferramenta exclusiva para clientes
            cadastrados. Faça login ou crie sua conta gratuita para acessar.
          </p>
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full px-6 py-3 bg-wg-orange text-white rounded-lg font-medium hover:bg-wg-orange/90 transition-colors"
            >
              Fazer Login
            </a>
            <a
              href="/register"
              className="block w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Criar Conta Grátis
            </a>
          </div>
          <a
            href="/moodboard"
            className="inline-block mt-6 text-sm text-gray-500 hover:text-wg-orange"
          >
            ← Voltar para o Moodboard (gratuito)
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <RoomVisualizerProvider>
      <RoomVisualizerContent />
    </RoomVisualizerProvider>
  );
};

export default RoomVisualizer;
