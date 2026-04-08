import React, { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { motion } from '@/lib/motion-lite'
import './Wnomas.css'
import {
  ArrowRight,
  ExternalLink,
  GlassWater,
  Grape,
  MoonStar,
  SunMedium,
  Truck,
  Wine,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const fadeInUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
}

const featuredWines = [
  {
    name: 'Cobos Bramare Malbec',
    type: 'Tinto de altitude',
    origin: 'Argentina · Mendoza',
    price: 'R$ 356,68',
    image: '/images/wno-mas/garrafa-tinto-4.webp',
  },
  {
    name: 'Gran Enemigo Gualtallary',
    type: 'Cabernet Franc · Blend',
    origin: 'Argentina · Gualtallary',
    price: 'R$ 327,08',
    image: '/images/wno-mas/garrafa-tinto-5.webp',
  },
  {
    name: 'Luigi Bosca Rosé',
    type: 'Rosé elegante',
    origin: 'Argentina · Mendoza',
    price: 'R$ 113,96',
    image: '/images/wno-mas/luigi-bosca-rose.png',
  },
  {
    name: 'Champagne Moët & Chandon',
    type: 'Champagne clássico',
    origin: 'França · Épernay',
    price: 'R$ 560,92',
    image: '/images/wno-mas/moet-chandon.png',
  },
]

const curationPoints = [
  {
    icon: Grape,
    title: 'Curadoria refinada',
    text: 'Seleção de rótulos argentinos, italianos e champagnes com perfil mais autoral e memorável.',
  },
  {
    icon: Truck,
    title: 'Entrega inteligente',
    text: 'Fluxo focado em atendimento direto, retirada e entregas especiais para clientes em São Paulo.',
  },
  {
    icon: GlassWater,
    title: 'Experiência de mesa',
    text: 'Uma página pensada para apresentar vinho como lifestyle, não só como catálogo de produto.',
  },
]

const brandStory = [
  {
    title: 'Atmosfera inicial',
    text: 'O universo visual nasceu entre vinho, arte e atmosfera autoral.',
    images: ['/images/wno-mas/brand-story/MOODBOARD CRIATIVO.png'],
  },
  {
    title: 'Mapa de concepção',
    text: 'As referências foram traduzidas em caminhos visuais até chegar ao gesto central da marca.',
    images: ['/images/wno-mas/brand-story/PROCESSO CRIATIVO DA MARCA.png'],
  },
  {
    title: 'Construção do símbolo',
    text: 'A taça, o movimento do vinho e a mão em brinde formaram o ícone da marca.',
    images: [
      '/images/wno-mas/brand-story/5.png',
      '/images/wno-mas/brand-story/6.png',
      '/images/wno-mas/brand-story/8.png',
    ],
  },
  {
    title: 'Assinatura manuscrita',
    text: 'O lettering trouxe proximidade, personalidade e assinatura própria para a marca.',
    images: ['/images/wno-mas/brand-story/9.png'],
  },
  {
    title: 'Versão principal',
    text: 'Símbolo e nome foram unificados em uma composição principal mais clara e memorável.',
    images: ['/images/wno-mas/brand-story/11.png'],
  },
  {
    title: 'Versão-selo',
    text: 'A marca ganhou versão compacta para usos institucionais, digitais e de apoio.',
    images: ['/images/wno-mas/brand-story/22.png'],
  },
  {
    title: 'Aplicação digital',
    text: 'A identidade foi levada para catálogo e experiência digital em desktop e mobile.',
    images: [
      '/images/wno-mas/brand-story/17.png',
      '/images/wno-mas/brand-story/18.png',
      '/images/wno-mas/catalogo-visual-2024.jpg',
    ],
  },
]

export default function Wnomas() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('wnomas_theme') || 'dark'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('wnomas_theme', theme)
  }, [theme])

  return (
    <>
      <SEO
        pathname="/wnomasvinho"
        title="Wno Mas Vinhos & Cia · Curadoria de Vinhos | Grupo WG Almeida"
        description="Curadoria de vinhos premium, champagnes e experiências exclusivas. Wno Mas Vinhos & Cia em uma apresentação editorial ligada ao Grupo WG Almeida."
      />

      <main className="wno-page" data-theme={theme}>
        <section className="wno-hero">
          <div className="wno-hero-glow wno-hero-glow-left" aria-hidden="true" />
          <div className="wno-hero-glow wno-hero-glow-right" aria-hidden="true" />

          <div className="wno-shell">
            <motion.div className="wno-topbar" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="wno-topbar-left">
                <span className="wno-eyebrow">Wno Mas Vinhos &amp; Cia</span>
                <nav className="wno-nav" aria-label="Navegação Wno Mas">
                  <a href="#curadoria">Curadoria</a>
                  <a href="#rotulos">Rótulos</a>
                  <a href="#marca">Marca</a>
                  <a href="#contato">Contato</a>
                </nav>
              </div>

              <div className="wno-theme-toggle" role="group" aria-label="Alternar aparência">
                <button
                  type="button"
                  className={theme === 'dark' ? 'is-active' : ''}
                  onClick={() => setTheme('dark')}
                >
                  <MoonStar size={15} />
                  Dark
                </button>
                <button
                  type="button"
                  className={theme === 'day' ? 'is-active' : ''}
                  onClick={() => setTheme('day')}
                >
                  <SunMedium size={15} />
                  Day
                </button>
              </div>
            </motion.div>

            <div className="wno-hero-grid">
              <motion.div className="wno-copy" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <img
                  src="/images/wno-mas/logo-wno.png"
                  alt="Wno Mas Vinhos & Cia"
                  className="wno-brand"
                />

                <span className="wno-chip">Argentina, Itália e champagnes em seleção especial</span>

                <h1>
                  Curadoria de vinhos com linguagem mais sofisticada, atmosfera escura e presença editorial.
                </h1>

                <p className="wno-lead">
                  A base visual veio do EasyFood: contraste forte, tipografia elegante, volumes escuros e detalhes
                  dourados. Aqui ela foi reinterpretada para a Wno Mas com alma de adega, marca própria e preview de
                  rótulos reais.
                </p>

                <div className="wno-cta-row">
                  <a
                    href="https://wa.me/5511976889417?text=Quero+conhecer+a+curadoria+da+Wno+Mas+Vinhos+%26+Cia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wno-btn wno-btn-primary"
                  >
                    Falar com a curadoria
                    <ExternalLink size={16} />
                  </a>

                  <Link to="/" className="wno-btn wno-btn-secondary">
                    Voltar ao grupo
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="wno-stats">
                  <div>
                    <strong>76+</strong>
                    <span>rótulos em catálogo</span>
                  </div>
                  <div>
                    <strong>7</strong>
                    <span>categorias de seleção</span>
                  </div>
                  <div>
                    <strong>5%</strong>
                    <span>off no Pix acima de 12 garrafas</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="wno-media-card"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="wno-video-frame">
                  <video
                    className="wno-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/images/wno-mas/catalogo-visual-2024.jpg"
                  />
                  <div className="wno-video-overlay" />
                  <div className="wno-video-caption">
                    <span>Hero cinematográfica</span>
                    <strong>Estrutura pronta para reel curto de vinícola em alta qualidade</strong>
                  </div>
                </div>

                <div className="wno-note-card">
                  <span className="wno-note-kicker">Direção aplicada</span>
                  <p>
                    Fundo escuro, dourado seco, serifada editorial, blocos premium e contraste inspirado no EasyFood,
                    mas com semântica de vinho.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="wno-section" id="rotulos">
          <div className="wno-shell">
            <motion.div className="wno-section-head" {...fadeInUp}>
              <span className="wno-section-kicker">Cards preservados</span>
              <h2>As garrafas continuam deitadas na horizontal. O visual agora ficou mais luxuoso.</h2>
              <p>
                Mantive a lógica central do catálogo anterior: garrafa posicionada na horizontal, bloco de mídia à
                esquerda e ficha do rótulo à direita.
              </p>
            </motion.div>

            <div className="wno-bottle-grid">
              {featuredWines.map((wine, index) => (
                <motion.article
                  key={wine.name}
                  className="wno-bottle-card"
                  {...fadeInUp}
                  transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="wno-bottle-media">
                    <img src={wine.image} alt={wine.name} className="wno-bottle-image" />
                  </div>
                  <div className="wno-bottle-copy">
                    <span className="wno-bottle-type">{wine.type}</span>
                    <h3>{wine.name}</h3>
                    <p>{wine.origin}</p>
                    <div className="wno-bottle-footer">
                      <strong>{wine.price}</strong>
                      <button type="button">Selecionar rótulo</button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="wno-section wno-section-muted" id="curadoria">
          <div className="wno-shell">
            <motion.div className="wno-section-head" {...fadeInUp}>
              <span className="wno-section-kicker">Código e CSS trazidos da referência</span>
              <h2>O que veio do EasyFood e o que veio do acervo original da Wno Mas</h2>
            </motion.div>

            <div className="wno-feature-grid">
              {curationPoints.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.article
                    key={item.title}
                    className="wno-feature-card"
                    {...fadeInUp}
                    transition={{ duration: 0.7, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="wno-feature-icon">
                      <Icon size={20} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </motion.article>
                )
              })}
            </div>

            <motion.div className="wno-code-strip" {...fadeInUp}>
              <div>
                <span>EasyFood</span>
                <p>tema `dark/day`, brilho dourado, profundidade, contraste e postura editorial.</p>
              </div>
              <div>
                <span>Wno Mas original</span>
                <p>paleta vinho, catálogo, logo e a construção horizontal das garrafas.</p>
              </div>
              <div>
                <span>Aplicação atual</span>
                <p>uma landing mais premium, pronta para receber um vídeo real de vinícola sem trocar a base visual.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="wno-section wno-brand-story-section" id="marca">
          <div className="wno-shell">
            <motion.div className="wno-section-head" {...fadeInUp}>
              <span className="wno-section-kicker">Concepção da marca</span>
              <h2>O site agora pode contar a história visual da Wno Mas como uma marca própria.</h2>
              <p>
                Encontramos o material antigo de criação e transformamos esse acervo em uma linha do tempo editorial,
                para mostrar como o símbolo, o gesto da taça e a assinatura foram concebidos.
              </p>
            </motion.div>

            <div className="wno-brand-story">
              {brandStory.map((step, index) => (
                <motion.article
                  key={step.title}
                  className={`wno-story-step ${index % 2 === 1 ? 'is-reversed' : ''}`}
                  {...fadeInUp}
                  transition={{ duration: 0.72, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="wno-story-meta">
                    <span className="wno-story-index">Etapa {String(index + 1).padStart(2, '0')}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>

                  <div className={`wno-story-gallery ${step.images.length > 1 ? 'is-grid' : ''}`}>
                    {step.images.map((image) => (
                      <figure key={image} className="wno-story-card">
                        <img src={image} alt={step.title} />
                      </figure>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="wno-section wno-contact-section" id="contato">
          <div className="wno-shell">
            <motion.div className="wno-contact-card" {...fadeInUp}>
              <div>
                <span className="wno-section-kicker">Pronto para subir</span>
                <h2>Estrutura fechada para publicação da Wno Mas como um site próprio.</h2>
                <p>
                  A rota já está isolada do site institucional, com linguagem própria, acervo real da marca e base
                  pronta para deploy. O próximo passo é publicar e apontar a URL final da operação.
                </p>
              </div>

              <div className="wno-contact-actions">
                <a
                  href="https://wa.me/5511976889417?text=Quero+publicar+o+site+da+Wno+Mas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wno-btn wno-btn-primary"
                >
                  Publicar Wno Mas
                  <ExternalLink size={16} />
                </a>
                <a href="mailto:contato@wgalmeida.com.br" className="wno-btn wno-btn-secondary">
                  contato@wgalmeida.com.br
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="wno-footer">
          <div className="wno-shell wno-footer-inner">
            <div className="wno-footer-brand">
              <img src="/images/wno-mas/logo-wno.png" alt="Wno Mas Vinhos & Cia" />
              <p>Curadoria premium de vinhos, champagnes e experiências autorais.</p>
            </div>

            <div className="wno-footer-links">
              <a href="#curadoria">Curadoria</a>
              <a href="#rotulos">Rótulos</a>
              <a href="#marca">Concepção da marca</a>
              <a
                href="https://wa.me/5511976889417?text=Quero+conhecer+a+Wno+Mas"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
