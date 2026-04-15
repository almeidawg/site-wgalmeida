import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { withBasePath } from '@/utils/assetPaths';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building,
  CheckCircle,
  MapPin,
  Building2,
  Clock,
  Award,
  Target,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY } from '@/data/company';

const ConstrutoraBrooklin = () => {
  const pageUrl = 'https://wgalmeida.com.br/construtora-brooklin';

  const diferenciais = [
    {
      icon: MapPin,
      title: 'Experiência no Brooklin',
      description: 'Conhecimento profundo da região, dos condomínios e normas específicas do bairro.'
    },
    {
      icon: Building2,
      title: 'Obras Corporativas',
      description: 'Especialistas em projetos próximos à Berrini e região empresarial.'
    },
    {
      icon: Clock,
      title: 'Prazo Rigoroso',
      description: 'Cronograma garantido com metodologia ágil e acompanhamento diário.'
    },
    {
      icon: Award,
      title: 'Qualidade Certificada',
      description: 'Padrão executivo com acabamentos premium e garantia de 5 anos.'
    }
  ];

  const tiposObra = [
    {
      tipo: 'Obras Residenciais',
      descricao: 'Construção e reforma completa de apartamentos e casas no Brooklin.',
      itens: ['Apartamentos 80-250m²', 'Retrofit completo', 'Marcenaria integrada', 'Turn Key Premium']
    },
    {
      tipo: 'Retrofit Comercial',
      descricao: 'Modernização de escritórios e espaços corporativos próximos à Berrini.',
      itens: ['Salas comerciais', 'Showrooms', 'Ambientes flex', 'Infraestrutura tech']
    },
    {
      tipo: 'Projetos Turn Key',
      descricao: 'Solução completa: projeto, execução e entrega pronta para uso.',
      itens: ['Projeto executivo', 'Obra integrada', 'Acabamentos premium', 'Garantia estendida']
    }
  ];

  const porqueBrooklin = [
    'Proximidade estratégica com Av. Berrini e centro empresarial',
    'Experiência em edifícios residenciais e comerciais da região',
    'Conhecimento das normas dos principais condomínios',
    'Logística otimizada para acesso e entrega de materiais',
    'Equipe treinada para ambientes de alto padrão',
    'Discrição e profissionalismo em obras urbanas'
  ];

  const etapas = [
    { titulo: 'Análise do Projeto', descricao: 'Visita técnica e levantamento completo do espaço.' },
    { titulo: 'Projeto Executivo', descricao: 'Documentação técnica, 3D e especificações.' },
    { titulo: 'Planejamento', descricao: 'Cronograma real e orçamento sem surpresas.' },
    { titulo: 'Execução', descricao: 'Obra com acompanhamento diário e relatórios.' },
    { titulo: 'Entrega', descricao: 'Vistoria final, ajustes e garantia de 5 anos.' }
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    "name": "Construtora Brooklin | Grupo WG Almeida",
    "description": "Construtora especializada no Brooklin. Obras residenciais e comerciais Turn Key. Atuação próxima à Berrini. Acabamento premium e prazo garantido.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": COMPANY.phoneRaw
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": "Brooklin",
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
        pathname="/construtora-brooklin"
        title="Construtora Brooklin SP | Obras Residenciais e Comerciais"
        description="Construtora especializada no Brooklin. Obras residenciais e comerciais Turn Key. Atuação próxima à Berrini. Acabamento premium e prazo garantido. Orçamento grátis."
        keywords="construtora brooklin, obra brooklin, construtora berrini, reforma brooklin, construção brooklin, quanto custa obra brooklin"
        url={pageUrl}
        schema={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="wg-page-hero hero-under-header bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${withBasePath('/images/banners/ENGENHARIA.webp')})` }}
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
                Brooklin, São Paulo
              </span>
            </div>
            <h1 className="wg-page-hero-title mb-6">
              Construtora no Brooklin<br />Obras Premium Turn Key
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Construção e reforma de alto padrão no Brooklin. Especialistas em obras residenciais
              e comerciais próximas à Berrini. Sistema Turn Key com prazo garantido.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Brooklin
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/brooklin">
                <Button className="btn-hero-outline">
                  Mais sobre o Brooklin
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
              Construtora Brooklin
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Por Que Escolher a WG Almeida no Brooklin
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

      {/* Tipos de Obra */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Obras que Realizamos no Brooklin
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiposObra.map((obra, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <Building className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-light text-wg-black mb-3">
                  {obra.tipo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {obra.descricao}
                </p>
                <ul className="space-y-2">
                  {obra.itens.map((item, i) => (
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

      {/* Por que Brooklin */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Target className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              O Brooklin e Sua Importância Estratégica
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {porqueBrooklin.map((item, index) => (
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
              Como Funciona Nossa Obra no Brooklin
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

      {/* Quote */}
      <section className="py-16 bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl italic text-wg-orange max-w-3xl mx-auto font-light"
          >
            "No Brooklin, entregamos obras com a excelência que o bairro merece."
          </motion.p>
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
              Pronto para Construir ou Reformar no Brooklin?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento personalizado e descubra como transformamos seu projeto com qualidade premium e prazo garantido.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Grátis
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

export default ConstrutoraBrooklin;
