import React, { useState, useEffect } from 'react';
import { motion } from '@/lib/motion-lite';
import { Palette, Import, Check, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const MoodboardImporter = ({
  importedColors,
  importedStyles,
  onImport,
  onClear,
}) => {
  const [savedMoodboard, setSavedMoodboard] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Tenta recuperar moodboard do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wg-moodboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedMoodboard(parsed);
      } catch {
        console.error('Erro ao carregar moodboard salvo');
      }
    }
  }, []);

  const handleImport = () => {
    if (savedMoodboard) {
      setIsImporting(true);
      setTimeout(() => {
        onImport({
          colors: savedMoodboard.colors || [],
          styles: savedMoodboard.styles || [],
        });
        setIsImporting(false);
      }, 500);
    }
  };

  const handleRefresh = () => {
    const saved = localStorage.getItem('wg-moodboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedMoodboard(parsed);
      } catch {
        console.error('Erro ao carregar moodboard salvo');
      }
    }
  };

  const hasImportedData = importedColors.length > 0 || importedStyles.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-wg-orange" />
          Seu Moodboard
        </h3>
        {savedMoodboard && (
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Recarregar moodboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {!hasImportedData ? (
        <>
          {savedMoodboard ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Encontramos um moodboard salvo:
                </p>
                <div className="flex gap-2 mb-2">
                  {savedMoodboard.colors?.slice(0, 5).map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {savedMoodboard.colors?.length || 0} cores •{' '}
                  {savedMoodboard.styles?.length || 0} estilos
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImport}
                disabled={isImporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Import className="w-5 h-5" />
                    Importar Moodboard
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <Palette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-2">
                Nenhum moodboard encontrado
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Crie um moodboard primeiro para poder usá-lo aqui
              </p>
              <Link
                to="/moodboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar Moodboard
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {/* Imported Colors */}
          {importedColors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Cores importadas:
              </p>
              <div className="flex flex-wrap gap-2">
                {importedColors.map((color, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-gray-600">
                      {color}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imported Styles */}
          {importedStyles.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Estilos importados:
              </p>
              <div className="flex flex-wrap gap-2">
                {importedStyles.map((style) => (
                  <span
                    key={style.id}
                    className="px-3 py-1.5 bg-wg-orange/10 text-wg-orange rounded-full text-sm font-medium"
                  >
                    {style.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <Check className="w-5 h-5" />
            <span className="text-sm">
              Moodboard importado com sucesso!
            </span>
          </div>

          {/* Clear Button */}
          <button
            onClick={onClear}
            className="w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Limpar e importar outro
          </button>
        </div>
      )}
    </div>
  );
};

export default MoodboardImporter;
