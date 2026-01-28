import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Send,
  Sparkles,
  User,
  Mail,
  Phone,
  Building,
  Upload,
  FileText,
  X,
  Instagram,
  Globe,
  Hammer,
  Layers,
  PaintBucket,
  Sofa,
  Lightbulb,
  Home,
  Ruler,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useTranslation, Trans } from 'react-i18next';

// Cores da marca WG Almeida
const WG_COLORS = {
  laranja: '#F25C26',
  verde: '#5E9B94',
  azul: '#2B4580',
  marrom: '#8B5E3C',
  preto: '#2E2E2E',
  cinza: '#4C4C4C',
  dourado: '#D4AF37',
};

// Cores para as linhas do grid (RAIOS)
const GRID_COLORS = [
  WG_COLORS.laranja,
  WG_COLORS.verde,
  WG_COLORS.azul,
  WG_COLORS.marrom,
  'rgba(255, 255, 255, 0.5)',
];

// SERVIÇOS disponíveis com ícones
const SERVICOS_CONFIG = [
  { id: 'marcenaria', labelKey: 'proposal.services.carpentry', icon: Hammer, color: WG_COLORS.marrom },
  { id: 'vidracaria', labelKey: 'proposal.services.glass', icon: Layers, color: WG_COLORS.azul },
  { id: 'marmoraria', labelKey: 'proposal.services.stone', icon: Ruler, color: WG_COLORS.cinza },
  { id: 'pintura', labelKey: 'proposal.services.paint', icon: PaintBucket, color: WG_COLORS.laranja },
  { id: 'iluminacao', labelKey: 'proposal.services.lighting', icon: Lightbulb, color: WG_COLORS.dourado },
  { id: 'mobiliario', labelKey: 'proposal.services.furniture', icon: Sofa, color: WG_COLORS.verde },
  { id: 'gesso', labelKey: 'proposal.services.plaster', icon: Home, color: WG_COLORS.preto },
  { id: 'eletrica', labelKey: 'proposal.services.electrical', icon: Lightbulb, color: WG_COLORS.azul },
];

// ============================================================
// COMPONENTE: Linhas do Grid interativas (RAIOS)
// ============================================================
const GridLine = ({ x, y, angle, color, length = 150 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      left: x,
      top: y,
      width: length,
      height: 2,
      background: `linear-gradient(90deg, ${color}, transparent)`,
      transformOrigin: 'left center',
      transform: `rotate(${angle}deg)`,
      boxShadow: `0 0 20px ${color}60`,
    }}
    initial={{ scaleX: 0, opacity: 0 }}
    animate={{ scaleX: 1, opacity: [0, 0.8, 0] }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.8, ease: 'easeOut' }}
  />
);

// Criar padrão de linhas do grid (RAIOS)
const createGridPattern = (x, y) => {
  const angles = [0, 45, 90, 135, -45, -90];
  const lines = [];

  for (let i = 0; i < 4; i++) {
    const angle = angles[Math.floor(Math.random() * angles.length)];
    const color = GRID_COLORS[Math.floor(Math.random() * GRID_COLORS.length)];
    const length = 80 + Math.random() * 120;
    const offsetX = (Math.random() - 0.5) * 40;
    const offsetY = (Math.random() - 0.5) * 40;

    lines.push({
      id: `${Date.now()}-${Math.random()}`,
      x: x + offsetX,
      y: y + offsetY,
      angle,
      color,
      length,
    });
  }

  return lines;
};

// Partículas douradas flutuantes
const GoldenParticles = ({ count = 20 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(count)].map((_, i) => {
      const size = 3 + Math.random() * 5;
      const delay = Math.random() * 5;
      const duration = 6 + Math.random() * 6;
      const startX = Math.random() * 100;

      return (
        <motion.div
          key={i}
          initial={{ x: `${startX}vw`, y: '110vh', opacity: 0, scale: 0 }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0],
            x: `${startX + (Math.random() - 0.5) * 15}vw`,
          }}
          transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${WG_COLORS.dourado}, ${WG_COLORS.laranja}80)`,
            boxShadow: `0 0 ${size * 2}px ${WG_COLORS.dourado}50`,
          }}
        />
      );
    })}
  </div>
);

// Traços de luz contínuos (RAIOS que passam pela tela)
const ContinuousLightBeams = () => {
  const colors = [WG_COLORS.laranja, WG_COLORS.verde, WG_COLORS.azul, WG_COLORS.marrom];
  const beams = [
    { angle: 15, top: '30%', delay: 0, duration: 2.5 },
    { angle: -10, top: '50%', delay: 0.8, duration: 2.2 },
    { angle: 25, top: '70%', delay: 1.6, duration: 2.8 },
    { angle: -20, top: '20%', delay: 2.4, duration: 2.4 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beams.map((beam, i) => (
        <motion.div
          key={i}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: ['-100%', '200%'], opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: beam.duration, delay: beam.delay, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          className="absolute h-[2px] w-[50vw]"
          style={{
            top: beam.top,
            background: `linear-gradient(90deg, transparent, ${colors[i % colors.length]}, transparent)`,
            transform: `rotate(${beam.angle}deg)`,
            boxShadow: `0 0 15px ${colors[i % colors.length]}50`,
          }}
        />
      ))}
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const SoliciteProposta = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const storyPhases = useMemo(() => {
    const phases = t('proposal.storyPhases', { returnObjects: true });
    return Array.isArray(phases) ? phases : [];
  }, [t, i18n.language]);

  const services = useMemo(
    () => SERVICOS_CONFIG.map((service) => ({
      ...service,
      label: t(service.labelKey),
    })),
    [t, i18n.language]
  );

  // Capturar código do vendedor da URL (ex: ?v=joao ou ?vendedor=joao)
  const vendedorCodigo = searchParams.get('v') || searchParams.get('vendedor') || '';

  // Estados
  const [isMobile, setIsMobile] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(1); // 1-8 + success
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gridLines, setGridLines] = useState([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [storyComplete, setStoryComplete] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Tela 2 - Sobre o Imóvel
    nomeEmpreendimento: '',
    metragem: '',
    // Tela 3 - Planta/Projeto
    possuiPlanta: null, // true/false
    arquivoPlanta: null,
    arquivoPlantaNome: '',
    // Tela 4 - Projeto Arquitetônico
    possuiProjetoArquitetonico: null,
    // Tela 5 - Escopo da Reforma
    reformarTodosAmbientes: null,
    ambientesEspecificos: '',
    // Tela 6 - Serviços
    servicosSelecionados: [],
    // Tela 7 - Dados para Contato
    nome: '',
    email: '',
    telefone: '',
  });

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Storytelling - avança pelas fases
  useEffect(() => {
    if (cardOpen || storyComplete) return;

    const phase = storyPhases[currentPhase];
    if (!phase) {
      setStoryComplete(true);
      return;
    }

    const timer = setTimeout(() => {
      if (currentPhase < storyPhases.length - 1) {
        setCurrentPhase(prev => prev + 1);
      } else {
        setStoryComplete(true);
      }
    }, phase.duration);

    return () => clearTimeout(timer);
  }, [currentPhase, cardOpen, storyComplete]);

  // Focar no input quando mudar de tela
  useEffect(() => {
    if (cardOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentScreen, cardOpen]);

  // Função para adicionar linhas do grid (RAIOS)
  const addGridLines = useCallback((x, y) => {
    const newLines = createGridPattern(x, y);
    setGridLines(prev => [...prev, ...newLines]);

    setTimeout(() => {
      setGridLines(prev => prev.filter(l => !newLines.find(nl => nl.id === l.id)));
    }, 1000);
  }, []);

  // Handler de clique/toque - cria RAIOS
  const handleInteraction = useCallback((e) => {
    if (cardOpen) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY || 0) - rect.top;

    addGridLines(x, y);
  }, [cardOpen, addGridLines]);

  // Handler de digitação - cria efeito de RAIOS
  const handleTyping = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;

    const lines = [];
    for (let i = 0; i < 2; i++) {
      const angles = [0, 45, 90, 135, -45, -90];
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const color = GRID_COLORS[Math.floor(Math.random() * GRID_COLORS.length)];

      lines.push({
        id: `typing-${Date.now()}-${i}`,
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 100,
        angle,
        color,
        length: 60 + Math.random() * 80,
      });
    }

    setGridLines(prev => [...prev, ...lines]);

    setTimeout(() => {
      setGridLines(prev => prev.filter(l => !lines.find(nl => nl.id === l.id)));
    }, 800);
  }, []);

  // Formatar telefone (apenas números brasileiros)
  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');

    // Limita a 11 dígitos (formato brasileiro)
    const limitedNumbers = numbers.slice(0, 11);

    // Formato brasileiro: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
    if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  // Handler de mudança
  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === 'telefone') {
      formattedValue = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    handleTyping();
  };

  // Handler de arquivo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        arquivoPlanta: file,
        arquivoPlantaNome: file.name,
      }));
    }
  };

  // Toggle serviço
  const toggleServico = (servicoId) => {
    setFormData(prev => {
      const atual = prev.servicosSelecionados;
      if (atual.includes(servicoId)) {
        return { ...prev, servicosSelecionados: atual.filter(s => s !== servicoId) };
      }
      return { ...prev, servicosSelecionados: [...atual, servicoId] };
    });
    handleTyping();
  };

  // Próxima tela
  const nextScreen = () => {
    setCurrentScreen(prev => Math.min(prev + 1, 8));
  };

  // Tela anterior
  const prevScreen = () => {
    setCurrentScreen(prev => Math.max(prev - 1, 1));
  };

  // Enviar formulário
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!formData.nome.trim()) throw new Error(t('proposal.validation.name'));
      if (!formData.email.trim()) throw new Error(t('proposal.validation.email'));
      if (!formData.telefone.trim()) throw new Error(t('proposal.validation.phone'));

      // Montar descrição completa do projeto
      const servicosNomes = services
        .filter(s => formData.servicosSelecionados.includes(s.id))
        .map(s => s.label)
        .join(', ');

      const notProvided = t('proposal.summary.notProvided');
      const yesLabel = t('proposal.yes');
      const noLabel = t('proposal.no');
      const notSpecified = t('proposal.summary.notSpecified');
      const selectedServicesLabel = servicosNomes || t('proposal.summary.noServices');

      const descricaoCompleta = [
        t('proposal.summary.projectName', { value: formData.nomeEmpreendimento || notProvided }),
        t('proposal.summary.area', { value: formData.metragem ? `${formData.metragem}m²` : notProvided }),
        t('proposal.summary.hasFloorplan', {
          value: formData.possuiPlanta === true ? yesLabel : formData.possuiPlanta === false ? noLabel : notProvided
        }),
        t('proposal.summary.hasArchitecture', {
          value: formData.possuiProjetoArquitetonico === true ? yesLabel : formData.possuiProjetoArquitetonico === false ? noLabel : notProvided
        }),
        t('proposal.summary.renovationScope', {
          value: formData.reformarTodosAmbientes === true
            ? yesLabel
            : formData.reformarTodosAmbientes === false
              ? `${noLabel} - ${formData.ambientesEspecificos || notSpecified}`
              : notProvided
        }),
        t('proposal.summary.services', { value: selectedServicesLabel }),
        vendedorCodigo ? `Vendedor: ${vendedorCodigo}` : '',
      ].filter(Boolean).join(' | ');

      // Definir origem: se tiver código de vendedor, indicar
      const origemProposta = vendedorCodigo ? `site-vendedor:${vendedorCodigo}` : 'site';

      const { error } = await supabase.from('propostas_solicitadas').insert([{
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        tipo_imovel: formData.nomeEmpreendimento || notProvided,
        area_aproximada: formData.metragem || notProvided,
        descricao_projeto: descricaoCompleta,
        origem: origemProposta,
        status: 'nova',
      }]);

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      toast({ variant: 'destructive', title: t('proposal.validation.errorTitle'), description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Tecla Enter avança
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentScreen === 7) {
        nextScreen();
      } else if (currentScreen < 8) {
        nextScreen();
      }
    }
  };

  const cloudinaryVideoUrl = 'https://res.cloudinary.com/dkkj9mpqv/video/upload/wgalmeida/hero-horizontal.mp4';
  const currentStory = storyPhases[currentPhase] || storyPhases[storyPhases.length - 1] || {};
  const totalScreens = 8;

  // Renderizar conteúdo da tela atual
  const renderScreenContent = () => {
    switch (currentScreen) {
      // TELA 2 - Sobre o Imóvel
      case 2:
        return (
          <motion.div
            key="screen-2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-8">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.verde}30` }}
              >
                <Building className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.verde }} />
              </div>
              <h2
                className="text-xl md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.property.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.property.subtitle')}</p>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="text-white/70 text-xs md:text-sm mb-1 md:mb-2 block">{t('proposal.screens.property.nameLabel')}</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.nomeEmpreendimento}
                  onChange={(e) => handleChange('nomeEmpreendimento', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('proposal.screens.property.namePlaceholder')}
                  className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl text-white text-base md:text-lg placeholder-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = WG_COLORS.verde}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>

              <div>
                <label className="text-white/70 text-xs md:text-sm mb-1 md:mb-2 block">{t('proposal.screens.property.areaLabel')}</label>
                <input
                  type="text"
                  value={formData.metragem}
                  onChange={(e) => handleChange('metragem', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('proposal.screens.property.areaPlaceholder')}
                  className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl text-white text-base md:text-lg placeholder-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = WG_COLORS.verde}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>
            </div>
          </motion.div>
        );

      // TELA 3 - Planta ou Projeto
      case 3:
        return (
          <motion.div
            key="screen-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-8">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.azul}30` }}
              >
                <FileText className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.azul }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.floorplan.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.floorplan.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <motion.button
                onClick={() => handleChange('possuiPlanta', true)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.possuiPlanta === true
                    ? `${WG_COLORS.verde}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.possuiPlanta === true ? WG_COLORS.verde : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: formData.possuiPlanta === true ? WG_COLORS.verde : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.yes')}</span>
              </motion.button>

              <motion.button
                onClick={() => handleChange('possuiPlanta', false)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.possuiPlanta === false
                    ? `${WG_COLORS.laranja}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.possuiPlanta === false ? WG_COLORS.laranja : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-8 h-8 mx-auto mb-2" style={{ color: formData.possuiPlanta === false ? WG_COLORS.laranja : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.no')}</span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {formData.possuiPlanta === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-4 rounded-xl border-2 border-dashed text-center cursor-pointer hover:border-white/30 transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.15)' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.dwg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-white/50" />
                    {formData.arquivoPlantaNome ? (
                      <p className="text-white">{formData.arquivoPlantaNome}</p>
                    ) : (
                      <>
                        <p className="text-white/70">{t('proposal.screens.floorplan.uploadPrompt')}</p>
                        <p className="text-white/40 text-sm mt-1">{t('proposal.screens.floorplan.uploadFormats')}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {formData.possuiPlanta === false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-5 rounded-xl"
                    style={{ background: `${WG_COLORS.verde}15`, border: `1px solid ${WG_COLORS.verde}30` }}
                  >
                    <p className="text-white/80 text-center leading-relaxed">
                      <span className="block text-lg mb-2" style={{ color: WG_COLORS.verde }}>
                        {t('proposal.screens.floorplan.noPlanTitle')}
                      </span>
                      {t('proposal.screens.floorplan.noPlanDescription')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // TELA 4 - Projeto Arquitetônico
      case 4:
        return (
          <motion.div
            key="screen-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-8">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.marrom}30` }}
              >
                <Ruler className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.marrom }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.architecture.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.architecture.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <motion.button
                onClick={() => handleChange('possuiProjetoArquitetonico', true)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.possuiProjetoArquitetonico === true
                    ? `${WG_COLORS.verde}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.possuiProjetoArquitetonico === true ? WG_COLORS.verde : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: formData.possuiProjetoArquitetonico === true ? WG_COLORS.verde : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.yes')}</span>
              </motion.button>

              <motion.button
                onClick={() => handleChange('possuiProjetoArquitetonico', false)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.possuiProjetoArquitetonico === false
                    ? `${WG_COLORS.laranja}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.possuiProjetoArquitetonico === false ? WG_COLORS.laranja : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <X className="w-8 h-8 mx-auto mb-2" style={{ color: formData.possuiProjetoArquitetonico === false ? WG_COLORS.laranja : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.no')}</span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {formData.possuiProjetoArquitetonico === false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-5 rounded-xl"
                    style={{ background: `${WG_COLORS.verde}15`, border: `1px solid ${WG_COLORS.verde}30` }}
                  >
                    <p className="text-white/80 text-center leading-relaxed">
                      <span className="block text-lg mb-2" style={{ color: WG_COLORS.verde }}>
                        {t('proposal.screens.architecture.noProjectTitle')}
                      </span>
                      {t('proposal.screens.architecture.noProjectDescription')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // TELA 5 - Escopo da Reforma
      case 5:
        return (
          <motion.div
            key="screen-5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-8">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.laranja}30` }}
              >
                <Home className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.laranja }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.scope.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.scope.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
              <motion.button
                onClick={() => handleChange('reformarTodosAmbientes', true)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.reformarTodosAmbientes === true
                    ? `${WG_COLORS.verde}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.reformarTodosAmbientes === true ? WG_COLORS.verde : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: formData.reformarTodosAmbientes === true ? WG_COLORS.verde : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.screens.scope.all')}</span>
              </motion.button>

              <motion.button
                onClick={() => handleChange('reformarTodosAmbientes', false)}
                className="p-3 md:p-5 rounded-lg md:rounded-xl text-center transition-all"
                style={{
                  background: formData.reformarTodosAmbientes === false
                    ? `${WG_COLORS.azul}30`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${formData.reformarTodosAmbientes === false ? WG_COLORS.azul : 'rgba(255,255,255,0.1)'}`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: formData.reformarTodosAmbientes === false ? WG_COLORS.azul : 'rgba(255,255,255,0.5)' }} />
                <span className="text-white text-lg">{t('proposal.screens.scope.some')}</span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {formData.reformarTodosAmbientes === false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-white/70 text-sm mb-2 block">{t('proposal.screens.scope.detailsLabel')}</label>
                  <textarea
                    value={formData.ambientesEspecificos}
                    onChange={(e) => handleChange('ambientesEspecificos', e.target.value)}
                    placeholder={t('proposal.screens.scope.detailsPlaceholder')}
                    rows={3}
                    className="w-full px-5 py-4 rounded-xl text-white text-lg placeholder-white/30 outline-none resize-none transition-all"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: `2px solid rgba(255,255,255,0.15)`,
                    }}
                    onFocus={(e) => e.target.style.borderColor = WG_COLORS.azul}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      // TELA 6 - Serviços
      case 6:
        return (
          <motion.div
            key="screen-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-6">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.dourado}30` }}
              >
                <Hammer className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.dourado }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.services.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.services.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {services.map((servico) => {
                const IconComponent = servico.icon;
                const isSelected = formData.servicosSelecionados.includes(servico.id);
                return (
                  <motion.button
                    key={servico.id}
                    onClick={() => toggleServico(servico.id)}
                    className="p-3 md:p-4 rounded-lg md:rounded-xl text-center transition-all"
                    style={{
                      background: isSelected ? `${servico.color}30` : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isSelected ? servico.color : 'rgba(255,255,255,0.1)'}`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent
                      className="w-6 h-6 mx-auto mb-2"
                      style={{ color: isSelected ? servico.color : 'rgba(255,255,255,0.5)' }}
                    />
                    <span className="text-white text-sm">{servico.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {formData.servicosSelecionados.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm"
                style={{ color: WG_COLORS.verde }}
              >
                {t('proposal.servicesSelected', { count: formData.servicosSelecionados.length })}
              </motion.p>
            )}
          </motion.div>
        );

      // TELA 7 - Dados para Contato
      case 7:
        return (
          <motion.div
            key="screen-7"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-6">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.verde}30` }}
              >
                <User className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.verde }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.screens.contact.title')}
              </h2>
              <p className="text-white/50 text-xs md:text-sm mt-1 md:mt-2">{t('proposal.screens.contact.subtitle')}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                  <User className="w-4 h-4" /> {t('proposal.screens.contact.nameLabel')}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('proposal.screens.contact.namePlaceholder')}
                  className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl text-white text-base md:text-lg placeholder-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = WG_COLORS.verde}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>

              <div>
                <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {t('proposal.screens.contact.emailLabel')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('proposal.screens.contact.emailPlaceholder')}
                  className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl text-white text-base md:text-lg placeholder-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = WG_COLORS.verde}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>

              <div>
                <label className="text-white/70 text-sm mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4" /> {t('proposal.screens.contact.phoneLabel')}
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('proposal.screens.contact.phonePlaceholder')}
                  maxLength={15}
                  className="w-full px-4 py-3 md:px-5 md:py-4 rounded-lg md:rounded-xl text-white text-base md:text-lg placeholder-white/30 outline-none transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `2px solid rgba(255,255,255,0.15)`,
                  }}
                  onFocus={(e) => e.target.style.borderColor = WG_COLORS.verde}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
              </div>
            </div>
          </motion.div>
        );

      // TELA 8 - Confirmação
      case 8:
        return (
          <motion.div
            key="screen-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4 md:space-y-6"
          >
            <div className="text-center mb-4 md:mb-6">
              <div
                className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-xl md:rounded-2xl flex items-center justify-center"
                style={{ background: `${WG_COLORS.laranja}30` }}
              >
                <ClipboardCheck className="w-6 h-6 md:w-8 md:h-8" style={{ color: WG_COLORS.laranja }} />
              </div>
              <h2
                className="text-lg md:text-3xl font-light text-white"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {t('proposal.confirmation.title')}
              </h2>
            </div>

            {/* Resumo */}
            <div
              className="p-5 rounded-xl space-y-3"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{t('proposal.confirmation.projectName')}</span>
                <span className="text-white">{formData.nomeEmpreendimento || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{t('proposal.confirmation.area')}</span>
                <span className="text-white">{formData.metragem ? `${formData.metragem}m²` : '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{t('proposal.confirmation.services')}</span>
                <span className="text-white text-right max-w-[60%]">
                  {formData.servicosSelecionados.length > 0
                    ? services.filter(s => formData.servicosSelecionados.includes(s.id)).map(s => s.label).join(', ')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">{t('proposal.confirmation.contact')}</span>
                <span className="text-white">{formData.nome || '-'}</span>
              </div>
            </div>

            {/* Mensagem de 48h */}
            <div
              className="p-5 rounded-xl text-center"
              style={{ background: `${WG_COLORS.verde}15`, border: `1px solid ${WG_COLORS.verde}30` }}
            >
              <p className="text-white/90 leading-relaxed">
                <span className="block text-lg mb-2" style={{ color: WG_COLORS.verde }}>
                  {t('proposal.confirmation.responseTitle')}
                </span>
                {t('proposal.confirmation.responseDescription')}
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('seo.proposal.title')}</title>
        <meta name="description" content={t('seo.proposal.description')} />
      </Helmet>

      <div
        ref={containerRef}
        className="fixed inset-0 w-full h-full overflow-hidden -mt-20"
        onClick={handleInteraction}
        onTouchStart={handleInteraction}
      >
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 z-0">
          <iframe
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '177.78vh',
              height: '100vh',
              minWidth: '100%',
              minHeight: '56.25vw',
            }}
            src={cloudinaryVideoUrl}
            title="WG Almeida Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div
            className="absolute inset-0"
            style={{
              background: cardOpen
                ? 'rgba(0,0,0,0.15)'
                : 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 80%)'
            }}
          />
        </div>

        {/* Traços de luz contínuos */}
        <ContinuousLightBeams />

        {/* Partículas douradas */}
        <GoldenParticles count={20} />

        {/* Linhas do Grid interativas (RAIOS) */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {gridLines.map(line => (
              <GridLine key={line.id} {...line} />
            ))}
          </AnimatePresence>
        </div>

        {/* STORYTELLING - quando card fechado */}
        <AnimatePresence>
          {!cardOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8"
            >
              <div className="text-center max-w-4xl">
                <AnimatePresence mode="wait">
                  {currentStory.type === 'services' ? (
                    <motion.div
                      key="phase-services"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 0.8 }}
                      className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8"
                    >
                      {currentStory.lines.map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="flex items-center gap-4"
                        >
                          <span
                            className="text-white text-xl md:text-3xl tracking-widest uppercase"
                            style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                          >
                            {item}
                          </span>
                          {i < currentStory.lines.length - 1 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.4 + i * 0.1 }}
                              className="hidden md:block w-2 h-2 rounded-full"
                              style={{ background: WG_COLORS.laranja }}
                            />
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`phase-${currentPhase}`}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {currentStory.lines.map((line, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="text-white text-3xl md:text-5xl lg:text-6xl font-light leading-tight"
                          style={{
                            fontFamily: '"Playfair Display", serif',
                            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
                            color: i === currentStory.lines.length - 1 && !currentStory.subtitle ? WG_COLORS.laranja : 'white'
                          }}
                        >
                          {line}
                        </motion.p>
                      ))}

                      {currentStory.subtitle && (
                        <motion.p
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="mt-4 text-xl md:text-2xl font-light"
                          style={{ color: WG_COLORS.laranja, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
                        >
                          {currentStory.subtitle}
                        </motion.p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1 }}
                className="absolute bottom-32 text-white text-sm tracking-widest"
              >
                {t('proposal.storytelling.tapToInteract')}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão CTA - "Começar agora" */}
        <AnimatePresence>
          {!cardOpen && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="absolute bottom-8 left-0 right-0 z-20 flex justify-center px-4"
            >
              <motion.button
                onClick={(e) => { e.stopPropagation(); setCardOpen(true); setCurrentScreen(2); }}
                className="group flex items-center gap-3 px-10 py-4 rounded-full backdrop-blur-sm border transition-all duration-500"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="w-5 h-5 text-white/70" />
                <span className="text-white/80 text-lg tracking-wide">{t('proposal.storytelling.startNow')}</span>
                <ChevronRight className="w-5 h-5 text-white/50" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card de formulário */}
        <AnimatePresence>
          {cardOpen && !success && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-30 flex items-center justify-center p-2 md:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="w-full max-w-md md:max-w-xl rounded-2xl md:rounded-3xl border shadow-2xl overflow-hidden max-h-[85vh] md:max-h-[90vh] flex flex-col"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Header com progresso */}
                <div className="p-3 md:p-6 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <button
                      onClick={() => currentScreen > 2 ? prevScreen() : setCardOpen(false)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <span className="text-white/50 text-xs md:text-sm">
                      {t('proposal.navigation.progress', { current: currentScreen - 1, total: totalScreens - 1 })}
                    </span>
                    <button
                      onClick={() => setCardOpen(false)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                  {/* Barra de progresso */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: WG_COLORS.laranja }}
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentScreen - 1) / (totalScreens - 1)) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Conteúdo da tela atual */}
                <div className="p-3 md:p-6 overflow-y-auto flex-1">
                  <AnimatePresence mode="wait">
                    {renderScreenContent()}
                  </AnimatePresence>
                </div>

                {/* Navegação */}
                <div className="p-3 md:p-6 border-t flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={prevScreen}
                      disabled={currentScreen <= 2}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>{t('proposal.navigation.back')}</span>
                    </button>

                    {currentScreen === 8 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={loading || !formData.nome || !formData.email || !formData.telefone}
                        className="px-8 py-4 rounded-xl text-lg font-medium text-white"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                        }}
                      >
                        {loading ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('proposal.navigation.sending')}</>
                        ) : (
                          <><Send className="mr-2 w-5 h-5" /> {t('proposal.navigation.submit')}</>
                        )}
                      </Button>
                    ) : (
                      <motion.button
                        onClick={nextScreen}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium"
                        style={{ background: WG_COLORS.laranja }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>{t('proposal.navigation.next')}</span>
                        <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TELA FINAL - Sucesso */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderColor: 'rgba(255,255,255,0.15)',
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 25 }}
              >
                <div className="text-center py-12 px-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <div
                      className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${WG_COLORS.verde}, ${WG_COLORS.azul})` }}
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  <h3
                    className="text-3xl md:text-4xl font-light text-white mb-4"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    <Trans i18nKey="proposal.success.title">
                      Solicitacao <span style={{ color: WG_COLORS.verde }}>Enviada!</span>
                    </Trans>
                  </h3>

                  <p className="text-white/60 text-lg mb-8 leading-relaxed">
                    <Trans i18nKey="proposal.success.description">
                      Obrigado pelo interesse! Nossa equipe entrara em contato em ate <strong className="text-white">48 horas</strong> para dar inicio ao seu projeto.
                    </Trans>
                  </p>

                  <div className="space-y-4">
                    {/* Links para Instagram e Site */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href="https://www.instagram.com/grupowgalmeida"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)',
                        }}
                      >
                        <Instagram className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">{t('proposal.success.instagram')}</span>
                      </a>

                      <a
                        href="https://wgalmeida.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl transition-all hover:scale-105"
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <Globe className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">{t('proposal.success.website')}</span>
                      </a>
                    </div>

                    <button
                      onClick={() => {
                        setSuccess(false);
                        setCardOpen(false);
                        setCurrentScreen(1);
                        setFormData({
                          nomeEmpreendimento: '', metragem: '', possuiPlanta: null,
                          arquivoPlanta: null, arquivoPlantaNome: '', possuiProjetoArquitetonico: null,
                          reformarTodosAmbientes: null, ambientesEspecificos: '',
                          servicosSelecionados: [], nome: '', email: '', telefone: '',
                        });
                      }}
                      className="text-white/50 hover:text-white transition-colors text-sm mt-4"
                    >
                      {t('proposal.success.backToStart')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default SoliciteProposta;
