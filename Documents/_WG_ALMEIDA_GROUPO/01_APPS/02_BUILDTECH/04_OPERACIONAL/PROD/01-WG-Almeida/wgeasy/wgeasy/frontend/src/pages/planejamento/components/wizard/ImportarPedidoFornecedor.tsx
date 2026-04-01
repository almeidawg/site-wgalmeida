/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// IMPORTAR PEDIDO DE FORNECEDOR - Componente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  parsePedidoPDF,
  buscarMatchesPricelist,
  buscarOuCadastrarFornecedor,
  importarPedidoCompleto,
  converterParaItensPedido,
} from "@/lib/importacaoPedidoService";
import type {
  PedidoImportado,
  ItemPedidoImportado,
  ItemProcessado,
} from "@/types/importacaoPedido";
import { formatarCNPJ } from "@/types/importacaoPedido";
import type { ItemMaterial } from "../shared/ItemMaterialCard";

interface ImportarPedidoFornecedorProps {
  onImportarItens: (itens: ItemMaterial[]) => void;
}

type EtapaImportacao =
  | "upload"
  | "processando"
  | "revisao"
  | "importando"
  | "concluido";

export default function ImportarPedidoFornecedor({
  onImportarItens,
}: ImportarPedidoFornecedorProps) {
  const { toast } = useToast();

  // Estados
  const [etapa, setEtapa] = useState<EtapaImportacao>("upload");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [pedido, setPedido] = useState<PedidoImportado | null>(null);
  const [itensProcessados, setItensProcessados] = useState<ItemProcessado[]>(
    []
  );
  const [erros, setErros] = useState<string[]>([]);
  const [expandirDetalhes, setExpandirDetalhes] = useState(false);

  // Opções de importaçÍo
  const [opcoes, setOpcoes] = useState({
    cadastrarFornecedor: true,
    cadastrarItensNovos: true,
    atualizarPrecos: false,
  });

  // Itens selecionados para importaçÍo
  const [itensSelecionados, setItensSelecionados] = useState<Set<number>>(
    new Set()
  );

  // ============================================================
  // HANDLERS
  // ============================================================

  /**
   * Handler para upload de arquivo
   */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Verificar tipo de arquivo
      if (file.type !== "application/pdf") {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive",
        });
        return;
      }

      setArquivo(file);
      setEtapa("processando");
      setErros([]);

      try {
        // Ler conteúdo do PDF
        const texto = await extrairTextoPDF(file);

        // Parsear o PDF
        const resultado = parsePedidoPDF(texto);

        if (!resultado.sucesso || !resultado.pedido) {
          setErros(resultado.erros || ["Erro ao processar o arquivo"]);
          setEtapa("upload");
          return;
        }

        // Buscar matches no pricelist
        const itensComMatch = await buscarMatchesPricelist(
          resultado.pedido.itens
        );

        // Atualizar pedido com itens processados
        const pedidoAtualizado = {
          ...resultado.pedido,
          itens: itensComMatch,
        };

        setPedido(pedidoAtualizado);
        setItensProcessados(
          itensComMatch.map((item) => ({
            ...item,
            status_processamento: "pendente" as const,
            cadastrar_pricelist: item.status_match === "nao_encontrado",
          }))
        );

        // Selecionar todos os itens por padrÍo
        setItensSelecionados(
          new Set(itensComMatch.map((_, index) => index))
        );

        setEtapa("revisao");

        // Mostrar avisos se houver
        if (resultado.avisos && resultado.avisos.length > 0) {
          toast({
            title: "AtençÍo",
            description: resultado.avisos.join(", "),
          });
        }
      } catch (error: any) {
        console.error("Erro ao processar PDF:", error);
        setErros([error.message || "Erro ao processar o arquivo"]);
        setEtapa("upload");
      }
    },
    [toast]
  );

  /**
   * Extrai texto do PDF usando pdf.js
   */
  async function extrairTextoPDF(file: File): Promise<string> {
    // Usar FileReader para ler como texto
    // Na prática, você usaria uma biblioteca como pdf.js
    // Por ora, simulamos com um parser básico

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Tentar extrair texto básico do PDF
          // Em produçÍo, usar pdf.js ou similar
          const uint8Array = new Uint8Array(arrayBuffer);
          let texto = "";

          // Buscar streams de texto no PDF (método simplificado)
          const pdfString = new TextDecoder("latin1").decode(uint8Array);

          // Extrair texto entre parênteses (comum em PDFs)
          const matches = pdfString.match(/\(([^)]+)\)/g) || [];
          texto = matches
            .map((m) => m.slice(1, -1))
            .join(" ")
            .replace(/\\n/g, "\n")
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")");

          // Se nÍo conseguiu extrair, tentar outro método
          if (texto.length < 100) {
            // Extrair texto de streams BT...ET
            const btMatches =
              pdfString.match(/BT[\s\S]*?ET/g) || [];
            texto = btMatches
              .map((bt) => {
                const tjMatches = bt.match(/\[([^\]]+)\]\s*TJ/g) || [];
                return tjMatches
                  .map((tj) => {
                    const parts = tj.match(/\(([^)]*)\)/g) || [];
                    return parts.map((p) => p.slice(1, -1)).join("");
                  })
                  .join(" ");
              })
              .join("\n");
          }

          resolve(texto);
        } catch (err) {
          reject(new Error("NÍo foi possível extrair texto do PDF"));
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Toggle seleçÍo de item
   */
  const toggleItemSelecionado = (index: number) => {
    const novos = new Set(itensSelecionados);
    if (novos.has(index)) {
      novos.delete(index);
    } else {
      novos.add(index);
    }
    setItensSelecionados(novos);
  };

  /**
   * Selecionar/desselecionar todos
   */
  const toggleTodos = () => {
    if (itensSelecionados.size === itensProcessados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(
        new Set(itensProcessados.map((_, i) => i))
      );
    }
  };

  /**
   * Confirmar importaçÍo
   */
  const confirmarImportacao = async () => {
    if (!pedido) return;

    setEtapa("importando");

    try {
      // Filtrar apenas itens selecionados
      const itensSelecionadosArray = itensProcessados.filter((_, i) =>
        itensSelecionados.has(i)
      );

      // Importar para o pricelist se configurado
      if (opcoes.cadastrarItensNovos || opcoes.atualizarPrecos) {
        const resultado = await importarPedidoCompleto(
          pedido,
          itensSelecionadosArray,
          opcoes
        );

        if (resultado.erros.length > 0) {
          toast({
            title: "ImportaçÍo parcial",
            description: `${resultado.erros.length} erros encontrados`,
            variant: "destructive",
          });
        }

        if (resultado.itensCadastrados > 0) {
          toast({
            title: "Pricelist atualizado",
            description: `${resultado.itensCadastrados} novos itens cadastrados`,
          });
        }

        if (resultado.fornecedorNovo) {
          toast({
            title: "Fornecedor cadastrado",
            description: pedido.fornecedor.nome,
          });
        }
      }

      // Converter para formato do pedido
      const itensParaPedido = converterParaItensPedido(itensSelecionadosArray);

      // Enviar para o componente pai
      onImportarItens(itensParaPedido as ItemMaterial[]);

      setEtapa("concluido");

      toast({
        title: "ImportaçÍo concluída!",
        description: `${itensSelecionadosArray.length} itens importados para o pedido.`,
      });

      // Resetar após 2 segundos
      setTimeout(() => {
        resetar();
      }, 2000);
    } catch (error: any) {
      console.error("Erro na importaçÍo:", error);
      toast({
        title: "Erro na importaçÍo",
        description: error.message,
        variant: "destructive",
      });
      setEtapa("revisao");
    }
  };

  /**
   * Resetar componente
   */
  const resetar = () => {
    setEtapa("upload");
    setArquivo(null);
    setPedido(null);
    setItensProcessados([]);
    setErros([]);
    setItensSelecionados(new Set());
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Etapa: Upload
  if (etapa === "upload") {
    return (
      <div className="space-y-4">
        {/* Área de upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-normal text-gray-900 mb-2">
              Importar Pedido de Fornecedor
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Arraste um PDF ou clique para selecionar
            </p>
            <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Selecionar PDF
            </span>
          </label>
        </div>

        {/* Erros */}
        {erros.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Erro na importaçÍo</p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  {erros.map((erro, i) => (
                    <li key={i}>{erro}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Dica */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
          <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">PDFs suportados:</p>
            <ul className="list-disc list-inside text-blue-600">
              <li>Pedidos de compra de fornecedores (ex: GDSUL)</li>
              <li>Notas de venda de distribuidores</li>
              <li>Orçamentos de materiais</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Etapa: Processando
  if (etapa === "processando") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Processando PDF...</p>
        <p className="text-sm text-gray-400 mt-1">
          Extraindo dados do pedido
        </p>
      </div>
    );
  }

  // Etapa: RevisÍo
  if ((etapa === "revisao" || etapa === "importando") && pedido) {
    return (
      <div className="space-y-4">
        {/* Header com info do pedido */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-normal text-gray-900">
                  Pedido #{pedido.numero_sequencia}
                </h3>
                <p className="text-sm text-gray-500">
                  {pedido.data_pedido
                    ? new Date(pedido.data_pedido).toLocaleDateString("pt-BR")
                    : "Data nÍo identificada"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetar}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Detalhes expansíveis */}
          <button
            type="button"
            onClick={() => setExpandirDetalhes(!expandirDetalhes)}
            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
          >
            {expandirDetalhes ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {expandirDetalhes ? "Ocultar detalhes" : "Ver detalhes"}
          </button>

          {expandirDetalhes && (
            <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Fornecedor */}
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Fornecedor</p>
                  <p className="font-medium text-gray-900">
                    {pedido.fornecedor.nome}
                  </p>
                  {pedido.fornecedor.cnpj && (
                    <p className="text-xs text-gray-400">
                      {formatarCNPJ(pedido.fornecedor.cnpj)}
                    </p>
                  )}
                </div>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium text-gray-900">
                    {pedido.cliente.nome}
                  </p>
                </div>
              </div>

              {/* Totais */}
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Valor Total</p>
                  <p className="font-normal text-green-600">
                    {pedido.pagamento.valor_total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  {pedido.pagamento.valor_frete > 0 && (
                    <p className="text-xs text-gray-400">
                      + Frete:{" "}
                      {pedido.pagamento.valor_frete.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Pagamento */}
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Forma de Pagamento</p>
                  <p className="font-medium text-gray-900">
                    {pedido.pagamento.forma}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Opções de importaçÍo */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="font-medium text-gray-700 text-sm">
            Opções de importaçÍo:
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={opcoes.cadastrarFornecedor}
                onChange={(e) =>
                  setOpcoes({ ...opcoes, cadastrarFornecedor: e.target.checked })
                }
                className="rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm text-gray-600">
                Cadastrar fornecedor se nÍo existir
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={opcoes.cadastrarItensNovos}
                onChange={(e) =>
                  setOpcoes({ ...opcoes, cadastrarItensNovos: e.target.checked })
                }
                className="rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm text-gray-600">
                Cadastrar itens novos no pricelist
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={opcoes.atualizarPrecos}
                onChange={(e) =>
                  setOpcoes({ ...opcoes, atualizarPrecos: e.target.checked })
                }
                className="rounded border-gray-300 text-purple-600"
              />
              <span className="text-sm text-gray-600">
                Atualizar preços de itens existentes
              </span>
            </label>
          </div>
        </div>

        {/* Lista de itens */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTodos}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {itensSelecionados.size === itensProcessados.length ? (
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                )}
              </button>
              <span className="font-medium text-gray-700">
                {itensProcessados.length} itens encontrados
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {itensSelecionados.size} selecionados
            </span>
          </div>

          <div className="max-h-[300px] overflow-y-auto divide-y">
            {itensProcessados.map((item, index) => (
              <div
                key={index}
                className={`p-3 flex items-start gap-3 hover:bg-gray-50 ${
                  !itensSelecionados.has(index) ? "opacity-50" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItemSelecionado(index)}
                  className="mt-1"
                >
                  {itensSelecionados.has(index) ? (
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {item.descricao}
                      </p>
                      <p className="text-xs text-gray-500">
                        Cód: {item.codigo_fornecedor} • {item.quantidade}{" "}
                        {item.unidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 text-sm">
                        {item.valor_total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.preco_unitario.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}{" "}
                        /un
                      </p>
                    </div>
                  </div>

                  {/* Status do match */}
                  <div className="mt-2 flex items-center gap-2">
                    {item.status_match === "encontrado" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        <Check className="w-3 h-3" />
                        No catálogo
                      </span>
                    )}
                    {item.status_match === "similar" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                        <RefreshCw className="w-3 h-3" />
                        Similar: {item.pricelist_match?.nome}
                      </span>
                    )}
                    {item.status_match === "nao_encontrado" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        <Plus className="w-3 h-3" />
                        Novo item
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botões de açÍo */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={resetar} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={confirmarImportacao}
            disabled={itensSelecionados.size === 0 || etapa === "importando"}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
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
        </div>
      </div>
    );
  }

  // Etapa: Concluído
  if (etapa === "concluido") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-gray-900 font-normal mb-2">
          ImportaçÍo concluída!
        </p>
        <p className="text-sm text-gray-500">
          Os itens foram adicionados ao seu pedido.
        </p>
      </div>
    );
  }

  return null;
}


