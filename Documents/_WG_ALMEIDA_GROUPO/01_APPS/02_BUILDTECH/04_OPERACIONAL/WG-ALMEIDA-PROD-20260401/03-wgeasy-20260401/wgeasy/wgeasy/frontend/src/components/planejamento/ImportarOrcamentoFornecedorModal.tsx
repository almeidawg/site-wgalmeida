/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// MODAL: Importar Orçamento de Fornecedor
// Sistema WG Easy - Grupo WG Almeida
// Cole texto de orçamento e extraia dados automaticamente
// ============================================================

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Building2,
  Truck,
  DollarSign,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Tag,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  parseOrcamentoFornecedor,
  OrcamentoExtraido,
  ItemOrcamento,
  MAPA_CATEGORIAS_FORNECEDOR,
  formatarCNPJ,
  normalizarUnidade,
} from "@/lib/orcamentoFornecedorParser";
import { supabase } from "@/lib/supabaseClient";

// Cores WG
const WG_ORANGE = "#F25C26";

interface ImportarOrcamentoFornecedorModalProps {
  open: boolean;
  onClose: () => void;
  onImportar: (itens: ItemImportado[], fornecedorId?: string) => void;
}

export interface ItemImportado {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  cadastrarPricelist: boolean;
  pricelistItemId?: string;
  statusMatch: "encontrado" | "similar" | "nao_encontrado";
}

type Etapa = "colar" | "processando" | "revisar" | "importando" | "concluido";

export default function ImportarOrcamentoFornecedorModal({
  open,
  onClose,
  onImportar,
}: ImportarOrcamentoFornecedorModalProps) {
  const { toast } = useToast();

  // Estados
  const [etapa, setEtapa] = useState<Etapa>("colar");
  const [textoOrcamento, setTextoOrcamento] = useState("");
  const [orcamento, setOrcamento] = useState<OrcamentoExtraido | null>(null);
  const [itensProcessados, setItensProcessados] = useState<ItemImportado[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<Set<number>>(new Set());
  const [expandirDetalhes, setExpandirDetalhes] = useState(false);

  // Opções de importaçÍo
  const [opcoes, setOpcoes] = useState({
    cadastrarFornecedor: true,
    cadastrarItensNovos: true,
    atualizarPrecos: false,
  });

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setEtapa("colar");
      setTextoOrcamento("");
      setOrcamento(null);
      setItensProcessados([]);
      setItensSelecionados(new Set());
    }
  }, [open]);

  // Colar da área de transferência
  const handleColar = async () => {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto) {
        setTextoOrcamento(texto);
      }
    } catch (err) {
      console.warn("não foi possível acessar a área de transferência");
    }
  };

  // Processar orçamento
  const handleProcessar = async () => {
    if (!textoOrcamento.trim()) return;

    setEtapa("processando");

    try {
      // Parse do texto
      const resultado = parseOrcamentoFornecedor(textoOrcamento);
      setOrcamento(resultado);

      // Buscar matches no pricelist
      const itensComMatch = await buscarMatchesPricelist(resultado.itens);
      setItensProcessados(itensComMatch);

      // Selecionar todos por padrÍo
      setItensSelecionados(new Set(itensComMatch.map((_, i) => i)));

      setEtapa("revisar");

      if (resultado.confianca < 50) {
        toast({
          title: "AtençÍo",
          description: "Alguns dados podem não ter sido extraídos corretamente. Por favor, revise.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao processar orçamento:", error);
      toast({
        title: "Erro ao processar",
        description: error.message || "não foi possível extrair os dados do orçamento",
        variant: "destructive",
      });
      setEtapa("colar");
    }
  };

  // Buscar matches no pricelist
  async function buscarMatchesPricelist(itens: ItemOrcamento[]): Promise<ItemImportado[]> {
    const { data: pricelistItens } = await supabase
      .from("pricelist_itens")
      .select("id, nome, descricao, codigo, unidade, preco")
      .eq("tipo", "material")
      .eq("ativo", true)
      .limit(5000);

    return itens.map((item, index) => {
      let melhorMatch: { id: string; nome: string; similaridade: number } | null = null;
      let maiorSimilaridade = 0;

      if (pricelistItens) {
        for (const plItem of pricelistItens) {
          // Comparar descrições
          const simNome = calcularSimilaridade(item.descricao, plItem.nome);
          const simCodigo = item.codigo && plItem.codigo === item.codigo ? 100 : 0;
          const similaridade = Math.max(simNome, simCodigo);

          if (similaridade > maiorSimilaridade && similaridade >= 50) {
            maiorSimilaridade = similaridade;
            melhorMatch = { id: plItem.id, nome: plItem.nome, similaridade };
          }
        }
      }

      let statusMatch: ItemImportado["statusMatch"] = "nao_encontrado";
      if (maiorSimilaridade >= 90) statusMatch = "encontrado";
      else if (maiorSimilaridade >= 50) statusMatch = "similar";

      return {
        id: `item_${Date.now()}_${index}`,
        codigo: item.codigo,
        descricao: item.descricao,
        unidade: normalizarUnidade(item.unidade),
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        valorTotal: item.valorTotal,
        cadastrarPricelist: statusMatch === "nao_encontrado",
        pricelistItemId: statusMatch === "encontrado" ? melhorMatch?.id : undefined,
        statusMatch,
      };
    });
  }

  // Calcular similaridade entre strings
  function calcularSimilaridade(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.round((Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 100);
    }
    const palavras1 = s1.split(/\s+/).filter(p => p.length > 2);
    const palavras2 = s2.split(/\s+/).filter(p => p.length > 2);
    let matches = 0;
    for (const p1 of palavras1) {
      if (palavras2.some(p2 => p1 === p2 || p1.includes(p2) || p2.includes(p1))) matches++;
    }
    return Math.round((matches / Math.max(palavras1.length, palavras2.length)) * 100) || 0;
  }

  // Toggle seleçÍo de item
  const toggleItemSelecionado = (index: number) => {
    const novos = new Set(itensSelecionados);
    if (novos.has(index)) novos.delete(index);
    else novos.add(index);
    setItensSelecionados(novos);
  };

  // Selecionar/desselecionar todos
  const toggleTodos = () => {
    if (itensSelecionados.size === itensProcessados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(new Set(itensProcessados.map((_, i) => i)));
    }
  };

  // Confirmar importaçÍo
  const handleConfirmar = async () => {
    if (!orcamento) return;

    setEtapa("importando");

    try {
      let fornecedorId: string | undefined;

      // Cadastrar/buscar fornecedor
      if (opcoes.cadastrarFornecedor && orcamento.fornecedor.cnpj) {
        fornecedorId = await buscarOuCadastrarFornecedor();
      }

      // Cadastrar itens novos no pricelist
      if (opcoes.cadastrarItensNovos) {
        await cadastrarItensNoPricelist(fornecedorId);
      }

      // Filtrar itens selecionados
      const itensSelecionadosArray = itensProcessados.filter((_, i) => itensSelecionados.has(i));

      // Callback para o componente pai
      onImportar(itensSelecionadosArray, fornecedorId);

      setEtapa("concluido");

      toast({
        title: "ImportaçÍo concluída!",
        description: `${itensSelecionadosArray.length} itens importados.`,
      });

      // Fechar após 1.5s
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Erro na importaçÍo:", error);
      toast({
        title: "Erro na importaçÍo",
        description: error.message,
        variant: "destructive",
      });
      setEtapa("revisar");
    }
  };

  // Buscar ou cadastrar fornecedor
  async function buscarOuCadastrarFornecedor(): Promise<string | undefined> {
    if (!orcamento?.fornecedor.cnpj) return undefined;

    const cnpjLimpo = orcamento.fornecedor.cnpj.replace(/\D/g, "");

    // Buscar existente
    const { data: existente } = await supabase
      .from("pessoas")
      .select("id")
      .eq("cnpj", cnpjLimpo)
      .eq("tipo", "FORNECEDOR")
      .single();

    if (existente) {
      return existente.id;
    }

    // Cadastrar novo
    const { data: novo, error } = await supabase
      .from("pessoas")
      .insert({
        nome: orcamento.fornecedor.nome,
        cnpj: cnpjLimpo,
        tipo: "FORNECEDOR",
        telefone: orcamento.fornecedor.telefone,
        endereco: orcamento.fornecedor.endereco,
        email: orcamento.fornecedor.email,
        ativo: true,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Vincular categoria se detectada
    if (novo && orcamento.fornecedor.categoriaDetectada) {
      // Buscar ou criar categoria
      const { data: categoriaExistente } = await supabase
        .from("fornecedor_categorias")
        .select("id")
        .eq("codigo", orcamento.fornecedor.categoriaDetectada.codigo)
        .single();

      let categoriaId = categoriaExistente?.id;

      if (!categoriaId) {
        const { data: novaCategoria } = await supabase
          .from("fornecedor_categorias")
          .insert({
            codigo: orcamento.fornecedor.categoriaDetectada.codigo,
            nome: orcamento.fornecedor.categoriaDetectada.nome,
            icone: orcamento.fornecedor.categoriaDetectada.icone,
            ativo: true,
          })
          .select("id")
          .single();
        categoriaId = novaCategoria?.id;
      }

      if (categoriaId) {
        await supabase.from("fornecedor_categoria_vinculo").insert({
          fornecedor_id: novo.id,
          categoria_id: categoriaId,
          principal: true,
        });
      }
    }

    toast({
      title: "Fornecedor cadastrado",
      description: orcamento.fornecedor.nome,
    });

    return novo?.id;
  }

  // Cadastrar itens no pricelist
  async function cadastrarItensNoPricelist(fornecedorId?: string) {
    const itensParaCadastrar = itensProcessados.filter(
      (item, i) => itensSelecionados.has(i) && item.cadastrarPricelist && item.statusMatch === "nao_encontrado"
    );

    if (itensParaCadastrar.length === 0) return;

    // Buscar ou criar categoria no pricelist baseada na categoria do fornecedor
    let categoriaId: string | null = null;
    if (orcamento?.fornecedor.categoriaDetectada) {
      const { data: catExistente } = await supabase
        .from("pricelist_categorias")
        .select("id")
        .eq("nome", orcamento.fornecedor.categoriaDetectada.nome)
        .eq("tipo", "material")
        .single();

      if (catExistente) {
        categoriaId = catExistente.id;
      } else {
        const { data: novaCat } = await supabase
          .from("pricelist_categorias")
          .insert({
            nome: orcamento.fornecedor.categoriaDetectada.nome,
            tipo: "material",
            ativo: true,
          })
          .select("id")
          .single();
        categoriaId = novaCat?.id || null;
      }
    }

    // Cadastrar itens
    const itensInsert = itensParaCadastrar.map((item) => ({
      nome: item.descricao,
      codigo: item.codigo || null,
      tipo: "material",
      unidade: item.unidade,
      preco: item.precoUnitario,
      fornecedor_id: fornecedorId || null,
      categoria_id: categoriaId,
      ativo: true,
    }));

    const { error } = await supabase.from("pricelist_itens").insert(itensInsert);

    if (error) {
      console.error("Erro ao cadastrar itens:", error);
    } else {
      toast({
        title: "Pricelist atualizado",
        description: `${itensParaCadastrar.length} novos itens cadastrados`,
      });
    }
  }

  // Indicador de confiança
  const renderConfianca = (confianca: number) => {
    const cor = confianca >= 80 ? "text-green-600" : confianca >= 50 ? "text-yellow-600" : "text-red-600";
    const Icone = confianca >= 80 ? CheckCircle2 : AlertCircle;

    return (
      <div className={`flex items-center gap-1.5 ${cor}`}>
        <Icone className="w-4 h-4" />
        <span className="text-sm font-medium">{confianca}% confiança</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" style={{ color: WG_ORANGE }} />
            Importar Orçamento de Fornecedor
          </DialogTitle>
        </DialogHeader>

        {/* ETAPA 1: Colar texto */}
        {etapa === "colar" && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Como usar:</strong> Copie o texto do orçamento do fornecedor (PDF, email, etc.)
                e cole aqui. O sistema vai extrair automaticamente os dados e cadastrar no pricelist.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Texto do Orçamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleColar} className="gap-1.5">
                  <ClipboardPaste className="w-4 h-4" />
                  Colar
                </Button>
              </div>
              <Textarea
                placeholder="Cole aqui o texto do orçamento do fornecedor (GDSUL, MARACA, ZONA SUL, etc.)..."
                value={textoOrcamento}
                onChange={(e) => setTextoOrcamento(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {/* Formatos suportados */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Formatos detectados automaticamente:</p>
              <div className="flex flex-wrap gap-2">
                {["GDSUL", "MARACA", "ZONA SUL", "OTIMIZI", "SALVABRAS", "MOLDURAMA"].map((f) => (
                  <span key={f} className="px-2 py-1 bg-white border rounded text-xs font-medium text-gray-600">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleProcessar}
                disabled={!textoOrcamento.trim()}
                style={{ backgroundColor: WG_ORANGE }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Extrair Dados
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ETAPA 2: Processando */}
        {etapa === "processando" && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: WG_ORANGE }} />
            <p className="text-gray-600 font-medium">Processando orçamento...</p>
            <p className="text-sm text-gray-400 mt-1">Extraindo dados e buscando no pricelist</p>
          </div>
        )}

        {/* ETAPA 3: Revisar dados */}
        {(etapa === "revisar" || etapa === "importando") && orcamento && (
          <div className="space-y-4">
            {/* Header com info do fornecedor */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Building2 className="w-6 h-6" style={{ color: WG_ORANGE }} />
                  </div>
                  <div>
                    <h3 className="font-normal text-gray-900">{orcamento.fornecedor.nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                        {orcamento.formato}
                      </span>
                      {orcamento.fornecedor.categoriaDetectada && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {orcamento.fornecedor.categoriaDetectada.nome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {renderConfianca(orcamento.confianca)}
              </div>

              {/* Detalhes expansíveis */}
              <button
                type="button"
                onClick={() => setExpandirDetalhes(!expandirDetalhes)}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
              >
                {expandirDetalhes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expandirDetalhes ? "Ocultar detalhes" : "Ver detalhes do fornecedor"}
              </button>

              {expandirDetalhes && (
                <div className="mt-3 pt-3 border-t border-orange-200 grid grid-cols-2 gap-3 text-sm">
                  {orcamento.fornecedor.cnpj && (
                    <div>
                      <p className="text-gray-500">CNPJ</p>
                      <p className="font-medium">{formatarCNPJ(orcamento.fornecedor.cnpj)}</p>
                    </div>
                  )}
                  {orcamento.fornecedor.telefone && (
                    <div>
                      <p className="text-gray-500">Telefone</p>
                      <p className="font-medium">{orcamento.fornecedor.telefone}</p>
                    </div>
                  )}
                  {orcamento.numero && (
                    <div>
                      <p className="text-gray-500">Nº Orçamento</p>
                      <p className="font-medium">{orcamento.numero}</p>
                    </div>
                  )}
                  {orcamento.formaPagamento && (
                    <div>
                      <p className="text-gray-500">Pagamento</p>
                      <p className="font-medium">{orcamento.formaPagamento}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opções de importaçÍo */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-gray-700 text-sm">Opções de importaçÍo:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opcoes.cadastrarFornecedor}
                    onCheckedChange={(checked) =>
                      setOpcoes({ ...opcoes, cadastrarFornecedor: checked as boolean })
                    }
                  />
                  <span className="text-sm text-gray-600">Cadastrar fornecedor se não existir</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opcoes.cadastrarItensNovos}
                    onCheckedChange={(checked) =>
                      setOpcoes({ ...opcoes, cadastrarItensNovos: checked as boolean })
                    }
                  />
                  <span className="text-sm text-gray-600">Cadastrar itens novos no pricelist</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={opcoes.atualizarPrecos}
                    onCheckedChange={(checked) =>
                      setOpcoes({ ...opcoes, atualizarPrecos: checked as boolean })
                    }
                  />
                  <span className="text-sm text-gray-600">Atualizar preços de itens existentes</span>
                </label>
              </div>
            </div>

            {/* Lista de itens */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={toggleTodos} className="p-1 hover:bg-gray-200 rounded">
                    {itensSelecionados.size === itensProcessados.length ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: WG_ORANGE }} />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                    )}
                  </button>
                  <span className="font-medium text-gray-700">{itensProcessados.length} itens encontrados</span>
                </div>
                <span className="text-sm text-gray-500">{itensSelecionados.size} selecionados</span>
              </div>

              <div className="max-h-[250px] overflow-y-auto divide-y">
                {itensProcessados.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-3 flex items-start gap-3 hover:bg-gray-50 ${
                      !itensSelecionados.has(index) ? "opacity-50" : ""
                    }`}
                  >
                    <button type="button" onClick={() => toggleItemSelecionado(index)} className="mt-1">
                      {itensSelecionados.has(index) ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: WG_ORANGE }} />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.descricao}</p>
                          <p className="text-xs text-gray-500">
                            {item.codigo && `Cód: ${item.codigo} • `}
                            {item.quantidade} {item.unidade}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.precoUnitario.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} /un
                          </p>
                        </div>
                      </div>

                      {/* Status do match */}
                      <div className="mt-2 flex items-center gap-2">
                        {item.statusMatch === "encontrado" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            <Check className="w-3 h-3" />
                            No catálogo
                          </span>
                        )}
                        {item.statusMatch === "similar" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                            <AlertCircle className="w-3 h-3" />
                            Similar encontrado
                          </span>
                        )}
                        {item.statusMatch === "nao_encontrado" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            <Database className="w-3 h-3" />
                            Novo item
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="bg-gray-50 px-4 py-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total</span>
                  <span className="text-xl font-normal" style={{ color: WG_ORANGE }}>
                    {orcamento.valorTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEtapa("colar")}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={itensSelecionados.size === 0 || etapa === "importando"}
                style={{ backgroundColor: WG_ORANGE }}
              >
                {etapa === "importando" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Importar {itensSelecionados.size} itens
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ETAPA 4: Concluído */}
        {etapa === "concluido" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-900 font-normal mb-2">ImportaçÍo concluída!</p>
            <p className="text-sm text-gray-500">Os itens foram adicionados ao pedido.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


