import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, HardHat, Trees, Cpu, Lock, Wine, ArrowRight } from 'lucide-react';

const COMPANIES = [
  {
    id: 'arquitetura',
    name: 'Arquitetura',
    tagline: 'Projetos residenciais e corporativos de alto padrão',
    description: 'Criamos espaços que unem funcionalidade e estética, com soluções personalizadas para cada cliente.',
    color: '#5E9B94',
    textColor: '#fff',
    path: '/arquitetura',
    Icon: Building2,
    highlights: ['Residencial Luxo', 'Corporativo', 'Interiores'],
  },
  {
    id: 'engenharia',
    name: 'Engenharia',
    tagline: 'Estruturas sólidas, execução eficiente',
    description: 'Engenharia estrutural e projetos turn key com gestão completa da obra, do cálculo à entrega.',
    color: '#2B4580',
    textColor: '#fff',
    path: '/engenharia',
    Icon: HardHat,
    highlights: ['Cálculo Estrutural', 'Turn Key', 'Gestão de Obra'],
  },
  {
    id: 'marcenaria',
    name: 'Marcenaria',
    tagline: 'Móveis planejados com acabamento premium',
    description: 'Marcenaria sob medida com madeira de alta qualidade, unindo design exclusivo e funcionalidade.',
    color: '#8B5E3C',
    textColor: '#fff',
    path: '/marcenaria',
    Icon: Trees,
    highlights: ['Móveis Planejados', 'Cozinhas', 'Home Office'],
  },
  {
    id: 'buildtech',
    name: 'WG Build Tech',
    tagline: 'Tecnologia e IA para construção civil',
    description: 'Consultoria de inteligência artificial e soluções digitais para gestão e automação de projetos.',
    color: '#046bd2',
    textColor: '#fff',
    path: '/buildtech',
    Icon: Cpu,
    highlights: ['IA Aplicada', 'Automação', 'Gestão Digital'],
  },
  {
    id: 'easylocker',
    name: 'WG EasyLocker',
    tagline: 'Armários inteligentes para condomínios e empresas',
    description: 'Solução IoT de armários inteligentes com acesso por app, monitoramento em tempo real e segurança.',
    color: '#F25C26',
    textColor: '#fff',
    path: '/easylocker',
    Icon: Lock,
    highlights: ['IoT', 'App Mobile', 'Segurança'],
  },
  {
    id: 'wnomas',
    name: 'W Nomas Vinhos',
    tagline: 'Curadoria, clube de assinatura e experiências',
    description: 'Seleção exclusiva de vinhos nacionais e importados com clube de assinatura e eventos presenciais.',
    color: '#6b1a2a',
    textColor: '#fff',
    path: '/wnomas',
    Icon: Wine,
    highlights: ['Clube de Assinatura', 'Curadoria', 'Experiências'],
  },
];

export default function SanfonaHero() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [tapIndex, setTapIndex] = useState(null); // for mobile double-tap nav
  const navigate = useNavigate();

  const handleMouseEnter = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handleClick = useCallback(
    (index, path) => {
      // Mobile: first tap expands, second tap navigates
      if (window.innerWidth < 768) {
        if (tapIndex === index) {
          navigate(path);
        } else {
          setActiveIndex(index);
          setTapIndex(index);
        }
      } else {
        navigate(path);
      }
    },
    [navigate, tapIndex]
  );

  return (
    <section
      className="w-full"
      onMouseLeave={handleMouseLeave}
      aria-label="Empresas do Grupo WG Almeida"
    >
      {COMPANIES.map((company, index) => {
        const isActive = activeIndex === index;
        const { Icon } = company;

        return (
          <div
            key={company.id}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleClick(index, company.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(index, company.path);
              }
            }}
            style={{
              backgroundColor: company.color,
              height: isActive ? 'var(--strip-expanded)' : 'var(--strip-collapsed)',
              transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              cursor: 'pointer',
              // CSS vars injected inline for responsive values
              '--strip-collapsed': '72px',
              '--strip-expanded': '280px',
            }}
            className="relative w-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:[--strip-collapsed:72px] md:[--strip-expanded:280px] [--strip-collapsed:60px] [--strip-expanded:240px]"
          >
            {/* Always-visible header row */}
            <div
              className="flex items-center gap-3 md:gap-4 px-5 md:px-8 h-[60px] md:h-[72px]"
              style={{ color: company.textColor }}
            >
              <Icon
                className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 opacity-90"
                aria-hidden="true"
              />
              <span className="font-semibold text-base md:text-lg tracking-tight leading-none">
                {company.name}
              </span>
              <span className="hidden sm:block text-white/60 text-sm font-light mx-1">·</span>
              <span className="hidden sm:block text-white/70 text-sm font-light truncate flex-1">
                {company.tagline}
              </span>
              <ArrowRight
                className="flex-shrink-0 ml-auto w-4 h-4 opacity-60 transition-transform duration-300"
                style={{ transform: isActive ? 'translateX(4px)' : 'none' }}
                aria-hidden="true"
              />
            </div>

            {/* Expanded content — fades in when active */}
            <div
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                transitionDelay: isActive ? '0.1s' : '0s',
                pointerEvents: isActive ? 'auto' : 'none',
              }}
              className="px-5 md:px-8 pb-6"
            >
              <p className="text-white/80 text-sm md:text-base leading-relaxed mb-4 max-w-2xl">
                {company.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {company.highlights.map((h) => (
                  <span
                    key={h}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white border border-white/25"
                  >
                    {h}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-1.5 text-white font-semibold text-sm">
                {company.id === 'arquitetura' ? 'Conhecer Projetos de Arquitetura' :
                 company.id === 'engenharia' ? 'Explorar Obras e Engenharia' :
                 company.id === 'marcenaria' ? 'Ver Marcenaria sob Medida' :
                 company.id === 'buildtech' ? 'Conhecer Soluções Build Tech' :
                 company.id === 'easylocker' ? 'Saiba mais sobre EasyLocker' :
                 company.id === 'wnomas' ? 'Conhecer W Nomas Vinhos' :
                 'Ver projetos'}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
