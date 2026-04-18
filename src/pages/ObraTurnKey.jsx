import React from 'react';
import SEO, { schemas } from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { withBasePath } from '@/utils/assetPaths';
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
import { COMPANY, WG_PRODUCT_MESSAGES } from '@/data/company';
import { getPublicPageImageSrc } from '@/data/publicPageImageCatalog';

const OBRA_TURN_KEY_HERO_IMAGE = getPublicPageImageSrc('obraTurnKey', withBasePath('/images/banners/ARQ.webp'));

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
        'Leitura guiada do andamento',
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
    'Leitura guiada do andamento em cada etapa',
    'Garantia estrutural de 5 anos',
    'Equipe especializada e integrada'
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Obra Turn Key São Paulo | Reforma Completa com leitura integrada",
    "description": "Turn Key Premium em São Paulo com projeto, execução e entrega integrados. Um único responsável, orçamento fechado e uma experiência mais clara, guiada e previsível.",
    "url": pageUrl,
    "provider": {
      "@type": "Organization",
      "name": "Grupo WG Almeida",
      "telephone": COMPANY.phoneRaw
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
        pathname="/obra-turn-key"
        title="Obra Turn Key SP | Reforma Premium com leitura integrada"
        description="Turn Key em São Paulo com projeto, obra e entrega integrados. Orçamento fechado, leitura guiada do andamento e qualidade controlada."
        keywords="turn key sao paulo, obra turn key, sistema turn key, reforma turn key, turn key premium, obra completa sp"
        url={pageUrl}
        schema={schema}
      />

      {/* Hero Section */}
      <section className="wg-page-hero hero-under-header bg-wg-black">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${OBRA_TURN_KEY_HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-wg-black/80 via-wg-black/60 to-wg-black" />

        <div className="relative z-10 container-custom text-center text-white px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-2 bg-wg-orange text-white rounded-full text-sm uppercase tracking-wider mb-6">
              Turn Key Premium
            </span>
            <h1 className="wg-page-hero-title mb-6">
              O Que é Turn Key?<br />Entenda a experiência completa
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Turn Key é o modelo em que uma única empresa conduz projeto, execução e entrega.
              Você recebe o espaço pronto com qualidade controlada, prazos reais e uma experiência mais simples do início ao fim.
            </p>
            <p className="text-base text-white/65 mb-8 max-w-3xl mx-auto leading-relaxed">
              No ecossistema WG, isso também significa transformar a obra em prova operacional da tese: menos ruído, mais controle e mais clareza sobre o valor que está sendo protegido ou destravado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta">
                <Button className="btn-apple">
                  Solicitar proposta turn key
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/projetos">
                <Button className="btn-hero-outline">
                  Ver projetos turn key
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">
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
                  <th className="text-left p-4 font-inter font-light text-wg-black">Aspecto</th>
                  <th className="text-left p-4 font-inter font-light text-wg-gray">Modelo Tradicional</th>
                  <th className="text-left p-4 font-inter font-light text-wg-orange">Modelo Turn Key</th>
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
                    <td className="p-4 font-light text-wg-black">{diferenca.aspecto}</td>
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">
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
                <h3 className="text-lg font-inter font-light text-wg-black mb-4">
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
            <span className="text-wg-orange text-sm tracking-widest uppercase mb-4 block">
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
                    <span className="text-white font-light text-xl">{etapa.numero}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-inter font-light text-wg-black mb-2">
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

      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[2rem] border border-black/5 bg-wg-black text-white p-8 md:p-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
              <div>
                <span className="text-white/60 text-sm tracking-[0.2em] uppercase mb-4 block">
                  Add-on de experiencia visual
                </span>
                <h2 className="text-3xl md:text-4xl font-inter font-light mb-4">
                  O turn key pode entrar com uma camada extra de alinhamento antes da obra apertar
                </h2>
                <div className="space-y-3 text-white/75 leading-relaxed">
                  <p>
                    {WG_PRODUCT_MESSAGES.wgExperienceSystem}
                  </p>
                  <p>
                    Em jornadas turn key, ela funciona como etapa de onboarding, prevenda consultiva ou validacao estetica antes de compras, definicoes finais e execucao integrada.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  'Mais clareza de expectativa antes de cronograma, compras e compatibilizacao.',
                  'Menos retrabalho entre conceito, visualizacao, marcenaria e obra.',
                  'Uma proposta comercial mais forte para clientes que ainda estao decidindo atmosfera e linguagem do projeto.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <CheckCircle className="w-5 h-5 text-wg-orange flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/80 font-light leading-relaxed">{item}</p>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=turnkey">
                    <Button className="btn-apple">
                      Incluir add-on visual
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/moodboard">
                    <Button className="btn-hero-outline">
                      Ver jornada visual
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
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
              Descubra como o modelo Turn Key transforma sua reforma em uma experiência mais fluida, guiada e previsível.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/solicite-proposta?context=turnkey">
                <Button className="btn-apple">
                  Solicitar proposta turn key
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

export default ObraTurnKey;
