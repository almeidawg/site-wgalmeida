import React from 'react';
import { motion } from '@/lib/motion-lite';
import { Check, Heart } from 'lucide-react';

const StyleCard = ({
  style,
  isSelected,
  onSelect,
  onFavorite,
  isFavorite = false
}) => {
  const { id, name, image, description, tags } = style;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-xl overflow-hidden cursor-pointer group shadow-lg ${
        isSelected ? 'ring-4 ring-wg-orange' : ''
      }`}
      onClick={() => onSelect(style)}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 w-8 h-8 bg-wg-orange rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite?.(style);
        }}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isFavorite
            ? 'bg-red-500 text-white'
            : 'bg-white/20 text-white hover:bg-white/40'
        }`}
      >
        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg mb-1">{name}</h3>
        <p className="text-white/80 text-sm line-clamp-2 mb-2">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default StyleCard;
