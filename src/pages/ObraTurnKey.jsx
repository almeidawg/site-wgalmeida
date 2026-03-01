import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Home,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ObraTurnKey = () => {
  const pageUrl = 'https://wgalmeida.com.br/obra-turn-key';

  const diferencasModelo = [
    {
      aspecto: 'Responsabilidade',
      tradicional: 'Múltiplos fornecedores sem coordenação',
      turnkey: 'Um único responsável do início ao fim',
      vantagem: true
    },
    {
      aspecto: 'Orçamento',
      tradicional: 'Custos fragmentados e imprevisíveis',
      turnkey: 'Orçamento fechado e transparente',
      vantagem: true
    },
    {
      aspecto: 'Prazo',
      tradicional: 'Cronograma sujeito a retrabalho',
      turnkey: 'Prazo garantido com gestão integrada',
      vantagem: true
    },
    {
      aspecto: 'Qualidade',
      tradicional: 'Padrão variável entre fornecedores',
      turnkey: 'Qualidade padronizada e controlada',
      vantagem: true
    },
    {
      aspecto: 'Estresse',
      tradicional: 'Cliente coordena toda a obra',
      turnkey: 'Gestão profissional completa',
      vantagem: true
    }
  ];

  const oqueinclui = [
    {
      categoria: 'Projeto Completo',
      icon: FileText,
      itens: [
        'Arquitetura e interiores',
        'Projeto executivo detalhado',
        'Compatibilização técnica',
        'Aprovações e licenças'
      ]
    },
    {
      categoria: 'Execução',
      icon: Settings,
      itens: [
        'Demolição e infraestrutura',
        'Instalações hidráulicas e elétricas',
        'Acabamentos premium',
        'Pintura e revestimentos'
      ]
    },
    {
      categoria: 'Marcenaria',
      icon: Home,
      itens: [
        'Móveis sob medida',
        'Projeto 3D para aprovação',
        'Fabricação própria',
        'Instalação e acabamento'
      ]
    },
    {
      categoria: 'Gestão',
      icon: Users,
      itens: [
        'Cronograma detalhado',
        'Acompanhamento diário',
        'Relatórios via WG Easy',
        'Garantia 5 anos'
      ]
    }
  ];

  const etapasDetalhadas = [
    {
      numero: '01',
      titulo: 'Briefing Estratégico',
      descricao: 'Entendemos suas necessidades, orçamento e expectativas. Visita técnica e análise completa do imóvel.',
      entregaveis: ['Diagnóstico técnico', 'Proposta comercial', 'Cronograma preliminar']
    },
    {
      numero: '02',
      titulo: 'Projeto Arquitetônico',
      descricao: 'Desenvolvimento do conceito, layouts, renderizações 3D e detalhamento executivo completo.',
      entregaveis: ['Moodboard', 'Plantas executivas', 'Renderizações 3D', 'Memorial descritivo']
    },
    {
      numero: '03',
      titulo: 'Planejamento da Obra',
      descricao: 'Orçamento final detalhado, cronograma executivo e compra de materiais com curadoria.',
      entregaveis: ['Orçamento fechado', 'Cronograma', 'Especificações técnicas']
    },
    {
      numero: '04',
      titulo: 'Execução Integrada',
      descricao: 'Obra completa com gestão profissional: demolição, infraestrutura, acabamentos e marcenaria.',
      entregaveis: ['Relatórios semanais', 'Fotos do progresso', 'Gestão de fornecedores']
    },
    {
      numero: '05',
      titulo: 'Entrega e Garantia',
      descricao: 'Vistoria técnica, ajustes finais, limpeza profunda e entrega das chaves com garantia estrutural.',
      entregaveis: ['Manual do proprietário', 'As built', 'Garantia 5 anos']
    }
  ];

  const beneficios = [
    'Um único ponto de contato e responsabilidade',
    'Orçamento fechado sem surpresas',
    'Cronograma real e cumprido',
    'Qualidade controlada em todas as etapas',
    'Menos estresse e mais previsibilidade',
    'Acompanhamento em tempo real via WG Easy',
    'Garantia estrutural de 5 anos',
    'Equipe especializada e integrada'
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Obra Turn Key São Paulo | Sistema Completo de Reforma",
    "description": "Sistema Turn Key Premium em São Paulo. Projeto, execução e entrega integrados. Um único responsável, orçamento fechado e prazo garantido. 14 anos de experiência.",
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
        title="Obra Turn Key SP | Sistema Completo de Reforma Premium"
        description="Sistema Turn Key em São Paulo: projeto, obra e entrega integrados. Orçamento fechado, prazo garantido e qualidade controlada. 14 anos transformando projetos em realidade."
        keywords="turn key sao paulo, obra turn key, sistema turn key, reforma turn key, turn key premium, obra completa sp"
        url={pageUrl}
        schema={schema}
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
            <span className="inline-block px-4 py-2 bg-wg-orange text-white rounded-full text-sm font-medium uppercase tracking-wider mb-6">
              Sistema Turn Key Premium
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-inter font-light mb-6 leading-tight">
              O Que é Turn Key?<br />Entenda o Sistema Completo
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Turn Key é o modelo onde uma única empresa responde por projeto, execução e entrega.
              Você recebe o espaço pronto com qualidade controlada, prazos reais e orçamento transparente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Turn Key
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-wg-black transition-all rounded-2xl px-6 py-3">
                  Ver Projetos Turn Key
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Turn Key vs Tradicional */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              Comparativo
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              Turn Key vs Modelo Tradicional
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-wg-orange">
                  <th className="text-left p-4 font-inter font-medium text-wg-black">Aspecto</th>
                  <th className="text-left p-4 font-inter font-medium text-wg-gray">Modelo Tradicional</th>
                  <th className="text-left p-4 font-inter font-medium text-wg-orange">Sistema Turn Key</th>
                </tr>
              </thead>
              <tbody>
                {diferencasModelo.map((diferenca, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-200"
                  >
                    <td className="p-4 font-medium text-wg-black">{diferenca.aspecto}</td>
                    <td className="p-4 text-wg-gray flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{diferenca.tradicional}</span>
                    </td>
                    <td className="p-4 text-wg-black">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-wg-green flex-shrink-0 mt-0.5" />
                        <span>{diferenca.turnkey}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* O Que Inclui */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-wg-orange font-medium text-sm tracking-widest uppercase mb-4 block">
              Escopo Completo
            </span>
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black">
              O Que Está Incluído no Turn Key
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {oqueinclui.map((categoria, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                {React.createElement(categoria.icon, { className: 'w-10 h-10 text-wg-orange mb-4' })}
                <h3 className="text-lg font-inter font-medium text-wg-black mb-4">
                  {categoria.categoria}
                </h3>
                <ul className="space-y-2">
                  {categoria.itens.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-wg-gray text-sm">
                      <CheckCircle className="w-4 h-4 text-wg-green flex-shrink-0 mt-0.5" />
                      <span className="font-light">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Etapas */}
      <section className="section-padding bg-white">
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
              As 5 Etapas do Processo Turn Key
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {etapasDetalhadas.map((etapa, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-wg-gray-light rounded-2xl p-6"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-wg-orange rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{etapa.numero}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-inter font-medium text-wg-black mb-2">
                      {etapa.titulo}
                    </h3>
                    <p className="text-wg-gray mb-3 font-light">
                      {etapa.descricao}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {etapa.entregaveis.map((entregavel, i) => (
                        <span key={i} className="text-xs bg-white px-3 py-1 rounded-full text-wg-gray">
                          {entregavel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Shield className="w-12 h-12 text-wg-orange mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-4">
              Por Que Escolher Turn Key?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {beneficios.map((beneficio, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-white rounded-xl"
              >
                <CheckCircle className="w-5 h-5 text-wg-green flex-shrink-0 mt-0.5" />
                <p className="text-wg-gray font-light">{beneficio}</p>
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
              Pronto para uma Obra sem Estresse?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Descubra como o sistema Turn Key transforma sua reforma em uma experiência fluida e previsível.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar Orçamento Turn Key
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

export default ObraTurnKey;
