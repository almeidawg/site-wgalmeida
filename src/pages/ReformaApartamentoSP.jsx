import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  CheckCircle,
  Clock,
  DollarSign,
  Lightbulb,
  Ruler,
  Shield,
  TrendingUp,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReformaApartamentoSP = () => {
  const pageUrl = 'https://wgalmeida.com.br/reforma-apartamento-sp';

  const etapas = [
    {
      numero: '01',
      titulo: 'Briefing e Diagnóstico',
      descricao: 'Visita técnica, análise do imóvel e definição de escopo completo.',
      duracao: '1-2 semanas'
    },
    {
      numero: '02',
      titulo: 'Projeto Arquitetônico',
      descricao: 'Conceito, layout otimizado, renderizações 3D e aprovações.',
      duracao: '4-6 semanas'
    },
    {
      numero: '03',
      titulo: 'Planejamento da Obra',
      descricao: 'Orçamento final, cronograma detalhado e compra de materiais.',
      duracao: '2-3 semanas'
    },
    {
      numero: '04',
      titulo: 'Execução Turn Key',
      descricao: 'Demolição, infraestrutura, acabamentos e marcenaria sob medida.',
      duracao: '12-20 semanas'
    },
    {
      numero: '05',
      titulo: 'Entrega Final',
      descricao: 'Vistoria, ajustes finais, limpeza profunda e entrega das chaves.',
      duracao: '1 semana'
    }
  ];

  const tiposReforma = [
    {
      tipo: 'Apartamento Novo',
      descricao: 'Recebeu as chaves da construtora? Transformamos o padrão em personalizado.',
      beneficios: ['Otimização de layout', 'Acabamentos premium', 'Marcenaria integrada', 'Automação residencial']
    },
    {
      tipo: 'Apartamento Comprado',
      descricao: 'Reforma completa para renovar e valorizar seu novo imóvel.',
      beneficios: ['Modernização total', 'Infraestrutura nova', 'Design contemporâneo', 'Garantia 5 anos']
    },
    {
      tipo: 'Atualização/Retrofit',
      descricao: 'Atualize seu apartamento sem sair de casa.',
      beneficios: ['Troca de acabamentos', 'Marcenaria nova', 'Iluminação moderna', 'Pintura e decoração']
    }
  ];

  const faixasInvestimento = [
    { padrao: 'Médio Padrão', valor: 'R$ 2.500 - R$ 4.000/m²', itens: ['Acabamentos nacionais de qualidade', 'Marcenaria planejada', 'Projeto arquitetônico'] },
    { padrao: 'Alto Padrão', valor: 'R$ 4.000 - R$ 6.500/m²', itens: ['Materiais importados', 'Marcenaria sob medida', 'Automação básica'] },
    { padrao: 'Padrão Premium', valor: 'R$ 6.500 - R$ 9.000/m²', itens: ['Acabamentos exclusivos', 'Tecnologia completa', 'Curadoria personalizada'] }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Reforma de Apartamento São Paulo | Turn Key Premium",
    "description": "Reforma completa de apartamentos em São Paulo. Sistema Turn Key: projeto, execução e entrega. Apartamentos novos e usados. Orçamento transparente e prazo garantido.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": "+55-11-98465-0002"
    },
    "areaServed": {
      "@type": "City",
      "name": "São Paulo"
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
        title="Reforma de Apartamento SP | Turn Key Premium"
        description="Reforma completa de apartamento em São Paulo. Sistema Turn Key: projeto, obra e entrega. Apartamentos novos, comprados e retrofit. Orçamento sem compromisso."
        keywords="reforma apartamento são paulo, reforma apartamento novo, reforma apartamento sp, quanto custa reforma apartamento, empresa reforma sp, reforma turn key"
        url={pageUrl}
        schema={schema}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url(/images/hero-architecture.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-wg-orange text-white rounded-full text-sm font-medium uppercase tracking-wider mb-6">
              Reforma de Apartamento São Paulo
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              Reforma Completa de Apartamento<br />com Sistema Turn Key
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transforme seu apartamento novo ou usado em um espaço único e personalizado.
              Projeto, execução e entrega com prazo garantido e orçamento transparente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3">
                  Ver Apartamentos Reformados
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tipos de Reforma */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              Soluções para Cada Necessidade
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Tipos de Reforma que Realizamos
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
                className="bg-wg-gray-light rounded-2xl p-8"
              >
                <Home className="w-10 h-10 text-wg-orange mb-4" />
                <h3 className="text-xl font-inter font-medium text-wg-black mb-3">
                  {reforma.tipo}
                </h3>
                <p className="text-wg-gray mb-4 font-light">
                  {reforma.descricao}
                </p>
                <ul className="space-y-2">
                  {reforma.beneficios.map((item, i) => (
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

      {/* Etapas do Processo */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              Como Funciona
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              As 5 Etapas da Reforma Turn Key
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              Do primeiro contato à entrega das chaves, você tem visibilidade completa de cada fase.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {etapas.map((etapa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg flex items-start gap-6"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-wg-orange rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">{etapa.numero}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-inter font-medium text-wg-black mb-2">
                    {etapa.titulo}
                  </h3>
                  <p className="text-wg-gray mb-2 font-light">
                    {etapa.descricao}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-wg-orange">
                    <Clock className="w-4 h-4" />
                    <span>{etapa.duracao}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quanto Custa */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <DollarSign className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Quanto Custa Reformar um Apartamento?
            </h2>
            <p className="text-wg-gray max-w-2xl mx-auto">
              Investimento varia conforme padrão de acabamentos, complexidade e personalização desejada.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {faixasInvestimento.map((faixa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-wg-gray-light rounded-2xl p-8 text-center"
              >
                <h3 className="text-xl font-inter font-medium text-wg-black mb-2">
                  {faixa.padrao}
                </h3>
                <p className="text-2xl font-bold text-wg-orange mb-6">
                  {faixa.valor}
                </p>
                <ul className="space-y-2 text-left">
                  {faixa.itens.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-wg-gray">
                      <CheckCircle className="w-4 h-4 text-wg-green flex-shrink-0 mt-1" />
                      <span className="font-light text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-wg-gray mt-8">
            *Valores de referência para São Paulo em 2026. Orçamento final depende de metragem, escopo e acabamentos selecionados.
          </p>
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
              Pronto para Reformar Seu Apartamento?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Receba um orçamento detalhado e descubra como transformamos seu apartamento com qualidade e prazo garantidos.
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

export default ReformaApartamentoSP;
