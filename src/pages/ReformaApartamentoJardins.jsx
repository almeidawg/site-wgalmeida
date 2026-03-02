import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  CheckCircle,
  MapPin,
  Building2,
  Clock,
  Award,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrandStar from '@/components/BrandStar';

const ReformaApartamentoJardins = () => {
  const pageUrl = 'https://wgalmeida.com.br/reforma-apartamento-jardins';

  const diferenciais = [
    {
      icon: Award,
      title: 'Tradição e Excelência',
      description: 'Projetos que respeitam a arquitetura histórica e sofisticação dos Jardins.'
    },
    {
      icon: Sparkles,
      title: 'Acabamentos Premium',
      description: 'Materiais nobres e execução impecável compatíveis com o bairro.'
    },
    {
      icon: Clock,
      title: 'Discrição e Método',
      description: 'Obra organizada com respeito às normas dos condomínios premium.'
    },
    {
      icon: Building2,
      title: 'Turn Key Exclusivo',
      description: 'Projeto, obra e marcenaria sob medida. Um único responsável de excelência.'
    }
  ];

  const tiposImovel = [
    {
      tipo: 'Casas Clássicas',
      descricao: 'Reformas que preservam elementos originais e integram modernidade com respeito.',
      itens: ['Fachadas históricas', 'Jardins integrados', 'Modernização discreta', 'Patrimônio preservado']
    },
    {
      tipo: 'Apartamentos de Época',
      descricao: 'Retrofit premium em edifícios históricos com pé-direito alto e arquitetura marcante.',
      itens: ['Elementos preservados', 'Instalações modernas', 'Acabamentos nobres', 'Design atemporal']
    },
    {
      tipo: 'Apartamentos Modernos',
      descricao: 'Reformas completas em unidades contemporâneas com design sofisticado.',
      itens: ['Layout otimizado', 'Automação integrada', 'Marcenaria autoral', 'Luxo silencioso']
    }
  ];

  const diferencialJardins = [
    'Respeito à identidade arquitetônica e histórica do bairro',
    'Experiência com casas e apartamentos de alto valor',
    'Conhecimento das normas de preservação e tombamento',
    'Curadoria de materiais exclusivos e fornecedores premium',
    'Equipe treinada para ambientes de luxo discreto',
    'Logística que respeita a tranquilidade residencial'
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Reforma de Apartamento nos Jardins | Grupo WG Almeida",
    "description": "Reforma completa de apartamento e casa nos Jardins. Projetos premium que respeitam a arquitetura histórica. Sistema Turn Key com curadoria exclusiva.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": "+55-11-98465-0002"
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": "Jardins",
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
        title="Reforma Apartamento Jardins SP | Construtora Alto Padrão"
        description="Reforma de apartamento e casa nos Jardins. Projetos premium que respeitam a arquitetura histórica. Sistema Turn Key com tradição e excelência. Orçamento grátis."
        keywords="reforma apartamento jardins, reforma casa jardins, construtora jardins, arquitetura jardins, reforma alto padrão jardins, quanto custa reforma jardins"
        url={pageUrl}
        schema={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80)' }}
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
                Jardins, São Paulo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Reforma de Apartamento<br />e Casa nos Jardins
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Tradição, sofisticação e arquitetura autoral. Reformamos casas e apartamentos nos Jardins
              com respeito à história e excelência no resultado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Jardins
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/jardins">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3">
                  Mais sobre os Jardins
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
              Reforma nos Jardins
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              O Padrão que os Jardins Exigem
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

      {/* Tipos de Imóvel */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Projetos para Cada Tipo de Imóvel
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiposImovel.map((tipo, index) => (
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
                  {tipo.tipo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {tipo.descricao}
                </p>
                <ul className="space-y-2">
                  {tipo.itens.map((item, i) => (
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

      {/* Diferenciais dos Jardins */}
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
              Por Que os Jardins São Especiais
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {diferencialJardins.map((item, index) => (
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

      {/* Quote */}
      <section className="py-16 bg-wg-black text-white">
        <div className="container-custom text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl italic text-wg-orange max-w-3xl mx-auto font-light"
          >
            "Nos Jardins, entregamos não apenas espaços — entregamos legado."
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
              Pronto para Reformar nos Jardins?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento personalizado e descubra como unimos tradição e contemporaneidade em projetos de excelência.
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

export default ReformaApartamentoJardins;
