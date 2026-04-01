/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// NOVO PEDIDO - Wizard Unificado
// Sistema WG Easy - Grupo WG Almeida
// Fluxo: Cliente → Materiais → Revisar → Enviar
// ============================================================

import { useState, useMemo, useEffect } from "react";
import styles from "./NovoPedidoPage.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  ShoppingCart,
  Building2,
  Package,
  ClipboardList,
  Send,
  Loader2,
  Save,
  Sparkles,
  Search,
  Layers,
  Upload,
  Calculator,
  ClipboardPaste,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";

// Componentes
import { StepIndicator, type Step } from "./components/wizard/StepIndicator";
import { StepCliente, type ClienteObra } from "./components/wizard/StepCliente";
import {
  ItemMaterialCard,
  type ItemMaterial,
} from "./components/shared/ItemMaterialCard";
import { ResumoTotais } from "./components/shared/ResumoTotais";
import ImportarPedidoFornecedor from "./components/wizard/ImportarPedidoFornecedor";
import ImportarOrcamentoFornecedorModal from "@/components/planejamento/ImportarOrcamentoFornecedorModal";

// APIs
import {
  listarComposicoes,
  buscarComposicaoCompleta,
  type ModeloComposicao,
} from "@/lib/composicoesApi";
import {
  listarItensComFiltros,
  type PricelistItemCompleto,
} from "@/lib/pricelistApi";

// ============================================================
// CONSTANTES
// ============================================================

const PASSOS: Step[] = [
  { id: 1, nome: "Cliente", descricao: "Selecionar obra", icone: Building2 },
  { id: 2, nome: "Materiais", descricao: "Adicionar itens", icone: Package },
  { id: 3, nome: "Revisar", descricao: "Conferir lista", icone: ClipboardList },
  { id: 4, nome: "Enviar", descricao: "Finalizar", icone: Send },
];

type FonteMaterial = "catalogo" | "kits" | "automatico" | "importar";

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function NovoPedidoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Estados do wizard
  const [passoAtual, setPassoAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [carregandoClienteInicial, setCarregandoClienteInicial] =
    useState(false);

  // Passo 1: Cliente
  const [clienteSelecionado, setClienteSelecionado] =
    useState<ClienteObra | null>(null);

  // Carregar cliente pré-selecionado da URL (para Pedidos Rápidos)
  useEffect(() => {
    const clienteId = searchParams.get("cliente");
    const analiseId = searchParams.get("analise");

    if (clienteId || analiseId) {
      carregarClienteInicial(clienteId, analiseId);
    }
  }, [searchParams]);

  async function carregarClienteInicial(
    clienteId: string | null,
    analiseId: string | null
  ) {
    try {
      setCarregandoClienteInicial(true);

      if (analiseId) {
        // Buscar análise de projeto (sem join - evita erro de FK)
        const { data: analise, error } = await supabase
          .from("analises_projeto")
          .select("id, titulo, cliente_id, endereco_obra, status, total_ambientes, total_area_piso")
          .eq("id", analiseId)
          .single();

        if (!error && analise) {
          // Buscar nome do cliente separadamente
          let clienteNome = analise.titulo;
          if (analise.cliente_id) {
            const { data: cliente } = await supabase
              .from("pessoas")
              .select("nome")
              .eq("id", analise.cliente_id)
              .single();
            if (cliente?.nome) {
              clienteNome = cliente.nome;
            }
          }
          setClienteSelecionado({
            id: analise.id,
            nome: clienteNome,
            endereco: analise.endereco_obra,
            tipo: analise.titulo,
            area_total: analise.total_area_piso,
            total_ambientes: analise.total_ambientes,
            status: analise.status,
            analise_id: analise.id,
            origem: "analise",
          });
          // Avançar para próximo passo automaticamente
          setPassoAtual(2);
          toast({ title: "Cliente pré-selecionado", description: clienteNome });
        }
      } else if (clienteId) {
        // Buscar cliente direto
        const { data: cliente, error } = await supabase
          .from("pessoas")
          .select("id, nome, logradouro, cidade, estado")
          .eq("id", clienteId)
          .single();

        if (!error && cliente) {
          const enderecoFormatado = [cliente.logradouro, cliente.cidade, cliente.estado].filter(Boolean).join(", ");
          setClienteSelecionado({
            id: cliente.id,
            nome: cliente.nome,
            endereco: enderecoFormatado || undefined,
            origem: "cliente",
          });
          // Avançar para próximo passo automaticamente
          setPassoAtual(2);
          toast({
            title: "Cliente pré-selecionado",
            description: cliente.nome,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar cliente inicial:", error);
    } finally {
      setCarregandoClienteInicial(false);
    }
  }

  // Passo 2: Materiais
  const [fonteSelecionada, setFonteSelecionada] =
    useState<FonteMaterial>("catalogo");
  const [itensPedido, setItensPedido] = useState<ItemMaterial[]>([]);

  // Busca catálogo
  const [buscaCatalogo, setBuscaCatalogo] = useState("");
  const [itensCatalogo, setItensCatalogo] = useState<PricelistItemCompleto[]>(
    []
  );
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  // Kits/Composições
  const [kits, setKits] = useState<ModeloComposicao[]>([]);
  const [kitsSelecionados, setKitsSelecionados] = useState<Set<string>>(
    new Set()
  );
  const [loadingKits, setLoadingKits] = useState(false);

  // Envio
  const [enviando, setEnviando] = useState(false);

  // Modal de importaçÍo de orçamento
  const [modalImportarOrcamento, setModalImportarOrcamento] = useState(false);

  // ============================================================
  // FUNÇÕES DE BUSCA
  // ============================================================

  async function buscarNoCatalogo(termo: string) {
    if (!termo || termo.length < 2) {
      setItensCatalogo([]);
      return;
    }

    try {
      setLoadingCatalogo(true);
      const itens = await listarItensComFiltros({
        busca: termo,
        apenas_ativos: true,
        limite: 30,
      });
      setItensCatalogo(itens);
    } catch (error) {
      console.error("Erro ao buscar no catálogo:", error);
    } finally {
      setLoadingCatalogo(false);
    }
  }

  async function carregarKits() {
    try {
      setLoadingKits(true);
      const composicoes = await listarComposicoes({ ativo: true });
      setKits(composicoes);
    } catch (error) {
      console.error("Erro ao carregar kits:", error);
    } finally {
      setLoadingKits(false);
    }
  }

  // ============================================================
  // MANIPULAÇÍO DE ITENS
  // ============================================================

  function adicionarItemDoCatalogo(item: PricelistItemCompleto) {
    const novoItem: ItemMaterial = {
      id: `PRICELIST-${item.id}-${Date.now()}`,
      descricao: item.nome,
      classificacao: "INSUMO",
      quantidade: 1,
      unidade: item.unidade || "UN",
      preco_unitario: item.preco || 0,
      valor_total: item.preco || 0,
      categoria: item.categoria?.nome,
      origem: "pricelist",
      imagem_url: item.imagem_url ?? undefined,
      pricelist_item_id: item.id,
    };

    setItensPedido((prev) => [...prev, novoItem]);
    toast({ title: "Item adicionado", description: item.nome });
  }

  async function adicionarItensDoKit(kitId: string) {
    try {
      const composicao = await buscarComposicaoCompleta(kitId);
      if (!composicao?.itens) return;

      const novosItens: ItemMaterial[] = composicao.itens.map((item) => ({
        id: `KIT-${kitId}-${item.id}-${Date.now()}`,
        descricao: item.descricao_generica,
        classificacao: item.classificacao,
        quantidade: item.coeficiente || 1,
        unidade: item.unidade,
        preco_unitario: item.pricelist_item?.preco || 0,
        valor_total:
          (item.coeficiente || 1) * (item.pricelist_item?.preco || 0),
        categoria: item.categoria_material,
        origem: "kit",
        composicao_nome: composicao.nome,
        pricelist_item_id: item.pricelist_item?.id,
      }));

      setItensPedido((prev) => [...prev, ...novosItens]);
      toast({
        title: "Kit adicionado",
        description: `${novosItens.length} itens de ${composicao.nome}`,
      });
    } catch (error) {
      console.error("Erro ao adicionar kit:", error);
    }
  }

  function ajustarQuantidade(id: string, delta: number) {
    setItensPedido((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const novaQtd = Math.max(0, item.quantidade + delta);
          return {
            ...item,
            quantidade: novaQtd,
            valor_total: novaQtd * item.preco_unitario,
          };
        }
        return item;
      })
    );
  }

  function definirQuantidade(id: string, quantidade: number) {
    setItensPedido((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const novaQtd = Math.max(0, quantidade);
          return {
            ...item,
            quantidade: novaQtd,
            valor_total: novaQtd * item.preco_unitario,
          };
        }
        return item;
      })
    );
  }

  function removerItem(id: string) {
    setItensPedido((prev) => prev.filter((item) => item.id !== id));
  }

  // ============================================================
  // TOTAIS
  // ============================================================

  const totais = useMemo(() => {
    const itensAtivos = itensPedido.filter((i) => i.quantidade > 0);
    return {
      totalItens: itensAtivos.length,
      totalQuantidade: itensAtivos.reduce((acc, i) => acc + i.quantidade, 0),
      valorTotal: itensAtivos.reduce((acc, i) => acc + i.valor_total, 0),
    };
  }, [itensPedido]);

  // ============================================================
  // NAVEGAÇÍO
  // ============================================================

  function avancarPasso() {
    if (passoAtual === 1 && !clienteSelecionado) {
      toast({
        title: "Selecione um cliente",
        description: "Escolha um cliente/obra para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (passoAtual === 2 && itensPedido.length === 0) {
      toast({
        title: "Adicione itens",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return;
    }

    if (passoAtual === 2 && fonteSelecionada === "kits" && kits.length === 0) {
      carregarKits();
    }

    setPassoAtual((prev) => Math.min(prev + 1, 4));
  }

  function voltarPasso() {
    setPassoAtual((prev) => Math.max(prev - 1, 1));
  }

  // ============================================================
  // SALVAR
  // ============================================================

  async function salvarOrcamento(statusDestino: "rascunho" | "enviado") {
    if (!clienteSelecionado || itensPedido.length === 0) {
      toast({
        title: "AtençÍo",
        description: "Selecione um cliente e adicione itens.",
        variant: "destructive",
      });
      return;
    }

    try {
      setEnviando(true);

      // Criar orçamento
      const { data: orcamento, error: erroOrcamento } = await supabase
        .from("orcamentos")
        .insert({
          titulo: `Materiais - ${clienteSelecionado.nome}`,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          endereco_obra: clienteSelecionado.endereco,
          status: statusDestino,
          enviado_em: statusDestino === "enviado" ? new Date().toISOString() : null,
          valor_total: totais.valorTotal,
          margem: 15,
          tipo: "MATERIAIS_OBRA",
        })
        .select()
        .single();

      if (erroOrcamento) throw erroOrcamento;

      // Inserir itens
      const itensParaSalvar = itensPedido
        .filter((i) => i.quantidade > 0)
        .map((item) => ({
          orcamento_id: orcamento.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          valor_total: item.valor_total,
          categoria: item.categoria || item.classificacao,
          pricelist_item_id: item.pricelist_item_id,
        }));

      if (itensParaSalvar.length > 0) {
        const { error: erroItens } = await supabase
          .from("orcamentos_itens")
          .insert(itensParaSalvar);

        if (erroItens) throw erroItens;
      }

      toast({
        title: "Orçamento salvo!",
        description: `${itensParaSalvar.length} itens salvos com sucesso.`,
      });

      navigate(`/planejamento/orcamentos?status=${statusDestino}`);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: error.message || "NÍo foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/planejamento")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-wg-primary to-wg-primary/90 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                Novo Pedido de Materiais
              </h1>
              <p className="text-[12px] text-gray-600">
                {clienteSelecionado
                  ? clienteSelecionado.nome
                  : "Selecione um cliente para começar"}
              </p>
            </div>
          </div>

          {/* Mini resumo */}
          {itensPedido.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500">{totais.totalItens} itens</p>
              <p className="text-xl font-normal text-green-600">
                {formatarMoeda(totais.valorTotal)}
              </p>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="mb-6">
          <StepIndicator
            passos={PASSOS}
            passoAtual={passoAtual}
            onPassoClick={setPassoAtual}
            permitirNavegacao={true}
          />
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ========== PASSO 1: CLIENTE ========== */}
          {passoAtual === 1 && (
            <StepCliente
              clienteSelecionado={clienteSelecionado}
              onSelecionar={setClienteSelecionado}
            />
          )}

          {/* ========== PASSO 2: MATERIAIS ========== */}
          {passoAtual === 2 && (
            <div className="p-6">
              {/* Tabs de fonte */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFonteSelecionada("catalogo")}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    fonteSelecionada === "catalogo"
                      ? "bg-wg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFonteSelecionada("kits");
                    if (kits.length === 0) carregarKits();
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    fonteSelecionada === "kits"
                      ? "bg-wg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Kits
                </button>
                {clienteSelecionado?.origem === "analise" && (
                  <button
                    type="button"
                    onClick={() => setFonteSelecionada("automatico")}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      fonteSelecionada === "automatico"
                        ? "bg-wg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    Automático
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFonteSelecionada("importar")}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    fonteSelecionada === "importar"
                      ? "bg-wg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Importar
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna esquerda: Fonte de materiais */}
                <div className="space-y-4">
                  {/* CATÁLOGO */}
                  {fonteSelecionada === "catalogo" && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-[18px] font-normal text-gray-900 mb-3 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        Buscar no Catálogo
                      </h3>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={buscaCatalogo}
                          onChange={(e) => {
                            setBuscaCatalogo(e.target.value);
                            buscarNoCatalogo(e.target.value);
                          }}
                          placeholder="Busque por nome, código..."
                          className={`w-full pl-10 pr-4 ${styles.inputBox}`}
                        />
                      </div>

                      {loadingCatalogo ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      ) : itensCatalogo.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                          {itensCatalogo.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {item.nome}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {item.unidade} •{" "}
                                  {formatarMoeda(item.preco || 0)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => adicionarItemDoCatalogo(item)}
                                className={`ml-2 ${styles.buttonPrimary}`}
                              >
                                <Package className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : buscaCatalogo.length >= 2 ? (
                        <p className="text-center text-gray-500 py-4">
                          Nenhum item encontrado
                        </p>
                      ) : (
                        <p className="text-center text-gray-400 py-4">
                          Digite para buscar...
                        </p>
                      )}
                    </div>
                  )}

                  {/* KITS */}
                  {fonteSelecionada === "kits" && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h3 className="text-[18px] font-normal text-gray-900 mb-3 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-600" />
                        Kits de Materiais
                      </h3>

                      {loadingKits ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        </div>
                      ) : kits.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                          {kits.map((kit) => (
                            <div
                              key={kit.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-purple-200 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">
                                  {kit.nome}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                    {kit.codigo}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {kit.disciplina}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => adicionarItensDoKit(kit.id)}
                                className="ml-2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                              >
                                <Package className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">
                          Nenhum kit encontrado
                        </p>
                      )}
                    </div>
                  )}

                  {/* AUTOMÁTICO */}
                  {fonteSelecionada === "automatico" && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
                      <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-[18px] font-normal text-gray-900 mb-2">
                        Cálculo Automático
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Calcule materiais automaticamente com base na análise de
                        projeto.
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/planejamento/orcamentos/materiais?analise=${clienteSelecionado?.analise_id}`
                          )
                        }
                        className="px-6 py-3 bg-primary text-white rounded-xl font-normal hover:bg-primary-dark"
                      >
                        Ir para Cálculo Automático
                      </button>
                    </div>
                  )}

                  {/* IMPORTAR */}
                  {fonteSelecionada === "importar" && (
                    <div className="space-y-4">
                      {/* BotÍo para colar orçamento */}
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ClipboardPaste className="w-6 h-6 text-wg-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[18px] font-normal text-gray-900 mb-1">
                              Colar Orçamento de Fornecedor
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Cole o texto do orçamento (GDSUL, MARACA, ZONA SUL, SALVABRAS, etc.)
                              e extraia automaticamente os dados para cadastrar no pricelist.
                            </p>
                            <button
                              type="button"
                              onClick={() => setModalImportarOrcamento(true)}
                              className="px-4 py-2 bg-wg-primary text-white rounded-lg font-medium hover:bg-wg-primary/90 transition-colors flex items-center gap-2"
                            >
                              <ClipboardPaste className="w-4 h-4" />
                              Colar Orçamento
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Importar PDF (funcionalidade existente) */}
                      <ImportarPedidoFornecedor
                        onImportarItens={(itensImportados) => {
                          // Adicionar itens importados ao pedido
                          setItensPedido((prev) => [
                            ...prev,
                            ...itensImportados.map((item) => ({
                              ...item,
                              id: `imp_${Date.now()}_${Math.random()
                                .toString(36)
                                .substr(2, 9)}`,
                            })),
                          ]);
                          toast({
                            title: "Itens importados!",
                            description: `${itensImportados.length} itens adicionados ao pedido.`,
                          });
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Coluna direita: Itens do Pedido */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-[18px] font-normal text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                      Itens do Pedido
                      <span className="text-sm font-normal text-gray-500">
                        ({itensPedido.length} itens)
                      </span>
                    </h3>
                  </div>

                  {itensPedido.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm">Nenhum item adicionado</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Use as opções ao lado para adicionar
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
                        {itensPedido.map((item) => (
                          <ItemMaterialCard
                            key={item.id}
                            item={item}
                            onAjustarQuantidade={ajustarQuantidade}
                            onDefinirQuantidade={definirQuantidade}
                            onRemover={removerItem}
                            mostrarOrigem={true}
                            compacto={true}
                          />
                        ))}
                      </div>
                      <div className="p-4 border-t border-gray-200">
                        <ResumoTotais
                          totalItens={totais.totalItens}
                          totalQuantidade={totais.totalQuantidade}
                          valorTotal={totais.valorTotal}
                          compacto={true}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========== PASSO 3: REVISAR ========== */}
          {passoAtual === 3 && (
            <div className="p-6">
              <h2 className="text-[18px] font-normal text-gray-900 mb-4">
                Revisar Pedido
              </h2>

              <div className="mb-6">
                <ResumoTotais
                  totalItens={totais.totalItens}
                  totalQuantidade={totais.totalQuantidade}
                  valorTotal={totais.valorTotal}
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-[18px] font-normal text-gray-900">
                    Lista de Materiais
                  </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                  {itensPedido
                    .filter((i) => i.quantidade > 0)
                    .map((item) => (
                      <div key={item.id} className="p-4">
                        <ItemMaterialCard
                          item={item}
                          onAjustarQuantidade={ajustarQuantidade}
                          onDefinirQuantidade={definirQuantidade}
                          onRemover={removerItem}
                          mostrarOrigem={true}
                          mostrarAmbientes={true}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== PASSO 4: ENVIAR ========== */}
          {passoAtual === 4 && (
            <div className="p-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">
                  Finalizar Pedido
                </h2>
                <p className="text-gray-600 mb-8">
                  Revise as informações e confirme o envio do orçamento.
                </p>

                {/* Resumo final */}
                <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-6 mb-8 text-left">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium text-gray-900">
                        {clienteSelecionado?.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Itens:</span>
                      <span className="font-medium text-gray-900">
                        {totais.totalItens}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3">
                      <span className="text-gray-600">Valor Total:</span>
                      <span className="text-xl font-normal text-green-600">
                        {formatarMoeda(totais.valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => salvarOrcamento("rascunho")}
                    disabled={enviando}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-normal hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                  >
                    {enviando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Salvar Rascunho
                  </button>
                  <button
                    type="button"
                    onClick={() => salvarOrcamento("enviado")}
                    disabled={enviando}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-normal hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {enviando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    Enviar para AprovaçÍo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer com navegaçÍo */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={voltarPasso}
              disabled={passoAtual === 1}
              className={
                styles.buttonSecondary +
                " disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              }
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            {passoAtual < 4 && (
              <button
                type="button"
                onClick={avancarPasso}
                className={styles.buttonPrimary + " flex items-center gap-2"}
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      {/* Modal de ImportaçÍo de Orçamento de Fornecedor */}
      <ImportarOrcamentoFornecedorModal
        open={modalImportarOrcamento}
        onClose={() => setModalImportarOrcamento(false)}
        onImportar={(itensImportados, fornecedorId) => {
          // Converter itens para o formato esperado
          const novosItens: ItemMaterial[] = itensImportados.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            classificacao: "INSUMO",
            quantidade: item.quantidade,
            unidade: item.unidade,
            preco_unitario: item.precoUnitario,
            valor_total: item.valorTotal,
            origem: "importado",
            pricelist_item_id: item.pricelistItemId,
          }));

          setItensPedido((prev) => [...prev, ...novosItens]);
          toast({
            title: "Itens importados!",
            description: `${novosItens.length} itens adicionados ao pedido.`,
          });
        }}
      />
    </div>
  );
}


