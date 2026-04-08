import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Clock,
  Shield,
  TrendingUp,
  Users,
  Award,
  MapPin,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConstrutoraAltoPadraoSP = () => {
  const pageUrl = 'https://wgalmeida.com.br/construtora-alto-padrao-sp';

  const diferenciais = [
    {
      icon: Shield,
      title: 'Turn Key Premium',
      description: 'Sistema completo: projeto, obra e entrega. Um único responsável do início ao fim.'
    },
    {
      icon: Clock,
      title: 'Cronograma Garantido',
      description: 'Planejamento rigoroso com prazos reais e acompanhamento via sistema WG Easy.'
    },
    {
      icon: Award,
      title: '14 Anos de Experiência',
      description: 'Mais de 200 projetos entregues nos bairros mais exigentes de São Paulo.'
    },
    {
      icon: Users,
      title: 'Equipe Integrada',
      description: 'Arquitetos, engenheiros e marceneiros trabalhando em sintonia perfeita.'
    }
  ];

  const servicos = [
    {
      titulo: 'Reforma Completa de Apartamentos',
      descricao: 'Do projeto à entrega das chaves. Reformas turn key com gestão total e acabamento impecável.',
      itens: ['Reforma estrutural', 'Otimização de layout', 'Instalações completas', 'Acabamentos premium']
    },
    {
      titulo: 'Construção de Casas de Alto Padrão',
      descricao: 'Casas sob medida com arquitetura autoral, engenharia de excelência e execução precisa.',
      itens: ['Projetos exclusivos', 'Execução técnica', 'Acompanhamento diário', 'Garantia estrutural 5 anos']
    },
    {
      titulo: 'Projetos Corporativos',
      descricao: 'Escritórios, showrooms e espaços comerciais que transmitem identidade e profissionalismo.',
      itens: ['Arquitetura corporativa', 'Infraestrutura técnica', 'Mobiliário integrado', 'Entrega turn key']
    }
  ];

  const bairrosAtendidos = [
    'Jardins', 'Vila Nova Conceição', 'Itaim Bibi', 'Brooklin',
    'Morumbi', 'Cidade Jardim', 'Alto de Pinheiros', 'Moema',
    'Higienópolis', 'Pinheiros', 'Campo Belo', 'Vila Mariana'
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "name": "Grupo WG Almeida - Construtora Alto Padrão São Paulo",
    "description": "Construtora especializada em obras de alto padrão em São Paulo. Sistema Turn Key Premium com arquitetura, engenharia e marcenaria integradas.",
    "url": pageUrl,
    "telephone": "+55-11-98465-0002",
    "email": "contato@wgalmeida.com.br",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "São Paulo",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "areaServed": {
      "@type": "City",
      "name": "São Paulo"
    },
    "priceRange": "$$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "47"
    }
  };

  return (
    <>
      <SEO
        title="Construtora Alto Padrão SP | Obras Turn Key Premium"
        description="Construtora especializada em obras de alto padrão em São Paulo. Sistema Turn Key: arquitetura, engenharia e marcenaria integradas. 14 anos de experiência. Orçamento sem compromisso."
        keywords="construtora alto padrão são paulo, construtora sp, obra alto padrão, turn key são paulo, construtora jardins, construtora itaim, reforma alto padrão sp"
        url={pageUrl}
        schema={schema}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-wg-black hero-under-header">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-wg-orange text-white rounded-full text-sm uppercase tracking-wider mb-6">
              Construtora Alto Padrão São Paulo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Obras de Alto Padrão<br />com Sistema Turn Key Premium
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Arquitetura, engenharia e marcenaria integradas em um único ecossistema.
              14 anos transformando projetos em realidade nos bairros mais exigentes de São Paulo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button className="btn-hero-outline">
                  Ver Projetos Realizados
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">
              Por que escolher o Grupo WG Almeida
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              O Diferencial de uma Construtora Premium
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

      {/* Serviços */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">
              Nossos Serviços
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Soluções Completas em Construção
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {servicos.map((servico, index) => (
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
                  {servico.titulo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {servico.descricao}
                </p>
                <ul className="space-y-2">
                  {servico.itens.map((item, i) => (
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

      {/* Bairros Atendidos */}
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
              Construtora nos Bairros Premium de São Paulo
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              Atuamos nos bairros mais exigentes da capital, com experiência comprovada em projetos de alto padrão.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {bairrosAtendidos.map((bairro, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-2 bg-wg-gray-light text-wg-gray rounded-full text-sm"
              >
                {bairro}
              </motion.span>
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
              Pronto para Iniciar Seu Projeto de Alto Padrão?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Solicite um orçamento sem compromisso e descubra como transformamos sua obra em uma experiência fluida e previsível.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+5511984650002" className="btn-hero-outline">
                <Phone className="w-5 h-5" />
                (11) 98465-0002
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ConstrutoraAltoPadraoSP;
