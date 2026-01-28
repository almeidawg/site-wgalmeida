import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, ArrowLeft } from 'lucide-react';
import CoverPage from '@/components/moodboard-generator/CoverPage';
import EnvironmentPage from '@/components/moodboard-generator/EnvironmentPage';
import MaterialPage from '@/components/moodboard-generator/MaterialPage';
import { searchUnsplashImages, buildImageQuery } from '@/lib/unsplash';
import { exportToPDF, preloadImages } from '@/lib/moodboard-pdf';
import {
  PAGE_SIZES,
  ENVIRONMENT_DATA,
  MATERIAL_DATA
} from '@/lib/moodboard-constants';
import SEO from '@/components/SEO';

export default function MoodboardGenerator() {
  // Form state
  const [clientName, setClientName] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedEnvironments, setSelectedEnvironments] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [colorPalette, setColorPalette] = useState(['#F25C26', '#2C5F6F', '#1A3A52', '#8B5A3C']);
  const [pageSize, setPageSize] = useState('MOBILE_PORTRAIT');
  const [orientation, setOrientation] = useState('portrait');
  const [customColor, setCustomColor] = useState('#F25C26');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [progress, setProgress] = useState(0);

  // Refs for PDF export
  const pagesRef = useRef([]);

  // Available styles from Revista de Estilos
  const styles = [
    'Minimalista', 'Contemporâneo', 'Industrial', 'Escandinavo', 'Japandi',
    'Boho', 'Coastal', 'Mid-Century', 'Art Déco', 'Clássico',
    'Moderno', 'Rústico', 'Farmhouse', 'Cottage', 'Shabby Chic',
    'Vitoriano', 'Colonial', 'Mediterranean', 'Tropical', 'Urban',
    'Eclético', 'Maximalista', 'Transitional', 'Hollywood Regency', 'French Country',
    'Zen', 'Wabi-Sabi', 'Hygge', 'Lagom', 'Grandmillennial'
  ];

  // Toggle environment selection
  const toggleEnvironment = (env) => {
    setSelectedEnvironments(prev =>
      prev.includes(env)
        ? prev.filter(e => e !== env)
        : [...prev, env]
    );
  };

  // Toggle material selection
  const toggleMaterial = (mat) => {
    setSelectedMaterials(prev =>
      prev.includes(mat)
        ? prev.filter(m => m !== mat)
        : [...prev, mat]
    );
  };

  // Add color to palette
  const addColorToPalette = () => {
    if (!colorPalette.includes(customColor)) {
      setColorPalette([...colorPalette, customColor]);
    }
  };

  // Remove color from palette
  const removeColor = (color) => {
    setColorPalette(colorPalette.filter(c => c !== color));
  };

  // Fetch images from Unsplash
  const fetchImages = async () => {
    const images = {};
    const totalItems = selectedEnvironments.length + selectedMaterials.length + 1;
    let completed = 0;

    try {
      // Cover image
      const coverResults = await searchUnsplashImages({
        query: `${selectedStyle} interior design minimalist`,
        orientation: 'landscape',
        perPage: 1
      });
      if (coverResults.length > 0) {
        images['cover'] = coverResults[0].urls.regular;
      }
      completed++;
      setProgress(Math.round((completed / totalItems) * 100));

      // Environment images
      for (const env of selectedEnvironments) {
        const envData = ENVIRONMENT_DATA[env];
        const query = buildImageQuery(selectedStyle, envData.searchQuery, colorPalette);

        const results = await searchUnsplashImages({
          query,
          orientation: 'landscape',
          perPage: 1
        });

        if (results.length > 0) {
          images[env] = results[0].urls.regular;
        }

        completed++;
        setProgress(Math.round((completed / totalItems) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Material images (fetch multiple for grid layout)
      for (const mat of selectedMaterials) {
        const matData = MATERIAL_DATA[mat];

        const results = await searchUnsplashImages({
          query: matData.searchQuery,
          orientation: 'squarish',
          perPage: 4
        });

        if (results.length > 0) {
          images[mat] = results.map(r => r.urls.regular).join(',');
        }

        completed++;
        setProgress(Math.round((completed / totalItems) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (error) {
      console.error('Error fetching images:', error);
    }

    return images;
  };

  // Generate moodboard
  const handleGenerate = async () => {
    if (!clientName || !selectedStyle) {
      alert('Por favor, preencha o nome do cliente e selecione um estilo.');
      return;
    }

    if (selectedEnvironments.length === 0 && selectedMaterials.length === 0) {
      alert('Por favor, selecione pelo menos um ambiente ou material.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const images = await fetchImages();
    setGeneratedImages(images);

    const allImageUrls = Object.values(images).flatMap(urls => urls.split(','));
    await preloadImages(allImageUrls);

    setProgress(100);
    setIsGenerating(false);
    setShowPreview(true);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (pagesRef.current.length === 0) {
      alert('Nenhuma página para exportar.');
      return;
    }

    const selectedPageSize = PAGE_SIZES[pageSize];
    const fileName = `moodboard-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`;

    await exportToPDF(pagesRef.current, {
      pageSize: selectedPageSize,
      orientation,
      quality: 0.95,
      fileName
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title="Gerador de Moodboards Profissional | WG Almeida"
        description="Crie moodboards personalizados e profissionais para seus clientes. Selecione estilos, ambientes, materiais e paleta de cores com imagens de alta qualidade."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showPreview ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Gerador de Moodboards Profissional
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Crie moodboards personalizados para seus clientes em minutos
              </p>
            </motion.div>

            <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-orange focus:border-transparent"
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estilo *
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-orange focus:border-transparent"
                >
                  <option value="">Selecione um estilo</option>
                  {styles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paleta de Cores
                </label>
                <div className="flex gap-4 items-center mb-4">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <button
                    onClick={addColorToPalette}
                    className="px-4 py-2 bg-wg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Adicionar Cor
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {colorPalette.map((color, index) => (
                    <div
                      key={index}
                      onClick={() => removeColor(color)}
                      className="relative w-12 h-12 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color }}
                      title={`Clique para remover ${color}`}
                    >
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ambientes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(ENVIRONMENT_DATA).map(env => (
                    <label key={env} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEnvironments.includes(env)}
                        onChange={() => toggleEnvironment(env)}
                        className="w-4 h-4 text-wg-orange focus:ring-wg-orange rounded"
                      />
                      <span className="text-sm text-gray-700">{ENVIRONMENT_DATA[env].title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Materiais e Paletas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.keys(MATERIAL_DATA).map(mat => (
                    <label key={mat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(mat)}
                        onChange={() => toggleMaterial(mat)}
                        className="w-4 h-4 text-wg-orange focus:ring-wg-orange rounded"
                      />
                      <span className="text-sm text-gray-700">{MATERIAL_DATA[mat].title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Page Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tamanho da Página
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-orange focus:border-transparent"
                  >
                    {Object.entries(PAGE_SIZES).map(([key, value]) => (
                      <option key={key} value={key}>{value.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Orientação
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-orange focus:border-transparent"
                  >
                    <option value="portrait">Retrato (Vertical)</option>
                    <option value="landscape">Paisagem (Horizontal)</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-wg-orange text-white rounded-lg font-semibold text-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? `Gerando... ${progress}%` : 'Gerar Moodboard'}
              </button>
            </div>
          </>
        ) : (
          <div>
            {/* Preview Header */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-3 bg-wg-orange text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>

            {/* Preview Pages */}
            <div className="space-y-8">
              {/* Cover */}
              <div
                ref={el => { if (el) pagesRef.current[0] = el; }}
                style={{
                  width: orientation === 'portrait' ? '595px' : '842px',
                  height: orientation === 'portrait' ? '842px' : '595px',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <CoverPage
                  clientName={clientName}
                  colorPalette={colorPalette}
                  backgroundImage={generatedImages['cover']}
                  pageNumber={1}
                />
              </div>

              {/* Environments */}
              {selectedEnvironments.map((env, index) => {
                const envData = ENVIRONMENT_DATA[env];
                const pageNum = index + 2;

                return (
                  <div
                    key={env}
                    ref={el => { if (el) pagesRef.current[pageNum - 1] = el; }}
                    style={{
                      width: orientation === 'portrait' ? '595px' : '842px',
                      height: orientation === 'portrait' ? '842px' : '595px',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <EnvironmentPage
                      title={envData.title}
                      description={envData.description}
                      imageUrl={generatedImages[env] || ''}
                      pageNumber={pageNum}
                    />
                  </div>
                );
              })}

              {/* Materials */}
              {selectedMaterials.map((mat, index) => {
                const matData = MATERIAL_DATA[mat];
                const pageNum = selectedEnvironments.length + index + 2;
                const images = generatedImages[mat]?.split(',') || [];

                return (
                  <div
                    key={mat}
                    ref={el => { if (el) pagesRef.current[pageNum - 1] = el; }}
                    style={{
                      width: orientation === 'portrait' ? '595px' : '842px',
                      height: orientation === 'portrait' ? '842px' : '595px',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <MaterialPage
                      title={matData.title}
                      description={matData.description}
                      images={images}
                      pageNumber={pageNum}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
