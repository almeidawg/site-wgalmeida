import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Ruler,
  CheckCircle,
  MapPin,
  Sparkles,
  Clock,
  Award,
  Palette,
  Phone,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MarcenariaSobMedidaMorumbi = () => {
  const pageUrl = 'https://wgalmeida.com.br/marcenaria-sob-medida-morumbi';

  const diferenciais = [
    {
      icon: Palette,
      title: 'Design Autoral',
      description: 'Projetos exclusivos desenvolvidos por arquitetos especializados.'
    },
    {
      icon: Sparkles,
      title: 'Materiais Premium',
      description: 'Curadoria de materiais nobres compatíveis com o padrão Morumbi.'
    },
    {
      icon: Ruler,
      title: 'Precisão Milimétrica',
      description: 'Medições exatas e execução impecável em cada detalhe.'
    },
    {
      icon: Award,
      title: 'Integração Total',
      description: 'Marcenaria integrada com arquitetura e obra para resultado harmonioso.'
    }
  ];

  const ambientes = [
    {
      tipo: 'Closets e Dormitórios',
      descricao: 'Soluções sob medida para ambientes íntimos com funcionalidade e sofisticação.',
      itens: ['Closets amplos', 'Cabeceiras integradas', 'Iluminação embutida', 'Organizadores premium']
    },
    {
      tipo: 'Cozinhas e Áreas Gourmet',
      descricao: 'Marcenaria técnica para espaços que unem estética e alta performance.',
      itens: ['Adegas climatizadas', 'Ilhas multifuncionais', 'Acabamentos resistentes', 'Design contemporâneo']
    },
    {
      tipo: 'Ambientes Integrados',
      descricao: 'Painéis, estantes e móveis que conectam e valorizam grandes espaços.',
      itens: ['Estantes autoral', 'Painéis ripados', 'Home theaters', 'Mobiliário corporativo']
    }
  ];

  const porqueMorumbi = [
    'Experiência em residências de alto padrão com grandes metragens',
    'Materiais nobres e acabamentos compatíveis com o Morumbi',
    'Conhecimento das características arquitetônicas da região',
    'Equipe especializada em projetos de luxo discreto',
    'Fornecedores exclusivos e curadoria de materiais diferenciados',
    'Logística premium para residências de alto valor'
  ];

  const processo = [
    { titulo: 'Briefing Completo', descricao: 'Entendemos seu estilo de vida e necessidades.' },
    { titulo: 'Projeto 3D', descricao: 'Visualização fotorrealística antes da execução.' },
    { titulo: 'Aprovação', descricao: 'Validação de materiais, cores e acabamentos.' },
    { titulo: 'Produção', descricao: 'Fabricação com controle rigoroso de qualidade.' },
    { titulo: 'Instalação', descricao: 'Montagem profissional com acabamento impecável.' }
  ];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Marcenaria Sob Medida Morumbi | Grupo WG Almeida",
    "description": "Marcenaria sob medida de alto padrão no Morumbi. Closets, cozinhas, estantes e ambientes integrados. Design autoral com materiais premium. Orçamento personalizado.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": "+55-11-98465-0002"
    },
    "areaServed": {
      "@type": "Neighborhood",
      "name": "Morumbi",
      "containedInPlace": {
        "@type": "City",
        "name": "São Paulo"
      }
    }
  };

  return (
    <>
      <SEO
        title="Marcenaria Sob Medida Morumbi SP | Design Premium"
        description="Marcenaria sob medida de alto padrão no Morumbi. Closets, cozinhas, estantes e ambientes integrados. Design autoral com materiais premium. Orçamento personalizado."
        keywords="marcenaria sob medida morumbi, closet morumbi, marcenaria morumbi, móveis planejados morumbi, marcenaria alto padrão morumbi"
        url={pageUrl}
        schema={localBusinessSchema}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/images/hero-architecture.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-wg-orange" />
              <span className="text-wg-orange font-medium text-sm tracking-widest uppercase">
                Morumbi, São Paulo
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Marcenaria Sob Medida<br />no Morumbi
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Design autoral e execução impecável. Criamos ambientes únicos com marcenaria
              de alto padrão integrada à arquitetura. Do projeto 3D à instalação final.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Morumbi
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/morumbi">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3">
                  Mais sobre o Morumbi
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
              Marcenaria Premium Morumbi
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              O Diferencial da Marcenaria WG Almeida
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

      {/* Ambientes */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Ambientes que Transformamos
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ambientes.map((ambiente, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <Ruler className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-medium text-wg-black mb-3">
                  {ambiente.tipo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {ambiente.descricao}
                </p>
                <ul className="space-y-2">
                  {ambiente.itens.map((item, i) => (
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

      {/* Por que Morumbi */}
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
              Marcenaria para o Padrão Morumbi
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {porqueMorumbi.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-wg-gray-light rounded-xl"
              >
                <Star className="w-5 h-5 text-wg-orange flex-shrink-0 mt-0.5" />
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
              Do Conceito à Instalação
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
            "Cada móvel é uma peça única, projetada para valorizar seu espaço e estilo de vida."
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
              Transforme Seu Espaço com Marcenaria Exclusiva
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento personalizado e descubra como criamos ambientes únicos com design autoral e execução impecável.
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

export default MarcenariaSobMedidaMorumbi;






