import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { withBasePath } from '@/utils/assetPaths';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  CheckCircle,
  MapPin,
  Building2,
  Clock,
  Award,
  TrendingUp,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReformaApartamentoItaim = () => {
  const pageUrl = 'https://wgalmeida.com.br/reforma-apartamento-itaim';

  const diferenciais = [
    {
      icon: MapPin,
      title: 'Experiência no Itaim',
      description: 'Conhecemos os condomínios, normas e características específicas do bairro.'
    },
    {
      icon: Clock,
      title: 'Cronograma Garantido',
      description: 'Logística otimizada para o Itaim. Obra sem atrasos e com acompanhamento diário.'
    },
    {
      icon: Building2,
      title: 'Turn Key Premium',
      description: 'Projeto, execução e entrega integrados. Um único responsável do início ao fim.'
    },
    {
      icon: Award,
      title: 'Acabamento Impecável',
      description: 'Padrão compatível com o Itaim Bibi: materiais premium e execução de excelência.'
    }
  ];

  const tiposReforma = [
    {
      tipo: 'Apartamento Novo (Construtora)',
      metragem: '80m² a 200m²',
      prazo: '12-16 semanas',
      servicos: ['Layout otimizado', 'Acabamentos premium', 'Marcenaria integrada', 'Automação residencial']
    },
    {
      tipo: 'Apartamento Comprado (Usado)',
      metragem: '100m² a 250m²',
      prazo: '14-20 semanas',
      servicos: ['Modernização completa', 'Infraestrutura renovada', 'Design contemporâneo', 'Garantia 5 anos']
    },
    {
      tipo: 'Retrofit e Atualização',
      metragem: '120m² a 300m²',
      prazo: '8-12 semanas',
      servicos: ['Troca de acabamentos', 'Marcenaria nova', 'Iluminação moderna', 'Reforma sem sair']
    }
  ];

  const porqueItaim = [
    'Proximidade com escritórios corporativos exige funcionalidade e design',
    'Padrão elevado de acabamentos compatível com o bairro',
    'Conhecimento das normas dos principais condomínios',
    'Logística eficiente para entrega de materiais e acesso',
    'Equipe treinada para ambientes premium',
    'Discrição e profissionalismo em obras residenciais'
  ];

  const etapas = [
    { titulo: 'Visita Técnica', descricao: 'Análise do apartamento e levantamento de medidas.' },
    { titulo: 'Projeto Completo', descricao: 'Arquitetura, layout 3D e especificações técnicas.' },
    { titulo: 'Orçamento Fechado', descricao: 'Valor final sem surpresas, com cronograma real.' },
    { titulo: 'Execução Turn Key', descricao: 'Obra completa: demolição, infraestrutura e acabamentos.' },
    { titulo: 'Entrega Premium', descricao: 'Vistoria, ajustes finais e entrega com garantia.' }
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Reforma de Apartamento no Itaim Bibi | Grupo WG Almeida",
    "description": "Reforma completa de apartamento no Itaim Bibi. Sistema Turn Key Premium: projeto, execução e entrega. Apartamentos de 80m² a 300m². Orçamento sem compromisso.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": "+5511984650002",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "São Paulo",
        "addressRegion": "SP",
        "addressCountry": "BR"
      }
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": "Itaim Bibi",
      "containedInPlace": {
        "@type": "City",
        "name": "São Paulo"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "47"
    }
  };

  return (
    <>
      <SEO
        pathname="/reforma-apartamento-itaim"
        title="Reforma Apartamento Itaim Bibi | Turn Key Premium SP"
        description="Reforma completa de apartamento no Itaim Bibi. Sistema Turn Key: projeto, obra e entrega integrados. Especialistas em apartamentos de 80m² a 300m². Orçamento grátis."
        keywords="reforma apartamento itaim, reforma apartamento itaim bibi, construtora itaim, arquitetura itaim, reforma turn key itaim, quanto custa reforma apartamento itaim"
        url={pageUrl}
        schema={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="wg-page-hero hero-under-header bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${withBasePath('/images/banners/PROJETOS.webp')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-wg-orange" />
              <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase">
                Itaim Bibi, São Paulo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Reforma de Apartamento<br />no Itaim Bibi
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transformamos apartamentos no Itaim com sistema Turn Key Premium.
              Projeto, execução e entrega com prazo garantido e acabamento impecável.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Itaim
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/itaim">
                <Button className="btn-hero-outline">
                  Mais sobre o Itaim
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
              Por que Reformar no Itaim com a WG Almeida
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Especialistas em Reforma no Itaim Bibi
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

      {/* Tipos de Reforma */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-light text-sm tracking-[0.18em] uppercase mb-4 block">
              Soluções para Cada Tipo de Apartamento
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Reformas que Realizamos no Itaim
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiposReforma.map((reforma, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <Home className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-light text-wg-black mb-2">
                  {reforma.tipo}
                </h3>
                <div className="flex items-center gap-4 text-sm text-wg-gray mb-4">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {reforma.metragem}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {reforma.prazo}
                  </span>
                </div>
                <ul className="space-y-2">
                  {reforma.servicos.map((servico, i) => (
                    <li key={i} className="flex items-center gap-2 text-wg-gray">
                      <CheckCircle className="w-4 h-4 text-wg-green flex-shrink-0" />
                      <span className="font-light">{servico}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que Itaim */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <MapPin className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Por Que o Itaim Exige Atenção Especial
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {porqueItaim.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-wg-gray-light rounded-xl"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-wg-green" />
                <p className="text-wg-gray font-light">{item}</p>
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
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Como Funciona a Reforma no Itaim
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {etapas.map((etapa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-wg-orange text-white rounded-full flex items-center justify-center font-medium text-lg mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-inter font-light text-wg-black mb-2">
                  {etapa.titulo}
                </h3>
                <p className="text-sm text-wg-gray font-light">
                  {etapa.descricao}
                </p>
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
              Pronto para Reformar Seu Apartamento no Itaim?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento personalizado e descubra como transformamos seu apartamento com qualidade premium e prazo garantido.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+5511984650002" className="btn-hero-outline">
                <Phone className="w-5 h-5" />
                +55 (11) 98465-0002
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ReformaApartamentoItaim;
