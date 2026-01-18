import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "O que é Turn Key Premium?",
      answer: "Turn Key Premium é um sistema completo onde o Grupo WG Almeida assume responsabilidade total do projeto — arquitetura, engenharia e marcenaria — entregando espaços totalmente acabados e prontos para uso. Você não se preocupa com coordenação de profissionais; nós cuidamos de tudo, do conceito até à entrega final, com um único padrão de qualidade."
    },
    {
      question: "Qual é a diferença entre reforma tradicional e Turn Key?",
      answer: "Reforma tradicional contrata arquiteto, engenheiro e marceneiro separadamente — você coordena tudo, com riscos de atraso e incompatibilidade. Turn Key integra todas as disciplinas sob um único guarda-chuva: um processo único, um cronograma, um responsável pela qualidade. Menos stress, mais previsibilidade, resultado superior."
    },
    {
      question: "Quanto tempo leva uma obra integrada?",
      answer: "Depende do escopo e metragem. Para um apartamento de 150m² com reforma completa, o ciclo típico é: 6-8 semanas de projeto + 12-16 semanas de execução = 5-6 meses. Usamos cronograma controlado com metodologia ágil. Em projetos maiores ou mais complexos, podemos estender. Fazemos consultoria gratuita para estimar seu caso específico."
    },
    {
      question: "Como funciona o sistema WG Easy?",
      answer: "WG Easy é nosso painel online de controle de obra. Você acompanha em tempo real: cronograma, fotos do dia-a-dia, aprovações, comunicação centralizada, decisões documentadas. Sem surpresas, sem intermediários. Você tem visibilidade total e pode acompanhar seu projeto do começo ao fim de qualquer lugar."
    },
    {
      question: "Em qual região de São Paulo vocês trabalham?",
      answer: "Atuamos em toda São Paulo, com especial foco em bairros premium como Itaim Bibi, Jardins, Brooklin, Vila Nova Conceição, Mooca, Vila Mariana e região Centro. Temos experiência em residencial e corporativo em todas as áreas — mas priorizamos clientes que valorizam qualidade e processo."
    },
    {
      question: "Qual é o processo completo de uma obra Turn Key?",
      answer: "Processo em 6 etapas: (1) Compreensão Profunda — briefing detalhado do cliente e espaço; (2) Projeto Executivo — documentação técnica completa; (3) Planejamento — financeiro, técnico e cronograma; (4) Execução Integrada — obra com gestão rigorosa; (5) Marcenaria Premium — acabados e mobiliário; (6) Entrega Assistida — pós-obra e acompanhamento."
    },
    {
      question: "Como é feita a marcenaria a medida?",
      answer: "Desenvolvemos móveis customizados de alto nível em perfeita integração com projeto e obra. Não é complemento — é extensão da arquitetura. Desde a concepção do design, já pensamos em materiais, acabamentos e funcionalidade integrada. Cada móvel é assinado, documentado e executado com rigor técnico."
    },
    {
      question: "Qual é o orçamento aproximado para uma reforma?",
      answer: "Varia conforme escopo (reforma completa vs. parcial), metragem, acabamentos premium e localização. Reformas integradas premium começam a partir de R$ 3.000-5.000/m². Para dar orçamento real, fazemos consultoria técnica gratuita onde analisamos seu espaço, necessidades e objetivos."
    },
    {
      question: "Vocês fazem reformas de apartamento novo?",
      answer: "Sim, é nossa especialidade. Apartamento novo (na planta ou na entrega) é situação perfeita para Turn Key. Sabemos como trabalhar com manuais de condomínio, legislação e restrições. Transformamos espaços em branco em ambientes assinados, funcionais e premium."
    },
    {
      question: "Há garantia no trabalho realizado?",
      answer: "Sim. Oferecemos garantia estrutural de 5 anos em obra e acabados. Além disso, todos os serviços estão documentados — se houver qualquer divergência, temos registro. Nossa reputação se baseia em qualidade e responsabilidade."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Perguntas Frequentes - FAQ | Grupo WG Almeida</title>
        <meta
          name="description"
          content="Respostas claras sobre Turn Key Premium, processos, prazos, garantias e serviços do Grupo WG Almeida. Tire suas dúvidas sobre arquitetura, engenharia e marcenaria de alto padrão."
        />
        <link rel="canonical" href="https://wgalmeida.com.br/faq" />
        <meta property="og:title" content="Perguntas Frequentes - FAQ | Grupo WG Almeida" />
        <meta property="og:description" content="Respostas claras sobre Turn Key Premium, processos, prazos, garantias e serviços do Grupo WG Almeida." />
        <meta property="og:url" content="https://wgalmeida.com.br/faq" />
      </Helmet>

      <div className="faq-page">
        <section className="faq-hero">
          <h1>Perguntas Frequentes</h1>
          <p>Respostas claras sobre nosso processo, serviços e diferencial</p>
        </section>

        <section className="faq-content">
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="faq-item"
                open={activeIndex === index}
              >
                <summary
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                  className="faq-question"
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </summary>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="faq-cta">
          <h2>Não encontrou sua resposta?</h2>
          <p>Entre em contato conosco. Estamos prontos para esclarecer qualquer dúvida.</p>
          <a href="/contato" className="btn btn-primary">Fale Conosco</a>
        </section>
      </div>
    </>
  );
}
