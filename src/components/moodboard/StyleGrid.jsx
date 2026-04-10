import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { Search, Filter, Grid, List } from 'lucide-react';
import StyleCard from './StyleCard';
import { styleCatalog } from '@/utils/styleCatalog';

const INTERIOR_STYLES = styleCatalog.filter((style) => [
  'moderno',
  'classico',
  'industrial',
  'escandinavo',
  'rustico',
  'minimalismo',
  'boho',
  'contemporaneo',
  'tropical',
  'japandi',
  'art-deco',
  'mediterraneo',
].includes(style.slug));

const CATEGORIES = [
  { id: 'todos', name: 'Todos' },
  { id: 'contemporaneo', name: 'Contemporâneo' },
  { id: 'tradicional', name: 'Tradicional' },
  { id: 'eclético', name: 'Eclético' },
];

const StyleGrid = ({ selectedStyles, onStylesChange, maxStyles = 3 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState([]);

  const filteredStyles = useMemo(() => {
    return INTERIOR_STYLES.filter((style) => {
      const matchesSearch =
        style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        style.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        activeCategory === 'todos' || style.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const handleStyleSelect = (style) => {
    const isSelected = selectedStyles.some((s) => s.id === style.id);

    if (isSelected) {
      onStylesChange(selectedStyles.filter((s) => s.id !== style.id));
    } else if (selectedStyles.length < maxStyles) {
      onStylesChange([...selectedStyles, style]);
    }
  };

  const handleFavorite = (style) => {
    const isFav = favorites.includes(style.id);
    if (isFav) {
      setFavorites(favorites.filter((id) => id !== style.id));
    } else {
      setFavorites([...favorites, style.id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-light text-gray-800">
            Escolha seus Estilos ({selectedStyles.length}/{maxStyles})
          </h3>
          <p className="text-sm text-gray-500">
            Selecione até {maxStyles} estilos que representam sua visão
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-wg-orange text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-wg-orange text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar estilos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-wg-orange focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-light transition-colors ${
                activeCategory === category.id
                  ? 'bg-wg-orange text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Styles Preview */}
      {selectedStyles.length > 0 && (
        <div className="bg-wg-orange/10 rounded-xl p-4">
          <p className="text-sm font-light text-gray-700 mb-2">Estilos selecionados:</p>
          <div className="flex flex-wrap gap-2">
            {selectedStyles.map((style) => (
              <span
                key={style.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-wg-orange text-white rounded-full text-sm"
              >
                {style.name}
                <button
                  onClick={() => handleStyleSelect(style)}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grid - Cards maiores para melhor visualização */}
      <motion.div
        layout
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
        }
      >
        <AnimatePresence>
          {filteredStyles.map((style) => (
            <motion.div
              key={style.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <StyleCard
                style={style}
                isSelected={selectedStyles.some((s) => s.id === style.id)}
                onSelect={handleStyleSelect}
                onFavorite={handleFavorite}
                isFavorite={favorites.includes(style.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredStyles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum estilo encontrado para sua busca.</p>
        </div>
      )}
    </div>
  );
};

export default StyleGrid;
