/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// ImportarAnaliseModal - Modal para importar análise de projeto
// Sistema WG Easy - Grupo WG Almeida
// Mostra dados da IA e permite vincular itens não identificados
// VERSÍO 2.0 - Suporte a Escopo Textual com IA Especialista Master
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Sparkles,
  Home,
  CheckCircle,
  AlertTriangle,
  Search,
  Plus,
  Loader2,
  FileText,
  Ruler,
  Package,
  FileEdit,
  Zap,
  ListChecks,
  ChevronRight,
  Wrench,
  ClipboardList,
} from "lucide-react";
import { listarAnalisesPorCliente, buscarAnalise, listarServicos, type ServicoAnalise } from "@/lib/analiseProjetoApi";
import { analisarEscopoComIA, type ServicoExtraido } from "@/lib/projetoAnaliseAI";
import type { AnaliseProjetoCompleta, AnaliseProjetoAmbiente, AcabamentoIA } from "@/types/analiseProjeto";
import type { Ambiente, ItemPricelist, ItemProposta } from "../types";

// Tipo para modo de importaçÍo
type ModoImportacao = "analises" | "escopo";

interface ImportarAnaliseModalProps {
  clienteId: string;
  clienteNome?: string;
  itensPricelist: ItemPricelist[];
  onImportar: (dados: {
    ambientes: Ambiente[];
    itensSugeridos: ItemProposta[];
    analiseId: string;
  }) => void;
  onClose: () => void;
}

interface AcabamentoComVinculo extends AcabamentoIA {
  itemVinculado?: ItemPricelist;
  buscando?: boolean;
}

// Interface para serviços com vinculaçÍo
interface ServicoComVinculo extends ServicoExtraido {
  itemVinculado?: ItemPricelist;
  buscando?: boolean;
}

export default function ImportarAnaliseModal({
  clienteId,
  clienteNome,
  itensPricelist,
  onImportar,
  onClose,
}: ImportarAnaliseModalProps) {
  // Modo de importaçÍo (análises salvas ou escopo textual)
  const [modo, setModo] = useState<ModoImportacao>("escopo");

  // Estado de listagem
  const [analises, setAnalises] = useState<AnaliseProjetoCompleta[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);

  // Estado de análise selecionada
  const [analiseSelecionada, setAnaliseSelecionada] = useState<AnaliseProjetoCompleta | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  // Estado de acabamentos com vinculaçÍo
  const [acabamentosComVinculo, setAcabamentosComVinculo] = useState<AcabamentoComVinculo[]>([]);

  // === NOVO: Estado para escopo textual ===
  const [escopoTexto, setEscopoTexto] = useState("");
  const [analisandoEscopo, setAnalisandoEscopo] = useState(false);
  const [erroEscopo, setErroEscopo] = useState<string | null>(null);
  const [servicosComVinculo, setServicosComVinculo] = useState<ServicoComVinculo[]>([]);
  const [escopoAnalisado, setEscopoAnalisado] = useState(false);
  const [ambientesEscopo, setAmbientesEscopo] = useState<string[]>([]);

  // Estado de busca de item
  const [buscaAberta, setBuscaAberta] = useState<number | null>(null);
  const [buscaServicoAberta, setBuscaServicoAberta] = useState<number | null>(null);
  const [termoBusca, setTermoBusca] = useState("");

  // Carregar análises do cliente
  useEffect(() => {
    async function carregar() {
      try {
        setLoadingLista(true);
        const lista = await listarAnalisesPorCliente(clienteId);
        // Filtrar apenas análises analisadas ou aprovadas
        const disponiveis = lista.filter(
          (a) => a.status === "analisado" || a.status === "aprovado"
        );
        setAnalises(disponiveis);
      } catch (error) {
        console.error("Erro ao carregar análises:", error);
      } finally {
        setLoadingLista(false);
      }
    }
    carregar();
  }, [clienteId]);

  // Carregar detalhes da análise selecionada
  const handleSelecionarAnalise = useCallback(async (analiseId: string) => {
    try {
      setLoadingAnalise(true);
      const analise = await buscarAnalise(analiseId);
      setAnaliseSelecionada(analise);

      // Preparar acabamentos com tentativa de vinculaçÍo automática
      if (analise.acabamentos && analise.acabamentos.length > 0) {
        const acabamentosProcessados = analise.acabamentos.map((acab) => {
          const termoBusca = (acab.material || acab.tipo || "").toLowerCase();
          const itemEncontrado = itensPricelist.find((item) => {
            const nomeNorm = item.nome.toLowerCase();
            const descNorm = (item.descricao || "").toLowerCase();
            return nomeNorm.includes(termoBusca) || descNorm.includes(termoBusca);
          });

          return {
            ...acab,
            itemVinculado: itemEncontrado,
          };
        });
        setAcabamentosComVinculo(acabamentosProcessados);
      } else {
        setAcabamentosComVinculo([]);
      }

      // NOVO: Carregar serviços salvos da análise
      try {
        const servicosSalvos = await listarServicos(analiseId);
        if (servicosSalvos && servicosSalvos.length > 0) {
          // Processar serviços com auto-vinculaçÍo inteligente
          const servicosProcessados: ServicoComVinculo[] = servicosSalvos.map((srv) => {
            let itemEncontrado: ItemPricelist | undefined;

            // Se já tem item vinculado no banco, usar diretamente
            if (srv.pricelist_item_id) {
              itemEncontrado = itensPricelist.find(item => item.id === srv.pricelist_item_id);
            }

            // Tentar vincular usando termo_busca
            if (!itemEncontrado && srv.termo_busca) {
              const termo = srv.termo_busca.toLowerCase();
              itemEncontrado = itensPricelist.find((item) => {
                const nomeNorm = item.nome.toLowerCase();
                const descNorm = (item.descricao || "").toLowerCase();
                const catNorm = (item.categoria || "").toLowerCase();
                return nomeNorm.includes(termo) || descNorm.includes(termo) || catNorm.includes(termo);
              });
            }

            // Tentar pelas palavras-chave
            if (!itemEncontrado && srv.palavras_chave && srv.palavras_chave.length > 0) {
              for (const palavra of srv.palavras_chave) {
                const palavraNorm = palavra.toLowerCase();
                itemEncontrado = itensPricelist.find((item) => {
                  const nomeNorm = item.nome.toLowerCase();
                  const descNorm = (item.descricao || "").toLowerCase();
                  return nomeNorm.includes(palavraNorm) || descNorm.includes(palavraNorm);
                });
                if (itemEncontrado) break;
              }
            }

            // Tentar pela categoria sugerida
            if (!itemEncontrado && srv.categoria_sugerida) {
              const catSugerida = srv.categoria_sugerida.toLowerCase();
              itemEncontrado = itensPricelist.find((item) => {
                const catNorm = (item.categoria || "").toLowerCase();
                return catNorm.includes(catSugerida);
              });
            }

            // Fallback: busca pela descriçÍo
            if (!itemEncontrado) {
              const descNorm = srv.descricao.toLowerCase();
              itemEncontrado = itensPricelist.find((item) => {
                const nomeNorm = item.nome.toLowerCase();
                return nomeNorm.split(" ").some((word) => descNorm.includes(word) && word.length > 3);
              });
            }

            return {
              categoria: srv.categoria,
              tipo: srv.tipo || "",
              descricao: srv.descricao,
              ambiente: srv.ambiente_nome,
              ambientes: srv.ambientes_nomes,
              unidade: srv.unidade,
              quantidade: srv.quantidade,
              area: srv.area,
              metragem_linear: srv.metragem_linear,
              especificacoes: srv.especificacoes,
              vinculo_pricelist: srv.termo_busca ? {
                termo_busca: srv.termo_busca,
                palavras_chave: srv.palavras_chave || [],
                categoria_sugerida: srv.categoria_sugerida,
              } : undefined,
              itemVinculado: itemEncontrado,
            } as ServicoComVinculo;
          });

          setServicosComVinculo(servicosProcessados);
          setEscopoAnalisado(true);
          console.log(`[ANALISE] ${servicosProcessados.length} servicos carregados, ${servicosProcessados.filter(s => s.itemVinculado).length} vinculados`);
        } else {
          setServicosComVinculo([]);
        }
      } catch (servicosError) {
        console.error("Erro ao carregar servicos:", servicosError);
        setServicosComVinculo([]);
      }
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
    } finally {
      setLoadingAnalise(false);
    }
  }, [itensPricelist]);

  // Vincular item manualmente
  const handleVincularItem = (index: number, item: ItemPricelist) => {
    setAcabamentosComVinculo((prev) =>
      prev.map((acab, i) =>
        i === index ? { ...acab, itemVinculado: item } : acab
      )
    );
    setBuscaAberta(null);
    setTermoBusca("");
  };

  // Vincular item a serviço
  const handleVincularServico = (index: number, item: ItemPricelist) => {
    setServicosComVinculo((prev) =>
      prev.map((serv, i) =>
        i === index ? { ...serv, itemVinculado: item } : serv
      )
    );
    setBuscaServicoAberta(null);
    setTermoBusca("");
  };

  // === NOVO: FunçÍo para analisar escopo textual com IA ===
  const handleAnalisarEscopo = async () => {
    if (!escopoTexto.trim() || escopoTexto.length < 50) {
      setErroEscopo("Cole o escopo completo da obra (mínimo 50 caracteres)");
      return;
    }

    try {
      setAnalisandoEscopo(true);
      setErroEscopo(null);

      // Chamar IA especialista para analisar escopo
      const resultado = await analisarEscopoComIA(escopoTexto);

      // Processar serviços com auto-vinculaçÍo inteligente
      const servicosProcessados: ServicoComVinculo[] = resultado.servicos.map((serv) => {
        // Tentar vincular usando os termos do vinculo_pricelist
        let itemEncontrado: ItemPricelist | undefined;

        if (serv.vinculo_pricelist) {
          // Primeiro tentar pelo termo_busca principal
          const termoBusca = serv.vinculo_pricelist.termo_busca.toLowerCase();
          itemEncontrado = itensPricelist.find((item) => {
            const nomeNorm = item.nome.toLowerCase();
            const descNorm = (item.descricao || "").toLowerCase();
            const catNorm = (item.categoria || "").toLowerCase();
            return (
              nomeNorm.includes(termoBusca) ||
              descNorm.includes(termoBusca) ||
              catNorm.includes(termoBusca)
            );
          });

          // Se não encontrou, tentar pelas palavras-chave
          if (!itemEncontrado && serv.vinculo_pricelist.palavras_chave) {
            for (const palavra of serv.vinculo_pricelist.palavras_chave) {
              const palavraNorm = palavra.toLowerCase();
              itemEncontrado = itensPricelist.find((item) => {
                const nomeNorm = item.nome.toLowerCase();
                const descNorm = (item.descricao || "").toLowerCase();
                return nomeNorm.includes(palavraNorm) || descNorm.includes(palavraNorm);
              });
              if (itemEncontrado) break;
            }
          }

          // Se ainda não encontrou, tentar pela categoria sugerida
          if (!itemEncontrado && serv.vinculo_pricelist.categoria_sugerida) {
            const catSugerida = serv.vinculo_pricelist.categoria_sugerida.toLowerCase();
            itemEncontrado = itensPricelist.find((item) => {
              const catNorm = (item.categoria || "").toLowerCase();
              return catNorm.includes(catSugerida);
            });
          }
        }

        // Fallback: busca pela descriçÍo do serviço
        if (!itemEncontrado) {
          const descNorm = serv.descricao.toLowerCase();
          itemEncontrado = itensPricelist.find((item) => {
            const nomeNorm = item.nome.toLowerCase();
            return nomeNorm.split(" ").some((word) => descNorm.includes(word) && word.length > 3);
          });
        }

        return {
          ...serv,
          itemVinculado: itemEncontrado,
        };
      });

      setServicosComVinculo(servicosProcessados);
      setAmbientesEscopo(resultado.ambientes.map((a) => a.nome));
      setEscopoAnalisado(true);

      console.log(`[IA] ${servicosProcessados.length} serviços extraídos do escopo`);
    } catch (error: any) {
      console.error("Erro ao analisar escopo:", error);
      setErroEscopo(error.message || "Erro ao analisar escopo com IA");
    } finally {
      setAnalisandoEscopo(false);
    }
  };

  // Filtrar itens do pricelist
  const itensFiltrados = termoBusca.length >= 2
    ? itensPricelist.filter((item) => {
        const termo = termoBusca.toLowerCase();
        return (
          item.nome.toLowerCase().includes(termo) ||
          (item.descricao || "").toLowerCase().includes(termo) ||
          (item.codigo || "").toLowerCase().includes(termo)
        );
      }).slice(0, 10)
    : [];

  // Importar para proposta
  const handleImportar = () => {
    // Se modo escopo, importar serviços extraídos
    if (modo === "escopo" && escopoAnalisado) {
      return handleImportarEscopo();
    }

    // Modo análises salvas
    if (!analiseSelecionada) return;

    // Converter ambientes
    // IMPORTANTE: area_parede deve usar area_paredes_liquida (descontando vÍos)
    // para revestimentos e trabalhos de parede
    const ambientes: Ambiente[] = (analiseSelecionada.ambientes || []).map((amb) => ({
      id: amb.id,
      nome: amb.nome,
      largura: amb.largura || 0,
      comprimento: amb.comprimento || 0,
      pe_direito: amb.pe_direito || 2.7,
      area_piso: amb.area_piso || 0,
      // Para revestimentos, usar area_paredes_liquida (desconta portas/janelas)
      area_parede: amb.area_paredes_liquida || amb.area_paredes_bruta || 0,
      area_paredes_bruta: amb.area_paredes_bruta || 0,
      area_paredes_liquida: amb.area_paredes_liquida || 0,
      area_teto: amb.area_teto || amb.area_piso || 0,
      perimetro: amb.perimetro || 0,
      portas: (amb.portas || []).map(p => ({
        largura: p.largura || 0.8,
        altura: p.altura || 2.1,
        quantidade: (p as any).quantidade || 1
      })),
      janelas: (amb.janelas || []).map(j => ({
        largura: j.largura || 1.2,
        altura: j.altura || 1.2,
        quantidade: (j as any).quantidade || 1
      })),
      vaos: (amb.vaos || []).map(v => ({
        largura: v.largura || 1.0,
        altura: v.altura || 2.1,
        quantidade: (v as any).quantidade || 1
      })),
      area_vaos_total: amb.area_vaos_total || 0,
    }));

    // Criar itens sugeridos dos acabamentos vinculados
    const itensSugeridos: ItemProposta[] = [];

    // PRIMEIRO: Adicionar itens dos SERVIÇOS (se existirem)
    for (const serv of servicosComVinculo) {
      if (!serv.itemVinculado) continue;
      // Filtrar itens excluídos do escopo
      if (serv.status_item === "excluido") continue;

      const ambiente = ambientes.find(
        (a) => a.nome.toLowerCase() === (serv.ambiente || "").toLowerCase()
      );

      // IMPORTANTE: Priorizar área do AMBIENTE sobre área do serviço
      // A área do serviço pode estar incorreta (calculada pela IA de forma genérica)
      // A área do ambiente é calculada corretamente com dimensões e vÍos
      let quantidade = 1;
      let usouAreaAmbiente = false;

      // Se o serviço tem ambiente vinculado, SEMPRE tentar usar a metragem do ambiente
      if (ambiente) {
        const descLower = serv.descricao.toLowerCase();
        const catLower = (serv.categoria || "").toLowerCase();
        const tipoLower = (serv.tipo || "").toLowerCase();
        const unidadeLower = (serv.unidade || "").toLowerCase();

        // Detectar tipo de serviço pela descriçÍo/categoria/tipo
        const isPiso = descLower.includes("piso") ||
          descLower.includes("porcelanato") && !descLower.includes("parede") ||
          descLower.includes("ceramica") && !descLower.includes("parede") ||
          descLower.includes("laminado") ||
          descLower.includes("vinilico") ||
          descLower.includes("contrapiso") ||
          catLower.includes("piso") ||
          tipoLower.includes("piso") ||
          tipoLower === "revestimento_piso";

        // Revestimento de parede - usar área LÍQUIDA (descontando portas/janelas)
        const isParede = descLower.includes("parede") ||
          (descLower.includes("revestimento") && !descLower.includes("piso")) ||
          descLower.includes("azulejo") ||
          catLower.includes("parede") ||
          catLower === "revestimento" ||
          catLower === "revestimentos" ||
          tipoLower.includes("parede") ||
          tipoLower === "revestimento_parede";

        const isTeto = descLower.includes("teto") ||
          descLower.includes("forro") ||
          catLower.includes("forro") ||
          catLower.includes("teto");

        const isRodape = descLower.includes("rodape") ||
          descLower.includes("rodapé") ||
          catLower.includes("rodape");

        const isPintura = descLower.includes("pintura") ||
          catLower.includes("pintura");

        // Verificar se unidade indica m2 ou ml
        const isM2 = unidadeLower === "m2" || unidadeLower === "m²";
        const isML = unidadeLower === "ml" || unidadeLower === "m";

        // Aplicar área correta baseado no tipo - PRIORIDADE para área do ambiente
        if (isPiso && ambiente.area_piso > 0) {
          quantidade = ambiente.area_piso;
          usouAreaAmbiente = true;
        } else if (isParede) {
          // Para revestimento de parede, SEMPRE usar area_paredes_liquida
          if (ambiente.area_paredes_liquida > 0) {
            quantidade = ambiente.area_paredes_liquida;
            usouAreaAmbiente = true;
          } else if (ambiente.area_parede > 0) {
            quantidade = ambiente.area_parede;
            usouAreaAmbiente = true;
          }
        } else if (isTeto && (ambiente.area_teto || ambiente.area_piso) > 0) {
          quantidade = ambiente.area_teto || ambiente.area_piso;
          usouAreaAmbiente = true;
        } else if (isRodape && ambiente.perimetro > 0) {
          quantidade = ambiente.perimetro;
          usouAreaAmbiente = true;
        } else if (isPintura) {
          // Pintura pode ser parede ou teto
          if (descLower.includes("parede")) {
            quantidade = ambiente.area_paredes_liquida || ambiente.area_parede || 0;
            usouAreaAmbiente = quantidade > 0;
          } else if (descLower.includes("teto")) {
            quantidade = ambiente.area_teto || ambiente.area_piso || 0;
            usouAreaAmbiente = quantidade > 0;
          } else if (ambiente.area_paredes_liquida > 0) {
            // Pintura sem especificaçÍo - usar parede líquida
            quantidade = ambiente.area_paredes_liquida;
            usouAreaAmbiente = true;
          }
        } else if (isM2 && ambiente.area_piso > 0) {
          // Se unidade é m2 e não identificamos tipo específico, usar área do piso
          quantidade = ambiente.area_piso;
          usouAreaAmbiente = true;
        } else if (isML && ambiente.perimetro > 0) {
          // Se unidade é ml, usar perímetro
          quantidade = ambiente.perimetro;
          usouAreaAmbiente = true;
        }
      }

      // Se não conseguiu área do ambiente, usar área/quantidade do serviço como fallback
      if (!usouAreaAmbiente) {
        quantidade = serv.quantidade || serv.area || serv.metragem_linear || 1;
      }

      // Aplicar margem de 10%
      quantidade = Math.ceil(quantidade * 1.1);

      itensSugeridos.push({
        id: `srv-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        item: serv.itemVinculado,
        ambiente_id: ambiente?.id,
        ambientes_ids: ambiente ? [ambiente.id] : [],
        quantidade,
        valor_unitario: serv.itemVinculado.preco,
        descricao_customizada: serv.descricao,
        prioridade: serv.prioridade || undefined,
        status_item: serv.status_item || "a_definir",
      });
    }

    // SEGUNDO: Adicionar itens dos acabamentos (complementar)
    for (const acab of acabamentosComVinculo) {
      if (!acab.itemVinculado) continue;

      const ambiente = ambientes.find(
        (a) => a.nome.toLowerCase() === (acab.ambiente || "").toLowerCase()
      );

      let quantidade = acab.area || acab.quantidade || 1;
      if (acab.tipo === "piso" && ambiente) {
        quantidade = ambiente.area_piso;
      } else if (acab.tipo === "parede" && ambiente) {
        quantidade = ambiente.area_parede;
      } else if (acab.tipo === "teto" && ambiente) {
        quantidade = ambiente.area_teto;
      } else if (acab.tipo === "rodape" && ambiente) {
        quantidade = ambiente.perimetro;
      }

      itensSugeridos.push({
        id: `acab-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        item: acab.itemVinculado,
        ambiente_id: ambiente?.id,
        ambientes_ids: ambiente ? [ambiente.id] : [],
        quantidade: Math.ceil(quantidade * 1.1), // 10% margem
        valor_unitario: acab.itemVinculado.preco,
        descricao_customizada: acab.descricao,
      });
    }

    onImportar({
      ambientes,
      itensSugeridos,
      analiseId: analiseSelecionada.id,
    });
  };

  // === NOVO: Importar serviços do escopo ===
  const handleImportarEscopo = () => {
    // Criar ambientes a partir dos identificados no escopo
    const ambientes: Ambiente[] = ambientesEscopo.map((nome, idx) => ({
      id: `escopo-${Date.now()}-${idx}`,
      nome,
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
    }));

    // Criar itens sugeridos dos serviços vinculados
    const itensSugeridos: ItemProposta[] = [];

    for (const serv of servicosComVinculo) {
      if (!serv.itemVinculado) continue;

      // Filtrar itens excluídos do escopo — não entram na proposta
      if (serv.status_item === "excluido") continue;

      // Encontrar ambiente correspondente
      const ambiente = ambientes.find(
        (a) => a.nome.toLowerCase() === (serv.ambiente || "").toLowerCase()
      );

      // Calcular quantidade - usar dados extraidos pela IA
      // A IA extrai quantidade, area e metragem_linear do escopo
      let quantidade = serv.quantidade || serv.area || serv.metragem_linear || 1;

      // Se a quantidade ainda é 1 e o serviço tem unidade m2/ml, verificar se a IA extraiu area
      if (quantidade <= 1) {
        const unidadeLower = (serv.unidade || "").toLowerCase();
        const isM2 = unidadeLower === "m2" || unidadeLower === "m²";
        const isML = unidadeLower === "ml" || unidadeLower === "m";

        // Tentar usar area do servico extraido pela IA
        if ((isM2 || isML) && serv.area && serv.area > 0) {
          quantidade = serv.area;
        }
      }

      // Aplicar margem de 10%
      quantidade = Math.ceil(quantidade * 1.1);

      itensSugeridos.push({
        id: `import-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        item: serv.itemVinculado,
        ambiente_id: ambiente?.id,
        ambientes_ids: ambiente ? [ambiente.id] : [],
        quantidade,
        valor_unitario: serv.itemVinculado.preco,
        descricao_customizada: serv.descricao,
        prioridade: serv.prioridade || undefined,
        status_item: serv.status_item || "a_definir",
      });
    }

    onImportar({
      ambientes,
      itensSugeridos,
      analiseId: `escopo-${Date.now()}`,
    });
  };

  // Estatísticas - Modo Análises
  const totalAcabamentos = acabamentosComVinculo.length;
  const vinculados = acabamentosComVinculo.filter((a) => a.itemVinculado).length;
  const pendentes = totalAcabamentos - vinculados;

  // Estatísticas - Modo Escopo
  const totalServicos = servicosComVinculo.length;
  const servicosVinculados = servicosComVinculo.filter((s) => s.itemVinculado).length;
  const servicosPendentes = totalServicos - servicosVinculados;

  // Agrupar serviços por categoria
  const servicosPorCategoria = servicosComVinculo.reduce((acc, serv) => {
    const cat = serv.categoria || "outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(serv);
    return acc;
  }, {} as Record<string, ServicoComVinculo[]>);

  // Nome legível para categorias
  const nomeCategoria: Record<string, string> = {
    gerais: "Gerais",
    demolicao: "DemoliçÍo",
    construcao: "ConstruçÍo",
    instalacoes_eletricas: "Elétrica",
    instalacoes_hidraulicas: "Hidráulica",
    revestimentos: "Revestimentos",
    pintura: "Pintura",
    forros: "Forros",
    esquadrias: "Esquadrias",
    loucas_metais: "Louças e Metais",
    pedras: "Pedras",
    vidracaria: "Vidraçaria",
    marcenaria: "Marcenaria",
    outros: "Outros",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-normal text-gray-900">
                  Importar Análise de Projeto
                </h2>
                <p className="text-sm text-gray-500">
                  {clienteNome || "Selecione uma análise ou cole o escopo"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs de Modo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModo("escopo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                modo === "escopo"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Analisar Escopo
              <span className="px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-normal rounded">
                IA
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModo("analises")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                modo === "analises"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FileText className="w-4 h-4" />
              Análises Salvas
              {analises.length > 0 && (
                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-normal rounded">
                  {analises.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* === MODO ESCOPO === */}
          {modo === "escopo" && (
            <div className="flex-1 flex">
              {/* Área de input do escopo (esquerda) */}
              <div className="w-1/2 border-r border-gray-200 p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <FileEdit className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                    Escopo da Obra
                  </h3>
                </div>

                <textarea
                  value={escopoTexto}
                  onChange={(e) => {
                    setEscopoTexto(e.target.value);
                    setEscopoAnalisado(false);
                    setErroEscopo(null);
                  }}
                  placeholder={`Cole aqui o escopo completo da obra...

Exemplo:
GERAIS:
ProteçÍo de piso, portas e esquadrias
Limpeza de obra ao final

DEMOLIÇÍO:
DemoliçÍo de revestimento de piso existente na cozinha, lavanderia e banheiros
RemoçÍo de louças e metais existentes

CONSTRUÇÍO:
ExecuçÍo de contrapiso com regularizaçÍo
ImpermeabilizaçÍo de áreas molhadas...`}
                  className="flex-1 w-full p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 bg-gray-50"
                />

                {erroEscopo && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {erroEscopo}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAnalisarEscopo}
                  disabled={analisandoEscopo || escopoTexto.length < 50}
                  className="mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analisandoEscopo ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisando com IA Especialista...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Analisar Escopo com IA Master
                    </>
                  )}
                </button>

                {escopoTexto.length > 0 && escopoTexto.length < 50 && (
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Mínimo 50 caracteres ({escopoTexto.length}/50)
                  </p>
                )}
              </div>

              {/* Serviços extraídos (direita) */}
              <div className="flex-1 overflow-y-auto p-4">
                {!escopoAnalisado ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <ListChecks className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm text-center">
                      Cole o escopo da obra e clique em<br />
                      <strong>"Analisar Escopo com IA Master"</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      A IA vai extrair todos os serviços automaticamente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          <span className="font-normal text-gray-900">
                            {totalServicos} Serviços Extraídos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-600 font-medium">
                            {servicosVinculados} vinculados
                          </span>
                          {servicosPendentes > 0 && (
                            <span className="text-orange-600 font-medium">
                              {servicosPendentes} pendentes
                            </span>
                          )}
                        </div>
                      </div>
                      {ambientesEscopo.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ambientesEscopo.map((amb) => (
                            <span
                              key={amb}
                              className="px-2 py-0.5 bg-white text-gray-700 text-xs rounded border border-gray-200"
                            >
                              {amb}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de serviços por categoria */}
                    {Object.entries(servicosPorCategoria).map(([categoria, servicos]) => (
                      <div key={categoria}>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                            {nomeCategoria[categoria] || categoria}
                          </h4>
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-normal rounded">
                            {servicos.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {servicos.map((serv, idx) => {
                            const globalIdx = servicosComVinculo.findIndex((s) => s === serv);
                            return (
                              <div
                                key={globalIdx}
                                className={`p-3 rounded-lg border ${
                                  serv.itemVinculado
                                    ? "bg-green-50 border-green-200"
                                    : "bg-orange-50 border-orange-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {serv.itemVinculado ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                      )}
                                      <span className="font-medium text-gray-900 text-sm truncate">
                                        {serv.descricao}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1 ml-6 text-xs">
                                      {serv.ambiente && serv.ambiente !== "geral" && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                          {serv.ambiente}
                                        </span>
                                      )}
                                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        {serv.unidade}
                                      </span>
                                      {serv.quantidade && (
                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                          Qtd: {serv.quantidade}
                                        </span>
                                      )}
                                    </div>

                                    {serv.itemVinculado && (
                                      <div className="mt-2 ml-6 p-2 bg-white rounded border border-green-200">
                                        <p className="text-xs font-medium text-green-800">
                                          ✓ {serv.itemVinculado.nome}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          R$ {serv.itemVinculado.preco.toFixed(2)} / {serv.itemVinculado.unidade}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* BotÍo vincular serviço */}
                                  {!serv.itemVinculado && (
                                    <div className="relative flex-shrink-0">
                                      {buscaServicoAberta === globalIdx ? (
                                        <div className="absolute right-0 top-0 w-80 bg-white border border-gray-300 rounded-xl shadow-2xl z-20">
                                          <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                                            <div className="relative">
                                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                              <input
                                                type="text"
                                                placeholder="Buscar no pricelist..."
                                                value={termoBusca}
                                                onChange={(e) => setTermoBusca(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                                                autoFocus
                                              />
                                            </div>
                                          </div>
                                          <div className="max-h-60 overflow-y-auto">
                                            {itensFiltrados.length > 0 ? (
                                              itensFiltrados.map((item) => (
                                                <button
                                                  key={item.id}
                                                  type="button"
                                                  onClick={() => handleVincularServico(globalIdx, item)}
                                                  className="w-full p-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                                >
                                                  <p className="font-medium text-gray-900 text-sm truncate">
                                                    {item.nome}
                                                  </p>
                                                  <p className="text-xs text-gray-500">
                                                    R$ {item.preco.toFixed(2)} / {item.unidade}
                                                  </p>
                                                </button>
                                              ))
                                            ) : termoBusca.length >= 2 ? (
                                              <div className="p-3 text-center text-gray-500 text-sm">
                                                Nenhum item encontrado
                                              </div>
                                            ) : (
                                              <div className="p-3 text-center text-gray-500 text-sm">
                                                Digite para buscar...
                                              </div>
                                            )}
                                          </div>
                                          <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setBuscaServicoAberta(null);
                                                setTermoBusca("");
                                              }}
                                              className="w-full py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                              Cancelar
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setBuscaServicoAberta(globalIdx)}
                                          className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                        >
                                          <Search className="w-3 h-3" />
                                          Vincular
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === MODO ANÁLISES SALVAS === */}
          {modo === "analises" && (
            <>
          {/* Lista de análises (esquerda) */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-normal text-gray-700 mb-3 uppercase tracking-wide">
                Análises Disponíveis
              </h3>

              {loadingLista ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : analises.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma análise disponível para este cliente
                </div>
              ) : (
                <div className="space-y-2">
                  {analises.map((analise) => (
                    <button
                      type="button"
                      key={analise.id}
                      onClick={() => handleSelecionarAnalise(analise.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        analiseSelecionada?.id === analise.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {analise.titulo}
                          </p>
                          {analise.numero && (
                            <p className="text-xs text-gray-500 font-mono">
                              {analise.numero}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {analise.total_ambientes || 0} ambientes
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                analise.status === "aprovado"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {analise.status === "aprovado" ? "Aprovado" : "Analisado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da análise (direita) */}
          <div className="flex-1 overflow-y-auto">
            {loadingAnalise ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : analiseSelecionada ? (
              <div className="p-4 space-y-4">
                {/* Ambientes identificados */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                      Ambientes Identificados pela IA
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-normal rounded-full">
                      {analiseSelecionada.ambientes?.length || 0}
                    </span>
                  </div>

                  {analiseSelecionada.ambientes && analiseSelecionada.ambientes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {analiseSelecionada.ambientes.map((amb) => (
                        <div
                          key={amb.id}
                          className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-gray-900 text-sm">
                              {amb.nome}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <span>Piso: {(amb.area_piso || 0).toFixed(1)}m²</span>
                            <span>Parede: {(amb.area_paredes_liquida || 0).toFixed(1)}m²</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      Nenhum ambiente identificado
                    </div>
                  )}
                </div>

                {/* Acabamentos e vinculaçÍo */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                        Acabamentos / Itens
                      </h3>
                    </div>
                    {totalAcabamentos > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 font-medium">
                          {vinculados} vinculados
                        </span>
                        {pendentes > 0 && (
                          <span className="text-orange-600 font-medium">
                            {pendentes} pendentes
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {acabamentosComVinculo.length > 0 ? (
                    <div className="space-y-2">
                      {acabamentosComVinculo.map((acab, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            acab.itemVinculado
                              ? "bg-green-50 border-green-200"
                              : "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {acab.itemVinculado ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                )}
                                <span className="font-medium text-gray-900 text-sm">
                                  {acab.tipo}: {acab.material || acab.descricao || "Sem descriçÍo"}
                                </span>
                              </div>

                              {acab.ambiente && (
                                <span className="text-xs text-gray-500 ml-6">
                                  Ambiente: {acab.ambiente}
                                </span>
                              )}

                              {acab.itemVinculado && (
                                <div className="mt-2 ml-6 p-2 bg-white rounded border border-green-200">
                                  <p className="text-xs font-medium text-green-800">
                                    Vinculado: {acab.itemVinculado.nome}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    R$ {acab.itemVinculado.preco.toFixed(2)} / {acab.itemVinculado.unidade}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* BotÍo/Busca para vincular */}
                            {!acab.itemVinculado && (
                              <div className="relative">
                                {buscaAberta === index ? (
                                  <div className="absolute right-0 top-0 w-96 bg-white border border-gray-300 rounded-xl shadow-2xl z-20">
                                    <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="text"
                                          placeholder="Buscar item no pricelist..."
                                          value={termoBusca}
                                          onChange={(e) => setTermoBusca(e.target.value)}
                                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                                          autoFocus
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                      {itensFiltrados.length > 0 ? (
                                        itensFiltrados.map((item) => (
                                          <button
                                            type="button"
                                            key={item.id}
                                            onClick={() => handleVincularItem(index, item)}
                                            className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                          >
                                            <p className="font-medium text-gray-900">
                                              {item.nome}
                                            </p>
                                            {/* Tags: Núcleo, Categoria, Tipo */}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {item.nucleo && (
                                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                                  item.nucleo === 'arquitetura' ? 'bg-purple-100 text-purple-700' :
                                                  item.nucleo === 'engenharia' ? 'bg-blue-100 text-blue-700' :
                                                  item.nucleo === 'marcenaria' ? 'bg-amber-100 text-amber-700' :
                                                  'bg-gray-100 text-gray-700'
                                                }`}>
                                                  {item.nucleo === 'arquitetura' ? 'ARQ' :
                                                   item.nucleo === 'engenharia' ? 'ENG' :
                                                   item.nucleo === 'marcenaria' ? 'MARC' :
                                                   item.nucleo?.toUpperCase().slice(0, 4)}
                                                </span>
                                              )}
                                              {item.categoria && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                                                  {item.categoria}
                                                </span>
                                              )}
                                              {item.tipo && (
                                                <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                                                  item.tipo === 'material' ? 'bg-green-100 text-green-700' :
                                                  item.tipo === 'mao_obra' ? 'bg-orange-100 text-orange-700' :
                                                  item.tipo === 'servico' ? 'bg-cyan-100 text-cyan-700' :
                                                  'bg-gray-100 text-gray-700'
                                                }`}>
                                                  {item.tipo === 'material' ? 'Material' :
                                                   item.tipo === 'mao_obra' ? 'MÍo de Obra' :
                                                   item.tipo === 'servico' ? 'Serviço' :
                                                   item.tipo}
                                                </span>
                                              )}
                                              {/* Indicador de aplicaçÍo (piso/parede) baseado na categoria ou nome */}
                                              {(item.categoria?.toLowerCase().includes('piso') || item.nome.toLowerCase().includes('piso')) && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                                                  PISO
                                                </span>
                                              )}
                                              {(item.categoria?.toLowerCase().includes('parede') || item.nome.toLowerCase().includes('parede') || item.categoria?.toLowerCase().includes('revestimento')) && (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 rounded">
                                                  PAREDE
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                              <span className="font-normal text-green-600">R$ {item.preco.toFixed(2)}</span>
                                              <span className="text-gray-400"> / {item.unidade}</span>
                                              {item.codigo && <span className="ml-2 text-xs text-gray-400">#{item.codigo}</span>}
                                            </p>
                                          </button>
                                        ))
                                      ) : termoBusca.length >= 2 ? (
                                        <div className="p-3 text-center text-gray-500 text-sm">
                                          Nenhum item encontrado
                                        </div>
                                      ) : (
                                        <div className="p-3 text-center text-gray-500 text-sm">
                                          Digite para buscar...
                                        </div>
                                      )}
                                    </div>
                                    <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setBuscaAberta(null);
                                          setTermoBusca("");
                                        }}
                                        className="w-full py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setBuscaAberta(index)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                                  >
                                    <Search className="w-3 h-3" />
                                    Vincular
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                      Nenhum acabamento identificado na análise
                    </div>
                  )}
                </div>

                {/* Memorial descritivo */}
                {analiseSelecionada.memorial_descritivo && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                        Descritivo de Obra
                      </h3>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                        {analiseSelecionada.memorial_descritivo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm">Selecione uma análise para ver os detalhes</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {modo === "escopo" && escopoAnalisado && (
              <>
                {ambientesEscopo.length} ambientes • {servicosVinculados}/{totalServicos} serviços vinculados
              </>
            )}
            {modo === "analises" && analiseSelecionada && (
              <>
                {analiseSelecionada.ambientes?.length || 0} ambientes •{" "}
                {vinculados}/{totalAcabamentos} itens vinculados
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImportar}
              disabled={
                (modo === "escopo" && !escopoAnalisado) ||
                (modo === "analises" && !analiseSelecionada)
              }
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {modo === "escopo"
                ? `Importar ${servicosVinculados} Serviços`
                : "Importar para Proposta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


