import React from 'react';
import { motion } from 'framer-motion';

/**
 * Componente de traços animados com as cores WG
 * Efeito visual decorativo que pode ser usado em diferentes seções
 *
 * Variantes:
 * - horizontal: traços horizontais
 * - vertical: traços verticais
 * - diagonal: traços diagonais
 * - grid: grade de traços
 */

const wgColors = [
  '#F25C26', // wg-orange
  '#5E9B94', // wg-green
  '#2B4580', // wg-blue
  '#8B5E3C', // wg-brown
];

const AnimatedStrokes = ({
  variant = 'horizontal',
  className = '',
  count = 4,
  duration = 3,
  opacity = 0.15,
  strokeWidth = 2,
}) => {
  // Animação para cada traço
  const strokeAnimation = {
    initial: { pathLength: 0, opacity: 0 },
    animate: (i) => ({
      pathLength: 1,
      opacity: [0, opacity, opacity, 0],
      transition: {
        pathLength: {
          duration: duration,
          delay: i * 0.3,
          repeat: Infinity,
          repeatDelay: 1,
          ease: "easeInOut"
        },
        opacity: {
          duration: duration,
          delay: i * 0.3,
          repeat: Infinity,
          repeatDelay: 1,
          times: [0, 0.2, 0.8, 1]
        }
      }
    })
  };

  // Variante com cor cycling
  const colorCycleAnimation = (i) => ({
    stroke: wgColors,
    transition: {
      stroke: {
        duration: duration * 2,
        delay: i * 0.5,
        repeat: Infinity,
        ease: "linear"
      }
    }
  });

  if (variant === 'horizontal') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: count }).map((_, i) => (
            <motion.line
              key={i}
              x1="0%"
              y1={`${(100 / (count + 1)) * (i + 1)}%`}
              x2="100%"
              y2={`${(100 / (count + 1)) * (i + 1)}%`}
              stroke={wgColors[i % wgColors.length]}
              strokeWidth={strokeWidth}
              initial="initial"
              animate="animate"
              custom={i}
              variants={strokeAnimation}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: count }).map((_, i) => (
            <motion.line
              key={i}
              x1={`${(100 / (count + 1)) * (i + 1)}%`}
              y1="0%"
              x2={`${(100 / (count + 1)) * (i + 1)}%`}
              y2="100%"
              stroke={wgColors[i % wgColors.length]}
              strokeWidth={strokeWidth}
              initial="initial"
              animate="animate"
              custom={i}
              variants={strokeAnimation}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'diagonal') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: count }).map((_, i) => (
            <motion.line
              key={i}
              x1={`${(100 / count) * i}%`}
              y1="0%"
              x2={`${(100 / count) * (i + 1)}%`}
              y2="100%"
              stroke={wgColors[i % wgColors.length]}
              strokeWidth={strokeWidth}
              initial="initial"
              animate="animate"
              custom={i}
              variants={strokeAnimation}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          {Array.from({ length: count }).map((_, i) => (
            <motion.path
              key={i}
              d={`M0,${50 + i * 30} Q300,${i % 2 === 0 ? 100 : 0} 600,${50 + i * 30} T1200,${50 + i * 30}`}
              fill="none"
              stroke={wgColors[i % wgColors.length]}
              strokeWidth={strokeWidth}
              initial="initial"
              animate="animate"
              custom={i}
              variants={strokeAnimation}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'colorCycle') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
        <svg className="w-full h-full" preserveAspectRatio="none">
          {Array.from({ length: count }).map((_, i) => (
            <motion.line
              key={i}
              x1="0%"
              y1={`${(100 / (count + 1)) * (i + 1)}%`}
              x2="100%"
              y2={`${(100 / (count + 1)) * (i + 1)}%`}
              strokeWidth={strokeWidth}
              opacity={opacity}
              initial={{ stroke: wgColors[i % wgColors.length] }}
              animate={colorCycleAnimation(i)}
            />
          ))}
        </svg>
      </div>
    );
  }

  // Grid pattern
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="w-full h-full" preserveAspectRatio="none">
        {/* Linhas horizontais */}
        {Array.from({ length: count }).map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0%"
            y1={`${(100 / (count + 1)) * (i + 1)}%`}
            x2="100%"
            y2={`${(100 / (count + 1)) * (i + 1)}%`}
            stroke={wgColors[i % wgColors.length]}
            strokeWidth={strokeWidth}
            initial="initial"
            animate="animate"
            custom={i}
            variants={strokeAnimation}
          />
        ))}
        {/* Linhas verticais */}
        {Array.from({ length: count }).map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={`${(100 / (count + 1)) * (i + 1)}%`}
            y1="0%"
            x2={`${(100 / (count + 1)) * (i + 1)}%`}
            y2="100%"
            stroke={wgColors[i % wgColors.length]}
            strokeWidth={strokeWidth}
            initial="initial"
            animate="animate"
            custom={i + count}
            variants={strokeAnimation}
          />
        ))}
      </svg>
    </div>
  );
};

// Componente separador com traço animado
export const AnimatedDivider = ({ color = 'wg-orange', className = '' }) => {
  const colors = {
    'wg-orange': '#F25C26',
    'wg-green': '#5E9B94',
    'wg-blue': '#2B4580',
    'wg-brown': '#8B5E3C',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="h-px"
        style={{ backgroundColor: colors[color] || colors['wg-orange'] }}
        initial={{ width: 0 }}
        whileInView={{ width: '100px' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="w-2 h-2 rounded-full mx-4"
        style={{ backgroundColor: colors[color] || colors['wg-orange'] }}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      <motion.div
        className="h-px"
        style={{ backgroundColor: colors[color] || colors['wg-orange'] }}
        initial={{ width: 0 }}
        whileInView={{ width: '100px' }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
};

// Componente de borda animada
export const AnimatedBorder = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Bordas animadas */}
      <motion.div
        className="absolute top-0 left-0 h-1 bg-gradient-to-r from-wg-orange via-wg-green to-wg-blue"
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 h-1 bg-gradient-to-l from-wg-orange via-wg-brown to-wg-blue"
        initial={{ width: 0 }}
        whileInView={{ width: '100%' }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      />
      {children}
    </div>
  );
};

export default AnimatedStrokes;
