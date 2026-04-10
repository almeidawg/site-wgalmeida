import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import './faq.css';

const FAQ_CLUSTERS = [
  {
    id: 'estrategia',
    eyebrow: 'Intenção de busca',
    title: 'Arquitetura, turn key e posicionamento premium',
    intro:
      'Este bloco responde dúvidas com maior aderência a busca qualificada para arquitetura, reforma alto padrão e obra turn key em São Paulo.',
    items: [
      {
        question: 'O que é obra turn key e quando ela faz sentido no alto padrão?',
        answer:
          'Obra turn key é o modelo em que arquitetura, engenharia, marcenaria, suprimentos e gestão executiva ficam integrados sob uma coordenação única. Ele faz mais sentido quando o cliente quer previsibilidade, compatibilização técnica e menos desgaste operacional durante a obra.',
        intent: 'obra turn key sao paulo',
        links: [
          { href: '/obra-turn-key', label: 'Entender a jornada turn key' },
          { href: '/processo', label: 'Ver processo completo' },
        ],
      },
      {
        question: 'Qual a diferença entre reforma tradicional e reforma turn key premium?',
        answer:
          'Na reforma tradicional, o cliente normalmente coordena profissionais e decisões em frentes separadas. No turn key premium, a tomada de decisão, o cronograma, os materiais e a execução convergem para uma mesma metodologia. Isso reduz ruído, retrabalho e desalinhamento entre projeto e obra.',
        intent: 'reforma apartamento alto padrao sp',
        links: [
          { href: '/reforma-apartamento-sp', label: 'Ver reforma em São Paulo' },
          { href: '/arquitetura', label: 'Explorar arquitetura WG' },
        ],
      },
      {
        question: 'Vocês atendem bairros como Itaim, Jardins, Brooklin e Vila Nova Conceição?',
        answer:
          'Sim. O foco operacional está em bairros com maior demanda por obra coordenada, alto padrão e adequação a condomínios exigentes, incluindo Itaim Bibi, Jardins, Brooklin, Vila Nova Conceição, Morumbi, Moema e outras regiões estratégicas de São Paulo.',
        intent: 'arquitetura alto padrao bairros sao paulo',
        links: [
          { href: '/itaim', label: 'Atendimento no Itaim' },
          { href: '/jardins', label: 'Atendimento nos Jardins' },
        ],
      },
      {
        question: 'Quando vale contratar arquiteto, engenheiro e marcenaria como um pacote integrado?',
        answer:
          'Quando o imóvel exige decisões técnicas em sequência, acabamento de alto nível e controle fino de orçamento e prazo. A integração evita que o mobiliário entre tarde, que o projeto chegue desconectado da execução ou que a engenharia corrija incompatibilidades já em obra.',
        intent: 'arquitetura engenharia marcenaria integradas',
        links: [
          { href: '/engenharia', label: 'Ver frente de engenharia' },
          { href: '/marcenaria', label: 'Ver marcenaria sob medida' },
        ],
      },
    ],
  },
  {
    id: 'obra',
    eyebrow: 'Dúvida operacional',
    title: 'Prazo, orçamento, condomínio e execução',
    intro:
      'Aqui ficam respostas que ajudam o usuário a comparar cenários reais de obra, orçamento e documentação, fortalecendo a relevância semântica do projeto para SEO local e comercial.',
    items: [
      {
        question: 'Quanto custa reformar apartamento em São Paulo com padrão premium?',
        answer:
          'O custo varia conforme escopo, infraestrutura existente, marcenaria, acabamentos e exigência do condomínio. Em projetos premium completos, a leitura por metro quadrado é apenas um ponto de partida; o orçamento real depende da compatibilização técnica e do pacote final de entrega.',
        intent: 'quanto custa reformar apartamento em sao paulo',
        links: [
          { href: '/solicite-proposta', label: 'Solicitar estimativa técnica' },
          { href: '/blog/quanto-custa-reformar-apartamento-2026', label: 'Ler guia de custo 2026' },
        ],
      },
      {
        question: 'Quanto tempo leva uma reforma completa de apartamento?',
        answer:
          'O prazo muda conforme metragem, nível de definição do cliente, aprovações e complexidade executiva. Em cenários residenciais completos, é comum dividir o ciclo entre diagnóstico, projeto, orçamento, execução e entrega assistida. O número final só deve ser comunicado após análise técnica do caso.',
        intent: 'quanto tempo dura reforma apartamento',
        links: [
          { href: '/blog/quanto-tempo-dura-reforma-apartamento', label: 'Ver artigo de prazo' },
          { href: '/processo', label: 'Ver macroetapas da jornada' },
        ],
      },
      {
        question: 'Vocês cuidam da documentação de obra em condomínio e normas técnicas?',
        answer:
          'Sim. A preparação documental faz parte da jornada: leitura técnica do imóvel, alinhamento com exigências do condomínio e direcionamento sobre responsabilidade, cronograma e comunicação da obra. Isso é especialmente importante em reformas com impacto hidráulico, elétrico ou estrutural.',
        intent: 'documentacao obra condominio nbr 16280',
        links: [
          { href: '/blog/documentacao-obra-condominio', label: 'Ver documentação de obra' },
          { href: '/blog/termo-responsabilidade-nbr16280', label: 'Ver NBR 16280' },
        ],
      },
      {
        question: 'Como funciona a marcenaria sob medida dentro da obra?',
        answer:
          'A marcenaria entra como parte do planejamento executivo, não como complemento final. Medições, detalhamento, materiais, ferragens, paginação e montagem precisam conversar com obra, forro, iluminação e uso real do espaço. Por isso ela é integrada à metodologia desde o início.',
        intent: 'marcenaria sob medida alto padrao',
        links: [
          { href: '/marcenaria', label: 'Explorar marcenaria' },
          { href: '/blog/marcenaria-sob-medida', label: 'Ler guia de marcenaria' },
        ],
      },
    ],
  },
  {
    id: 'tecnologia',
    eyebrow: 'Autoridade de processo',
    title: 'WG Easy, acompanhamento e visualização com IA',
    intro:
      'Este bloco conecta autoridade de marca, tecnologia própria e intenção de conversão. Ele ajuda SEO ao responder perguntas com termos proprietários e jornadas que o público realmente pesquisa.',
    items: [
      {
        question: 'O WG Easy mostra dados reais da obra?',
        answer:
          'O WG Easy é a camada de acompanhamento operacional do ecossistema WG. Hoje, no site público, apenas parte dos dados ligados ao catálogo está confirmada em leitura real. Já simulações de prazo e fluxo editorial devem ser tratadas como estimativas orientativas até que a sincronização operacional seja publicada explicitamente.',
        intent: 'wg easy como funciona',
        links: [
          { href: '/obraeasy', label: 'Ver ecossistema ObraEasy' },
          { href: '/processo', label: 'Entender a tela de processo' },
        ],
      },
      {
        question: 'Como funciona a personalização de ambiente com IA e moodboard da WG Almeida?',
        answer:
          'O moodboard ajuda a transformar direção estética em uma prévia compartilhável, enquanto o room visualizer aproxima cores e atmosferas de uma experiência visual mais concreta. A ferramenta é útil para briefing e alinhamento inicial, mas contratação e material executivo seguem uma etapa técnica posterior.',
        intent: 'moodboard ia design interiores',
        links: [
          { href: '/moodboard', label: 'Abrir moodboard' },
          { href: '/room-visualizer', label: 'Abrir visualizador de ambientes' },
        ],
      },
      {
        question: 'FAQ ajuda mesmo no SEO do site?',
        answer:
          'Sim, desde que o FAQ responda perguntas com intenção real de busca e mantenha aderência direta aos serviços, bairros, dores e diferenciais do projeto. FAQ genérico ajuda pouco. FAQ estratégico melhora cobertura semântica, chance de rich results e profundidade temática para arquitetura, reforma, marcenaria e tecnologia proprietária.',
        intent: 'faq seo arquitetura',
        links: [
          { href: '/blog', label: 'Ver base editorial do blog' },
          { href: '/arquitetura-corporativa', label: 'Ver landing estratégica' },
        ],
      },
      {
        question: 'Qual é o próximo passo depois de ler o FAQ?',
        answer:
          'Se você já tem imóvel, metragem, bairro ou objetivo definidos, o passo seguinte é solicitar proposta ou iniciar o briefing. Isso acelera o diagnóstico, reduz estimativas genéricas e leva a conversa para escopo real, cronograma e contratação.',
        intent: 'solicitar proposta arquitetura engenharia',
        links: [
          { href: '/solicite-proposta', label: 'Solicitar proposta' },
          { href: '/contato', label: 'Falar com a equipe' },
        ],
      },
    ],
  },
];

const flattenFaqs = (clusters) => clusters.flatMap((cluster) => cluster.items);

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState('estrategia-0');
  const faqs = useMemo(() => flattenFaqs(FAQ_CLUSTERS), []);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <SEO
        pathname="/faq"
        title="FAQ Estratégico | Turn Key, Reforma Alto Padrão e WG Easy | Grupo WG Almeida"
        description="Perguntas frequentes com foco real em SEO para obra turn key, reforma premium, marcenaria sob medida, WG Easy e arquitetura de alto padrão em São Paulo."
        keywords="faq arquitetura sao paulo, obra turn key, reforma apartamento premium, wg easy, marcenaria sob medida, seo arquitetura"
        schema={faqSchema}
      />

      <div className="faq-page">
        <section className="relative faq-hero hero-under-header overflow-hidden">
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <ResponsiveWebpImage
              className="w-full h-full object-cover"
              alt="Perguntas frequentes estratégicas WG Almeida"
              src="/images/banners/ARQ.webp"
              width="1920"
              height="1080"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.24)_0%,rgba(17,24,39,0.70)_58%,rgba(17,24,39,0.92)_100%)]" />
          </motion.div>

          <div className="relative z-10 container-custom faq-hero-grid">
            <div className="faq-hero-copy">
              <span className="faq-kicker">FAQ Estratégico</span>
              <h1>Perguntas que ajudam a entender processo, escopo e contratação</h1>
              <p>
                Reunimos aqui as dúvidas que mais ajudam quem está avaliando reforma, arquitetura,
                marcenaria e jornada turn key. A ideia é deixar a leitura clara, objetiva e útil para a próxima decisão.
              </p>
            </div>

            <div className="faq-hero-panel">
              <div className="faq-insight-card">
                <span className="faq-card-label">O que você encontra aqui</span>
                <p className="faq-insight-title">Respostas diretas para dúvidas reais de obra</p>
                <p>
                  O conteúdo foi organizado para explicar etapas, custos, documentação, tecnologia,
                  bairros atendidos e como a jornada WG Almeida funciona na prática.
                </p>
              </div>
              <div className="faq-insight-list">
                <div>
                  <span>01</span>
                  <p>Ajuda a comparar cenários antes de pedir proposta.</p>
                </div>
                <div>
                  <span>02</span>
                  <p>Conecta leitura editorial com páginas de serviço e atendimento.</p>
                </div>
                <div>
                  <span>03</span>
                  <p>Evita ruído e concentra o que realmente importa para decisão.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="faq-strategy-strip">
          <div className="container-custom faq-strategy-grid">
            <article>
              <span>Topo semântico</span>
              <p>Arquitetura alto padrão, turn key, bairros atendidos, marcenaria sob medida e tecnologia WG.</p>
            </article>
            <article>
              <span>Temas centrais</span>
              <p>Custo, prazo, documentação, compatibilização, condomínio, processo e riscos de obra.</p>
            </article>
            <article>
              <span>Próximo passo</span>
              <p>Briefing, proposta, jornada operacional, coordenação executiva e contratação assistida.</p>
            </article>
          </div>
        </section>

        <section className="faq-content">
          <div className="faq-container">
            {FAQ_CLUSTERS.map((cluster) => (
              <section key={cluster.id} className="faq-cluster" id={cluster.id}>
                <div className="faq-cluster-header">
                  <span className="faq-kicker faq-kicker-dark">{cluster.eyebrow}</span>
                  <h2>{cluster.title}</h2>
                  <p>{cluster.intro}</p>
                </div>

                <div className="faq-items">
                  {cluster.items.map((faq, index) => {
                    const itemKey = `${cluster.id}-${index}`;
                    const isOpen = activeIndex === itemKey;

                    return (
                      <details
                        key={itemKey}
                        className={`faq-item${isOpen ? ' is-open' : ''}`}
                        open={isOpen}
                      >
                        <summary
                          onClick={() => setActiveIndex(isOpen ? null : itemKey)}
                          className="faq-question"
                        >
                          <div className="faq-question-copy">
                            <span className="faq-intent-chip">{faq.intent}</span>
                            <span>{faq.question}</span>
                          </div>
                          <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                        </summary>

                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                          {faq.links?.length > 0 && (
                            <div className="faq-links">
                              {faq.links.map((link) => (
                                <Link key={link.href} to={link.href}>
                                  {link.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="faq-cta">
          <div className="faq-cta-inner">
            <div>
              <span className="faq-kicker">Próximo passo</span>
              <h2>Se o FAQ já respondeu a parte editorial, vamos para o briefing real</h2>
              <p>
                A resposta certa para SEO é importante. A resposta certa para contratação exige escopo, imóvel,
                bairro, expectativa e cronograma. É aí que a conversa fica útil de verdade.
              </p>
            </div>
            <div className="faq-cta-actions">
              <Link to="/solicite-proposta" className="btn btn-primary">Solicitar proposta</Link>
              <Link to="/blog" className="btn btn-secondary">Explorar base editorial</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

