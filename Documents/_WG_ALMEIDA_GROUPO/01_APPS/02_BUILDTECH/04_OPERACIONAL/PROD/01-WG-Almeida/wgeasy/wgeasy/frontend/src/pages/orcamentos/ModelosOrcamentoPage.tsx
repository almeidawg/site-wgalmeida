/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { normalizeSearchTerm } from "@/utils/searchUtils";
// ==========================================
// MODELOS DE ORÇAMENTO
// Sistema WG Easy - Grupo WG Almeida
// Cards com templates prontos para orçamentos
// INTEGRADO COM ANÁLISE DE PROJETOS
// ==========================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, Palette, Hammer, Home, Building2, Sofa, ChefHat, Bath, Bed, Trees, Ruler, HardHat, PenTool, Check, Sparkles, ClipboardList, ShoppingCart, Package, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { listarAnalises } from "@/lib/analiseProjetoApi";
import { carregarDadosAnaliseParaOrcamento, gerarListaComprasDeAnalise } from "@/lib/modelosOrcamentoApi";
import { useToast } from "@/hooks/use-toast";
import WGStarIcon from "@/components/icons/WGStarIcon";

// Tipos de modelo de orçamento
interface ModeloOrcamento {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  nucleo: "arquitetura" | "engenharia" | "marcenaria";
  nucleoCor: string;
  categorias: string[];
  itensBase: {
    categoria: string;
    descricao: string;
    unidade: string;
  }[];
  popular?: boolean;
}

// Modelos pré-definidos
const MODELOS: ModeloOrcamento[] = [
  {
    id: "reforma-completa",
    titulo: "Reforma Completa",
    descricao: "Orçamento completo para reforma residencial ou comercial, incluindo todos os serviços",
    icon: <Home className="w-8 h-8" />,
    nucleo: "arquitetura",
    nucleoCor: "#5E9B94",
    popular: true,
    categorias: ["DemoliçÍo", "Alvenaria", "Elétrica", "Hidráulica", "Acabamentos"],
    itensBase: [
      { categoria: "DemoliçÍo", descricao: "DemoliçÍo de paredes e retirada de entulho", unidade: "m²" },
      { categoria: "Alvenaria", descricao: "ConstruçÍo de paredes em alvenaria", unidade: "m²" },
      { categoria: "Elétrica", descricao: "Instalações elétricas completas", unidade: "pontos" },
      { categoria: "Hidráulica", descricao: "Instalações hidráulicas", unidade: "pontos" },
      { categoria: "Acabamentos", descricao: "Pintura e acabamentos gerais", unidade: "m²" },
    ],
  },
  {
    id: "projeto-interiores",
    titulo: "Projeto de Interiores",
    descricao: "Design de interiores com especificaçÍo de mobiliário, iluminaçÍo e acabamentos",
    icon: <Palette className="w-8 h-8" />,
    nucleo: "arquitetura",
    nucleoCor: "#5E9B94",
    popular: true,
    categorias: ["Projeto", "Mobiliário", "IluminaçÍo", "DecoraçÍo", "Acompanhamento"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto de interiores completo", unidade: "m²" },
      { categoria: "Mobiliário", descricao: "EspecificaçÍo e orçamento de mobiliário", unidade: "un" },
      { categoria: "IluminaçÍo", descricao: "Projeto de iluminaçÍo", unidade: "ambiente" },
      { categoria: "DecoraçÍo", descricao: "Itens decorativos e acessórios", unidade: "vb" },
      { categoria: "Acompanhamento", descricao: "Acompanhamento de obra", unidade: "visita" },
    ],
  },
  {
    id: "cozinha-planejada",
    titulo: "Cozinha Planejada",
    descricao: "Projeto e execuçÍo de cozinha planejada com móveis sob medida",
    icon: <ChefHat className="w-8 h-8" />,
    nucleo: "marcenaria",
    nucleoCor: "#8B5E3C",
    popular: true,
    categorias: ["Projeto", "Armários", "Bancadas", "Eletrodomésticos", "InstalaçÍo"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto de cozinha 3D", unidade: "un" },
      { categoria: "Armários", descricao: "Armários superiores e inferiores", unidade: "ml" },
      { categoria: "Bancadas", descricao: "Bancada em granito/quartzo", unidade: "ml" },
      { categoria: "Eletrodomésticos", descricao: "Fornecimento de eletros embutidos", unidade: "un" },
      { categoria: "InstalaçÍo", descricao: "Montagem e instalaçÍo", unidade: "vb" },
    ],
  },
  {
    id: "banheiro-reforma",
    titulo: "Reforma de Banheiro",
    descricao: "Reforma completa de banheiro com hidráulica, revestimentos e louças",
    icon: <Bath className="w-8 h-8" />,
    nucleo: "engenharia",
    nucleoCor: "#2B4580",
    categorias: ["DemoliçÍo", "Hidráulica", "Revestimentos", "Louças", "Marcenaria"],
    itensBase: [
      { categoria: "DemoliçÍo", descricao: "RemoçÍo de revestimentos existentes", unidade: "m²" },
      { categoria: "Hidráulica", descricao: "Instalações hidráulicas novas", unidade: "pontos" },
      { categoria: "Revestimentos", descricao: "Pisos e azulejos", unidade: "m²" },
      { categoria: "Louças", descricao: "Vaso, cuba e metais", unidade: "un" },
      { categoria: "Marcenaria", descricao: "Armário de banheiro", unidade: "un" },
    ],
  },
  {
    id: "closet-planejado",
    titulo: "Closet Planejado",
    descricao: "Projeto e execuçÍo de closet ou armário planejado",
    icon: <Bed className="w-8 h-8" />,
    nucleo: "marcenaria",
    nucleoCor: "#8B5E3C",
    categorias: ["Projeto", "Estrutura", "Portas", "Acessórios", "IluminaçÍo"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto de closet 3D", unidade: "un" },
      { categoria: "Estrutura", descricao: "Módulos e prateleiras", unidade: "ml" },
      { categoria: "Portas", descricao: "Portas de correr/abrir", unidade: "un" },
      { categoria: "Acessórios", descricao: "Gaveteiros, calceiros, etc", unidade: "un" },
      { categoria: "IluminaçÍo", descricao: "IluminaçÍo interna LED", unidade: "ml" },
    ],
  },
  {
    id: "area-gourmet",
    titulo: "Área Gourmet",
    descricao: "Projeto completo de área gourmet com churrasqueira e mobiliário",
    icon: <Trees className="w-8 h-8" />,
    nucleo: "arquitetura",
    nucleoCor: "#5E9B94",
    categorias: ["Projeto", "Churrasqueira", "Marcenaria", "Bancadas", "Paisagismo"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto arquitetônico", unidade: "m²" },
      { categoria: "Churrasqueira", descricao: "Churrasqueira pré-moldada ou alvenaria", unidade: "un" },
      { categoria: "Marcenaria", descricao: "Móveis e bancadas", unidade: "ml" },
      { categoria: "Bancadas", descricao: "Bancada em granito", unidade: "ml" },
      { categoria: "Paisagismo", descricao: "Projeto paisagístico", unidade: "m²" },
    ],
  },
  {
    id: "projeto-arquitetonico",
    titulo: "Projeto Arquitetônico",
    descricao: "Projeto arquitetônico completo para construçÍo nova ou reforma",
    icon: <Ruler className="w-8 h-8" />,
    nucleo: "arquitetura",
    nucleoCor: "#5E9B94",
    categorias: ["Estudo Preliminar", "Anteprojeto", "Projeto Executivo", "Detalhamento", "Acompanhamento"],
    itensBase: [
      { categoria: "Estudo Preliminar", descricao: "Estudo de viabilidade e partido", unidade: "m²" },
      { categoria: "Anteprojeto", descricao: "DefiniçÍo do projeto", unidade: "m²" },
      { categoria: "Projeto Executivo", descricao: "Projeto para execuçÍo", unidade: "m²" },
      { categoria: "Detalhamento", descricao: "Detalhamentos construtivos", unidade: "pranchas" },
      { categoria: "Acompanhamento", descricao: "Acompanhamento de obra", unidade: "visita" },
    ],
  },
  {
    id: "construcao-civil",
    titulo: "ConstruçÍo Civil",
    descricao: "Orçamento para construçÍo nova com todos os serviços de engenharia",
    icon: <HardHat className="w-8 h-8" />,
    nucleo: "engenharia",
    nucleoCor: "#2B4580",
    categorias: ["FundaçÍo", "Estrutura", "Alvenaria", "Cobertura", "Instalações", "Acabamentos"],
    itensBase: [
      { categoria: "FundaçÍo", descricao: "FundaçÍo em sapata ou radier", unidade: "m³" },
      { categoria: "Estrutura", descricao: "Estrutura em concreto armado", unidade: "m³" },
      { categoria: "Alvenaria", descricao: "Paredes e divisórias", unidade: "m²" },
      { categoria: "Cobertura", descricao: "Telhado e madeiramento", unidade: "m²" },
      { categoria: "Instalações", descricao: "Elétrica e hidráulica", unidade: "m²" },
      { categoria: "Acabamentos", descricao: "Pisos, revestimentos e pintura", unidade: "m²" },
    ],
  },
  {
    id: "mobiliario-corporativo",
    titulo: "Mobiliário Corporativo",
    descricao: "Projeto e execuçÍo de mobiliário para escritórios e empresas",
    icon: <Building2 className="w-8 h-8" />,
    nucleo: "marcenaria",
    nucleoCor: "#8B5E3C",
    categorias: ["Projeto", "Mesas", "Armários", "RecepçÍo", "Sala de ReuniÍo"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto de layout e mobiliário", unidade: "m²" },
      { categoria: "Mesas", descricao: "Estações de trabalho", unidade: "un" },
      { categoria: "Armários", descricao: "Armários e arquivos", unidade: "un" },
      { categoria: "RecepçÍo", descricao: "BalcÍo de recepçÍo", unidade: "un" },
      { categoria: "Sala de ReuniÍo", descricao: "Mesa de reuniÍo e mobiliário", unidade: "un" },
    ],
  },
  {
    id: "sala-planejada",
    titulo: "Sala Planejada",
    descricao: "Móveis planejados para sala de estar e home theater",
    icon: <Sofa className="w-8 h-8" />,
    nucleo: "marcenaria",
    nucleoCor: "#8B5E3C",
    categorias: ["Projeto", "Painel TV", "Estantes", "Aparador", "Home Theater"],
    itensBase: [
      { categoria: "Projeto", descricao: "Projeto de sala 3D", unidade: "un" },
      { categoria: "Painel TV", descricao: "Painel para TV com nichos", unidade: "ml" },
      { categoria: "Estantes", descricao: "Estantes e nichos", unidade: "ml" },
      { categoria: "Aparador", descricao: "Aparador ou buffet", unidade: "un" },
      { categoria: "Home Theater", descricao: "Rack home theater", unidade: "un" },
    ],
  },
];

// Cores por núcleo
const NUCLEO_CORES = {
  arquitetura: { bg: "#5E9B94", light: "#E8F5F3", text: "#2D5A54" },
  engenharia: { bg: "#2B4580", light: "#E8EDF7", text: "#1A2A4D" },
  marcenaria: { bg: "#8B5E3C", light: "#F5EDE8", text: "#5A3D27" },
};

const NUCLEO_LABELS = {
  arquitetura: "Arquitetura",
  engenharia: "Engenharia",
  marcenaria: "Marcenaria",
};

export default function ModelosOrcamentoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filtroNucleo, setFiltroNucleo] = useState<string>("todos");
  const [buscaModelo, setBuscaModelo] = useState("");

  // Estado para Análises de Projeto disponíveis
  const [analisesDisponiveis, setAnalisesDisponiveis] = useState<any[]>([]);
  const [loadingAnalises, setLoadingAnalises] = useState(true);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<any | null>(null);
  const [dadosAnalise, setDadosAnalise] = useState<any | null>(null);
  const [gerandoLista, setGerandoLista] = useState(false);

  // Carregar análises disponíveis (status analisado ou aprovado)
  useEffect(() => {
    async function carregarAnalises() {
      try {
        setLoadingAnalises(true);
        const todas = await listarAnalises();
        // Filtrar apenas analisadas/aprovadas
        const disponiveis = todas.filter(
          (a: any) => a.status === "analisado" || a.status === "aprovado"
        );
        setAnalisesDisponiveis(disponiveis);
      } catch (error) {
        console.error("Erro ao carregar análises:", error);
      } finally {
        setLoadingAnalises(false);
      }
    }
    carregarAnalises();
  }, []);

  // Carregar dados da análise selecionada
  async function handleSelecionarAnalise(analise: any) {
    setAnaliseSelecionada(analise);
    try {
      const dados = await carregarDadosAnaliseParaOrcamento(analise.id);
      setDadosAnalise(dados);
      toast({
        title: "Análise carregada!",
        description: `${dados.totalServicos} serviços e ${dados.totalMateriais} materiais prontos para orçamento.`,
      });
    } catch (error) {
      console.error("Erro ao carregar dados da análise:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os dados da análise.",
        variant: "destructive",
      });
    }
  }

  // Gerar lista de compras
  async function handleGerarListaCompras() {
    if (!analiseSelecionada) {
      toast({
        title: "Selecione uma análise",
        description: "Escolha uma análise de projeto para gerar a lista de compras.",
        variant: "destructive",
      });
      return;
    }

    try {
      setGerandoLista(true);
      const lista = await gerarListaComprasDeAnalise(
        analiseSelecionada.id,
        `Lista de Compras - ${analiseSelecionada.titulo}`
      );
      toast({
        title: "Lista de compras gerada!",
        description: `${lista.total_itens} itens adicionados à lista.`,
      });
      navigate(`/compras?lista=${lista.id}`);
    } catch (error: any) {
      console.error("Erro ao gerar lista:", error);
      toast({
        title: "Erro",
        description: error.message || "NÍo foi possível gerar a lista de compras.",
        variant: "destructive",
      });
    } finally {
      setGerandoLista(false);
    }
  }

  // Filtrar modelos
  const modelosFiltrados = MODELOS.filter((modelo) => {
    const matchNucleo = filtroNucleo === "todos" || modelo.nucleo === filtroNucleo;
    const matchBusca =
      !buscaModelo ||
      normalizeSearchTerm(modelo.titulo).includes(normalizeSearchTerm(buscaModelo)) ||
      normalizeSearchTerm(modelo.descricao).includes(normalizeSearchTerm(buscaModelo));
    return matchNucleo && matchBusca;
  });

  // Usar modelo para criar orçamento
  function handleUsarModelo(modelo: ModeloOrcamento) {
    // Navegar para página de novo orçamento com os dados do modelo
    let url = `/orcamentos/novo?modelo=${modelo.id}`;

    // Se tem análise selecionada, incluir
    if (analiseSelecionada) {
      url += `&analise=${analiseSelecionada.id}`;
    }

    navigate(url);
  }

  return (
    <div className="p-8 min-h-screen bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                Modelos de Orçamento
              </h1>
              <p className="text-[12px] text-gray-600">
                Escolha um modelo pronto para começar seu orçamento rapidamente
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÍO: Análises de Projeto Disponíveis */}
        {analisesDisponiveis.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-[16px] font-normal text-gray-900">
                  Análises de Projeto Disponíveis
                </h2>
                <p className="text-sm text-gray-600">
                  Selecione uma análise para pré-carregar serviços e materiais
                </p>
              </div>
            </div>

            {loadingAnalises ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analisesDisponiveis.slice(0, 6).map((analise) => (
                  <div
                    key={analise.id}
                    onClick={() => handleSelecionarAnalise(analise)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      analiseSelecionada?.id === analise.id
                        ? "border-purple-500 bg-white shadow-md"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-normal text-gray-900 text-sm">
                        {analise.titulo || analise.numero || "Análise"}
                      </h3>
                      {analiseSelecionada?.id === analise.id && (
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {analise.cliente_nome || "Cliente nÍo informado"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        analise.status === "aprovado"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {analise.status === "aprovado" ? "Aprovado" : "Analisado"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {analise.total_ambientes || 0} ambientes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dados da Análise Selecionada */}
            {analiseSelecionada && dadosAnalise && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-normal text-gray-900">
                    Dados Carregados da Análise
                  </h4>
                  <button
                    type="button"
                    onClick={handleGerarListaCompras}
                    disabled={gerandoLista}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-[14px] font-medium hover:bg-purple-700 disabled:opacity-50"
                  >
                    {gerandoLista ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                    Gerar Lista de Compras
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-[20px] font-normal text-gray-900">
                      {dadosAnalise.ambientes?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Ambientes</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-[20px] font-normal text-blue-600">
                      {dadosAnalise.totalServicos || 0}
                    </div>
                    <div className="text-xs text-gray-500">Serviços</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-[20px] font-normal text-green-600">
                      {dadosAnalise.totalMateriais || 0}
                    </div>
                    <div className="text-xs text-gray-500">Materiais</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-[20px] font-normal text-orange-600">
                      {dadosAnalise.totalServicos + dadosAnalise.totalMateriais}
                    </div>
                    <div className="text-xs text-gray-500">Total Itens</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Busca */}
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                value={buscaModelo}
                onChange={(e) => setBuscaModelo(e.target.value)}
                placeholder="Buscar modelo..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none text-[14px]"
              />
            </div>

            {/* Filtro por Núcleo */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFiltroNucleo("todos")}
                className={`px-4 py-2.5 rounded-lg font-medium text-[14px] transition-all ${
                  filtroNucleo === "todos"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {Object.entries(NUCLEO_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltroNucleo(key)}
                  style={{
                    backgroundColor:
                      filtroNucleo === key
                        ? NUCLEO_CORES[key as keyof typeof NUCLEO_CORES].bg
                        : NUCLEO_CORES[key as keyof typeof NUCLEO_CORES].light,
                    color:
                      filtroNucleo === key
                        ? "white"
                        : NUCLEO_CORES[key as keyof typeof NUCLEO_CORES].text,
                  }}
                  className="px-4 py-2.5 rounded-lg font-medium text-[14px] transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modelos Populares */}
        {filtroNucleo === "todos" && !buscaModelo && (
          <div className="mb-8">
            <h2 className="text-[16px] font-normal text-gray-900 mb-4 flex items-center gap-2">
              <WGStarIcon className="w-5 h-5 text-amber-500" />
              Mais Utilizados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODELOS.filter((m) => m.popular).map((modelo) => {
                const cores = NUCLEO_CORES[modelo.nucleo];
                return (
                  <div
                    key={modelo.id}
                    className="bg-white rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleUsarModelo(modelo)}
                  >
                    <div
                      className="p-5"
                      style={{ backgroundColor: cores.light }}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: cores.bg, color: "white" }}
                        >
                          {modelo.icon}
                        </div>
                        <span
                          className="px-2 py-1 text-xs font-normal rounded-full"
                          style={{ backgroundColor: cores.bg, color: "white" }}
                        >
                          {NUCLEO_LABELS[modelo.nucleo]}
                        </span>
                      </div>
                      <h3 className="font-normal text-gray-900 mt-4 text-[16px]">
                        {modelo.titulo}
                      </h3>
                      <p className="text-[12px] text-gray-600 mt-1 line-clamp-2">
                        {modelo.descricao}
                      </p>
                    </div>
                    <div className="px-5 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {modelo.categorias.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                        {modelo.categorias.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{modelo.categorias.length - 3}
                          </span>
                        )}
                      </div>
                      <ArrowRight
                        className="w-5 h-5 text-gray-400 group-hover:text-[#F25C26] transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Todos os Modelos */}
        <div>
          <h2 className="text-[16px] font-normal text-gray-900 mb-4">
            {filtroNucleo === "todos" && !buscaModelo
              ? "Todos os Modelos"
              : `${modelosFiltrados.length} modelo${modelosFiltrados.length !== 1 ? "s" : ""} encontrado${modelosFiltrados.length !== 1 ? "s" : ""}`}
          </h2>

          {modelosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-[16px] font-normal text-gray-700 mb-2">
                Nenhum modelo encontrado
              </h3>
              <p className="text-[12px] text-gray-500">
                Tente ajustar os filtros de busca
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {modelosFiltrados
                .filter((m) => !(filtroNucleo === "todos" && !buscaModelo && m.popular))
                .map((modelo) => {
                  const cores = NUCLEO_CORES[modelo.nucleo];
                  return (
                    <div
                      key={modelo.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group"
                      onClick={() => handleUsarModelo(modelo)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="p-2.5 rounded-lg"
                            style={{ backgroundColor: cores.light, color: cores.text }}
                          >
                            {modelo.icon}
                          </div>
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={{ backgroundColor: cores.light, color: cores.text }}
                          >
                            {NUCLEO_LABELS[modelo.nucleo]}
                          </span>
                        </div>
                        <h3 className="font-normal text-gray-900 text-[14px]">
                          {modelo.titulo}
                        </h3>
                        <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">
                          {modelo.descricao}
                        </p>
                      </div>

                      <div className="px-4 pb-4">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {modelo.categorias.slice(0, 3).map((cat) => (
                            <span
                              key={cat}
                              className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {cat}
                            </span>
                          ))}
                          {modelo.categorias.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{modelo.categorias.length - 3}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-medium rounded-lg transition-all"
                          style={{
                            backgroundColor: cores.light,
                            color: cores.text,
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Usar Modelo
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Card de Modelo Personalizado */}
        <div className="mt-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <PenTool className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[16px] font-normal">Orçamento Personalizado</h3>
                <p className="text-[12px] text-gray-300">
                  Crie um orçamento do zero, sem usar modelos
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/orcamentos/novo")}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium text-[14px] hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Criar do Zero
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

