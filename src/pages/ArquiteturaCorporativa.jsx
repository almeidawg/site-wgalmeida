import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { withBasePath } from '@/utils/assetPaths';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Briefcase,
  Users,
  TrendingUp,
  Lightbulb,
  Shield,
  Clock,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/data/company';

const ArquiteturaCorporativa = () => {
  const pageUrl = 'https://wgalmeida.com.br/arquitetura-corporativa';

  const diferenciais = [
    {
      icon: Briefcase,
      title: 'Identidade Corporativa',
      description: 'Projetos que transmitem os valores e o posicionamento da sua empresa.'
    },
    {
      icon: Users,
      title: 'Produtividade',
      description: 'Ambientes otimizados para performance e bem-estar das equipes.'
    },
    {
      icon: TrendingUp,
      title: 'Valorização',
      description: 'Espaços que impressionam clientes e atraem talentos.'
    },
    {
      icon: Shield,
      title: 'Turn Key Corporativo',
      description: 'Obra sem interferir nas operações. Cronograma rigoroso e entrega garantida.'
    }
  ];

  const tiposProjeto = [
    {
      titulo: 'Escritórios Corporativos',
      descricao: 'Ambientes profissionais que refletem a cultura e valores da empresa.',
      itens: [
        'Open space e salas privativas',
        'Salas de reunião equipadas',
        'Áreas de colaboração',
        'Infraestrutura técnica completa'
      ]
    },
    {
      titulo: 'Showrooms e Lojas',
      descricao: 'Espaços comerciais que convertem visitas em vendas.',
      itens: [
        'Design estratégico de exposição',
        'Iluminação cenográfica',
        'Identidade visual integrada',
        'Experiência do cliente'
      ]
    },
    {
      titulo: 'Coworkings e Hubs',
      descricao: 'Espaços flexíveis para trabalho colaborativo e eventos.',
      itens: [
        'Layout modular e adaptável',
        'Tecnologia integrada',
        'Áreas comuns inspiradoras',
        'Acústica profissional'
      ]
    }
  ];

  const beneficiosCorporativos = [
    'Redução de custos operacionais com eficiência energética',
    'Aumento da produtividade com ergonomia e conforto',
    'Fortalecimento da marca com design alinhado',
    'Atração e retenção de talentos com ambiente inspirador',
    'Flexibilidade para crescimento futuro',
    'Conformidade com normas técnicas e acessibilidade'
  ];

  const processoExecutivo = [
    {
      fase: 'Diagnóstico Estratégico',
      atividades: ['Briefing executivo', 'Análise de fluxos', 'Benchmarking setorial', 'Proposta comercial']
    },
    {
      fase: 'Conceito e Projeto',
      atividades: ['Identidade espacial', 'Layouts comparativos', 'Renderizações 3D', 'Aprovação executiva']
    },
    {
      fase: 'Planejamento e Compliance',
      atividades: ['Projetos complementares', 'Cronograma executivo', 'Orçamento detalhado', 'Aprovações legais']
    },
    {
      fase: 'Execução Profissional',
      atividades: ['Gestão de obra', 'Fornecedores corporativos', 'Relatórios semanais', 'Qualidade assegurada']
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Arquitetura Corporativa São Paulo | Projetos Comerciais Premium",
    "description": "Arquitetura corporativa e comercial em São Paulo. Escritórios, showrooms e espaços corporativos. Projeto e execução turn key com identidade empresarial.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": COMPANY.phoneRaw
    },
    "areaServed": {
      "@type": "City",
      "name": "São Paulo"
    }
  };

  return (
    <>
      <SEO
        pathname="/arquitetura-corporativa"
        title="Arquitetura Corporativa SP | Escritórios e Espaços Comerciais"
        description="Arquitetura corporativa em São Paulo. Projetos de escritórios, showrooms e espaços comerciais premium. Sistema turn key com design estratégico e execução profissional."
        keywords="arquitetura corporativa, arquiteto corporativo, projeto escritorio sp, arquitetura comercial, design corporativo, escritorio alto padrao"
        url={pageUrl}
        schema={schema}
      />

      {/* Hero Section */}
      <section className="wg-page-hero hero-under-header bg-wg-black">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={withBasePath('/images/banners/ARQ.webp')}
          srcSet={`${withBasePath('/images/banners/ARQ-640.webp')} 640w, ${withBasePath('/images/banners/ARQ-960-opt.webp')} 960w, ${withBasePath('/images/banners/ARQ-1280.webp')} 1280w, ${withBasePath('/images/banners/ARQ.webp')} 1920w`}
          sizes="100vw"
          alt="Arquitetura corporativa e espaços comerciais"
          width="1920"
          height="1080"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-wg-orange text-white rounded-full text-sm font-light uppercase tracking-[0.18em] mb-6">
              Arquitetura Corporativa
            </span>
            <h1 className="wg-page-hero-title mb-6">
              Projetos Corporativos<br />que Transformam Negócios
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Escritórios, showrooms e espaços comerciais que fortalecem sua marca,
              aumentam produtividade e impressionam clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Proposta
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button className="btn-hero-outline">
                  Ver Projetos Corporativos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase mb-4 block">
              Por que Investir em Arquitetura Corporativa
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Espaços que Geram Resultados
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {diferenciais.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-wg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {React.createElement(item.icon, { className: 'w-8 h-8 text-wg-orange' })}
                </div>
                <h3 className="text-xl font-inter font-light text-wg-black mb-2">
                  {item.title}
                </h3>
                <p className="text-wg-gray font-light">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tipos de Projeto */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase mb-4 block">
              Soluções Corporativas
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Projetos para Cada Tipo de Negócio
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiposProjeto.map((projeto, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <Building2 className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-light text-wg-black mb-3">
                  {projeto.titulo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {projeto.descricao}
                </p>
                <ul className="space-y-2">
                  {projeto.itens.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-wg-gray">
                      <CheckCircle className="w-4 h-4 text-wg-green flex-shrink-0" />
                      <span className="font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Lightbulb className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Benefícios de um Projeto Corporativo Premium
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {beneficiosCorporativos.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-wg-gray-light rounded-xl"
              >
                <CheckCircle className="w-5 h-5 text-wg-green flex-shrink-0 mt-0.5" />
                <p className="text-wg-gray font-light">{beneficio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Processo */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase mb-4 block">
              Como Trabalhamos
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Processo Executivo Turn Key
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {processoExecutivo.map((etapa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6"
              >
                <div className="w-10 h-10 bg-wg-orange text-white rounded-full flex items-center justify-center font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-inter font-light text-wg-black mb-3">
                  {etapa.fase}
                </h3>
                <ul className="space-y-1">
                  {etapa.atividades.map((atividade, i) => (
                    <li key={i} className="text-sm text-wg-gray font-light">
                      • {atividade}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding bg-gradient-to-br from-wg-black to-wg-black/90 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light mb-6">
              Pronto para Transformar Seu Espaço Corporativo?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Converse com nossos arquitetos especializados em projetos corporativos e descubra como criar um ambiente estratégico para seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Proposta Corporativa
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href={`tel:${COMPANY.phoneRaw}`} className="btn-hero-outline">
                <Phone className="w-5 h-5" />
                {COMPANY.phone}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ArquiteturaCorporativa;
