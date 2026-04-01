// ============================================================
// COMPONENTE: ItemMatcher
// Sistema WGEasy - Grupo WG Almeida
// Permite buscar e vincular itens do pricelist ou cadastrar novos
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import type { ItemPriceList } from "@/types/pricelist";

interface ItemImportado {
  ambiente: string;
  atividade: string;
  descricao: string;
  itemSugerido?: ItemPriceList;
}

interface ItemMatcherProps {
  item: ItemImportado;
  index: number;
  itensPriceList: ItemPriceList[];
  onVincular: (index: number, itemPricelist: ItemPriceList) => void;
  onCadastrar: (index: number, novoItem: ItemPriceList) => void;
}

export default function ItemMatcher({
  item,
  index,
  itensPriceList,
  onVincular,
  onCadastrar,
}: ItemMatcherProps) {
  const [mostrarBusca, setMostrarBusca] = useState(false);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState<ItemPriceList[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Estado para cadastro de novo item
  const [novoItem, setNovoItem] = useState({
    nome: item.atividade,
    descricao: item.descricao,
    categoria: "Serviços",
    tipo: "servico" as const,
    unidade: "un" as const,
    preco: 0,
  });

  // Buscar no pricelist - busca DIRETA no banco de dados
  const buscarItens = useCallback(async (termo: string) => {
    if (!termo.trim()) {
      setResultadosBusca([]);
      return;
    }

    setBuscando(true);
    const termoLimpo = termo.trim();

    try {
      // Busca direta no Supabase usando ILIKE - busca no campo nome (mais comum)
      // Sem join de núcleo (evita erro de FK)
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, codigo, nome, descricao, categoria, tipo, unidade, preco, imagem_url, nucleo_id")
        .eq("ativo", true)
        .ilike("nome", `%${termoLimpo}%`)
        .limit(20);

      if (error) {
        console.error("Erro na busca Supabase:", error);
        throw error;
      }

      // Buscar núcleos separadamente
      const enriquecerComNucleos = async (itens: any[]) => {
        if (!itens || itens.length === 0) return itens;
        const nucleoIds = [...new Set(itens.map(i => i.nucleo_id).filter(Boolean))];
        if (nucleoIds.length === 0) return itens;
        const { data: nucleos } = await supabase
          .from("nucleos")
          .select("id, nome")
          .in("id", nucleoIds);
        const nucleosMap: Record<string, any> = {};
        if (nucleos) nucleos.forEach(n => nucleosMap[n.id] = n);
        return itens.map(item => ({
          ...item,
          nucleo: item.nucleo_id ? nucleosMap[item.nucleo_id] : null
        }));
      };

      // Se encontrou resultados, usa eles
      if (data && data.length > 0) {
        console.log(`[Pricelist] Encontrados ${data.length} itens para "${termoLimpo}"`);
        const dataComNucleos = await enriquecerComNucleos(data);
        setResultadosBusca(dataComNucleos);
        return;
      }

      // Se não encontrou por nome, tenta por descriçÍo ou categoria
      const { data: data2, error: error2 } = await supabase
        .from("pricelist_itens")
        .select("id, codigo, nome, descricao, categoria, tipo, unidade, preco, imagem_url, nucleo_id")
        .eq("ativo", true)
        .or(`descricao.ilike.%${termoLimpo}%,categoria.ilike.%${termoLimpo}%,codigo.ilike.%${termoLimpo}%`)
        .limit(20);

      if (!error2 && data2 && data2.length > 0) {
        console.log(`[Pricelist] Encontrados ${data2.length} itens (descriçÍo/categoria) para "${termoLimpo}"`);
        const data2ComNucleos = await enriquecerComNucleos(data2);
        setResultadosBusca(data2ComNucleos);
        return;
      }

      // Nenhum resultado no banco
      console.log(`[Pricelist] Nenhum item encontrado no banco para "${termoLimpo}"`);

      // Fallback: buscar na lista local (já carregada em memória)
      if (itensPriceList.length > 0) {
        const termoLower = termoLimpo.toLowerCase();
        const resultadosLocal = itensPriceList.filter((pl) => {
          const nomeMatch = (pl.nome || "").toLowerCase().includes(termoLower);
          const descricaoMatch = (pl.descricao || "").toLowerCase().includes(termoLower);
          const categoriaMatch = (pl.categoria || "").toLowerCase().includes(termoLower);
          const codigoMatch = (pl.codigo || "").toLowerCase().includes(termoLower);
          return nomeMatch || descricaoMatch || categoriaMatch || codigoMatch;
        }).slice(0, 20);

        if (resultadosLocal.length > 0) {
          console.log(`[Pricelist] Encontrados ${resultadosLocal.length} itens na lista local`);
          setResultadosBusca(resultadosLocal);
          return;
        }
      }

      setResultadosBusca([]);
    } catch (err) {
      console.error("Erro na busca do pricelist:", err);

      // Fallback total: usa lista local
      const termoLower = termoLimpo.toLowerCase();
      const resultadosLocal = itensPriceList.filter((pl) => {
        const nomeMatch = (pl.nome || "").toLowerCase().includes(termoLower);
        const descricaoMatch = (pl.descricao || "").toLowerCase().includes(termoLower);
        return nomeMatch || descricaoMatch;
      }).slice(0, 20);

      setResultadosBusca(resultadosLocal);
    } finally {
      setBuscando(false);
    }
  }, [itensPriceList]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (termoBusca) {
        buscarItens(termoBusca);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [termoBusca, buscarItens]);

  // Selecionar item da busca
  function selecionarItem(itemPricelist: ItemPriceList) {
    onVincular(index, itemPricelist);
    setMostrarBusca(false);
    setTermoBusca("");
    setResultadosBusca([]);
  }

  // Cadastrar novo item
  async function cadastrarNovoItem() {
    if (!novoItem.nome.trim()) {
      alert("Informe o nome do item");
      return;
    }

    try {
      // Inserir no pricelist
      const { data, error } = await supabase
        .from("pricelist_itens")
        .insert({
          codigo: `SRV-${Date.now()}`,
          nome: novoItem.nome,
          descricao: novoItem.descricao,
          categoria: novoItem.categoria,
          tipo: novoItem.tipo,
          unidade: novoItem.unidade,
          preco: novoItem.preco,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar objeto do item para vincular
      const itemCriado: ItemPriceList = {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao || "",
        categoria: data.categoria || "Serviços",
        tipo: data.tipo || "servico",
        unidade: data.unidade || "un",
        preco: data.preco || 0,
      };

      onCadastrar(index, itemCriado);
      setMostrarCadastro(false);
      alert("Item cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar item:", error);
      alert("Erro ao cadastrar item. Verifique o console.");
    }
  }

  // Se já tem item sugerido/vinculado, mostrar apenas o status
  if (item.itemSugerido) {
    return (
      <div className="bg-white rounded-lg p-3 border border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                {item.ambiente}
              </span>
              <p className="font-normal text-gray-900">{item.atividade}</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Vinculado: {item.itemSugerido.nome}
              </span>
              <span className="text-xs text-gray-500">
                {item.itemSugerido.preco > 0 ? `R$ ${item.itemSugerido.preco.toFixed(2)}` : "Preço a definir"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setMostrarBusca(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Alterar
          </button>
        </div>

        {/* Modal de Busca (para alterar) */}
        {mostrarBusca && (
          <ModalBusca
            termoBusca={termoBusca}
            setTermoBusca={setTermoBusca}
            resultadosBusca={resultadosBusca}
            buscando={buscando}
            onSelecionar={selecionarItem}
            onFechar={() => {
              setMostrarBusca(false);
              setTermoBusca("");
              setResultadosBusca([]);
            }}
          />
        )}
      </div>
    );
  }

  // Se não tem item sugerido, mostrar opções de buscar ou cadastrar
  return (
    <div className="bg-white rounded-lg p-3 border border-orange-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
              {item.ambiente}
            </span>
            <p className="font-normal text-gray-900">{item.atividade}</p>
          </div>
          <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>
        </div>
        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded whitespace-nowrap">
          não encontrado
        </span>
      </div>

      {/* Botões de açÍo */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => setMostrarBusca(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Buscar no Pricelist
        </button>
        <button
          onClick={() => setMostrarCadastro(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cadastrar Novo Item
        </button>
      </div>

      {/* Modal de Busca */}
      {mostrarBusca && (
        <ModalBusca
          termoBusca={termoBusca}
          setTermoBusca={setTermoBusca}
          resultadosBusca={resultadosBusca}
          buscando={buscando}
          onSelecionar={selecionarItem}
          onFechar={() => {
            setMostrarBusca(false);
            setTermoBusca("");
            setResultadosBusca([]);
          }}
        />
      )}

      {/* Modal de Cadastro */}
      {mostrarCadastro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-normal text-gray-900">Cadastrar Novo Item</h3>
              <button
                onClick={() => setMostrarCadastro(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item *</label>
                <input
                  type="text"
                  value={novoItem.nome}
                  onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  placeholder="Ex: Pintura de parede"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo</label>
                <textarea
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  rows={2}
                  placeholder="DescriçÍo detalhada do item"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={novoItem.categoria}
                    onChange={(e) => setNovoItem({ ...novoItem, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  >
                    <option value="Serviços">Serviços</option>
                    <option value="Materiais">Materiais</option>
                    <option value="MÍo de Obra">MÍo de Obra</option>
                    <option value="Produtos">Produtos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={novoItem.unidade}
                    onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="m2">Metro² (m²)</option>
                    <option value="ml">Metro Linear (ml)</option>
                    <option value="diaria">Diária</option>
                    <option value="hora">Hora</option>
                    <option value="empreita">Empreita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoItem.preco}
                  onChange={(e) => setNovoItem({ ...novoItem, preco: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Deixe 0 se o preço for definido depois</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setMostrarCadastro(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={cadastrarNovoItem}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
              >
                Cadastrar e Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar: Modal de Busca
interface ModalBuscaProps {
  termoBusca: string;
  setTermoBusca: (termo: string) => void;
  resultadosBusca: ItemPriceList[];
  buscando: boolean;
  onSelecionar: (item: ItemPriceList) => void;
  onFechar: () => void;
}

function ModalBusca({
  termoBusca,
  setTermoBusca,
  resultadosBusca,
  buscando,
  onSelecionar,
  onFechar,
}: ModalBuscaProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-normal text-gray-900">Buscar no Pricelist</h3>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Campo de busca */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
            placeholder="Digite o nome do item..."
            autoFocus
          />
        </div>

        {/* Resultados */}
        <div className="max-h-64 overflow-y-auto">
          {buscando && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!buscando && termoBusca && resultadosBusca.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">Nenhum item encontrado para "{termoBusca}"</p>
              <p className="text-xs mt-2 text-gray-400">
                O item pode não estar cadastrado no Pricelist.
              </p>
              <p className="text-xs mt-1 text-blue-600">
                Feche esta janela e clique em "Cadastrar Novo Item" para adicionar.
              </p>
              <p className="text-xs mt-3 text-gray-400 border-t pt-3">
                💡 Dica: tente termos mais curtos (ex: "pint" ao invés de "pintura")
              </p>
            </div>
          )}

          {!buscando && resultadosBusca.length > 0 && (
            <div className="space-y-2">
              {resultadosBusca.map((itemPl) => (
                <button
                  key={itemPl.id}
                  onClick={() => onSelecionar(itemPl)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-[#F25C26] hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-normal text-gray-900">{itemPl.nome}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{itemPl.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {itemPl.categoria}
                        </span>
                        <span className="text-xs text-gray-500">{itemPl.unidade}</span>
                      </div>
                    </div>
                    <span className="text-sm font-normal text-[#F25C26]">
                      {itemPl.preco > 0 ? `R$ ${itemPl.preco.toFixed(2)}` : "A definir"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!buscando && !termoBusca && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Digite para buscar itens no pricelist</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


