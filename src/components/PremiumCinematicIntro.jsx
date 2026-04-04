import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { useTranslation, Trans } from 'react-i18next';

/**
 * ABERTURA CINEMATOGRÁFICA PREMIUM - WG ALMEIDA
 *
 * Uma experiência que faz o cliente ir direto para o WhatsApp
 * Storytelling emocional + CTA de urgência
 *
 * Duração: ~28 segundos
 */

const WG_LOGO = "/images/logo-192.webp";

// Cores da marca WG
const WG_COLORS = {
  orange: '#F25C26',
  green: '#5E9B94',
  blue: '#2B4580',
  brown: '#8B5E3C',
  black: '#1a1a1a',
};

// WhatsApp da empresa
const WHATSAPP_NUMBER = "5511984650002";

// Sequência de storytelling - História completa da empresa
// TEMPOS FIXOS em milissegundos
const STAGE_TIMES = [
  0,      // 0: Logo (0-3s)
  3000,   // 1: Quem Somos 1 (3-6s)
  6000,   // 2: Quem Somos 2 (6-9s)
  9000,   // 3: O Que Fazemos (9-13s)
  13000,  // 4: Núcleos Intro (13-16s)
  16000,  // 5: Arquitetura (16-19s)
  19000,  // 6: Engenharia (19-22s)
  22000,  // 7: Marcenaria (22-25s)
  25000,  // 8: Como Fazemos (25-29s)
  29000,  // 9: WG Easy (29-33s)
  33000,  // 10: Impacto (33-37s)
  37000,  // 11: CTA (37-45s)
];

const TOTAL_DURATION = 45000; // 45 segundos total

// Imagens do portfólio para o flash
const portfolioImages = [
  '/images/projects/galpao-surubiju-alphaville/1.webp',
  '/images/projects/casa-gaivota-moema/1.webp',
  '/images/projects/apartamento-alameda-alphaville/3sala_03_39270011980_o.webp',
  '/images/projects/apartamento-square-santo-amaro/sala01.webp',
];

// ============================================================
// COMPONENTES DE EFEITOS VISUAIS
// ============================================================

// Partículas douradas flutuantes
const GoldenParticles = ({ count = 50, active = true }) => {
  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => {
        const size = 2 + Math.random() * 4;
        const delay = Math.random() * 3;
        const duration = 4 + Math.random() * 4;
        const startX = Math.random() * 100;

        return (
          <motion.div
            key={i}
            initial={{
              x: `${startX}vw`,
              y: '110vh',
              opacity: 0,
              scale: 0
            }}
            animate={{
              y: '-10vh',
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
              x: `${startX + (Math.random() - 0.5) * 20}vw`,
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${WG_COLORS.orange}, ${WG_COLORS.brown}80)`,
              boxShadow: `0 0 ${size * 2}px ${WG_COLORS.orange}60`,
            }}
          />
        );
      })}
    </div>
  );
};

// Ondas de energia elegantes
const ElegantWave = ({ color, delay, scale }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0.6 }}
    animate={{ scale: scale, opacity: 0 }}
    transition={{ duration: 2.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className="absolute rounded-full"
    style={{
      width: 200,
      height: 200,
      border: `2px solid ${color}`,
      boxShadow: `0 0 30px ${color}40`,
    }}
  />
);

// Traços de luz contínuos com cores WG oficiais
const ContinuousLightBeams = () => {
  const colors = [WG_COLORS.orange, WG_COLORS.green, WG_COLORS.blue, WG_COLORS.brown];

  // Configurações dos traços - diferentes posições e ângulos
  const beams = [
    { angle: 15, top: '30%', delay: 0, duration: 2.5 },
    { angle: -10, top: '50%', delay: 0.8, duration: 2.2 },
    { angle: 25, top: '70%', delay: 1.6, duration: 2.8 },
    { angle: -20, top: '20%', delay: 2.4, duration: 2.4 },
    { angle: 5, top: '80%', delay: 3.2, duration: 2.6 },
    { angle: -15, top: '40%', delay: 4.0, duration: 2.3 },
    { angle: 30, top: '60%', delay: 4.8, duration: 2.7 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beams.map((beam, i) => (
        <motion.div
          key={i}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{
            x: ['-100%', '200%'],
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: beam.duration,
            delay: beam.delay,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeInOut'
          }}
          className="absolute h-[3px] w-[60vw]"
          style={{
            top: beam.top,
            background: `linear-gradient(90deg, transparent, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]}80, transparent)`,
            transform: `rotate(${beam.angle}deg)`,
            transformOrigin: 'center',
            boxShadow: `0 0 20px ${colors[i % colors.length]}60, 0 0 40px ${colors[i % colors.length]}30`,
          }}
        />
      ))}
    </div>
  );
};

// Botão WhatsApp pulsante - Laranja WG
const WhatsAppButton = ({ show, urgent = false, size = 'normal', message, ariaLabel }) => {
  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    normal: 'w-14 h-14 text-base',
    large: 'w-20 h-20 text-xl',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
          }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          aria-label={ariaLabel}
          className={`
            ${sizeClasses[size]}
            rounded-full flex items-center justify-center
            shadow-lg transition-colors relative z-50
          `}
          style={{
            background: WG_COLORS.orange,
            boxShadow: `0 10px 25px ${WG_COLORS.orange}40`
          }}
        >
          {/* Pulso de urgência */}
          {urgent && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: WG_COLORS.orange }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: WG_COLORS.orange }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}

          {/* Ícone WhatsApp */}
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white relative z-10">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// CTA Final com urgência máxima
const FinalCTA = ({ show, lines, message, subtitle, buttonLabel, availabilityLabel }) => {
  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Texto principal - usando lines dinâmicos */}
          <div className="text-center">
            {(lines || ['Vamos começar?']).map((line, i) => (
              <motion.h2
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.2 }}
                className="text-white text-3xl md:text-5xl font-light tracking-wide"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {line}
              </motion.h2>
            ))}
          </div>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 text-sm md:text-base tracking-widest uppercase"
          >
            {subtitle || ''}
          </motion.p>

          {/* Botão principal */}
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="relative mt-4"
          >
            {/* Pulsos de urgência */}
            <motion.div
              className="absolute inset-0 rounded-full bg-[#25D366]"
              animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-[#25D366]"
              animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />

            {/* Botão */}
            <div className="relative flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] rounded-full transition-colors">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="text-white font-medium text-lg tracking-wide">
                {buttonLabel || ''}
              </span>
            </div>
          </motion.button>

          {/* Indicador de urgência */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center gap-2 text-white/40 text-xs"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span>{availabilityLabel || ''}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Logo Reveal - Aparece e vai sumindo elegantemente
const LogoReveal = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="relative flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Ondas de energia atrás do logo - cores WG */}
        {[WG_COLORS.orange, WG_COLORS.green, WG_COLORS.blue, WG_COLORS.brown].map((color, i) => (
          <ElegantWave key={i} color={color} delay={0.3 + i * 0.15} scale={5 + i * 1.5} />
        ))}

        {/* Luz central pulsante */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 1.2],
            opacity: [0, 0.8, 0.4]
          }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute w-48 h-48 rounded-full"
          style={{
            background: `radial-gradient(circle, ${WG_COLORS.orange}50, transparent 70%)`,
          }}
        />

        {/* Logo com animação de entrada e fade out */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
          animate={{
            scale: [0.5, 1.1, 1],
            opacity: [0, 1, 1, 0.8],
            filter: ['blur(20px)', 'blur(0px)', 'blur(0px)', 'blur(2px)']
          }}
          transition={{
            duration: 3,
            times: [0, 0.3, 0.7, 1],
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <img
            src={WG_LOGO}
            alt="Logo Grupo WG Almeida - Arquitetura, Engenharia e Marcenaria de Alto Padrão"
            className="h-28 md:h-40 w-auto relative z-10"
          />
        </motion.div>

        {/* Tagline aparece e some junto */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0, 1, 1, 0.5],
            y: [30, 0, 0, -10]
          }}
          transition={{
            duration: 3,
            times: [0, 0.3, 0.7, 1],
            ease: "easeOut"
          }}
          className="mt-6 text-white/70 text-sm md:text-base tracking-[0.4em] uppercase"
        >
          {t('premiumIntro.tagline')}
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);

// Texto Emocional
const EmotionalText = ({ lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center px-8 max-w-3xl"
      >
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-white text-3xl md:text-5xl lg:text-6xl font-light leading-tight"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// Statement Bold
const StatementText = ({ lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center px-8 max-w-4xl"
      >
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            className="text-white text-2xl md:text-4xl font-light tracking-wide"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// Serviços animados
const ServicesDisplay = ({ lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col md:flex-row items-center gap-4 md:gap-8"
      >
        {lines.map((service, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2, duration: 0.5, type: 'spring' }}
            className="flex items-center gap-4"
          >
            <span
              className="text-white text-xl md:text-3xl tracking-widest uppercase"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {service}
            </span>
            {i < lines.length - 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="hidden md:block w-2 h-2 rounded-full"
                style={{ background: WG_COLORS.orange }}
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// Impact Text
const ImpactText = ({ lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center"
      >
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.6 }}
            className="text-white text-2xl md:text-4xl lg:text-5xl font-medium tracking-wide"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================
// NOVOS COMPONENTES PARA STORYTELLING
// ============================================================

// Story Text - Texto com subtítulo opcional (para história da empresa)
const StoryText = ({ subtitle, lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center px-8 max-w-4xl"
      >
        {/* Subtítulo (seção) */}
        {subtitle && (
          <motion.span
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-wg-orange text-sm md:text-base tracking-[0.3em] uppercase mb-6 font-medium"
            style={{ color: WG_COLORS.orange }}
          >
            {subtitle}
          </motion.span>
        )}

        {/* Linhas de texto */}
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              delay: (subtitle ? 0.3 : 0) + i * 0.2,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-white text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {line}
          </motion.p>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

// Nucleo Highlight - Destaque de cada núcleo com cor
const NucleoHighlight = ({ nucleo, desc, color, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        {/* Linha decorativa com cor do núcleo */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-20 h-1 mx-auto mb-6 rounded-full"
          style={{ background: color }}
        />

        {/* Nome do núcleo */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            color: color,
            textShadow: `0 0 40px ${color}40`
          }}
        >
          {nucleo}
        </motion.h3>

        {/* Descrição */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/70 text-lg md:text-xl tracking-wide"
        >
          {desc}
        </motion.p>

        {/* Brilho de fundo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(circle at center, ${color}30, transparent 50%)`
          }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

// WG Easy Display - Apresentação do sistema
const WGEasyDisplay = ({ subtitle, lines, features, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center px-8 max-w-4xl"
      >
        {/* Subtítulo */}
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block text-sm md:text-base tracking-[0.3em] uppercase mb-4 font-medium"
          style={{ color: WG_COLORS.orange }}
        >
          {subtitle}
        </motion.span>

        {/* Ícone do sistema */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: `${WG_COLORS.orange}20`, border: `2px solid ${WG_COLORS.orange}` }}
        >
          <svg className="w-8 h-8" style={{ color: WG_COLORS.orange }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.div>

        {/* Título WG Easy */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl md:text-4xl font-light text-white mb-2"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          WG Easy
        </motion.h3>

        {/* Linhas de texto */}
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="text-white/70 text-lg md:text-xl"
          >
            {line}
          </motion.p>
        ))}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          {features.map((feature, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: `${WG_COLORS.orange}15`,
                color: WG_COLORS.orange,
                border: `1px solid ${WG_COLORS.orange}40`
              }}
            >
              {feature}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Impact Final - Frase de impacto com destaque especial
const ImpactFinal = ({ lines, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center px-8 relative"
      >
        {/* Aspas decorativas */}
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-9xl font-serif"
          style={{ color: WG_COLORS.orange }}
        >
          "
        </motion.span>

        {/* Texto de impacto */}
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.3,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-wide"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: i === lines.length - 1 ? WG_COLORS.orange : 'white',
              textShadow: i === lines.length - 1 ? `0 0 30px ${WG_COLORS.orange}40` : 'none'
            }}
          >
            {line}
          </motion.p>
        ))}

        {/* Linha decorativa abaixo */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="w-24 h-1 mx-auto mt-8 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${WG_COLORS.orange}, transparent)` }}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

// Portfolio Flash
const PortfolioFlash = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 overflow-hidden"
      >
        {portfolioImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [1.1, 1, 1, 1.05] }}
            transition={{
              duration: 0.8,
              delay: i * 0.8,
              times: [0, 0.1, 0.9, 1],
            }}
            className="absolute inset-0"
          >
            <img
              src={img}
              alt={`Projeto de Arquitetura e Engenharia de Luxo - Grupo WG Almeida ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        ))}

        {/* Contador de projetos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1] }}
            transition={{ delay: 2.5 }}
            className="text-white/60 text-sm tracking-widest uppercase"
          >
            +200 projetos entregues
          </motion.span>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

// Função para obter tempo de início persistente (sobrevive ao HMR)
const getStartTime = () => {
  const stored = sessionStorage.getItem('wg-intro-start-time');
  if (stored) {
    const storedTime = parseInt(stored, 10);
    // Verificar se não passou da duração total (evita usar tempo antigo)
    if (Date.now() - storedTime < TOTAL_DURATION + 5000) {
      return storedTime;
    }
  }
  // Novo tempo
  const newTime = Date.now();
  sessionStorage.setItem('wg-intro-start-time', newTime.toString());
  return newTime;
};

const PremiumCinematicIntro = ({ onComplete }) => {
  const { t } = useTranslation();
  const whatsappMessage = t('premiumIntro.whatsappMessage');
  // Obter tempo de início persistente (sobrevive ao HMR do Vite)
  const startTimeRef = useRef(getStartTime());

  const [currentStage, setCurrentStage] = useState(() => {
    // Calcular estágio inicial baseado no tempo já decorrido
    const elapsed = Date.now() - startTimeRef.current;
    let stage = 0;
    for (let i = STAGE_TIMES.length - 1; i >= 0; i--) {
      if (elapsed >= STAGE_TIMES[i]) {
        stage = i;
        break;
      }
    }
    return stage;
  });
  const [showWhatsApp, setShowWhatsApp] = useState(() => {
    // Verificar se já deveria estar mostrando WhatsApp
    return Date.now() - startTimeRef.current >= 3000;
  });
  const [isComplete, setIsComplete] = useState(() => {
    // Verificar se já completou
    return Date.now() - startTimeRef.current >= TOTAL_DURATION;
  });
  // Inicializa isMobile sincronamente para evitar flip de src no primeiro render
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  const [elapsed, setElapsed] = useState(() => Date.now() - startTimeRef.current);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timeline principal
  useEffect(() => {
    // Se já completou, não fazer nada
    if (isComplete) {
      if (onComplete) onComplete();
      return;
    }


    // Atualizar estágio atual baseado no tempo
    const tick = () => {
      const elapsedTime = Date.now() - startTimeRef.current;

      // Encontrar o estágio atual baseado nos tempos fixos
      let newStage = 0;
      for (let i = STAGE_TIMES.length - 1; i >= 0; i--) {
        if (elapsedTime >= STAGE_TIMES[i]) {
          newStage = i;
          break;
        }
      }

      setElapsed(elapsedTime);
      setCurrentStage(newStage);

      // Mostrar WhatsApp após 3 segundos
      if (elapsedTime >= 3000) {
        setShowWhatsApp(true);
      }

      // Completar após duração total
      if (elapsedTime >= TOTAL_DURATION) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsComplete(true);
        // Limpar storage para próxima vez
        sessionStorage.removeItem('wg-intro-start-time');
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
    };

    // Intervalo para atualizações
    intervalRef.current = setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isComplete, onComplete]);

  // Controle do vídeo
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Tecla R para reiniciar a intro (para testes)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        // Limpar storage e reiniciar
        sessionStorage.removeItem('wg-intro-start-time');
        const newTime = Date.now();
        sessionStorage.setItem('wg-intro-start-time', newTime.toString());
        startTimeRef.current = newTime;
        setCurrentStage(0);
        setElapsed(0);
        setShowWhatsApp(false);
        setIsComplete(false);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  if (isComplete) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black">
      {/* Vídeo de fundo */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-70 w-full h-full object-cover"
          src={isMobile
            ? "/videos/hero/VERTICAL_compressed.mp4"
            : "/videos/hero/HORIZONTAL_compressed.mp4"
          }
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-poster-640.webp"
          aria-hidden="true"
        >
          <track kind="captions" src="/videos/hero/descricao.vtt" srcLang="pt-BR" label="Português" default />
        </video>

        {/* Overlay gradiente - mais leve */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 80%),
              linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.5) 100%)
            `
          }}
        />
      </div>

      {/* Traços de luz contínuos com cores WG */}
      <ContinuousLightBeams />

      {/* Partículas douradas */}
      <GoldenParticles count={40} active={currentStage >= 1} />

      {/* Conteúdo central - RENDERIZAÇÃO SIMPLES E DIRETA */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        {/* Cada estágio é renderizado diretamente baseado no currentStage */}

        {/* LOGO REVEAL - Stage 0 */}
        {currentStage === 0 && (
          <motion.div
            key="logo-stage"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.img
              src={WG_LOGO}
              alt="WG Almeida"
              className="h-32 md:h-44 w-auto"
              initial={{ filter: 'blur(20px)' }}
              animate={{ filter: 'blur(0px)' }}
              transition={{ duration: 1 }}
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-6 text-white text-sm md:text-base tracking-[0.4em] uppercase"
            >
              {t('premiumIntro.tagline')}
            </motion.p>
          </motion.div>
        )}

        {/* QUEM SOMOS 1 - Stage 1 */}
        {currentStage === 1 && (
          <motion.div
            key="quem-somos-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
              style={{ color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.whoWeAre.kicker')}
            </motion.span>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.whoWeAre.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.whoWeAre.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* QUEM SOMOS 2 - Stage 2 */}
        {currentStage === 2 && (
          <motion.div
            key="quem-somos-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.ecosystem.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.ecosystem.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* O QUE FAZEMOS - Stage 3 */}
        {currentStage === 3 && (
          <motion.div
            key="o-que-fazemos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
              style={{ color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.whatWeDo.kicker')}
            </motion.span>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.whatWeDo.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.whatWeDo.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* NÚCLEOS INTRO - Stage 4 */}
        {currentStage === 4 && (
          <motion.div
            key="nucleos-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
              style={{ color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.units.kicker')}
            </motion.span>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.units.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.units.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* ARQUITETURA - Stage 5 */}
        {currentStage === 5 && (
          <motion.div
            key="nucleo-arq"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-4 max-w-[95vw]"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 sm:w-24 h-1 mx-auto mb-4 sm:mb-6 rounded-full"
              style={{ background: WG_COLORS.green }}
            />
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-2 sm:mb-4"
              style={{ color: WG_COLORS.green, fontFamily: 'Inter, sans-serif' }}
            >
              {t('premiumIntro.stages.architecture.title')}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              className="text-white text-sm sm:text-lg md:text-xl"
            >
              {t('premiumIntro.stages.architecture.subtitle')}
            </motion.p>
          </motion.div>
        )}

        {/* ENGENHARIA - Stage 6 */}
        {currentStage === 6 && (
          <motion.div
            key="nucleo-eng"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-4 max-w-[95vw]"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 sm:w-24 h-1 mx-auto mb-4 sm:mb-6 rounded-full"
              style={{ background: WG_COLORS.blue }}
            />
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-2 sm:mb-4"
              style={{ color: WG_COLORS.blue, fontFamily: 'Inter, sans-serif' }}
            >
              {t('premiumIntro.stages.engineering.title')}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              className="text-white text-sm sm:text-lg md:text-xl"
            >
              {t('premiumIntro.stages.engineering.subtitle')}
            </motion.p>
          </motion.div>
        )}

        {/* MARCENARIA - Stage 7 */}
        {currentStage === 7 && (
          <motion.div
            key="nucleo-marc"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-4 max-w-[95vw]"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 sm:w-24 h-1 mx-auto mb-4 sm:mb-6 rounded-full"
              style={{ background: WG_COLORS.brown }}
            />
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light tracking-wide mb-2 sm:mb-4"
              style={{ color: WG_COLORS.brown, fontFamily: 'Inter, sans-serif' }}
            >
              {t('premiumIntro.stages.carpentry.title')}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              className="text-white text-sm sm:text-lg md:text-xl"
            >
              {t('premiumIntro.stages.carpentry.subtitle')}
            </motion.p>
          </motion.div>
        )}

        {/* COMO FAZEMOS - Stage 8 */}
        {currentStage === 8 && (
          <motion.div
            key="como-fazemos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs sm:text-sm tracking-[0.3em] uppercase mb-4 sm:mb-6"
              style={{ color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.howWeWork.kicker')}
            </motion.span>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-lg sm:text-2xl md:text-3xl lg:text-4xl font-light mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.howWeWork.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-base sm:text-lg md:text-xl lg:text-2xl font-light leading-tight"
            >
              {t('premiumIntro.stages.howWeWork.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* WG EASY - Stage 9 */}
        {currentStage === 9 && (
          <motion.div
            key="wg-easy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="block text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase mb-3 sm:mb-4"
              style={{ color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.wgEasy.kicker')}
            </motion.span>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center"
              style={{ background: `${WG_COLORS.orange}20`, border: `2px solid ${WG_COLORS.orange}` }}
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: WG_COLORS.orange }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </motion.div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-2"
            >
              WG Easy
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.4 }}
              className="text-white text-sm sm:text-base md:text-lg mb-3 sm:mb-4"
            >
              {t('premiumIntro.stages.wgEasy.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-2 sm:gap-3"
            >
              {(t('premiumIntro.stages.wgEasy.features', { returnObjects: true }) || []).map((f, i) => (
                <motion.span
                  key={f}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm"
                  style={{ background: `${WG_COLORS.orange}15`, color: WG_COLORS.orange, border: `1px solid ${WG_COLORS.orange}40` }}
                >
                  {f}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* IMPACTO FINAL - Stage 10 */}
        {currentStage === 10 && (
          <motion.div
            key="impacto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-medium leading-tight"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('premiumIntro.stages.impact.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-medium mt-1 sm:mt-2 leading-tight"
              style={{ fontFamily: 'Inter, sans-serif', color: WG_COLORS.orange }}
            >
              {t('premiumIntro.stages.impact.line2')}
            </motion.p>
          </motion.div>
        )}

        {/* CTA FINAL - Stage 11 */}
        {currentStage === 11 && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pointer-events-auto px-4 sm:px-8 max-w-[95vw] md:max-w-4xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.finalCta.line1')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light mb-2 leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              <Trans i18nKey="premiumIntro.stages.finalCta.line2">
                existe uma <span className="text-wg-orange font-medium">HISTORIA</span>
              </Trans>
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-light mb-6 leading-tight"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {t('premiumIntro.stages.finalCta.line3')}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.4 }}
              className="text-white text-sm tracking-widest uppercase mb-6"
            >
              {t('premiumIntro.cta.subtitle')}
            </motion.p>
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank')}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ background: WG_COLORS.orange }}
                animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <div
                className="relative flex items-center gap-3 px-8 py-4 rounded-full transition-colors hover:brightness-110"
                style={{ background: WG_COLORS.orange }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-white font-medium text-lg">{t('premiumIntro.cta.button')}</span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* WhatsApp flutuante (canto inferior direito) - esconde no CTA (stage 11) */}
      <div className="fixed bottom-8 right-8 z-50">
        <WhatsAppButton
          show={showWhatsApp && currentStage !== 11}
          urgent={currentStage >= 3}
          message={whatsappMessage}
          ariaLabel={t('premiumIntro.whatsappAria')}
        />
      </div>

      {/* Progress bar sutil */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: WG_COLORS.orange }}
          initial={{ width: '0%' }}
          animate={{ width: `${(elapsed / TOTAL_DURATION) * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Botão pular */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        onClick={() => {
          setIsComplete(true);
          if (onComplete) onComplete();
        }}
        className="absolute top-8 right-8 text-white/30 hover:text-white/70 text-xs tracking-widest uppercase transition-colors"
      >
        {t('premiumIntro.skip')}
      </motion.button>

      {/* Logo pequena no canto */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: currentStage > 0 ? 0.5 : 0 }}
        className="absolute top-8 left-8"
      >
        <img src={WG_LOGO} alt="WG" className="h-8 w-8 object-contain" width="568" height="568" decoding="async" />
      </motion.div>
    </div>
  );
};

export default PremiumCinematicIntro;
