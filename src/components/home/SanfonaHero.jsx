// SanfonaHero v3 — WG Almeida — 24/03/2026
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const DESKTOP_BP = 900;
const TX = '0 1px 4px rgba(0,0,0,0.9),0 4px 16px rgba(0,0,0,0.7),0 12px 40px rgba(0,0,0,0.5)';

/*
  Imagens Unsplash — IDs fornecidos por William Almeida:
  Arquitetura : 3QzMBrvCeyQ  (person writing on white paper)
  Engenharia  : K67sBVqLLuw  (grayscale low angle building)
  Marcenaria  : vqMQN9zImG4  (modern kitchen bar stools)
  Build Tech  : xuTJZ7uD7PI  (blue background lines and dots)
  EasyLocker  : 8fHan-6KDm0  (person holding white and black box)
  Wno Mas     : HzjLEv5VwJw  (two glasses wine bread on table)
*/
const U = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2400&q=90`;

const COMPANIES = [
  {
    id: 'arquitetura', index: '01', name: 'Arquitetura',
    color: '#5E9B94', path: '/arquitetura',
    tagline: 'Projetos que definem\ncomo se vive.',
    bullets: [
      'Residencial e corporativo de alto padrão',
      'Interiores, volumetria e paisagismo',
      'Do projeto ao acabamento com rigor',
    ],
    cta: 'Conhecer arquitetura',
    img: U('photo-3QzMBrvCeyQ'),
    imgPos: 'center center',
  },
  {
    id: 'engenharia', index: '02', name: 'Engenharia',
    color: '#2B4580', path: '/engenharia',
    tagline: 'Estrutura sólida,\nentrega precisa.',
    bullets: [
      'Cálculo estrutural e coordenação de obra',
      'Cronograma físico-financeiro rigoroso',
      'Obra turn key com gestão integrada',
    ],
    cta: 'Explorar engenharia',
    img: U('photo-K67sBVqLLuw'),
    imgPos: 'center 40%',
  },
  {
    id: 'marcenaria', index: '03', name: 'Marcenaria',
    color: '#8B5E3C', path: '/marcenaria',
    tagline: 'Cada móvel nasce\npara aquele espaço.',
    bullets: [
      'Mobiliário sob medida com design autoral',
      'Materiais nobres, acabamento premium',
      'Do projeto ao encaixe perfeito',
    ],
    cta: 'Ver marcenaria',
    img: U('photo-vqMQN9zImG4'),
    imgPos: 'center center',
  },
  {
    id: 'buildtech', index: '04', name: 'WG Build Tech',
    color: '#046BD2', path: '/buildtech',
    tagline: 'Tecnologia que\ntransforma operações.',
    bullets: [
      'Sistemas SaaS, IA e automação',
      'Produtos digitais para construção',
      'Agentes inteligentes e fluxos conectados',
    ],
    cta: 'Entrar em Build Tech',
    img: U('photo-xuTJZ7uD7PI'),
    imgPos: 'center center',
  },
  {
    id: 'easylocker', index: '05', name: 'WG EasyLocker',
    color: '#F25C26', path: '/easylocker',
    tagline: 'Armários inteligentes\npara o mundo físico.',
    bullets: [
      'Controle por app, rastreio em tempo real',
      'Para condomínios, empresas e eventos',
      'Operação física com camada digital',
    ],
    cta: 'Conhecer EasyLocker',
    img: U('photo-8fHan-6KDm0'),
    imgPos: 'center center',
  },
  {
    id: 'wnomas', index: '06', name: 'Wno Mas Vinhos',
    color: '#8B1A2E', path: '/wnomasvinho',
    tagline: 'Curadoria, clube\ne experiência sensorial.',
    bullets: [
      'Seleção premium de vinhos autorais',
      'Clube de assinatura e experiências',
      'Identidade forte para um público exigente',
    ],
    cta: 'Conhecer Wno Mas',
    img: U('photo-HzjLEv5VwJw'),
    imgPos: 'center center',
  },
];

const TX_HEAVY = '0 1px 4px rgba(0,0,0,0.9),0 4px 16px rgba(0,0,0,0.7),0 12px 40px rgba(0,0,0,0.5)';

export default function SanfonaHero() {
  const navigate   = useNavigate();
  const sectionRef = useRef(null);
  const [desktop, setDesktop] = useState(() => window.innerWidth >= DESKTOP_BP);
  const [active,  setActive]  = useState(0);
  const [tapped,  setTapped]  = useState(false);

  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= DESKTOP_BP);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (desktop) return;
    const fn = (e) => {
      if (!sectionRef.current?.contains(e.target)) {
        setActive(0);
        setTapped(false);
      }
    };
    document.addEventListener('pointerdown', fn);
    return () => document.removeEventListener('pointerdown', fn);
  }, [desktop]);

  const go    = useCallback((path) => navigate(path), [navigate]);
  const onCTA = (e, path) => { e.stopPropagation(); go(path); };

  const onEnter = (i) => { if (desktop) setActive(i); };
  const onLeave = ()  => { if (desktop) setActive(0); };

  const onClick = (i, path) => {
    if (desktop) { go(path); return; }
    if (active !== i) { setActive(i); setTapped(true); }
  };

  const onKey = (e, i, path) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (desktop) { go(path); return; }
      if (active === i && tapped) go(path);
      else { setActive(i); setTapped(true); }
    }
    if (e.key === 'Escape') { setActive(0); setTapped(false); }
  };

  const fActive   = desktop ? 3.8 : 4.2;
  const fInactive = desktop ? 0.26 : 1;
  const TR = 'flex 540ms cubic-bezier(0.22,1,0.36,1)';

  return (
    <section
      ref={sectionRef}
      aria-label="Empresas do Grupo WG Almeida"
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        flexDirection: desktop ? 'row' : 'column',
        width: '100%',
        height: desktop ? '100vh' : 'calc(100svh - 56px)',
        overflow: 'hidden',
        background: '#060606',
        touchAction: 'pan-y',
      }}
    >
      {COMPANIES.map((c, i) => {
        const isActive = active === i;

        return (
          <article
            key={c.id}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
            aria-label={`${c.name} — ${c.tagline.replace('\n', ' ')}`}
            onMouseEnter={() => onEnter(i)}
            onClick={() => onClick(i, c.path)}
            onKeyDown={(e) => onKey(e, i, c.path)}
            style={{
              position: 'relative',
              flex: isActive ? fActive : fInactive,
              minWidth: 0, minHeight: 0,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: TR,
              outline: 'none',
              background: '#0a0a0a',
              WebkitTapHighlightColor: 'transparent',
              borderRight:  desktop && i < COMPANIES.length - 1
                ? '1px solid rgba(255,255,255,0.05)' : 'none',
              borderBottom: !desktop && i < COMPANIES.length - 1
                ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            {/* Imagem de fundo */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url("${c.img}")`,
              backgroundSize: 'cover',
              backgroundPosition: c.imgPos,
              transform: isActive ? 'scale(1)' : 'scale(1.06)',
              transition: 'transform 700ms cubic-bezier(0.22,1,0.36,1)',
            }} />

            {/* Máscara gradiente igual ao MVP */}
            <div style={{
              position: 'absolute', inset: 0,
              background: isActive
                ? 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.50) 42%, rgba(0,0,0,0.10) 100%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.12) 100%)',
              transition: 'background 400ms ease',
            }} />

            {/* Traço de cor — lateral desktop / superior mobile */}
            <div style={{
              position: 'absolute',
              ...(desktop
                ? { left: 0, top: 0, bottom: 0, width: 3 }
                : { top: 0, left: 0, right: 0, height: 3 }),
              background: c.color,
              opacity: isActive ? 1 : 0.5,
              transition: 'opacity 300ms ease',
              zIndex: 2,
            }} />

            {/* Linhas diagonais decorativas — efeito trama */}
            <svg aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              opacity: isActive ? 0.07 : 0.03,
              transition: 'opacity 400ms ease',
              pointerEvents: 'none', zIndex: 1,
            }}>
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((k) => (
                <line key={k}
                  x1={`${k * 9}%`} y1="0%"
                  x2={`${k * 9 - 28}%`} y2="100%"
                  stroke="white" strokeWidth="0.5"
                />
              ))}
            </svg>

            {/* Label vertical — desktop, faixa fechada */}
            {!isActive && desktop && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                display: 'flex', alignItems: 'flex-end',
                justifyContent: 'center', paddingBottom: 28,
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 10,
                  transform: 'rotate(-180deg)',
                  writingMode: 'vertical-rl',
                  userSelect: 'none',
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    letterSpacing: '0.26em', textTransform: 'uppercase',
                    color: c.color, textShadow: TX,
                  }}>{c.index}</span>
                  <strong style={{
                    fontFamily: '"Playfair Display",Georgia,serif',
                    fontSize: 'clamp(1rem,1.3vw,1.3rem)',
                    fontWeight: 700, letterSpacing: '-0.02em',
                    color: '#fff', textShadow: TX, lineHeight: 1,
                  }}>{c.name}</strong>
                </div>
              </div>
            )}

            {/* Label horizontal — mobile/tablet, faixa fechada */}
            {!isActive && !desktop && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                display: 'flex', alignItems: 'center',
                paddingLeft: 20, gap: 10,
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  letterSpacing: '0.22em', textTransform: 'uppercase',
                  color: c.color, textShadow: TX,
                }}>{c.index}</span>
                <strong style={{
                  fontFamily: '"Playfair Display",Georgia,serif',
                  fontSize: 'clamp(1rem,4vw,1.3rem)',
                  fontWeight: 700, color: '#fff',
                  textShadow: TX, letterSpacing: '-0.02em',
                }}>{c.name}</strong>
              </div>
            )}

            {/* Conteúdo expandido */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 4,
              display: 'flex', alignItems: 'flex-end',
              padding: desktop ? '40px 36px 36px' : '16px 22px 24px',
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 220ms ease, transform 360ms ease',
              transitionDelay: isActive ? '90ms' : '0ms',
              pointerEvents: isActive ? 'auto' : 'none',
            }}>
              <div style={{ maxWidth: desktop ? 400 : '100%' }}>

                {/* Número grande com linha — exato do MVP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{
                    fontFamily: '"Playfair Display",Georgia,serif',
                    fontSize: desktop ? 'clamp(3rem,4vw,5.5rem)' : '2.4rem',
                    fontWeight: 800, fontStyle: 'italic',
                    color: c.color, lineHeight: 1,
                    letterSpacing: '-0.06em', textShadow: TX,
                  }}>{c.index}</span>
                  <div style={{ width: 44, height: 1, background: c.color, opacity: 0.7 }} />
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.55)', textShadow: TX,
                  }}>{c.name}</span>
                </div>

                {/* Tagline em itálico serif — igual ao MVP */}
                <h2 style={{
                  margin: 0,
                  fontFamily: '"Playfair Display",Georgia,serif',
                  fontSize: desktop
                    ? 'clamp(1.9rem,2.5vw,3.2rem)'
                    : 'clamp(1.45rem,5vw,2rem)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  lineHeight: 1.08,
                  letterSpacing: '-0.045em',
                  color: '#fff',
                  textShadow: TX,
                  whiteSpace: 'pre-line',
                }}>{c.tagline}</h2>

                {/* Bullets com ponto colorido — igual ao MVP */}
                <ul style={{
                  margin: '16px 0 0', padding: 0, listStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {c.bullets.map((b) => (
                    <li key={b} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 9,
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: desktop ? 14 : 13,
                      lineHeight: 1.5,
                      textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: c.color, flexShrink: 0, marginTop: 5,
                      }} />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA Button branco */}
                <button
                  onClick={(e) => onCTA(e, c.path)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 9,
                    marginTop: 22,
                    padding: desktop ? '12px 22px' : '10px 18px',
                    borderRadius: 999,
                    background: '#fff', color: '#080808',
                    fontSize: 11, fontWeight: 800,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.32)',
                    transition: 'transform .15s ease, box-shadow .15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.04)';
                    e.currentTarget.style.boxShadow = '0 18px 52px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.32)';
                  }}
                >
                  {c.cta}
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 5.5h8M6.5 2.5l3 3-3 3"
                      stroke="#080808" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
