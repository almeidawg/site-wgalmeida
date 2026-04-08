import React, { useEffect, useMemo, useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle,
  Clock3,
  DoorOpen,
  FileText,
  FolderOpen,
  Hammer,
  Lightbulb,
  MessagesSquare,
  Monitor,
  PenTool,
  Ruler,
  Users,
} from 'lucide-react';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';
import { SCHEMAS } from '@/data/schemaConfig';

const TIMELINE_CONTENT = {
  pt: {
    heroTitle: 'Timeline da Obra',
    heroSubtitle:
      'Escolha o tipo de projeto, ajuste a metragem e visualize uma linha do tempo clara, elegante e orientada por método.',
    selectorKicker: 'Planejamento inteligente',
    selectorTitle: 'Veja a obra ganhar ritmo antes mesmo do primeiro passo.',
    selectorSubtitle:
      'A experiência abaixo traduz nossa metodologia em uma leitura simples: tipo de projeto, faixa de metragem, estimativas de duração e sequência de execução.',
    reform: 'Reforma',
    build: 'Construção',
    areaLabel: 'Metragem estimada',
    summaryDuration: 'Estimativa total',
    summaryStages: 'Macroetapas',
    summaryFocus: 'Foco da jornada',
    summaryRange: 'Faixa analisada',
    stageListLabel: 'Etapas principais',
    stagePanelLabel: 'Detalhamento da etapa',
    estimatedDataLabel: 'Leitura estimativa',
    estimatedDataText:
      'Os tempos desta tela são estimativas orientativas. Eles variam conforme metragem, escopo, disponibilidade das equipes, nível de definição do cliente e dinâmica da obra.',
    durationUnit: 'semanas',
    areaUnit: 'm²',
    ctaTitle: 'Quer transformar essa estimativa em um cronograma real para o seu imóvel?',
    ctaText:
      'A partir do briefing, da metragem e do escopo do projeto, estruturamos a sequência executiva, as aprovações e a coordenação técnica com muito mais previsibilidade.',
    ctaPrimary: 'Solicitar proposta',
    ctaSecondary: 'Falar com a equipe',
    focusReform: 'estimativas para compatibilização, obra em imóvel existente e decisões ao longo da execução',
    focusBuild: 'estimativas para planejamento integral, aprovações, estrutura e entregas em sequência controlada',
    reformStages: [
      {
        icon: Lightbulb,
        title: 'Diagnóstico e briefing',
        summary: 'Levantamento, entendimento da rotina e leitura técnica do imóvel.',
        detail:
          'Consolidamos necessidades, restrições do imóvel, orçamento e prioridades para definir o caminho da reforma com clareza.',
        tasks: [
          { title: 'Levantamento e medição do imóvel', note: 'Base contratual do WGEasy: leitura física e normativa.', eta: '3 a 7 dias úteis' },
          { title: 'Briefing de necessidades e rotina', note: 'Mapeamento de prioridades, dores e nível de decisão do cliente.', eta: '3 a 5 dias úteis' },
          { title: 'Planta de situação inicial', note: 'Síntese técnica para orientar conceito, escopo e próximos estudos.', eta: '3 a 5 dias úteis' },
        ],
        baseWeeks: 1.2,
        accent: {
          card: 'bg-[#f3f8f7] shadow-[inset_0_0_0_1px_rgba(94,155,148,0.14)]',
          icon: 'bg-[#e1f0ed] text-wg-green',
          active: 'bg-[#5e9b94] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: PenTool,
        title: 'Conceito e projeto',
        summary: 'Estudo, layout, materiais e decisões técnicas.',
        detail:
          'Transformamos o briefing em projeto coerente, com linguagem, fluxos, detalhamentos e compatibilização entre disciplinas.',
        tasks: [
          { title: 'Estudo preliminar e conceito', note: 'Materialização da ideia, linguagem e fluxos do ambiente.', eta: '1 a 2 semanas' },
          { title: 'Anteprojeto com layout e materiais', note: 'Definição espacial, revestimentos e diretrizes de marcenaria.', eta: '2 a 4 semanas' },
          { title: 'Projeto executivo e detalhamentos', note: 'Conjunto técnico para orientar orçamento, compras e obra.', eta: '3 a 5 semanas' },
        ],
        baseWeeks: 3.1,
        accent: {
          card: 'bg-[#f3f8f7] shadow-[inset_0_0_0_1px_rgba(94,155,148,0.14)]',
          icon: 'bg-[#e1f0ed] text-wg-green',
          active: 'bg-[#4f867f] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: FileText,
        title: 'Orçamento e planejamento',
        summary: 'Escopo, contratações e cronograma executivo.',
        detail:
          'Definimos frentes, sequências, quantitativos e marcos de obra para reduzir improviso e dar previsibilidade ao investimento.',
        tasks: [
          { title: 'EVF e estimativa de custos', note: 'Leitura financeira preliminar para validar escopo e investimento.', eta: '1 a 2 semanas' },
          { title: 'Orçamento executivo por frentes', note: 'Composição de fornecedores, compras e mão de obra.', eta: '2 a 4 semanas' },
          { title: 'Planejamento de execução por m²', note: 'Sequência física da reforma conforme escopo e metragem.', eta: '6 a 9 semanas' },
        ],
        baseWeeks: 7.4,
        accent: {
          card: 'bg-[#f4f7fb] shadow-[inset_0_0_0_1px_rgba(123,151,187,0.16)]',
          icon: 'bg-[#e7edf6] text-wg-blue',
          active: 'bg-[#395b81] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: Hammer,
        title: 'Execução da obra',
        summary: 'Demolições, infraestrutura, acabamentos e coordenação.',
        detail:
          'Acompanhamos a obra por etapas, decisões de campo, compras, instalações e acabamentos até a maturidade da execução.',
        tasks: [
          { title: 'Demolição e preparação do canteiro', note: 'Proteções, descarte e preparação do espaço para intervenção.', eta: '3 dias a 1 semana' },
          { title: 'Infraestrutura e instalações', note: 'Elétrica, hidráulica, bases e compatibilizações de campo.', eta: '2 a 5 semanas' },
          { title: 'Acabamentos e coordenação final', note: 'Revestimentos, pintura, louças, metais e ajustes executivos.', eta: '3 a 6 semanas' },
        ],
        baseWeeks: 9.6,
        accent: {
          card: 'bg-[#f3f6fb] shadow-[inset_0_0_0_1px_rgba(123,151,187,0.16)]',
          icon: 'bg-[#e2eaf5] text-wg-blue',
          active: 'bg-[#2f537c] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: DoorOpen,
        title: 'Marcenaria e acabamento final',
        summary: 'Instalações finais, ajustes finos e ambientação.',
        detail:
          'Entram marcenaria, peças finais, regulagens, testes e refinamentos que elevam a qualidade percebida da entrega.',
        tasks: [
          { title: 'Medição executiva inicial', note: 'Conferência técnica final quando o imóvel está liberado para medição.', eta: '10 a 15 dias' },
          { title: 'Produção e fabricação', note: 'Execução sob medida conforme projeto aprovado e agenda fabril.', eta: '56 a 70 dias corridos' },
          { title: 'Instalação, regulagem e acabamento', note: 'Montagem, alinhamento, testes e acabamento fino.', eta: '7 a 14 dias corridos' },
        ],
        baseWeeks: 4.2,
        accent: {
          card: 'bg-[#fbf6f2] shadow-[inset_0_0_0_1px_rgba(208,171,142,0.16)]',
          icon: 'bg-[#f3e8df] text-wg-orange-text',
          active: 'bg-[#8f5238] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: CheckCircle,
        title: 'Entrega assistida',
        summary: 'Checklist, documentação e fechamento da jornada.',
        detail:
          'Concluímos com conferência, arremates, orientação de uso e fechamento técnico da entrega.',
        tasks: [
          { title: 'Vistoria final com apontamentos', note: 'Leitura conjunta do que precisa de ajuste antes do aceite.', eta: '2 a 4 dias úteis' },
          { title: 'Inspeção e correções finais', note: 'Arremates, testes e checagens de funcionamento.', eta: '3 a 5 dias úteis' },
          { title: 'Termo de aceite e orientações', note: 'Entrega assistida, documentação e fechamento da jornada.', eta: '1 a 3 dias úteis' },
        ],
        baseWeeks: 1.4,
        accent: {
          card: 'bg-[#f8f7f5] shadow-[inset_0_0_0_1px_rgba(46,46,46,0.08)]',
          icon: 'bg-black/5 text-wg-black',
          active: 'bg-[#2f2c29] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
    ],
    buildStages: [
      {
        icon: Lightbulb,
        title: 'Estratégia e viabilidade',
        summary: 'Programa, terreno, premissas e direcionamento do investimento.',
        detail:
          'Estruturamos o cenário inicial com leitura de terreno, escopo, perfil de uso e condicionantes que definem a construção.',
        tasks: [
          { title: 'Leitura do terreno e condicionantes', note: 'Premissas físicas, legais e urbanísticas para viabilidade.', eta: '4 a 7 dias úteis' },
          { title: 'Programa de necessidades', note: 'Rotina, volumetria e escopo desejado para a construção.', eta: '3 a 5 dias úteis' },
          { title: 'Direcionamento de investimento', note: 'Faixa preliminar de porte, prazo e complexidade.', eta: '3 a 5 dias úteis' },
        ],
        baseWeeks: 2.1,
        accent: {
          card: 'bg-[#f3f8f7] shadow-[inset_0_0_0_1px_rgba(94,155,148,0.14)]',
          icon: 'bg-[#e1f0ed] text-wg-green',
          active: 'bg-[#5e9b94] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: PenTool,
        title: 'Projeto integrado',
        summary: 'Arquitetura, engenharia e compatibilização.',
        detail:
          'Convergimos arquitetura, estrutura e instalações em um pacote técnico capaz de guiar a execução sem ruído desnecessário.',
        tasks: [
          { title: 'Estudo preliminar e implantação', note: 'Conceito do projeto, implantação e partido arquitetônico.', eta: '2 a 3 semanas' },
          { title: 'Projetos complementares', note: 'Estrutural, instalações e demais disciplinas técnicas.', eta: '3 a 6 semanas' },
          { title: 'Compatibilização e executivo', note: 'Consolidação técnica para orientar obra e contratação.', eta: '3 a 5 semanas' },
        ],
        baseWeeks: 5.8,
        accent: {
          card: 'bg-[#f3f8f7] shadow-[inset_0_0_0_1px_rgba(94,155,148,0.14)]',
          icon: 'bg-[#e1f0ed] text-wg-green',
          active: 'bg-[#4f867f] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: FileText,
        title: 'Aprovações e preparação',
        summary: 'Documentação, orçamento e contratação.',
        detail:
          'Entram aprovações, planejamento físico-financeiro, definição de fornecedores e preparação executiva da obra.',
        tasks: [
          { title: 'Projeto legal e aprovações', note: 'Protocolos, documentos e encaminhamentos regulatórios.', eta: '2 a 4 semanas' },
          { title: 'EVF e orçamento executivo', note: 'Estimativa financeira e composição por frentes de execução.', eta: '2 a 3 semanas' },
          { title: 'Plano físico-financeiro', note: 'Sequência, suprimentos e preparação de contratação.', eta: '6 a 9 semanas' },
        ],
        baseWeeks: 7.8,
        accent: {
          card: 'bg-[#f4f7fb] shadow-[inset_0_0_0_1px_rgba(123,151,187,0.16)]',
          icon: 'bg-[#e7edf6] text-wg-blue',
          active: 'bg-[#395b81] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: Hammer,
        title: 'Estrutura e obra principal',
        summary: 'Fundação, estrutura, vedações e instalações.',
        detail:
          'É a fase mais intensa da construção, com frentes estruturais e técnicas coordenadas em sequência precisa.',
        tasks: [
          { title: 'Fundação e estrutura', note: 'Base da obra, contenções, estrutura e estabilidade.', eta: '4 a 8 semanas' },
          { title: 'Vedações e instalações principais', note: 'Alvenarias, infraestrutura e sistemas técnicos.', eta: '4 a 7 semanas' },
          { title: 'Preparação para acabamentos', note: 'Regularizações e consolidação das frentes principais.', eta: '3 a 5 semanas' },
        ],
        baseWeeks: 15.8,
        accent: {
          card: 'bg-[#f3f6fb] shadow-[inset_0_0_0_1px_rgba(123,151,187,0.16)]',
          icon: 'bg-[#e2eaf5] text-wg-blue',
          active: 'bg-[#2f537c] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: Users,
        title: 'Acabamentos e marcenaria',
        summary: 'Revestimentos, marcenaria, louças, metais e ajustes.',
        detail:
          'Concentramos os acabamentos finais, as entregas sob medida e a leitura estética da obra com controle de qualidade.',
        tasks: [
          { title: 'Revestimentos e acabamentos finos', note: 'Pisos, paredes, pintura, louças e metais.', eta: '2 a 4 semanas' },
          { title: 'Medição, produção e instalação de marcenaria', note: 'Ciclo sob medida com medição executiva, fabricação e montagem.', eta: '70 a 90 dias corridos' },
          { title: 'Ambientação e ajustes finais', note: 'Fechamento estético e qualidade percebida da entrega.', eta: '1 a 2 semanas' },
        ],
        baseWeeks: 4.2,
        accent: {
          card: 'bg-[#fbf6f2] shadow-[inset_0_0_0_1px_rgba(208,171,142,0.16)]',
          icon: 'bg-[#f3e8df] text-wg-orange-text',
          active: 'bg-[#8f5238] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
      {
        icon: CheckCircle,
        title: 'Comissionamento e entrega',
        summary: 'Testes, checklist, documentação e entrega final.',
        detail:
          'A obra chega ao fechamento com verificações, testes, registros finais e preparação para ocupação.',
        tasks: [
          { title: 'Comissionamento dos sistemas', note: 'Testes e verificação de funcionamento dos principais itens.', eta: '3 a 5 dias úteis' },
          { title: 'Checklist e inspeção final', note: 'Ajustes, pendências e validação técnica da entrega.', eta: '3 a 5 dias úteis' },
          { title: 'Entrega e ocupação assistida', note: 'Aceite, documentação e orientação para uso inicial.', eta: '1 a 3 dias úteis' },
        ],
        baseWeeks: 2.3,
        accent: {
          card: 'bg-[#f9f8f6] shadow-[inset_0_0_0_1px_rgba(46,46,46,0.08)]',
          icon: 'bg-black/5 text-wg-black',
          active: 'bg-[#2f2c29] text-white shadow-[0_16px_45px_rgba(18,18,18,0.14)]',
        },
      },
    ],
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatArea(value) {
  return `${Math.round(value)} m²`;
}

function formatWeeks(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

function formatDurationLabel(value) {
  if (value < 1) {
    const days = Math.max(3, Math.round(value * 7));
    return `${days} dias`;
  }

  if (value === 1) {
    return '1 semana';
  }

  const rounded = Math.round(value);
  return `${rounded} semanas`;
}

function formatDurationRange(minValue, maxValue) {
  const safeMin = Math.max(0.4, minValue);
  const safeMax = Math.max(safeMin, maxValue);
  return `de ${formatDurationLabel(safeMin)} a ${formatDurationLabel(safeMax)}`;
}

function areaProfile(area, projectType) {
  const maxArea = 500;
  const minArea = 20;
  const normalized = (clamp(area, minArea, maxArea) - minArea) / (maxArea - minArea);
  const factor = projectType === 'reform' ? 0.7 + normalized * 0.95 : 0.76 + normalized * 1.12;

  if (normalized < 0.24) return { label: 'compacta', factor };
  if (normalized < 0.52) return { label: 'intermediária', factor };
  if (normalized < 0.8) return { label: 'ampla', factor };
  return { label: 'especial', factor };
}

const Process = () => {
  const { t, i18n } = useTranslation();
  const copy = TIMELINE_CONTENT[i18n.language?.startsWith('pt') ? 'pt' : 'pt'];
  const [projectType, setProjectType] = useState('reform');
  const [area, setArea] = useState(160);
  const [leadName, setLeadName] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadEmail, setLeadEmail] = useState('');

  const profile = areaProfile(area, projectType);
  const stages = projectType === 'reform' ? copy.reformStages : copy.buildStages;
  const [activeStage, setActiveStage] = useState(0);
  const stageIndex = clamp(activeStage, 0, stages.length - 1);
  const currentStage = stages[stageIndex];
  const minProfile = areaProfile(20, projectType);
  const maxProfile = areaProfile(500, projectType);
  const adjustedStages = stages.map((stage) => ({
    ...stage,
    duration: Math.max(0.8, Math.round(stage.baseWeeks * profile.factor * 2) / 2),
    durationRange: formatDurationRange(
      stage.baseWeeks * minProfile.factor,
      stage.baseWeeks * maxProfile.factor
    ),
  }));
  const totalDuration = adjustedStages.reduce((sum, stage) => sum + stage.duration, 0);

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['c', 'p', 's', 'u'].includes(key)) {
        event.preventDefault();
      }
    };
    const onContextMenu = (event) => event.preventDefault();
    const onBeforePrint = () => {
      if (typeof window !== 'undefined') {
        window.alert('A visualização deste estudo é compartilhada pela equipe WG Almeida.');
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('beforeprint', onBeforePrint);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('beforeprint', onBeforePrint);
    };
  }, []);

  const leadWhatsappHref = useMemo(() => {
    const summary = [
      `Olá, equipe WG Almeida.`,
      `Quero receber o estudo inicial da Timeline da Obra e avançar para o EVF.`,
      `Nome: ${leadName || 'não informado'}`,
      `WhatsApp: ${leadWhatsapp || 'não informado'}`,
      `E-mail: ${leadEmail || 'não informado'}`,
      `Projeto: ${projectType === 'reform' ? copy.reform : copy.build}`,
      `Metragem estimada: ${formatArea(area)}`,
      `Duração estimada: ${formatWeeks(totalDuration)}`,
    ].join('\n');

    return `https://wa.me/5511999999999?text=${encodeURIComponent(summary)}`;
  }, [area, copy.build, copy.reform, leadEmail, leadName, leadWhatsapp, projectType, totalDuration]);

  return (
    <>
      <SEO pathname="/processo" schema={SCHEMAS.breadcrumbProcess} />

      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('processPage.hero.imageAlt')}
            src="/images/banners/PROCESSOS.webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/60 to-wg-black/80"></div>
        </motion.div>

        <div className="relative z-10 container-custom h-full px-4">
          <div className="flex h-full flex-col justify-center text-center text-white">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="mb-4 block text-[12px] md:text-[13px] uppercase tracking-[0.18em] text-white/74 font-light"
            >
              {copy.selectorKicker}
            </motion.span>
            <motion.div
              className="mb-8 flex items-center justify-center gap-4"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/70" />
              <div className="h-2 w-2 rounded-full bg-white/80" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/70" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-7xl font-inter font-light tracking-tight"
            >
              {copy.heroTitle}
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute inset-x-4 bottom-1 md:bottom-2 text-center text-[17px] md:text-[19px] text-white font-light max-w-3xl mx-auto leading-relaxed"
          >
            {copy.heroSubtitle}
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-white border-t border-black/5">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10 text-center"
          >
            <h2 className="text-xl md:text-2xl lg:text-3xl font-inter font-light text-wg-black mb-3 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {copy.selectorTitle}
            </h2>
            <p className="text-sm md:text-base text-wg-gray max-w-3xl mx-auto font-light leading-relaxed">
              {copy.selectorSubtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[32px] bg-[#faf8f5] p-5 md:p-8 shadow-[0_18px_60px_rgba(30,24,20,0.05),inset_0_0_0_1px_rgba(46,46,46,0.06)]"
          >
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-white p-1 shadow-[0_10px_24px_rgba(30,24,20,0.06),inset_0_0_0_1px_rgba(46,46,46,0.08)]">
                  {[
                    { id: 'reform', label: copy.reform },
                    { id: 'build', label: copy.build },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setProjectType(option.id);
                        setActiveStage(0);
                      }}
                      className={`rounded-full px-5 py-2.5 text-sm md:text-[15px] transition-colors ${
                        projectType === option.id
                          ? 'bg-wg-black text-white'
                          : 'text-wg-black/70 hover:text-wg-black'
                      } font-light`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-[26px] bg-white/88 p-4 md:p-5 shadow-[0_10px_26px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.07)]">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray font-light">
                        {copy.areaLabel}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2.5 text-wg-black">
                        <Ruler className="h-[18px] w-[18px] text-wg-blue" />
                        <span className="text-[28px] md:text-[32px] font-inter font-light tracking-tight">
                          {formatArea(area)}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full px-3 py-1 text-[11px] text-wg-gray font-light shadow-[inset_0_0_0_1px_rgba(46,46,46,0.1)]">
                      {profile.label}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="1"
                    value={area}
                    onChange={(event) => setArea(Number(event.target.value))}
                    className="process-range h-2 w-full cursor-pointer appearance-none rounded-full bg-black/10"
                  />

                  <div className="mt-2.5 flex justify-between text-[10px] uppercase tracking-[0.18em] text-wg-gray/80">
                    <span>20 m²</span>
                    <span>500 m²</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-[26px] bg-white p-4 md:p-5 min-h-[148px] flex flex-col justify-between shadow-[0_10px_26px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.07)]">
                  <div className="mb-2.5 flex items-center gap-3 text-wg-orange-text">
                    <Clock3 className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wg-gray font-light">
                      {copy.summaryDuration}
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-inter font-light text-wg-black tracking-tight">
                    {formatWeeks(totalDuration)}
                  </div>
                  <p className="mt-1 text-sm text-wg-gray font-light leading-relaxed">{copy.durationUnit}</p>
                </div>

                <div className="rounded-[26px] bg-white p-4 md:p-5 min-h-[148px] flex flex-col justify-between shadow-[0_10px_26px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.07)]">
                  <div className="mb-2.5 flex items-center gap-3 text-wg-orange-text">
                    <Calendar className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wg-gray font-light">
                      {copy.summaryStages}
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-inter font-light text-wg-black tracking-tight">
                    {adjustedStages.length}
                  </div>
                  <p className="mt-1 text-sm text-wg-gray font-light leading-relaxed">{copy.stageListLabel}</p>
                </div>

                <div className="rounded-[26px] bg-white p-4 md:p-5 min-h-[148px] flex flex-col justify-between shadow-[0_10px_26px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.07)]">
                  <div className="mb-2.5 flex items-center gap-3 text-wg-orange-text">
                    <Ruler className="h-5 w-5" />
                    <span className="text-[11px] uppercase tracking-[0.22em] text-wg-gray font-light">
                      {copy.summaryRange}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-wg-black font-light">
                    {copy[projectType === 'reform' ? 'focusReform' : 'focusBuild']}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <p className="text-xs text-wg-gray font-light max-w-xl text-right">
                {copy.estimatedDataLabel}: {copy.estimatedDataText}
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray font-light">
                  {copy.stageListLabel}
                </p>
                <p className="text-xs text-wg-gray font-light hidden md:block">
                  {formatArea(area)} · {projectType === 'reform' ? copy.reform : copy.build}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {adjustedStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isActive = stageIndex === index;
                  return (
                    <button
                      key={stage.title}
                      type="button"
                      onClick={() => setActiveStage(index)}
                      className={`appearance-none rounded-[26px] p-4 text-left transition-all ${
                        isActive
                          ? stage.accent.active
                          : `${stage.accent.card} hover:shadow-[inset_0_0_0_1px_rgba(46,46,46,0.12)]`
                      }`}
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            isActive ? 'bg-white/12 text-white' : stage.accent.icon
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span
                          className={`text-[11px] uppercase tracking-[0.2em] font-light ${
                            isActive ? 'text-white/70' : 'text-wg-gray/70'
                          }`}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className={`text-lg leading-tight font-inter font-light ${isActive ? 'text-white' : 'text-wg-black'}`}>
                        {stage.title}
                      </h3>
                      <p className={`mt-2 text-sm leading-relaxed font-light ${isActive ? 'text-white/75' : 'text-wg-gray'}`}>
                        {stage.summary}
                      </p>
                      <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-[11px] font-light ${
                        isActive ? 'bg-white/10 text-white/80' : 'bg-black/4 text-wg-gray'
                      }`}>
                        {stage.durationRange}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div
              key={`${projectType}-${stageIndex}-${area}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 grid gap-5 rounded-[30px] bg-wg-black p-6 md:p-8 text-white lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/55 font-light">
                  {copy.stagePanelLabel}
                </p>
                <div className="mt-4 flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                    <currentStage.icon className="h-6 w-6 text-[#d8a289]" />
                  </span>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-inter font-light tracking-tight">
                      {currentStage.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-white/72 font-light">
                      {currentStage.detail}
                    </p>
                    <div className="mt-5 space-y-3">
                      {currentStage.tasks?.map((task, index) => (
                        <div
                          key={`${currentStage.title}-${task.title}`}
                          className="grid gap-3 rounded-[20px] bg-white/6 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] md:grid-cols-[auto_1fr_auto]"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] tracking-[0.18em] text-white/72">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <p className="text-sm md:text-[15px] text-white font-light">{task.title}</p>
                            <p className="mt-1 text-xs md:text-[13px] leading-relaxed text-white/60 font-light">
                              {task.note}
                            </p>
                          </div>
                          <span className="inline-flex h-fit rounded-full bg-white/8 px-3 py-1 text-[11px] text-white/74 font-light">
                            {task.eta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Etapa ativa
                  </p>
                  <p className="mt-2 text-xl font-inter font-light">
                    {String(stageIndex + 1).padStart(2, '0')}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Duração estimada
                  </p>
                  <p className="mt-2 text-xl font-inter font-light">
                    {formatWeeks(adjustedStages[stageIndex].duration)} {copy.durationUnit}
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-light">
                    Sequência
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/74 font-light">
                    {stageIndex < adjustedStages.length - 1
                      ? `Segue para ${adjustedStages[stageIndex + 1].title.toLowerCase()}.`
                      : 'Etapa final de fechamento e entrega.'}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 rounded-[30px] bg-[#f7f4ef] p-5 md:p-8 shadow-[0_18px_60px_rgba(30,24,20,0.05),inset_0_0_0_1px_rgba(46,46,46,0.06)]"
            >
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-wg-blue font-light">
                    Cadastro protegido
                  </p>
                  <h3 className="mt-3 text-2xl md:text-3xl font-inter font-light tracking-tight text-wg-black">
                    Receba este estudo com atendimento assistido e avance para o EVF.
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-wg-gray font-light leading-relaxed">
                    Este resumo é uma leitura inicial. Para enviar a versão assistida, validar premissas e transformar a estimativa em caminho comercial, coletamos seus dados e conduzimos o próximo passo com a equipe.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.06)]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-wg-gray font-light">Projeto</p>
                      <p className="mt-1.5 text-sm text-wg-black font-light">{projectType === 'reform' ? copy.reform : copy.build}</p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.06)]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-wg-gray font-light">Metragem</p>
                      <p className="mt-1.5 text-sm text-wg-black font-light">{formatArea(area)}</p>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(30,24,20,0.04),inset_0_0_0_1px_rgba(46,46,46,0.06)]">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-wg-gray font-light">Leitura</p>
                      <p className="mt-1.5 text-sm text-wg-black font-light">Visualização protegida e envio assistido</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white p-5 md:p-6 shadow-[0_12px_28px_rgba(30,24,20,0.05),inset_0_0_0_1px_rgba(46,46,46,0.06)]">
                  <div className="grid gap-3">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={leadName}
                      onChange={(event) => setLeadName(event.target.value)}
                      className="h-12 rounded-full border border-black/8 px-4 text-sm text-wg-black outline-none transition-colors placeholder:text-wg-gray/70 focus:border-wg-blue"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={leadWhatsapp}
                      onChange={(event) => setLeadWhatsapp(event.target.value)}
                      className="h-12 rounded-full border border-black/8 px-4 text-sm text-wg-black outline-none transition-colors placeholder:text-wg-gray/70 focus:border-wg-blue"
                    />
                    <input
                      type="email"
                      placeholder="E-mail"
                      value={leadEmail}
                      onChange={(event) => setLeadEmail(event.target.value)}
                      className="h-12 rounded-full border border-black/8 px-4 text-sm text-wg-black outline-none transition-colors placeholder:text-wg-gray/70 focus:border-wg-blue"
                    />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <a
                      href={leadWhatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-wg-black px-6 py-3 text-sm text-white transition-colors hover:bg-black/92 font-light"
                    >
                      Receber estudo no WhatsApp
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href="/obraeasy"
                      className="inline-flex items-center justify-center rounded-full border border-black/10 bg-black/[0.02] px-6 py-3 text-sm text-wg-black transition-colors hover:bg-black/[0.04] font-light"
                    >
                      Iniciar EVF
                    </a>
                  </div>

                  <p className="mt-4 text-[12px] leading-relaxed text-wg-gray font-light">
                    Bloqueios de cópia e impressão foram aplicados nesta visualização, mas o envio final do estudo continua assistido pela equipe WG Almeida para preservar contexto, leitura técnica e fechamento comercial.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-wg-black text-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <span className="text-wg-orange tracking-[0.16em] text-xs md:text-sm mb-4 block">
              {t('processPage.onboarding.kicker')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light mb-6 tracking-tight">
              {t('processPage.onboarding.title')}
            </h2>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
              {t('processPage.onboarding.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Lightbulb, title: t('processPage.onboarding.items.0.title'), desc: t('processPage.onboarding.items.0.desc') },
              { icon: Camera, title: t('processPage.onboarding.items.1.title'), desc: t('processPage.onboarding.items.1.desc') },
              { icon: FolderOpen, title: t('processPage.onboarding.items.2.title'), desc: t('processPage.onboarding.items.2.desc') },
              { icon: Calendar, title: t('processPage.onboarding.items.3.title'), desc: t('processPage.onboarding.items.3.desc') },
              { icon: Monitor, title: t('processPage.onboarding.items.4.title'), desc: t('processPage.onboarding.items.4.desc') },
              { icon: MessagesSquare, title: t('processPage.onboarding.items.5.title'), desc: t('processPage.onboarding.items.5.desc') },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-wg-orange/35 transition-colors group"
              >
                <div className="w-12 h-12 bg-wg-orange/15 rounded-xl flex items-center justify-center mb-4 group-hover:bg-wg-orange/22 transition-colors">
                  <item.icon className="w-6 h-6 text-wg-orange" />
                </div>
                <h3 className="text-xl font-light text-white mb-2 tracking-tight">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-wg-blue tracking-[0.16em] text-xs md:text-sm mb-4 block">
                {t('processPage.engineering.kicker')}
              </span>
              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('processPage.engineering.title')}
              </h2>
              <p className="text-sm md:text-base text-wg-gray leading-relaxed mb-6 font-light max-w-xl">
                {t('processPage.engineering.subtitle')}
              </p>
              <ul className="space-y-4">
                {[
                  t('processPage.engineering.items.0'),
                  t('processPage.engineering.items.1'),
                  t('processPage.engineering.items.2'),
                  t('processPage.engineering.items.3'),
                  t('processPage.engineering.items.4'),
                  t('processPage.engineering.items.5'),
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-wg-blue mt-0.5 flex-shrink-0" />
                    <span className="text-wg-gray font-light">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-wg-gray-light rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">98%</div>
                    <p className="text-sm text-wg-gray font-light">{t('processPage.engineering.stats.0')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">100%</div>
                    <p className="text-sm text-wg-gray font-light">{t('processPage.engineering.stats.1')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl font-inter font-light text-wg-blue mb-2">14+</div>
                    <p className="text-sm text-wg-gray font-light">{t('processPage.engineering.stats.2')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-8 h-8 text-wg-orange-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-xl font-inter font-light text-wg-orange-text">Sprints</span>
                    </div>
                    <p className="text-sm text-wg-gray font-light">{t('processPage.engineering.stats.3')}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-[32px] bg-wg-black px-6 py-8 md:px-10 md:py-12 text-center max-w-5xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light text-white mb-4 tracking-tight">
              {copy.ctaTitle}
            </h2>
            <p className="text-sm md:text-base text-white/78 font-light leading-relaxed max-w-3xl mx-auto">
              {copy.ctaText}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/solicite-proposta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm text-wg-black transition-colors hover:bg-white/92 font-light"
              >
                {copy.ctaPrimary}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/contato"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-6 py-3 text-sm text-white/92 transition-colors hover:bg-white/[0.08] hover:border-white/20 font-light"
              >
                {copy.ctaSecondary}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Process;
