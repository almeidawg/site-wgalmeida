import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  CheckCircle,
  MapPin,
  Palette,
  Clock,
  Award,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandStar from '@/components/BrandStar';

const ArquiteturaInterioresVilaNovaConceicao = () => {
  const pageUrl = 'https://wgalmeida.com.br/arquitetura-interiores-vila-nova-conceicao';

  const diferenciais = [
    {
      icon: Palette,
      title: 'Design Exclusivo',
      description: 'Projetos de interiores assinados por arquitetos especializados em alto padrão.'
    },
    {
      icon: Sparkles,
      title: 'Curadoria Premium',
      description: 'Seleção de materiais nobres, acabamentos diferenciados e fornecedores exclusivos.'
    },
    {
      icon: Award,
      title: 'Discrição Total',
      description: 'Atendimento personalizado e obras com o máximo de privacidade e respeito.'
    },
    {
      icon: Clock,
      title: 'Turn Key Completo',
      description: 'Do conceito à entrega, cuidamos de cada detalhe do seu projeto de interiores.'
    }
  ];

  const servicos = [
    {
      tipo: 'Design de Interiores Residencial',
      descricao: 'Projetos completos que traduzem personalidade e estilo de vida em ambientes únicos.',
      itens: ['Conceito autoral', 'Paleta exclusiva', 'Mobiliário curado', 'Iluminação cenográfica']
    },
    {
      tipo: 'Curadoria de Materiais',
      descricao: 'Seleção criteriosa de revestimentos, metais, madeiras e tecidos de luxo.',
      itens: ['Mármores exclusivos', 'Metais importados', 'Madeiras nobres', 'Tecidos premium']
    },
    {
      tipo: 'Projeto Turn Key Premium',
      descricao: 'Solução completa: arquitetura de interiores, execução e marcenaria integradas.',
      itens: ['Projeto executivo', 'Obra gerenciada', 'Marcenaria sob medida', 'Garantia 5 anos']
    }
  ];

  const porqueVilaNovaConceicao = [
    'Localização privilegiada próxima ao Parque Ibirapuera',
    'Experiência em apartamentos de ultra alto padrão',
    'Conhecimento dos principais edifícios e condomínios premium',
    'Rede de fornecedores exclusivos e showrooms diferenciados',
    'Equipe especializada em ambientes de luxo discreto',
    'Respeito à privacidade e excelência em cada detalhe'
  ];

  const processo = [
    { titulo: 'Imersão', descricao: 'Entendemos seu estilo de vida, gostos e necessidades.' },
    { titulo: 'Conceito', descricao: 'Desenvolvemos proposta autoral com moodboard e paleta.' },
    { titulo: 'Projeto 3D', descricao: 'Visualização fotorrealística dos ambientes.' },
    { titulo: 'Execução', descricao: 'Obra integrada com acompanhamento personalizado.' },
    { titulo: 'Entrega', descricao: 'Ambiente pronto com curadoria de objetos e arte.' }
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Arquitetura de Interiores Vila Nova Conceição | Grupo WG Almeida",
    "description": "Arquitetura de interiores de alto padrão em Vila Nova Conceição. Design exclusivo, curadoria premium e projetos Turn Key completos. Ambientes únicos para residências de luxo.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": "+55-11-98465-0002"
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": "Vila Nova Conceição",
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
        title="Arquitetura Interiores Vila Nova Conceição SP | Design Premium"
        description="Arquitetura de interiores de alto padrão em Vila Nova Conceição. Design exclusivo, curadoria premium e projetos Turn Key completos. Ambientes únicos para residências de luxo."
        keywords="arquitetura interiores vila nova conceição, design interiores vila nova conceição, arquiteto vila nova conceição, decoração alto padrão vila nova conceição"
        url={pageUrl}
        schema={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-wg-black hero-under-header">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/images/banners/ARQ.webp)' }}
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
              <span className="text-wg-orange font-medium text-sm tracking-widest uppercase">
                Vila Nova Conceição, São Paulo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Arquitetura de Interiores<br />Vila Nova Conceição
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Design exclusivo e curadoria premium. Criamos ambientes únicos que refletem
              sofisticação e personalidade. Do conceito à entrega completa Turn Key.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento VNC
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/vila-nova-conceicao">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3">
                  Mais sobre Vila Nova Conceição
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
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              Interiores Vila Nova Conceição
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              O Padrão que Vila Nova Conceição Exige
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
                <h3 className="text-xl font-inter font-medium text-wg-black mb-2">
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
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Serviços de Arquitetura de Interiores
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
                <Home className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-medium text-wg-black mb-3">
                  {servico.tipo}
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

      {/* Por que Vila Nova Conceição */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Sparkles className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Vila Nova Conceição e Seu Padrão Único
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {porqueVilaNovaConceicao.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-wg-gray-light rounded-xl"
              >
                <BrandStar className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
              Do Conceito ao Ambiente Pronto
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {processo.map((etapa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-wg-orange text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-inter font-medium text-wg-black mb-2">
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
            "Criamos interiores que traduzem personalidade, sofisticação e exclusividade."
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
              Transforme Seu Espaço com Design Exclusivo
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento personalizado e descubra como criamos ambientes únicos com arquitetura de interiores de excelência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+5511984650002" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white rounded-2xl font-medium hover:bg-white hover:text-wg-black transition-all">
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

export default ArquiteturaInterioresVilaNovaConceicao;
