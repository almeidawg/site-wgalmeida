import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const COMPANIES = [
  {
    id: 'arquitetura',
    name: 'Arquitetura',
    shortName: 'ARQ',
    tagline: 'Projetos residenciais e corporativos de alto padrão',
    description: 'Ambientes autorais, proporção elegante e soluções personalizadas para cada cliente.',
    color: '#5E9B94',
    path: '/arquitetura',
    bgImage: '/images/imagens/ARQ-VILANOVACONCEICAO (3).webp',
    bgPosition: 'center center',
    highlights: ['Residencial', 'Interiores', 'Corporativo'],
    cta: 'Conhecer arquitetura',
  },
  {
    id: 'engenharia',
    name: 'Engenharia',
    shortName: 'ENG',
    tagline: 'Estrutura, execução e gestão completa de obra',
    description: 'Coordenação técnica, cronograma e obra turn key com rigor de ponta a ponta.',
    color: '#2B4580',
    path: '/engenharia',
    bgImage: '/images/imagens/ENG-COND-POTADOSOL-MARINQUE (12).webp',
    bgPosition: 'center center',
    highlights: ['Estrutural', 'Obra', 'Turn Key'],
    cta: 'Explorar engenharia',
  },
  {
    id: 'marcenaria',
    name: 'Marcenaria',
    shortName: 'MARC',
    tagline: 'Mobiliário planejado com acabamento premium',
    description: 'Marcenaria sob medida com desenho preciso, materiais nobres e execução refinada.',
    color: '#8B5E3C',
    path: '/marcenaria',
    bgImage: '/images/imagens/STUDIO-BROOKLIN (4).webp',
    bgPosition: 'center center',
    highlights: ['Sob Medida', 'Detalhe', 'Acabamento'],
    cta: 'Ver marcenaria',
  },
  {
    id: 'buildtech',
    name: 'WG Build Tech',
    shortName: 'TECH',
    tagline: 'IA, automação e sistemas para operação e negócios',
    description: 'Produtos digitais, fluxos inteligentes e tecnologia aplicada à construção e serviços.',
    color: '#046BD2',
    path: '/buildtech',
    bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2200&q=90',
    bgPosition: 'center center',
    highlights: ['IA', 'Automação', 'Sistemas'],
    cta: 'Entrar em Build Tech',
  },
  {
    id: 'easylocker',
    name: 'WG EasyLocker',
    shortName: 'LOCK',
    tagline: 'Armários inteligentes para condomínios e empresas',
    description: 'Controle por aplicativo, rastreio em tempo real e operação física com camada digital.',
    color: '#F25C26',
    path: '/easylocker',
    bgImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=2200&q=90',
    bgPosition: 'center center',
    highlights: ['IoT', 'App', 'Segurança'],
    cta: 'Conhecer EasyLocker',
  },
  {
    id: 'wnomas',
    name: 'Wno Mas Vinhos & Cia',
    shortName: 'VINHOS',
    tagline: 'Curadoria, clube e experiências em torno do vinho',
    description: 'Seleção premium, experiência sensorial e identidade forte para um público de curadoria.',
    color: '#8B1A2E',
    path: '/wnomasvinho',
    bgImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=2200&q=90',
    bgPosition: 'center center',
    highlights: ['Curadoria', 'Clube', 'Experiência'],
    cta: 'Conhecer Wno Mas',
  },
];

const CONTENT_SHADOW = '0 2px 10px rgba(0,0,0,0.88), 0 10px 28px rgba(0,0,0,0.72), 0 18px 60px rgba(0,0,0,0.55)';
const MOBILE_BP = 768;

export default function SanfonaHero() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [tapIndex, setTapIndex] = useState(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < MOBILE_BP;
      setIsMobile(mobile);

      if (mobile) {
        setActiveIndex((prev) => (prev == null ? 0 : prev));
      } else if (activeIndex == null) {
        setActiveIndex(0);
      }
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeIndex]);

  const handleNavigate = (path) => navigate(path);

  const handleInteraction = (index, path) => {
    if (isMobile) {
      if (tapIndex === index && activeIndex === index) {
        handleNavigate(path);
        return;
      }
      setActiveIndex(index);
      setTapIndex(index);
      return;
    }

    handleNavigate(path);
  };

  return (
    <section
      aria-label="Empresas do Grupo WG Almeida"
      onMouseLeave={() => {
        if (!isMobile) {
          setActiveIndex(0);
        }
      }}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#050505',
      }}
    >
      {COMPANIES.map((company, index) => {
        const isActive = activeIndex === index;

        return (
          <article
            key={company.id}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            onMouseEnter={() => {
              if (!isMobile) {
                setActiveIndex(index);
              }
            }}
            onClick={() => handleInteraction(index, company.path)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleInteraction(index, company.path);
              }
              if (event.key === 'Escape') {
                setActiveIndex(0);
              }
            }}
            style={{
              position: 'relative',
              flex: isMobile ? (isActive ? 4.2 : 1) : (isActive ? 3.6 : 0.28),
              minWidth: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'flex 560ms cubic-bezier(0.22, 1, 0.36, 1)',
              borderRight: !isMobile && index < COMPANIES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom: isMobile && index < COMPANIES.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              outline: 'none',
              background: '#0b0b0b',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${company.bgImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: company.bgPosition,
                transform: isActive ? 'scale(1)' : 'scale(1.05)',
                transition: 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.26) 58%, rgba(0,0,0,0.72) 100%)',
              }}
            />

            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: company.color,
                zIndex: 2,
              }}
            />

            {!isActive && !isMobile ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 26,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    transform: 'rotate(-180deg)',
                    writingMode: 'vertical-rl',
                    color: '#fff',
                    textShadow: CONTENT_SHADOW,
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: company.color,
                    }}
                  >
                    {company.shortName}
                  </span>
                  <strong
                    className="font-playfair"
                    style={{
                      fontSize: 'clamp(1.15rem, 1.55vw, 1.45rem)',
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {company.name}
                  </strong>
                </div>
              </div>
            ) : null}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 4,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
                padding: isMobile ? '20px 20px 22px 22px' : '34px 30px 30px 30px',
              }}
            >
              <div
                style={{
                  opacity: isActive || isMobile ? 1 : 0,
                  transform: isActive || isMobile ? 'translateY(0)' : 'translateY(18px)',
                  transition: 'opacity 260ms ease, transform 420ms ease',
                  transitionDelay: isActive ? '120ms' : '0ms',
                  pointerEvents: isActive || isMobile ? 'auto' : 'none',
                  maxWidth: isMobile ? '100%' : 420,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    marginBottom: 10,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: company.color,
                    textShadow: CONTENT_SHADOW,
                  }}
                >
                  {company.shortName}
                </span>

                <h2
                  className="font-playfair"
                  style={{
                    margin: 0,
                    color: '#fff',
                    fontSize: isMobile ? '1.55rem' : 'clamp(2rem, 2.7vw, 3.25rem)',
                    lineHeight: 0.94,
                    letterSpacing: '-0.045em',
                    textShadow: CONTENT_SHADOW,
                  }}
                >
                  {company.name}
                </h2>

                <p
                  style={{
                    margin: '10px 0 0',
                    color: '#fff',
                    fontSize: isMobile ? '0.96rem' : '1rem',
                    lineHeight: 1.5,
                    textShadow: CONTENT_SHADOW,
                    maxWidth: 420,
                  }}
                >
                  {company.tagline}
                </p>

                <p
                  style={{
                    margin: '14px 0 0',
                    color: 'rgba(255,255,255,0.96)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    textShadow: CONTENT_SHADOW,
                    maxWidth: 460,
                  }}
                >
                  {company.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 18,
                  }}
                >
                  {company.highlights.map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: company.color,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 22,
                    padding: '12px 18px',
                    borderRadius: 999,
                    background: '#fff',
                    color: '#080808',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
                  }}
                >
                  {company.cta}
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
