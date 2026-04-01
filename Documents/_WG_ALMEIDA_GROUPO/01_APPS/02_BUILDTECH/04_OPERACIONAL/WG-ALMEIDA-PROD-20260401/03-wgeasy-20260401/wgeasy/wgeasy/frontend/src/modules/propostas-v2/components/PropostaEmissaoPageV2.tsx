/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PropostaEmissaoPageV2 - Página principal redesenhada
// Sistema WG Easy - Grupo WG Almeida
// Layout: 3 Colunas igual Análise de Projeto
// ============================================================

import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Search,
  Home,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Upload,
  Package,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// Hooks
import { useAmbientes } from "../hooks/useAmbientes";
import { usePricelistBusca } from "../hooks/usePricelistBusca";
import { useItensProposta } from "../hooks/useItensProposta";
import { useCondicoesComerciais } from "../hooks/useCondicoesComerciais";

// Componentes
import PricelistBusca from "./PricelistBusca";
import ItensPropostaPanel from "./ItensPropostaPanel";
import ImportarAnaliseModal from "./ImportarAnaliseModal";
import NumericInputSpinner from "@/components/ui/NumericInputSpinner";

// Types
import type { Cliente, Ambiente, ItemPricelist } from "../types";

// APIs
import { criarProposta, atualizarProposta, buscarProposta } from "@/lib/propostasApi";

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function PropostaEmissaoPageV2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  // Parâmetros da URL
  const oportunidadeId = searchParams.get("oportunidade_id");
  const clienteIdParam = searchParams.get("cliente_id");

  // Estado do cliente
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Estado de salvamento
  const [salvando, setSalvando] = useState(false);
  const [propostaId, setPropostaId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(!!id);

  // Ambiente expandido/selecionado
  const [ambienteExpandido, setAmbienteExpandido] = useState<string | null>(null);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(null);

  // Modal importar análise
  const [modalImportarAnalise, setModalImportarAnalise] = useState(false);

  // Hooks customizados
  const {
    ambientes,
    totais: totaisAmbientes,
    adicionar: adicionarAmbiente,
    atualizar: atualizarAmbiente,
    remover: removerAmbiente,
    importar: importarAmbientes,
    setAmbientes,
  } = useAmbientes();

  const {
    itens: itensPricelist,
    itensFiltrados,
    loading: loadingPricelist,
    filtros,
    setFiltros,
    buscar,
  } = usePricelistBusca();

  const {
    itens: itensProposta,
    totais,
    gruposPorNucleo,
    adicionar: adicionarItem,
    adicionarMultiplos,
    remover: removerItem,
    atualizarQuantidade,
    setItens: setItensProposta,
  } = useItensProposta();

  const {
    condicoes,
    taxaCartaoPerc,
    valorTaxaCartao,
    totalComCartao,
    atualizarCampo,
    setCondicoes,
  } = useCondicoesComerciais(totais.total);

  // Buscar clientes
  const buscarClientes = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setClientesEncontrados([]);
      return;
    }

    try {
      setBuscandoCliente(true);
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, cpf, email, telefone")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .ilike("nome", `%${termo}%`)
        .limit(10);

      if (error) {
        console.error("Erro busca:", error);
        return;
      }

      setClientesEncontrados((data || []) as Cliente[]);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setBuscandoCliente(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarClientes(buscaCliente);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaCliente, buscarClientes]);

  // Carregar proposta existente (modo ediçÍo)
  useEffect(() => {
    const carregarProposta = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const proposta = await buscarProposta(id);
        console.log(`[carregarProposta] Proposta carregada: ${id} (status: ${proposta?.status || "N/A"})`);
        console.log(`[carregarProposta] Itens retornados pela API: ${proposta?.itens?.length || 0}`);

        if (proposta) {
          // Carregar cliente
          if (proposta.cliente_id) {
            const { data: clienteData } = await supabase
              .from("pessoas")
              .select("id, nome, cpf, email, telefone")
              .eq("id", proposta.cliente_id)
              .single();

            if (clienteData) {
              setClienteSelecionado(clienteData as Cliente);
            }
          }

          // Carregar condições comerciais
          setCondicoes({
            forma_pagamento: proposta.forma_pagamento || "parcelado",
            percentual_entrada: proposta.percentual_entrada || 30,
            numero_parcelas: proposta.numero_parcelas || 3,
            validade_dias: proposta.validade_dias || 30,
            prazo_execucao_dias: proposta.prazo_execucao_dias || 60,
            pagamento_cartao: proposta.pagamento_cartao || false,
          });

          // Carregar itens da proposta
          if (proposta.itens && proposta.itens.length > 0) {
            const itensFormatados = proposta.itens.map((item: any) => ({
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              item: {
                id: item.pricelist_item_id || item.id,
                codigo: item.codigo || "",
                nome: item.nome,
                descricao: item.descricao || "",
                categoria: item.categoria || "",
                subcategoria: item.subcategoria || "",
                tipo: item.tipo || "material",
                unidade: item.unidade || "un",
                preco: item.valor_unitario,
                nucleo: item.nucleo || null,
              },
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              ambiente_id: item.ambiente_id || undefined,
              descricao_customizada: item.descricao_customizada,
            }));
            setItensProposta(itensFormatados);
          } else {
            console.warn("[carregarProposta] Nenhum item retornado para a proposta. Verifique RLS, tabela propostas_itens e/ou propostas_itens_backup.");
          }

          setPropostaId(id);
        }
      } catch (error) {
        console.error("Erro ao carregar proposta:", error);
        toast({
          title: "Erro",
          description: "não foi possível carregar a proposta",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    carregarProposta();
  }, [id, toast]);

  // Handlers
  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente("");
    setClientesEncontrados([]);
  };

  const handleAdicionarItem = useCallback((item: ItemPricelist, ambienteId?: string) => {
    adicionarItem(item, ambienteId || ambienteSelecionado || undefined, ambientes);
  }, [adicionarItem, ambientes, ambienteSelecionado]);

  const handleImportarAnalise = useCallback((dados: {
    ambientes: Ambiente[];
    itensSugeridos: any[];
    analiseId: string;
  }) => {
    if (dados.ambientes.length > 0) {
      importarAmbientes(dados.ambientes);
    }
    if (dados.itensSugeridos.length > 0) {
      adicionarMultiplos(dados.itensSugeridos);
    }
    setModalImportarAnalise(false);
  }, [importarAmbientes, adicionarMultiplos]);

  const handleSalvarProposta = useCallback(async () => {
    if (!clienteSelecionado) {
      toast({
        title: "AtençÍo",
        description: "Selecione um cliente primeiro",
        variant: "destructive",
      });
      return;
    }

    if (itensProposta.length === 0) {
      toast({
        title: "AtençÍo",
        description: "Adicione pelo menos um item à proposta",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);

      // Preparar dados da proposta
      const dadosProposta = {
        cliente_id: clienteSelecionado.id,
        oportunidade_id: oportunidadeId || undefined,
        titulo: `Proposta - ${clienteSelecionado.nome}`,
        descricao: `Proposta comercial para ${clienteSelecionado.nome}`,
        forma_pagamento: condicoes.forma_pagamento || "parcelado",
        percentual_entrada: condicoes.percentual_entrada || 30,
        numero_parcelas: condicoes.numero_parcelas || 3,
        validade_dias: condicoes.validade_dias || 30,
        prazo_execucao_dias: 60,
        exibir_valores: true,
      };

      // Preparar itens para o formato da API
      // ItemProposta tem estrutura: { id, item: ItemPricelist, ambiente_id, quantidade, valor_unitario }
      const itensParaSalvar = itensProposta.map((itemProposta, index) => ({
        pricelist_item_id: itemProposta.item.id,
        codigo: itemProposta.item.codigo || "",
        nome: itemProposta.item.nome,
        descricao: itemProposta.item.descricao || "",
        categoria: itemProposta.item.categoria || "",
        tipo: itemProposta.item.tipo || "material",
        unidade: itemProposta.item.unidade || "un",
        quantidade: itemProposta.quantidade,
        valor_unitario: itemProposta.valor_unitario,
        descricao_customizada: itemProposta.descricao_customizada,
        ambiente_id: itemProposta.ambiente_id,
        ordem: index,
        nucleo: itemProposta.item.nucleo || null,
      }));

      const itensNormalizados = itensParaSalvar.map((item, index) => ({
        ...item,
        pricelist_item_id: isUuid(item.pricelist_item_id) ? item.pricelist_item_id : null,
        categoria: (item.categoria || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim(),
        tipo: (item.tipo || "material").toLowerCase(),
        unidade: (item.unidade || "un").toLowerCase() === "m²" ? "m2" : (item.unidade || "un").toLowerCase(),
        ordem: index,
      }));

      // Atualizar proposta existente ou criar nova
      let propostaDestinoId = propostaId;
      if (propostaDestinoId) {
        await atualizarProposta(propostaDestinoId, dadosProposta as any);

        if (itensNormalizados.length > 0) {
          const payloadInsercao = itensNormalizados.map((item) => ({
            proposta_id: propostaDestinoId,
            ...item,
          }));

          const { data: insertedItens, error: insertError } = await supabase
            .from("propostas_itens")
            .insert(payloadInsercao)
            .select();

          if (insertError) throw insertError;

          const idsNovos = (insertedItens || []).map((registro: any) => registro.id).filter(Boolean);
          if (idsNovos.length > 0) {
            await supabase
              .from("propostas_itens")
              .delete()
              .eq("proposta_id", propostaDestinoId)
              .not("id", "in", `(${idsNovos.join(",")})`);
          }
        } else {
          await supabase
            .from("propostas_itens")
            .delete()
            .eq("proposta_id", propostaDestinoId);
        }
      } else {
        const propostaCriada = await criarProposta(dadosProposta, itensNormalizados as any);
        propostaDestinoId = propostaCriada.id;
        setPropostaId(propostaCriada.id);
      }

      toast({
        title: "Sucesso!",
        description: propostaId
          ? "Proposta atualizada com sucesso"
          : "Proposta criada com sucesso",
      });

      // Navegar para a lista de propostas
      navigate("/propostas");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "não foi possível salvar a proposta",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }, [clienteSelecionado, itensProposta, condicoes, oportunidadeId, propostaId, navigate, toast]);

  // Adicionar novo ambiente manual
  const handleNovoAmbiente = () => {
    const novoAmbiente: Ambiente = {
      id: `temp-${Date.now()}`,
      nome: `Ambiente ${ambientes.length + 1}`,
      largura: 0,
      comprimento: 0,
      pe_direito: 2.7,
      area_piso: 0,
      area_parede: 0,
      area_paredes_bruta: 0,
      area_paredes_liquida: 0,
      area_teto: 0,
      perimetro: 0,
      portas: [],
      janelas: [],
      vaos: [],
      area_vaos_total: 0,
    };
    adicionarAmbiente(novoAmbiente);
    setAmbienteExpandido(novoAmbiente.id);
  };

  // Atualizar campo do ambiente
  const handleAtualizarAmbiente = (id: string, campo: string, valor: any) => {
    const ambiente = ambientes.find(a => a.id === id);
    if (!ambiente) return;

    const atualizado = { ...ambiente, [campo]: valor };

    // Recalcular áreas
    if (['largura', 'comprimento', 'pe_direito'].includes(campo)) {
      const l = campo === 'largura' ? parseFloat(valor) || 0 : atualizado.largura;
      const c = campo === 'comprimento' ? parseFloat(valor) || 0 : atualizado.comprimento;
      const p = campo === 'pe_direito' ? parseFloat(valor) || 2.7 : atualizado.pe_direito;

      atualizado.area_piso = l * c;
      atualizado.area_teto = l * c;
      atualizado.perimetro = 2 * (l + c);
      atualizado.area_paredes_bruta = atualizado.perimetro * p;

      // Calcular área de vÍos
      const calcularAreaVaos = (lista: typeof atualizado.portas) =>
        (lista || []).reduce((acc, v) => acc + (v.largura * v.altura * v.quantidade), 0);

      atualizado.area_vaos_total = calcularAreaVaos(atualizado.portas) +
        calcularAreaVaos(atualizado.janelas) +
        calcularAreaVaos(atualizado.vaos);

      atualizado.area_paredes_liquida = Math.max(0, atualizado.area_paredes_bruta - atualizado.area_vaos_total);
      atualizado.area_parede = atualizado.area_paredes_bruta; // Alias

      // Revestimentos
      atualizado.rev_piso_largura = l;
      atualizado.rev_piso_altura = c;
      atualizado.rev_piso_area = atualizado.area_piso;
      atualizado.rev_parede_perimetro = atualizado.perimetro;
      atualizado.rev_parede_altura = p;
      atualizado.rev_parede_area = atualizado.area_paredes_liquida;
    }

    atualizarAmbiente(id, atualizado);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F25C26] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/propostas")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-normal text-gray-900">
                    {id ? "Editar Proposta" : "Nova Proposta"}
                  </h1>
                  {clienteSelecionado && (
                    <p className="text-sm text-gray-500">{clienteSelecionado.nome}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSalvarProposta}
                disabled={salvando}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo - Layout Profissional */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">

        {/* PRIMEIRA LINHA: 3 Cards de ConfiguraçÍo (alinhado com colunas abaixo) */}
        <div className="grid grid-cols-[1fr_1.2fr_1.8fr] gap-4 mb-6">

          {/* Card 1: SeleçÍo do Cliente */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-normal text-gray-900">Cliente</h2>
                <p className="text-xs text-gray-500">Selecione o cliente da proposta</p>
              </div>
            </div>

            {clienteSelecionado ? (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-normal text-sm">
                    {clienteSelecionado.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-normal text-gray-900">{clienteSelecionado.nome}</p>
                    <p className="text-xs text-gray-500">{clienteSelecionado.email || clienteSelecionado.telefone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setClienteSelecionado(null)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
                />

                {/* Dropdown resultados */}
                {clientesEncontrados.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {clientesEncontrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => handleSelecionarCliente(cliente)}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{cliente.nome}</p>
                        <p className="text-xs text-gray-500">{cliente.email || cliente.cpf}</p>
                      </button>
                    ))}
                  </div>
                )}

                {buscandoCliente && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#F25C26] animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 2: Adicionar/Importar Ambientes */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-normal text-gray-900">Ambientes</h2>
                <p className="text-xs text-gray-500">Adicione ou importe ambientes</p>
              </div>
              <span className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-normal rounded-full">
                {ambientes.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleNovoAmbiente}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
              <button
                onClick={() => {
                  if (!clienteSelecionado) {
                    alert("Selecione um cliente primeiro");
                    return;
                  }
                  setModalImportarAnalise(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 border-2 border-blue-200 rounded-lg font-medium hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <Upload className="w-4 h-4" />
                Importar IA
              </button>
            </div>

            {/* Resumo de áreas */}
            {ambientes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Área Piso</p>
                  <p className="font-normal text-gray-900">{totaisAmbientes.area_piso.toFixed(1)}m²</p>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Área Parede</p>
                  <p className="font-normal text-gray-900">{totaisAmbientes.area_parede.toFixed(1)}m²</p>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Condições Comerciais */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-normal text-gray-900">Condições Comerciais</h2>
                <p className="text-xs text-gray-500">Pagamento e validade</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Entrada (%)</label>
                <input
                  type="number"
                  value={condicoes.percentual_entrada}
                  onChange={(e) => atualizarCampo("percentual_entrada", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Parcelas</label>
                <input
                  type="number"
                  value={condicoes.numero_parcelas}
                  onChange={(e) => atualizarCampo("numero_parcelas", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Validade</label>
                <input
                  type="number"
                  value={condicoes.validade_dias}
                  onChange={(e) => atualizarCampo("validade_dias", parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-gray-700">Valor Total:</span>
              <span className="text-xl font-normal text-green-600">
                R$ {totais.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* SEGUNDA LINHA: 3 Colunas Principais */}
        <div className="grid grid-cols-[1fr_1.2fr_1.8fr] gap-4">

          {/* COLUNA 1: Lista de Ambientes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h3 className="font-normal text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                Lista de Ambientes
              </h3>
            </div>

            <div className="p-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {ambientes.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhum ambiente adicionado</p>
                  <p className="text-xs text-gray-400 mt-1">Use os botões acima para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ambientes.map((ambiente) => (
                    <div
                      key={ambiente.id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        ambienteSelecionado === ambiente.id
                          ? "border-[#F25C26] bg-orange-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setAmbienteSelecionado(
                            ambienteSelecionado === ambiente.id ? null : ambiente.id
                          );
                          setAmbienteExpandido(
                            ambienteExpandido === ambiente.id ? null : ambiente.id
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {ambienteExpandido === ambiente.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{ambiente.nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {ambiente.area_piso.toFixed(1)}m²
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Remover este ambiente?")) {
                                removerAmbiente(ambiente.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      {ambienteExpandido === ambiente.id && (
                        <div className="p-3 space-y-3 border-t border-gray-100 bg-gray-50">
                          {/* Nome do ambiente */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do Ambiente</label>
                            <input
                              type="text"
                              value={ambiente.nome}
                              onChange={(e) => handleAtualizarAmbiente(ambiente.id, "nome", e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
                            />
                          </div>

                          {/* Dimensões Básicas - 5 colunas */}
                          <div className="grid grid-cols-5 gap-1.5">
                            <div className="text-center p-1.5 bg-white rounded border border-gray-200 hover:border-[#F25C26]/50 transition-colors">
                              <NumericInputSpinner
                                label="Larg. (m)"
                                value={ambiente.largura || ""}
                                onChange={(val) => handleAtualizarAmbiente(ambiente.id, "largura", val)}
                                step={0.01}
                                min={0}
                                max={100}
                                compact
                              />
                            </div>
                            <div className="text-center p-1.5 bg-white rounded border border-gray-200 hover:border-[#F25C26]/50 transition-colors">
                              <NumericInputSpinner
                                label="Comp. (m)"
                                value={ambiente.comprimento || ""}
                                onChange={(val) => handleAtualizarAmbiente(ambiente.id, "comprimento", val)}
                                step={0.01}
                                min={0}
                                max={100}
                                compact
                              />
                            </div>
                            <div className="text-center p-1.5 bg-white rounded border border-gray-200">
                              <span className="text-[10px] text-gray-500 block">Área m²</span>
                              <span className="text-xs font-normal text-gray-900">{ambiente.area_piso.toFixed(2)}</span>
                            </div>
                            <div className="text-center p-1.5 bg-white rounded border border-gray-200 hover:border-[#F25C26]/50 transition-colors">
                              <NumericInputSpinner
                                label="PD (m)"
                                value={ambiente.pe_direito || ""}
                                onChange={(val) => handleAtualizarAmbiente(ambiente.id, "pe_direito", val)}
                                step={0.01}
                                min={0}
                                max={20}
                                compact
                              />
                            </div>
                            <div className="text-center p-1.5 bg-white rounded border border-gray-200">
                              <span className="text-[10px] text-gray-500 block">Perím.</span>
                              <span className="text-xs font-normal text-gray-900">{ambiente.perimetro.toFixed(2)}m</span>
                            </div>
                          </div>

                          {/* Áreas Calculadas - 4 colunas */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="text-center p-2 bg-emerald-50 rounded border border-emerald-200">
                              <span className="text-[10px] text-emerald-600 block font-medium">Área Piso</span>
                              <span className="text-sm font-normal text-emerald-700">{ambiente.area_piso.toFixed(2)} m²</span>
                            </div>
                            <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-[10px] text-blue-600 block font-medium">Perímetro</span>
                              <span className="text-sm font-normal text-blue-700">{ambiente.perimetro.toFixed(2)} m</span>
                            </div>
                            <div className="text-center p-2 bg-amber-50 rounded border border-amber-200">
                              <span className="text-[10px] text-amber-600 block font-medium">Paredes Bruta</span>
                              <span className="text-sm font-normal text-amber-700">{(ambiente.area_paredes_bruta || ambiente.area_parede).toFixed(2)} m²</span>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded border border-purple-200">
                              <span className="text-[10px] text-purple-600 block font-medium">Paredes Líq.</span>
                              <span className="text-sm font-normal text-purple-700">{(ambiente.area_paredes_liquida || ambiente.area_parede).toFixed(2)} m²</span>
                            </div>
                          </div>

                          {/* VÍos - 4 colunas */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                              <span className="text-[10px] text-gray-500 block">Portas ({ambiente.portas?.length || 0})</span>
                              <span className="text-[10px] text-gray-600">
                                {ambiente.portas?.length > 0
                                  ? `${ambiente.portas[0]?.largura?.toFixed(2) || '0,80'} × ${ambiente.portas[0]?.altura?.toFixed(2) || '2,10'}`
                                  : '0,80 × 2,10'}
                              </span>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                              <span className="text-[10px] text-gray-500 block">Janelas ({ambiente.janelas?.length || 0})</span>
                              <span className="text-[10px] text-gray-600">
                                {ambiente.janelas?.length > 0
                                  ? `${ambiente.janelas[0]?.largura?.toFixed(2) || '1,20'} × ${ambiente.janelas[0]?.altura?.toFixed(2) || '1,20'}`
                                  : '1,20 × 1,20'}
                              </span>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
                              <span className="text-[10px] text-gray-500 block">VÍos ({ambiente.vaos?.length || 0})</span>
                              <span className="text-[10px] text-gray-600">
                                {ambiente.vaos?.length > 0
                                  ? `${ambiente.vaos[0]?.largura?.toFixed(2) || '1,00'} × ${ambiente.vaos[0]?.altura?.toFixed(2) || '2,10'}`
                                  : '1,00 × 2,10'}
                              </span>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                              <span className="text-[10px] text-red-600 block font-medium">Total VÍos</span>
                              <span className="text-sm font-normal text-red-700">{(ambiente.area_vaos_total || 0).toFixed(2)} m²</span>
                            </div>
                          </div>

                          {/* Revestimentos - 2 colunas */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                              <span className="text-[10px] text-emerald-700 font-normal block mb-1">Rev. Piso</span>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600">
                                  {ambiente.largura.toFixed(2)} × {ambiente.comprimento.toFixed(2)}
                                </span>
                                <span className="text-sm font-normal text-emerald-700">{ambiente.area_piso.toFixed(2)} m²</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                              <span className="text-[10px] text-purple-700 font-normal block mb-1">Rev. Parede</span>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600">
                                  {ambiente.perimetro.toFixed(2)} × {ambiente.pe_direito.toFixed(2)}
                                </span>
                                <span className="text-sm font-normal text-purple-700">{(ambiente.area_paredes_liquida || ambiente.area_parede).toFixed(2)} m²</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 2: Busca Pricelist + IA */}
          <div className="space-y-4">
            <PricelistBusca
              itens={itensFiltrados}
              loading={loadingPricelist}
              filtros={filtros}
              ambientes={ambientes}
              sugestoes={[]}
              onBuscar={buscar}
              onFiltrar={setFiltros}
              onAdicionar={handleAdicionarItem}
              onCriarNovo={() => {}}
            />
          </div>

          {/* COLUNA 3: Itens da Proposta */}
          <div className="space-y-4">
            <ItensPropostaPanel
              gruposPorNucleo={gruposPorNucleo}
              totais={totais}
              ambientes={ambientes}
              onAtualizarQuantidade={atualizarQuantidade}
              onRemover={removerItem}
            />
          </div>
        </div>
      </div>

      {/* Modal Importar Análise */}
      {modalImportarAnalise && clienteSelecionado && (
        <ImportarAnaliseModal
          clienteId={clienteSelecionado.id}
          clienteNome={clienteSelecionado.nome}
          itensPricelist={itensPricelist}
          onImportar={handleImportarAnalise}
          onClose={() => setModalImportarAnalise(false)}
        />
      )}
    </div>
  );
}


