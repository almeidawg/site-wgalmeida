/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Formulário de Contrato Multi-Núcleo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { criarContratoMultiNucleo, buscarContrato } from "@/lib/contratosApi";
import type { UnidadeNegocio } from "@/types/contratos";
import type { ContratoMultiNucleoFormData } from "@/types/contratos-extended";
import { buscarProposta } from "@/lib/propostasApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { adicionarDiasUteis } from "@/lib/diasUteisUtils";
import { useToast } from "@/components/ui/use-toast";

// ============================================================
// SCHEMA DE VALIDAÇÍO
// ============================================================

const contratoMultiNucleoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  nucleos_selecionados: z
    .array(z.enum(["arquitetura", "engenharia", "marcenaria"]))
    .min(1, "Selecione pelo menos um núcleo"),
  descricao: z.string().min(1, "DescriçÍo é obrigatória"),
  observacoes: z.string().optional(),

  // Dados do cliente
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  cliente_cpf: z.string().min(11, "CPF é obrigatório"),
  cliente_rg: z.string().optional(),
  cliente_nacionalidade: z.string().optional(),
  cliente_estado_civil: z.string().optional(),
  cliente_profissao: z.string().optional(),
  cliente_telefone: z.string().optional(),
  cliente_email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  cliente_endereco: z.string().optional(),
  cliente_bairro: z.string().optional(),
  cliente_cidade: z.string().optional(),
  cliente_estado: z.string().optional(),
  cliente_cep: z.string().optional(),

  // Dados do imóvel
  imovel_endereco: z.string().min(1, "Endereço do imóvel é obrigatório"),
  imovel_numero: z.string().optional(),
  imovel_complemento: z.string().optional(),
  imovel_apartamento: z.string().optional(),
  imovel_torre: z.string().optional(),
  imovel_condominio: z.string().optional(),
  imovel_bairro: z.string().optional(),
  imovel_cidade: z.string().optional(),
  imovel_estado: z.string().optional(),
  imovel_cep: z.string().optional(),
  imovel_matricula: z.string().optional(),
  imovel_inscricao: z.string().optional(),
  imovel_horario_seg_sex: z.string().optional(),
  imovel_horario_sabado: z.string().optional(),

  // Prazos e valores por núcleo (dinâmicos)
  // SerÍo validados dinamicamente baseado nos núcleos selecionados

  // Pagamento
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  percentual_entrada: z.number().min(0).max(100),
  numero_parcelas: z.number().min(0),
});

type ContratoMultiNucleoFormFields = z.infer<typeof contratoMultiNucleoSchema>;

// ============================================================
// COMPONENTE
// ============================================================

function normalizarNucleo(raw?: string | null): UnidadeNegocio | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v.startsWith("eng")) return "engenharia";
  if (v.startsWith("mar")) return "marcenaria";
  if (v.startsWith("arq")) return "arquitetura";
  if (v === "engenharia" || v === "marcenaria" || v === "arquitetura") {
    return v as UnidadeNegocio;
  }
  return undefined;
}

/**
 * Arredonda valor para 2 casas decimais (evita problemas de ponto flutuante)
 */
function arredondar2Casas(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function inferirNucleoPorCategoria(
  codigo?: string | null,
  nome?: string | null,
  tipo?: string | null
): UnidadeNegocio | undefined {
  const c = (codigo || "").toLowerCase();
  const n = (nome || "").toLowerCase();
  const t = (tipo || "").toLowerCase();

  // Heurísticas simples pelos nomes mais comuns
  if (c.startsWith("arq") || n.includes("arquitet") || t.includes("arquitet"))
    return "arquitetura";
  if (c.startsWith("mar") || n.includes("marcen") || t.includes("marcen"))
    return "marcenaria";
  if (c.startsWith("eng") || n.includes("engenh") || t.includes("engenh"))
    return "engenharia";
  if (
    n.includes("piso") ||
    n.includes("vidra") ||
    n.includes("vidro") ||
    n.includes("marmor") ||
    n.includes("gesso")
  )
    return "engenharia";

  // fallback leve: materiais tendem a engenharia
  if (t === "material") return "engenharia";
  return undefined;
}

export default function ContratoFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdicao = Boolean(id);
  const propostaId = searchParams.get("proposta_id");

  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(Boolean(propostaId));
  const [clientes, setClientes] = useState<any[]>([]);
  const [proposta, setProposta] = useState<any>();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [enderecoObraDiferente, setEnderecoObraDiferente] = useState(false); // Checkbox para endereço diferente
  const [itensPorNucleo, setItensPorNucleo] = useState<
    Record<UnidadeNegocio, any[]>
  >({
    arquitetura: [],
    engenharia: [],
    marcenaria: [],
    moma_engenharia: [],
    moma_planejados: [],
  });
  const [categorias, setCategorias] = useState<any[]>([]);
  const [valoresPorNucleo, setValoresPorNucleo] = useState<
    Record<UnidadeNegocio, any>
  >({
    arquitetura: { valor_total: 0, valor_mao_obra: 0, valor_materiais: 0 },
    engenharia: { valor_total: 0, valor_mao_obra: 0, valor_materiais: 0 },
    marcenaria: { valor_total: 0, valor_mao_obra: 0, valor_materiais: 0 },
  } as Record<UnidadeNegocio, any>);
  const [duracoesPorNucleo, setDuracoesPorNucleo] = useState<
    Record<UnidadeNegocio, number>
  >({
    arquitetura: 127, // PadrÍo de arquitetura
    engenharia: 90, // PadrÍo de engenharia
    marcenaria: 71, // PadrÍo de marcenaria
  } as Record<UnidadeNegocio, number>);

  // NOVO: ConfiguraçÍo de pagamento INDIVIDUAL por núcleo
  const [pagamentoPorNucleo, setPagamentoPorNucleo] = useState<
    Record<
      UnidadeNegocio,
      {
        percentual_entrada: number;
        numero_parcelas: number;
        forma_pagamento: string;
        dia_vencimento: number;
        conta_tipo: "real" | "virtual";
        // NOVO: Modalidade de materiais (apenas Engenharia)
        modalidade_materiais: "revenda" | "gestao";
        fee_gestao_percentual: number;
      }
    >
  >({
    arquitetura: {
      percentual_entrada: 30,
      numero_parcelas: 6,
      forma_pagamento: "PIX/Transferência",
      dia_vencimento: 10,
      conta_tipo: "real",
      modalidade_materiais: "revenda",
      fee_gestao_percentual: 15,
    },
    engenharia: {
      percentual_entrada: 30,
      numero_parcelas: 6,
      forma_pagamento: "PIX/Transferência",
      dia_vencimento: 10,
      conta_tipo: "real",
      modalidade_materiais: "revenda", // revenda = empresa compra, gestao = cliente compra
      fee_gestao_percentual: 15,
    },
    marcenaria: {
      percentual_entrada: 50,
      numero_parcelas: 3,
      forma_pagamento: "PIX/Transferência",
      dia_vencimento: 10,
      conta_tipo: "real",
      modalidade_materiais: "revenda",
      fee_gestao_percentual: 15,
    },
  } as Record<UnidadeNegocio, {
    percentual_entrada: number;
    numero_parcelas: number;
    forma_pagamento: string;
    dia_vencimento: number;
    conta_tipo: "real" | "virtual";
    modalidade_materiais: "revenda" | "gestao";
    fee_gestao_percentual: number;
  }>);

  // Estado para contas bancárias disponíveis
  const [contasBancarias, setContasBancarias] = useState<any[]>([]);

  // Estado para especificadores (indicadores/parceiros)
  const [especificadores, setEspecificadores] = useState<any[]>([]);
  const [temEspecificador, setTemEspecificador] = useState(false);
  const [especificadorId, setEspecificadorId] = useState<string>("");
  const [codigoRastreamento, setCodigoRastreamento] = useState<string>("");
  const [observacoesIndicacao, setObservacoesIndicacao] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<ContratoMultiNucleoFormFields>({
    resolver: zodResolver(contratoMultiNucleoSchema),
    defaultValues: {
      nucleos_selecionados: [],
      percentual_entrada: 30,
      numero_parcelas: 6,
      forma_pagamento: "PIX/Transferência",
    },
  });

  const nucleosSelecionados = watch("nucleos_selecionados") || [];
  const clienteSelecionado = watch("cliente_id");

  // VALIDAÇÍO: Novos contratos DEVEM vir de uma proposta aprovada
  useEffect(() => {
    if (!isEdicao && !propostaId) {
      toast.error(
        "Para criar um contrato, você precisa aprovar uma proposta primeiro."
      );
      navigate("/propostas");
    }
  }, [isEdicao, propostaId, navigate]);

  // Quando um cliente é selecionado (dropdown), carregar os dados dele automaticamente.
  useEffect(() => {
    if (clienteSelecionado) {
      handleClienteChange(clienteSelecionado);
    }
  }, [clienteSelecionado]);

  // Carregar clientes
  useEffect(() => {
    async function carregarClientes() {
      try {
        const { data } = await supabase
          .from("vw_clientes_completos")
          .select("*")
          .order("nome");
        if (data) setClientes(data);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    }
    carregarClientes();
  }, []);

  // Carregar categorias para os itens do contrato
  useEffect(() => {
    async function carregarCategorias() {
      try {
        const { data, error } = await supabase
          .from("pricelist_categorias")
          .select("id, nome")
          .order("nome");

        if (error) throw error;
        setCategorias(data || []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setCategorias([]);
      }
    }

    carregarCategorias();
  }, []);

  // Carregar contas bancárias por empresa
  useEffect(() => {
    async function carregarContasBancarias() {
      try {
        if (empresaId) {
          const { data, error } = await supabase
            .from("empresas_contas_bancarias")
            .select(
              "id, apelido, banco_nome, banco_codigo, tipo, tipo_conta, pix_tipo, pix_chave"
            )
            .eq("ativo", true)
            .eq("empresa_id", empresaId)
            .order("padrao", { ascending: false });

          if (error) throw error;

          const contasNormalizadas = (data || []).map((conta: any) => ({
            id: conta.id,
            nome: conta.apelido || conta.banco_nome || conta.banco_codigo,
            banco: conta.banco_nome || conta.banco_codigo,
            integracao_tipo: conta.tipo || "Manual",
            nucleo: "grupo",
            tipo_conta: conta.tipo_conta || null,
            pix_tipo: conta.pix_tipo || null,
            pix_chave: conta.pix_chave || null,
          }));

          setContasBancarias(contasNormalizadas);
          return;
        }

        const { data, error } = await supabase
          .from("contas_bancarias")
          .select("*")
          .eq("ativo", true)
          .order("nucleo");

        if (error) {
          if (import.meta.env.DEV) console.log("Tabela contas_bancarias nÍo existe ainda:", error.message);
          return;
        }
        setContasBancarias(data || []);
      } catch (error) {
        console.error("Erro ao carregar contas bancárias:", error);
      }
    }

    carregarContasBancarias();
  }, [empresaId]);

  // Carregar especificadores (parceiros/indicadores)
  useEffect(() => {
    async function carregarEspecificadores() {
      try {
        const { data, error } = await supabase
          .from("pessoas")
          .select("id, nome, email, telefone")
          .eq("tipo", "ESPECIFICADOR")
          .eq("ativo", true)
          .order("nome");

        if (error) {
          console.error("Erro ao carregar especificadores:", error);
          return;
        }
        setEspecificadores(data || []);
      } catch (error) {
        console.error("Erro ao carregar especificadores:", error);
      }
    }

    carregarEspecificadores();
  }, []);

  // Handler para auto-preenchimento quando cliente é selecionado
  async function handleClienteChange(clienteId: string) {
    if (!clienteId) {
      // Limpar campos se nenhum cliente selecionado
      setValue("cliente_nome", "");
      setValue("cliente_cpf", "");
      setValue("cliente_rg", "");
      setValue("cliente_telefone", "");
      setValue("cliente_email", "");
      setValue("cliente_nacionalidade", "");
      setValue("cliente_estado_civil", "");
      setValue("cliente_profissao", "");
      setValue("cliente_endereco", "");
      setValue("cliente_bairro", "");
      setValue("cliente_cidade", "");
      setValue("cliente_estado", "");
      setValue("cliente_cep", "");
      setValue("imovel_endereco", "");
      setValue("imovel_bairro", "");
      setValue("imovel_cidade", "");
      setValue("imovel_estado", "");
      setValue("imovel_cep", "");
      return;
    }

    try {
      const { data: cliente, error } = await supabase
        .from("vw_clientes_completos")
        .select("*")
        .eq("id", clienteId)
        .single();

      if (error || !cliente) {
        console.error("Erro ao buscar cliente:", error);
        return;
      }

      // Preencher todos os dados do cliente
      setValue("cliente_nome", cliente.nome || "");
      setValue("cliente_cpf", cliente.cpf || "");
      setValue("cliente_rg", cliente.rg || "");
      setValue("cliente_telefone", cliente.telefone || "");
      setValue("cliente_email", cliente.email || "");
      setValue("cliente_nacionalidade", cliente.nacionalidade || "Brasileira");
      setValue("cliente_estado_civil", cliente.estado_civil || "");
      setValue("cliente_profissao", cliente.profissao || "");
      setValue(
        "cliente_endereco",
        cliente.logradouro +
          (cliente.numero ? ", " + cliente.numero : "") +
          (cliente.complemento ? " - " + cliente.complemento : "")
      );
      setValue("cliente_bairro", cliente.bairro || "");
      setValue("cliente_cidade", cliente.cidade || "");
      setValue("cliente_estado", cliente.estado || "");
      setValue("cliente_cep", cliente.cep || "");

      // Preencher endereço do imóvel
      if (cliente.obra_endereco_diferente) {
        // Usar endereço da obra
        setValue(
          "imovel_endereco",
          cliente.obra_logradouro +
            (cliente.obra_numero ? ", " + cliente.obra_numero : "") +
            (cliente.obra_complemento ? " - " + cliente.obra_complemento : "")
        );
        setValue("imovel_bairro", cliente.obra_bairro || "");
        setValue("imovel_cidade", cliente.obra_cidade || "");
        setValue("imovel_estado", cliente.obra_estado || "");
        setValue("imovel_cep", cliente.obra_cep || "");
      } else {
        // Copiar endereço do cliente para o imóvel
        setValue(
          "imovel_endereco",
          cliente.logradouro +
            (cliente.numero ? ", " + cliente.numero : "") +
            (cliente.complemento ? " - " + cliente.complemento : "")
        );
        setValue("imovel_bairro", cliente.bairro || "");
        setValue("imovel_cidade", cliente.cidade || "");
        setValue("imovel_estado", cliente.estado || "");
        setValue("imovel_cep", cliente.cep || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error);
    }
  }

  // Timestamp da URL para forçar reload quando necessário
  const urlTimestamp = searchParams.get("_t");

  // Carregar dados da proposta
  useEffect(() => {
    if (propostaId && !id) {
      async function carregarProposta() {
        try {
          if (!propostaId) return;
          setCarregando(true);
          const propostaData = await buscarProposta(propostaId);
          setProposta(propostaData);
          setEmpresaId((propostaData as any).empresa_id ?? null);

          // Preencher dados básicos
          setValue(
            "descricao",
            propostaData.descricao || propostaData.titulo || ""
          );

          // Buscar dados do cliente - VALIDAR SE EXISTE
          if (propostaData.cliente_id) {
            const { data: clienteData, error: clienteError } = await supabase
              .from("vw_clientes_completos")
              .select("*")
              .eq("id", propostaData.cliente_id)
              .single();

            if (clienteError || !clienteData) {
              console.error(
                "Cliente da proposta nÍo encontrado:",
                clienteError
              );
              toast({
                variant: "destructive",
                title: "Cliente nÍo encontrado",
                description: "O cliente desta proposta nÍo foi encontrado no sistema. Por favor, selecione um cliente válido antes de criar o contrato.",
              });
              // NÍo definir cliente_id - usuário precisará selecionar manualmente
              setValue("cliente_id", "");
            } else {
              // Cliente encontrado - preencher todos os dados
              setValue("cliente_id", propostaData.cliente_id);
              setValue("cliente_nome", clienteData.nome || "");
              setValue("cliente_cpf", clienteData.cpf || "");
              setValue("cliente_rg", clienteData.rg || "");
              setValue("cliente_telefone", clienteData.telefone || "");
              setValue("cliente_email", clienteData.email || "");
              const enderecoCompleto = clienteData.logradouro
                ? `${clienteData.logradouro}${
                    clienteData.numero ? ", " + clienteData.numero : ""
                  }${
                    clienteData.complemento
                      ? " - " + clienteData.complemento
                      : ""
                  }`
                : clienteData.endereco_completo || "";
              setValue("cliente_endereco", enderecoCompleto || "");
              setValue("cliente_bairro", clienteData.bairro || "");
              setValue("cliente_cidade", clienteData.cidade || "");
              setValue("cliente_estado", clienteData.estado || "");
              setValue("cliente_cep", clienteData.cep || "");
              setValue(
                "cliente_nacionalidade",
                clienteData.nacionalidade || ""
              );
              setValue("cliente_estado_civil", clienteData.estado_civil || "");
              setValue("cliente_profissao", clienteData.profissao || "");

              // Buscar dados da oportunidade para regras de obra
              // Primeiro tenta via proposta, depois via cliente
              let oportunidadeId = propostaData.oportunidade_id;
              if (!oportunidadeId && clienteData.id) {
                // Buscar oportunidade mais recente do cliente
                const { data: oportunidadeCliente } = await supabase
                  .from("oportunidades")
                  .select("id")
                  .eq("cliente_id", clienteData.id)
                  .order("criado_em", { ascending: false })
                  .limit(1)
                  .single();
                if (oportunidadeCliente) {
                  oportunidadeId = oportunidadeCliente.id;
                }
              }

              // Se encontrou oportunidade, buscar regras de obra
              if (oportunidadeId) {
                const { data: oportunidadeData } = await supabase
                  .from("oportunidades")
                  .select("titulo, condominio_nome, condominio_contato, obra_seg_sex_entrada, obra_seg_sex_saida, obra_sab_entrada, obra_sab_saida, obra_regras_obs")
                  .eq("id", oportunidadeId)
                  .single();

                if (oportunidadeData) {
                  // Preencher endereço da obra com o título da oportunidade
                  if (oportunidadeData.titulo) {
                    setValue("imovel_endereco", oportunidadeData.titulo);
                  }
                  // Preencher condomínio
                  if (oportunidadeData.condominio_nome) {
                    setValue("imovel_condominio", oportunidadeData.condominio_nome);
                  }
                  // Preencher horários
                  if (oportunidadeData.obra_seg_sex_entrada && oportunidadeData.obra_seg_sex_saida) {
                    setValue("imovel_horario_seg_sex", `${oportunidadeData.obra_seg_sex_entrada} - ${oportunidadeData.obra_seg_sex_saida}`);
                  }
                  if (oportunidadeData.obra_sab_entrada && oportunidadeData.obra_sab_saida) {
                    setValue("imovel_horario_sabado", `${oportunidadeData.obra_sab_entrada} - ${oportunidadeData.obra_sab_saida}`);
                  }
                  // Preencher observações nas observações do contrato
                  if (oportunidadeData.obra_regras_obs) {
                    setValue("observacoes", oportunidadeData.obra_regras_obs);
                  }
                }
              }
            }
          } else {
            // Proposta sem cliente_id
            toast({
              variant: "destructive",
              title: "Proposta sem cliente",
              description: "Esta proposta nÍo possui um cliente associado. Por favor, selecione um cliente antes de criar o contrato.",
            });
            setValue("cliente_id", "");
          }

          // Buscar itens da proposta
          const { data: itensData } = await supabase
            .from("propostas_itens")
            .select("*")
            .eq("proposta_id", propostaId)
            .order("ordem", { ascending: true });

          if (itensData) {
            // Completar dados dos itens a partir do Pricelist
            const itens = [...itensData];

            // Buscar TODOS os pricelist_item_id para completar dados
            const pricelistIds = itens
              .filter((i) => i.pricelist_item_id)
              .map((i) => i.pricelist_item_id);

            // Mapa com dados completos do pricelist
            const pricelistMap = new Map<string, any>();

            if (pricelistIds.length > 0) {
              const { data: itensPricelist } = await supabase
                .from("pricelist_itens")
                .select(
                  `
                  id, nome, nucleo_id, categoria_id, tipo, preco, unidade, descricao,
                  nucleo:nucleos!nucleo_id (id, nome)
                `
                )
                .in("id", pricelistIds);

              // Buscar categorias
              const categoriaIds = (itensPricelist || [])
                .map((pi: any) => pi.categoria_id)
                .filter((v) => v);

              let categoriasMap = new Map<
                string,
                {
                  codigo: string | null;
                  nome: string | null;
                  tipo: string | null;
                }
              >();

              if (categoriaIds.length > 0) {
                const { data: cats } = await supabase
                  .from("pricelist_categorias")
                  .select("id, codigo, nome, tipo")
                  .in("id", categoriaIds as string[]);

                (cats || []).forEach((c: any) =>
                  categoriasMap.set(c.id, {
                    codigo: c.codigo,
                    nome: c.nome,
                    tipo: c.tipo,
                  })
                );
              }

              // Construir mapa completo do pricelist
              (itensPricelist || []).forEach((pi: any) => {
                // NOVO: Usar o nome do núcleo do join, nÍo mais campo direto
                let nucleo = normalizarNucleo(pi.nucleo?.nome) || null;
                if (!nucleo && pi.categoria_id) {
                  const cat = categoriasMap.get(pi.categoria_id);
                  nucleo =
                    normalizarNucleo(cat?.codigo) ||
                    inferirNucleoPorCategoria(
                      cat?.codigo,
                      cat?.nome,
                      cat?.tipo
                    ) ||
                    null;
                }
                pricelistMap.set(pi.id, {
                  nucleo: nucleo,
                  nucleo_id: pi.nucleo_id,
                  tipo: pi.tipo || "material",
                  categoria_id: pi.categoria_id,
                  preco: pi.preco || 0,
                  nome: pi.nome,
                  unidade: pi.unidade,
                  descricao: pi.descricao,
                });
              });
            }

            // Preencher dados dos itens com informações do pricelist
            itens.forEach((item) => {
              if (item.pricelist_item_id) {
                const pricelistData = pricelistMap.get(item.pricelist_item_id);
                if (pricelistData) {
                  // Completar núcleo se nÍo tiver
                  if (!item.nucleo) {
                    item.nucleo = pricelistData.nucleo || "arquitetura";
                  } else {
                    item.nucleo = normalizarNucleo(item.nucleo) || item.nucleo;
                  }

                  // Completar tipo se nÍo tiver ou estiver vazio
                  if (!item.tipo) {
                    item.tipo = pricelistData.tipo || "material";
                  }

                  // Completar categoria_id se nÍo tiver
                  if (!item.categoria_id) {
                    item.categoria_id = pricelistData.categoria_id;
                  }

                  // Completar valor_unitario se nÍo tiver ou for 0
                  if (!item.valor_unitario || item.valor_unitario === 0) {
                    item.valor_unitario = pricelistData.preco || 0;
                  }

                  // Recalcular valor_subtotal se necessário
                  if (!item.valor_subtotal || item.valor_subtotal === 0) {
                    item.valor_subtotal =
                      (item.quantidade || 1) * (item.valor_unitario || 0);
                  }
                }
              } else if (item.nucleo) {
                item.nucleo = normalizarNucleo(item.nucleo) || item.nucleo;
              }

              // Garantir que tipo tem um valor padrÍo
              if (!item.tipo) {
                item.tipo = "material";
              }
            });

            // Agrupar itens por núcleo
            const grupos: Record<string, any[]> = {
              arquitetura: [],
              engenharia: [],
              marcenaria: [],
            };

            let totaisArquitetura = { total: 0, maoObra: 0, materiais: 0 };
            let totaisEngenharia = { total: 0, maoObra: 0, materiais: 0 };
            let totaisMarcenaria = { total: 0, maoObra: 0, materiais: 0 };

            itens.forEach((item) => {
              const nucleo = item.nucleo || "arquitetura";
              if (grupos[nucleo]) {
                grupos[nucleo].push(item);

                // Calcular totais (usando valor_subtotal que é a coluna correta no banco)
                // Arredondar para evitar problemas de ponto flutuante
                const valorTotal = arredondar2Casas(
                  item.valor_subtotal ||
                    item.quantidade * item.valor_unitario ||
                    0
                );
                if (nucleo === "arquitetura") {
                  totaisArquitetura.total = arredondar2Casas(
                    totaisArquitetura.total + valorTotal
                  );
                  if (item.tipo === "mao_obra")
                    totaisArquitetura.maoObra = arredondar2Casas(
                      totaisArquitetura.maoObra + valorTotal
                    );
                  if (item.tipo === "material")
                    totaisArquitetura.materiais = arredondar2Casas(
                      totaisArquitetura.materiais + valorTotal
                    );
                } else if (nucleo === "engenharia") {
                  totaisEngenharia.total = arredondar2Casas(
                    totaisEngenharia.total + valorTotal
                  );
                  if (item.tipo === "mao_obra")
                    totaisEngenharia.maoObra = arredondar2Casas(
                      totaisEngenharia.maoObra + valorTotal
                    );
                  if (item.tipo === "material")
                    totaisEngenharia.materiais = arredondar2Casas(
                      totaisEngenharia.materiais + valorTotal
                    );
                } else if (nucleo === "marcenaria") {
                  totaisMarcenaria.total = arredondar2Casas(
                    totaisMarcenaria.total + valorTotal
                  );
                  if (item.tipo === "mao_obra")
                    totaisMarcenaria.maoObra = arredondar2Casas(
                      totaisMarcenaria.maoObra + valorTotal
                    );
                  if (item.tipo === "material")
                    totaisMarcenaria.materiais = arredondar2Casas(
                      totaisMarcenaria.materiais + valorTotal
                    );
                }
              }
            });

            setItensPorNucleo(grupos as Record<UnidadeNegocio, any[]>);

            // Definir valores iniciais por núcleo
            setValoresPorNucleo({
              arquitetura: {
                valor_total: totaisArquitetura.total,
                valor_mao_obra: totaisArquitetura.maoObra,
                valor_materiais: totaisArquitetura.materiais,
              },
              engenharia: {
                valor_total: totaisEngenharia.total,
                valor_mao_obra: totaisEngenharia.maoObra,
                valor_materiais: totaisEngenharia.materiais,
              },
              marcenaria: {
                valor_total: totaisMarcenaria.total,
                valor_mao_obra: totaisMarcenaria.maoObra,
                valor_materiais: totaisMarcenaria.materiais,
              },
            } as Record<UnidadeNegocio, any>);

            // Auto-selecionar núcleos que têm itens
            const nucleosComItens: ("arquitetura" | "engenharia" | "marcenaria")[] = [];
            if (grupos.arquitetura.length > 0)
              nucleosComItens.push("arquitetura");
            if (grupos.engenharia.length > 0)
              nucleosComItens.push("engenharia");
            if (grupos.marcenaria.length > 0)
              nucleosComItens.push("marcenaria");

            setValue("nucleos_selecionados", nucleosComItens);

            // Carregar configuraçÍo de pagamento da proposta
            // IMPORTANTE: Aplicar valores ajustados na proposta para os núcleos do contrato
            if (propostaData.percentual_entrada !== undefined || propostaData.numero_parcelas !== undefined) {
              const novoPagamentoPorNucleo = { ...pagamentoPorNucleo };

              // Aplicar valores da proposta para todos os núcleos selecionados
              nucleosComItens.forEach((nucleo) => {
                // Aplicar estrutura de pagamento da proposta (entrada + parcelas)
                if (propostaData.percentual_entrada !== undefined && propostaData.percentual_entrada !== null) {
                  novoPagamentoPorNucleo[nucleo].percentual_entrada = propostaData.percentual_entrada;
                }

                if (propostaData.numero_parcelas !== undefined && propostaData.numero_parcelas !== null) {
                  novoPagamentoPorNucleo[nucleo].numero_parcelas = propostaData.numero_parcelas;
                }

                // Ajustar para pagamento à vista se a proposta for à vista
                if (propostaData.forma_pagamento === "a_vista") {
                  novoPagamentoPorNucleo[nucleo].percentual_entrada = 100;
                  novoPagamentoPorNucleo[nucleo].numero_parcelas = 0;
                }
              });

              setPagamentoPorNucleo(novoPagamentoPorNucleo);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar proposta:", error);
          toast({ variant: "destructive", title: "Erro ao carregar dados da proposta" });
        } finally {
          setCarregando(false);
        }
      }
      carregarProposta();
    }
  }, [propostaId, id, setValue, urlTimestamp]);

  // Carregar dados do contrato existente (modo ediçÍo)
  useEffect(() => {
    if (id && !propostaId) {
      async function carregarContrato() {
        try {
          if (!id) return;
          setCarregando(true);
          const contratoData = await buscarContrato(id);
          const sv = setValue as unknown as (name: string, value: any) => void;
          const cd = contratoData as any;

          // Preencher dados básicos do contrato (uso de `sv` para evitar checagens de chave estritas)
          sv("descricao", cd.descricao || "");
          sv("objeto", cd.objeto || "");
          sv(
            "data_inicio",
            cd.data_inicio
              ? new Date(cd.data_inicio).toISOString().split("T")[0]
              : ""
          );
          sv("prazo_execucao_dias", cd.prazo_execucao_dias || 60);

          // Preencher dados do cliente
          sv("cliente_id", cd.cliente_id || "");
          sv("cliente_nome", cd.cliente_nome || "");
          sv("cliente_cpf", cd.cliente_cpf || "");
          sv("cliente_rg", cd.cliente_rg || "");
          sv("cliente_telefone", cd.cliente_telefone || "");
          sv("cliente_email", cd.cliente_email || "");
          sv("cliente_endereco", cd.cliente_endereco || "");
          sv("cliente_bairro", cd.cliente_bairro || "");
          sv("cliente_cidade", cd.cliente_cidade || "");
          sv("cliente_estado", cd.cliente_estado || "");
          sv("cliente_cep", cd.cliente_cep || "");
          sv("cliente_nacionalidade", cd.cliente_nacionalidade || "");
          sv("cliente_estado_civil", cd.cliente_estado_civil || "");
          sv("cliente_profissao", cd.cliente_profissao || "");

          const dadosImovelContrato =
            ((contratoData as any)?.dados_imovel_json as Record<
              string,
              any
            > | null) || null;

          // Preencher dados do imóvel
          const contratoAny = contratoData as any;
          if (
            contratoAny.imovel_endereco ||
            dadosImovelContrato?.endereco_completo
          ) {
            setEnderecoObraDiferente(true);
            setValue(
              "imovel_endereco",
              contratoAny.imovel_endereco ||
                dadosImovelContrato?.endereco_completo ||
                ""
            );
            setValue(
              "imovel_numero",
              contratoAny.imovel_numero || dadosImovelContrato?.numero || ""
            );
            setValue(
              "imovel_complemento",
              contratoAny.imovel_complemento ||
                dadosImovelContrato?.complemento ||
                ""
            );
            setValue(
              "imovel_apartamento",
              contratoAny.imovel_apartamento ||
                dadosImovelContrato?.apartamento ||
                ""
            );
            setValue(
              "imovel_torre",
              contratoAny.imovel_torre || dadosImovelContrato?.torre || ""
            );
            setValue(
              "imovel_condominio",
              contratoAny.imovel_condominio ||
                dadosImovelContrato?.condominio ||
                ""
            );
            setValue(
              "imovel_bairro",
              contratoAny.imovel_bairro || dadosImovelContrato?.bairro || ""
            );
            setValue(
              "imovel_cidade",
              contratoAny.imovel_cidade || dadosImovelContrato?.cidade || ""
            );
            setValue(
              "imovel_estado",
              contratoAny.imovel_estado || dadosImovelContrato?.estado || ""
            );
            setValue(
              "imovel_cep",
              contratoAny.imovel_cep || dadosImovelContrato?.cep || ""
            );
            setValue(
              "imovel_matricula",
              contratoAny.imovel_matricula ||
                dadosImovelContrato?.matricula ||
                ""
            );
            setValue(
              "imovel_inscricao",
              contratoAny.imovel_inscricao ||
                dadosImovelContrato?.inscricao_imobiliaria ||
                ""
            );
            setValue(
              "imovel_horario_seg_sex",
              (contratoData as any)?.imovel_horario_seg_sex ||
                dadosImovelContrato?.horario_seg_sex ||
                ""
            );
            setValue(
              "imovel_horario_sabado",
              (contratoData as any)?.imovel_horario_sabado ||
                dadosImovelContrato?.horario_sabado ||
                ""
            );
          }

          // Carregar itens do contrato agrupados por núcleo
          if (contratoData.itens && contratoData.itens.length > 0) {
            const grupos: Record<string, any[]> = {
              arquitetura: [],
              engenharia: [],
              marcenaria: [],
            };

            let totaisArquitetura = { total: 0, maoObra: 0, materiais: 0 };
            let totaisEngenharia = { total: 0, maoObra: 0, materiais: 0 };
            let totaisMarcenaria = { total: 0, maoObra: 0, materiais: 0 };

            contratoData.itens.forEach((item: any) => {
              const nucleo = item.nucleo || "arquitetura";
              if (grupos[nucleo]) {
                grupos[nucleo].push(item);

                const valorTotal = arredondar2Casas(
                  item.valor_subtotal || item.valor_total || 0
                );
                if (nucleo === "arquitetura") {
                  totaisArquitetura.total = arredondar2Casas(
                    totaisArquitetura.total + valorTotal
                  );
                } else if (nucleo === "engenharia") {
                  totaisEngenharia.total = arredondar2Casas(
                    totaisEngenharia.total + valorTotal
                  );
                } else if (nucleo === "marcenaria") {
                  totaisMarcenaria.total = arredondar2Casas(
                    totaisMarcenaria.total + valorTotal
                  );
                }
              }
            });

            setItensPorNucleo(grupos as Record<UnidadeNegocio, any[]>);

            // Definir valores por núcleo
            setValoresPorNucleo({
              arquitetura: {
                valor_total: totaisArquitetura.total,
                valor_mao_obra: totaisArquitetura.maoObra,
                valor_materiais: totaisArquitetura.materiais,
              },
              engenharia: {
                valor_total: totaisEngenharia.total,
                valor_mao_obra: totaisEngenharia.maoObra,
                valor_materiais: totaisEngenharia.materiais,
              },
              marcenaria: {
                valor_total: totaisMarcenaria.total,
                valor_mao_obra: totaisMarcenaria.maoObra,
                valor_materiais: totaisMarcenaria.materiais,
              },
            } as Record<UnidadeNegocio, any>);

            // Definir núcleos selecionados
            const nucleosComItens: ("arquitetura" | "engenharia" | "marcenaria")[] = [];
            if (grupos.arquitetura.length > 0)
              nucleosComItens.push("arquitetura");
            if (grupos.engenharia.length > 0)
              nucleosComItens.push("engenharia");
            if (grupos.marcenaria.length > 0)
              nucleosComItens.push("marcenaria");

            setValue("nucleos_selecionados", nucleosComItens);
          }
        } catch (error) {
          console.error("Erro ao carregar contrato:", error);
          toast({ variant: "destructive", title: "Erro ao carregar dados do contrato" });
        } finally {
          setCarregando(false);
        }
      }
      carregarContrato();
    }
  }, [id, propostaId, setValue]);

  // Atualizar dados do cliente quando selecionado
  const clienteIdWatch = watch("cliente_id");
  useEffect(() => {
    if (clienteIdWatch && !propostaId) {
      const cliente = clientes.find((c) => c.id === clienteIdWatch);
      if (cliente) {
        setValue("cliente_nome", cliente.nome || "");
        setValue("cliente_cpf", cliente.cpf || "");
        setValue("cliente_rg", cliente.rg || "");
        setValue("cliente_telefone", cliente.telefone || "");
        setValue("cliente_email", cliente.email || "");
        setValue("cliente_endereco", cliente.endereco_completo || "");
        setValue("cliente_bairro", cliente.bairro || "");
        setValue("cliente_cidade", cliente.cidade || "");
        setValue("cliente_estado", cliente.estado || "");
        setValue("cliente_cep", cliente.cep || "");
        setValue("cliente_nacionalidade", cliente.nacionalidade || "");
        setValue("cliente_estado_civil", cliente.estado_civil || "");
        setValue("cliente_profissao", cliente.profissao || "");
      }
    }
  }, [clienteIdWatch, clientes, setValue, propostaId]);

  // Auto-preencher endereço do imóvel com endereço do cliente se nÍo for diferente
  const clienteEndereco = watch("cliente_endereco");
  const clienteBairro = watch("cliente_bairro");
  const clienteCidade = watch("cliente_cidade");
  const clienteEstado = watch("cliente_estado");
  const clienteCep = watch("cliente_cep");

  useEffect(() => {
    if (!enderecoObraDiferente) {
      // Copiar endereço do cliente para o imóvel
      setValue("imovel_endereco", clienteEndereco || "");
      setValue("imovel_bairro", clienteBairro || "");
      setValue("imovel_cidade", clienteCidade || "");
      setValue("imovel_estado", clienteEstado || "");
      setValue("imovel_cep", clienteCep || "");
    }
  }, [
    enderecoObraDiferente,
    clienteEndereco,
    clienteBairro,
    clienteCidade,
    clienteEstado,
    clienteCep,
    setValue,
  ]);

  async function onSubmit(data: ContratoMultiNucleoFormFields) {
    setLoading(true);

    try {
      // VALIDAÇÍO CRÍTICA: Verificar se cliente_id existe no banco
      if (!data.cliente_id) {
        toast({ variant: "destructive", title: "Cliente obrigatório", description: "Por favor, selecione um cliente antes de criar o contrato." });
        setLoading(false);
        return;
      }

      const { data: clienteExiste, error: erroValidacao } = await supabase
        .from("pessoas")
        .select("id")
        .eq("id", data.cliente_id)
        .single();

      if (erroValidacao || !clienteExiste) {
        toast({
          variant: "destructive",
          title: "Cliente inválido",
          description: "O cliente selecionado nÍo existe no sistema. Por favor, selecione um cliente válido da lista.",
        });
        setLoading(false);
        return;
      }

      // Construir payload para API
      const payload: ContratoMultiNucleoFormData = {
        proposta_id: propostaId || undefined,
        cliente_id: data.cliente_id,
        nucleos_selecionados: data.nucleos_selecionados,
        descricao: data.descricao,
        observacoes: data.observacoes,

        // Prazos por núcleo
        prazos_por_nucleo: data.nucleos_selecionados.reduce((acc, nucleo) => {
          const n = nucleo as UnidadeNegocio;
          acc[n] = {
            duracao_dias_uteis: duracoesPorNucleo[n],
          };
          return acc;
        }, {} as Record<UnidadeNegocio, any>),

        // Valores por núcleo
        valores_por_nucleo: data.nucleos_selecionados.reduce((acc, nucleo) => {
          const n = nucleo as UnidadeNegocio;
          acc[n] = valoresPorNucleo[n];
          return acc;
        }, {} as Record<UnidadeNegocio, any>),

        // Forma de pagamento (configuraçÍo individual por núcleo)
        forma_pagamento: data.forma_pagamento, // fallback global
        percentual_entrada: data.percentual_entrada, // fallback global
        numero_parcelas: data.numero_parcelas, // fallback global

        // NOVO: ConfiguraçÍo de pagamento POR NÚCLEO
        pagamento_por_nucleo: data.nucleos_selecionados.reduce(
          (acc, nucleo) => {
            const n = nucleo as UnidadeNegocio;
            acc[n] = pagamentoPorNucleo[n];
            return acc;
          },
          {} as Record<UnidadeNegocio, any>
        ),

        // Dados do cliente
        dados_cliente: {
          nome: data.cliente_nome,
          cpf: data.cliente_cpf,
          rg: data.cliente_rg,
          nacionalidade: data.cliente_nacionalidade,
          estado_civil: data.cliente_estado_civil,
          profissao: data.cliente_profissao,
          telefone: data.cliente_telefone,
          email: data.cliente_email,
          endereco: data.cliente_endereco,
          bairro: data.cliente_bairro,
          cidade: data.cliente_cidade,
          estado: data.cliente_estado,
          cep: data.cliente_cep,
        },

        // Dados do imóvel
        dados_imovel: {
          endereco_completo: data.imovel_endereco,
          numero: data.imovel_numero,
          complemento: data.imovel_complemento,
          apartamento: data.imovel_apartamento,
          torre: data.imovel_torre,
          condominio: data.imovel_condominio,
          bairro: data.imovel_bairro,
          cidade: data.imovel_cidade,
          estado: data.imovel_estado,
          cep: data.imovel_cep,
          matricula: data.imovel_matricula,
          inscricao_imobiliaria: data.imovel_inscricao,
          horario_seg_sex: data.imovel_horario_seg_sex,
          horario_sabado: data.imovel_horario_sabado,
        },

        // Dados do especificador/indicaçÍo
        especificador_id:
          temEspecificador && especificadorId ? especificadorId : undefined,
        tem_especificador: temEspecificador,
        codigo_rastreamento:
          temEspecificador && codigoRastreamento
            ? codigoRastreamento
            : undefined,
        observacoes_indicacao:
          temEspecificador && observacoesIndicacao
            ? observacoesIndicacao
            : undefined,

        // Itens por núcleo (do memorial da proposta)
        itens_por_nucleo: data.nucleos_selecionados.reduce((acc, nucleo) => {
          acc[nucleo as UnidadeNegocio] = itensPorNucleo[
            nucleo as UnidadeNegocio
          ].map((item) => ({
            ...item,
            tipo: item.tipo || "material",
          }));
          return acc;
        }, {} as Record<UnidadeNegocio, any[]>),
      };

      const resultado = await criarContratoMultiNucleo(payload);

      toast({
        title: `${resultado.totalContratos} contrato(s) criado(s) com sucesso!`,
        description: `IDs: ${resultado.contratosIds.join(", ")}`,
      });

      navigate("/contratos");
    } catch (error: any) {
      console.error("Erro ao criar contratos:", error);
      toast({ variant: "destructive", title: "Erro ao criar contratos", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26]" />
          <p className="text-sm text-gray-600 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/contratos")}
          className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Voltar
        </button>
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
          {isEdicao
            ? "Editar Contrato"
            : propostaId
            ? "Criar Contratos da Proposta"
            : "Novo Contrato"}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {isEdicao
            ? "Edite os dados do contrato existente."
            : "Preencha os dados para criar os contratos. Você pode selecionar múltiplos núcleos."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SeçÍo: Núcleos Selecionados */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">
            Núcleos de Negócio
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Selecione os núcleos para os quais deseja criar contratos (1, 2 ou 3
            núcleos)
          </p>

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                {
                  value: "arquitetura",
                  label: "Arquitetura",
                  color: "#8B5CF6",
                  itens: itensPorNucleo.arquitetura.length,
                },
                {
                  value: "engenharia",
                  label: "Engenharia",
                  color: "#3B82F6",
                  itens: itensPorNucleo.engenharia.length,
                },
                {
                  value: "marcenaria",
                  label: "Marcenaria",
                  color: "#F59E0B",
                  itens: itensPorNucleo.marcenaria.length,
                },
              ] as const
            ).map((nucleo) => (
              <Controller
                key={nucleo.value}
                name="nucleos_selecionados"
                control={control}
                render={({ field }) => {
                  const isSelected = field.value?.includes(nucleo.value);
                  return (
                    <label
                      className={`flex flex-col items-center justify-center px-4 py-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-current text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                      style={
                        isSelected ? { backgroundColor: nucleo.color } : {}
                      }
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...(field.value || []), nucleo.value]
                            : field.value?.filter((v) => v !== nucleo.value) ||
                              [];
                          field.onChange(newValue);
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-normal mb-1">
                        {nucleo.label}
                      </span>
                      {nucleo.itens > 0 && (
                        <span className="text-xs opacity-90">
                          {nucleo.itens} itens
                        </span>
                      )}
                    </label>
                  );
                }}
              />
            ))}
          </div>
          {errors.nucleos_selecionados && (
            <p className="text-sm text-red-600 mt-2">
              {errors.nucleos_selecionados.message}
            </p>
          )}
        </div>

        {/* SeçÍo: Cliente */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">Cliente</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Selecionar Cliente *
                {propostaId && watch("cliente_id") && (
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    (carregado da proposta)
                  </span>
                )}
                {propostaId && !watch("cliente_id") && (
                  <span className="ml-2 text-xs font-normal text-red-600">
                    (cliente da proposta nÍo encontrado - selecione manualmente)
                  </span>
                )}
              </label>
              <select
                {...register("cliente_id")}
                onChange={(e) => {
                  setValue("cliente_id", e.target.value);
                  handleClienteChange(e.target.value);
                }}
                disabled={Boolean(propostaId && watch("cliente_id"))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] ${
                  errors.cliente_id ? "border-red-500" : "border-gray-300"
                } ${
                  propostaId && watch("cliente_id")
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} {cliente.cpf ? `- CPF: ${cliente.cpf}` : ""}
                  </option>
                ))}
              </select>
              {errors.cliente_id && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.cliente_id.message}
                </p>
              )}
            </div>

            {/* SeçÍo: Especificador/IndicaçÍo */}
            <div className="col-span-2 mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="temEspecificador"
                  checked={temEspecificador}
                  onChange={(e) => {
                    setTemEspecificador(e.target.checked);
                    if (!e.target.checked) {
                      setEspecificadorId("");
                      setCodigoRastreamento("");
                      setObservacoesIndicacao("");
                    }
                  }}
                  className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                />
                <label
                  htmlFor="temEspecificador"
                  className="text-sm font-normal text-gray-700"
                >
                  Este cliente foi indicado por um Especificador/Parceiro?
                </label>
              </div>

              {temEspecificador && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="especificador-select">
                      Especificador/Parceiro *
                    </label>
                    <select
                      id="especificador-select"
                      value={especificadorId}
                      onChange={(e) => setEspecificadorId(e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] bg-white"
                      title="Selecione o especificador ou parceiro"
                    >
                      <option value="">Selecione o especificador</option>
                      {especificadores.map((esp) => (
                        <option key={esp.id} value={esp.id}>
                          {esp.nome} {esp.email ? `- ${esp.email}` : ""}
                        </option>
                      ))}
                    </select>
                    {especificadores.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Nenhum especificador cadastrado. Cadastre em Pessoas →
                        Especificadores.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Código de Rastreamento
                    </label>
                    <input
                      type="text"
                      value={codigoRastreamento}
                      onChange={(e) => setCodigoRastreamento(e.target.value)}
                      placeholder="Ex: LINK-001, PARCEIRO-ABC"
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Código do link rastreável usado na indicaçÍo
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Observações sobre a indicaçÍo
                    </label>
                    <input
                      type="text"
                      value={observacoesIndicacao}
                      onChange={(e) => setObservacoesIndicacao(e.target.value)}
                      placeholder="Como o cliente chegou até nós..."
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                {...register("cliente_nome")}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.cliente_nome ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cliente_nome && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.cliente_nome.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                CPF *
              </label>
              <input
                type="text"
                {...register("cliente_cpf")}
                placeholder="000.000.000-00"
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.cliente_cpf ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cliente_cpf && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.cliente_cpf.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                RG
              </label>
              <input
                type="text"
                {...register("cliente_rg")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Telefone
              </label>
              <input
                type="text"
                {...register("cliente_telefone")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                {...register("cliente_email")}
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.cliente_email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cliente_email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.cliente_email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Nacionalidade
              </label>
              <input
                type="text"
                {...register("cliente_nacionalidade")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Estado Civil
              </label>
              <select
                {...register("cliente_estado_civil")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecione</option>
                <option value="Solteiro">Solteiro</option>
                <option value="Casado">Casado</option>
                <option value="Divorciado">Divorciado</option>
                <option value="Viuvo">Viúvo</option>
                <option value="Uniao Estavel">UniÍo Estável</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                ProfissÍo
              </label>
              <input
                type="text"
                {...register("cliente_profissao")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                CEP
              </label>
              <input
                type="text"
                {...register("cliente_cep")}
                placeholder="00000-000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                {...register("cliente_endereco")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                {...register("cliente_bairro")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                {...register("cliente_cidade")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Estado
              </label>
              <select
                {...register("cliente_estado")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecione</option>
                <option value="SP">SÍo Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                {/* Adicionar outros estados */}
              </select>
            </div>
          </div>
        </div>

        {/* SeçÍo: Imóvel */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">
            Dados do Imóvel
          </h2>

          {/* Checkbox: Obra em endereço diferente */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={enderecoObraDiferente}
                onChange={(e) => setEnderecoObraDiferente(e.target.checked)}
                className="w-5 h-5 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26] cursor-pointer"
              />
              <div>
                <span className="text-sm font-normal text-gray-700 group-hover:text-[#F25C26] transition-colors">
                  A obra nÍo é no mesmo endereço cadastrado
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {enderecoObraDiferente
                    ? "Preencha o endereço da obra abaixo"
                    : "O endereço do cliente será usado automaticamente"}
                </p>
              </div>
            </label>
          </div>

          {/* Campos do imóvel - aparecem somente quando checkbox está marcado */}
          {enderecoObraDiferente && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  {...register("imovel_endereco")}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.imovel_endereco
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.imovel_endereco && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.imovel_endereco.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Número
                </label>
                <input
                  type="text"
                  {...register("imovel_numero")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  {...register("imovel_complemento")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Apartamento
                </label>
                <input
                  type="text"
                  {...register("imovel_apartamento")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Torre
                </label>
                <input
                  type="text"
                  {...register("imovel_torre")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Condomínio
                </label>
                <input
                  type="text"
                  {...register("imovel_condominio")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  {...register("imovel_bairro")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  {...register("imovel_cidade")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  {...register("imovel_estado")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecione</option>
                  <option value="SP">SÍo Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  {...register("imovel_cep")}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Matrícula
                </label>
                <input
                  type="text"
                  {...register("imovel_matricula")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  InscriçÍo Imobiliária
                </label>
                <input
                  type="text"
                  {...register("imovel_inscricao")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Dias e horários (segunda a sexta)
                </label>
                <textarea
                  {...register("imovel_horario_seg_sex")}
                  rows={2}
                  placeholder="Ex.: Seg-Sex 08h às 18h"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Dias e horários (sábados)
                </label>
                <textarea
                  {...register("imovel_horario_sabado")}
                  rows={2}
                  placeholder="Ex.: Sábados 09h às 13h ou Sem expediente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* SeçÍo: DescriçÍo do Projeto */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">
            DescriçÍo do Projeto
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                DescriçÍo *
              </label>
              <textarea
                {...register("descricao")}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg resize-none ${
                  errors.descricao ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.descricao && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.descricao.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                {...register("observacoes")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>
          </div>
        </div>

        {/* SeçÍo: Itens e Valores por Núcleo */}
        {nucleosSelecionados.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">
              Itens e Valores por Núcleo
            </h2>

            {nucleosSelecionados.map((nucleo) => {
              const nucleoConfig = {
                arquitetura: { label: "Arquitetura", color: "#8B5CF6" },
                engenharia: { label: "Engenharia", color: "#3B82F6" },
                marcenaria: { label: "Marcenaria", color: "#F59E0B" },
              }[nucleo];

              const itens = itensPorNucleo[nucleo as UnidadeNegocio];

              return (
                <div
                  key={nucleo}
                  className="mb-6 last:mb-0 border-b border-gray-200 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nucleoConfig.color }}
                    />
                    <h3 className="font-normal text-gray-900">
                      {nucleoConfig.label}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({itens.length} itens)
                    </span>
                  </div>

                  {/* ITENS DO MEMORIAL (COM EDIÇÍO) */}
                  {itens.length > 0 && (
                    <div className="mb-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-normal text-gray-600 mb-3">
                        ITENS DO MEMORIAL — EdiçÍo Rápida
                      </p>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {itens.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                          >
                            {/* Linha Superior: Nome + Badge Núcleo */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-normal">
                                {item.quantidade}x {item.nome || item.descricao}
                              </span>

                              <span
                                className="px-2 py-0.5 text-xs rounded-full font-normal"
                                style={{
                                  background:
                                    item.nucleo === "arquitetura"
                                      ? "#EDE9FE"
                                      : item.nucleo === "engenharia"
                                      ? "#DBEAFE"
                                      : "#FEF3C7",
                                  color:
                                    item.nucleo === "arquitetura"
                                      ? "#6D28D9"
                                      : item.nucleo === "engenharia"
                                      ? "#1D4ED8"
                                      : "#B45309",
                                }}
                              >
                                {item.nucleo?.toUpperCase()}
                              </span>
                            </div>

                            {/* Inputs de ediçÍo */}
                            <div className="grid grid-cols-3 gap-3">
                              {/* Tipo */}
                              <div>
                                <label className="text-xs text-gray-600 font-medium" htmlFor={`tipo-select-${nucleo}-${idx}`}>
                                  Tipo
                                </label>
                                <select
                                  id={`tipo-select-${nucleo}-${idx}`}
                                  value={item.tipo}
                                  onChange={(e) => {
                                    const novoTipo = e.target.value;

                                    const updated = [
                                      ...itensPorNucleo[
                                        nucleo as UnidadeNegocio
                                      ],
                                    ];
                                    updated[idx].tipo = novoTipo;

                                    setItensPorNucleo({
                                      ...itensPorNucleo,
                                      [nucleo as UnidadeNegocio]: updated,
                                    });
                                  }}
                                  title="Selecione o tipo do item"
                                  className="w-full text-sm px-2 py-1 border rounded"
                                >
                                  <option value="mao_obra">MÍo de Obra</option>
                                  <option value="material">Material</option>
                                  <option value="servico">Serviço</option>
                                  <option value="produto">Produto</option>
                                </select>
                              </div>

                              {/* Categoria */}
                              <div>
                                <label className="text-xs text-gray-600 font-medium">
                                  Categoria
                                </label>
                                <select
                                  value={item.categoria_id || ""}
                                  onChange={(e) => {
                                    const updated = [
                                      ...itensPorNucleo[
                                        nucleo as UnidadeNegocio
                                      ],
                                    ];
                                    updated[idx].categoria_id =
                                      e.target.value || null; // ✅ Converte "" para null

                                    setItensPorNucleo({
                                      ...itensPorNucleo,
                                      [nucleo as UnidadeNegocio]: updated,
                                    });
                                  }}
                                  className="w-full text-sm px-2 py-1 border rounded"
                                >
                                  <option value="">Selecione</option>
                                  {categorias?.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Valor */}
                              <div>
                                <label className="text-xs text-gray-600 font-medium">
                                  Valor
                                </label>
                                <input
                                  type="number"
                                  className="w-full text-sm px-2 py-1 border rounded"
                                  step="0.01"
                                  title="Valor do item"
                                  placeholder="Digite o valor"
                                  value={arredondar2Casas(
                                    item.valor_subtotal || 0
                                  )}
                                  onChange={(e) => {
                                    const novoValor = arredondar2Casas(
                                      Number(e.target.value) || 0
                                    );

                                    const updated = [
                                      ...itensPorNucleo[
                                        nucleo as UnidadeNegocio
                                      ],
                                    ];
                                    updated[idx].valor_subtotal = novoValor;

                                    setItensPorNucleo({
                                      ...itensPorNucleo,
                                      [nucleo as UnidadeNegocio]: updated,
                                    });

                                    // Recalcular os totais do núcleo (com arredondamento)
                                    const novoTotal = arredondar2Casas(
                                      updated.reduce(
                                        (acc, it) =>
                                          acc + (it.valor_subtotal || 0),
                                        0
                                      )
                                    );

                                    setValoresPorNucleo({
                                      ...valoresPorNucleo,
                                      [nucleo as UnidadeNegocio]: {
                                        ...valoresPorNucleo[
                                          nucleo as UnidadeNegocio
                                        ],
                                        valor_total: novoTotal,
                                      },
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Valores Editáveis */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        Valor Total
                      </label>
                      <input
                        type="number"
                        title="Valor total do núcleo"
                        placeholder="Digite o valor total"
                        value={arredondar2Casas(
                          valoresPorNucleo[nucleo as UnidadeNegocio].valor_total
                        )}
                        onChange={(e) => {
                          setValoresPorNucleo({
                            ...valoresPorNucleo,
                            [nucleo as UnidadeNegocio]: {
                              ...valoresPorNucleo[nucleo as UnidadeNegocio],
                              valor_total: arredondar2Casas(
                                parseFloat(e.target.value) || 0
                              ),
                            },
                          });
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        MÍo de Obra
                      </label>
                      <input
                        type="number"
                        title="Valor de mÍo de obra"
                        placeholder="Digite o valor de mÍo de obra"
                        value={arredondar2Casas(
                          valoresPorNucleo[nucleo as UnidadeNegocio]
                            .valor_mao_obra
                        )}
                        onChange={(e) => {
                          setValoresPorNucleo({
                            ...valoresPorNucleo,
                            [nucleo as UnidadeNegocio]: {
                              ...valoresPorNucleo[nucleo as UnidadeNegocio],
                              valor_mao_obra: arredondar2Casas(
                                parseFloat(e.target.value) || 0
                              ),
                            },
                          });
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        Materiais
                      </label>
                      <input
                        type="number"
                        title="Valor de materiais"
                        placeholder="Digite o valor de materiais"
                        value={arredondar2Casas(
                          valoresPorNucleo[nucleo as UnidadeNegocio]
                            .valor_materiais
                        )}
                        onChange={(e) => {
                          setValoresPorNucleo({
                            ...valoresPorNucleo,
                            [nucleo as UnidadeNegocio]: {
                              ...valoresPorNucleo[nucleo as UnidadeNegocio],
                              valor_materiais: arredondar2Casas(
                                parseFloat(e.target.value) || 0
                              ),
                            },
                          });
                        }}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  {/* DuraçÍo em Dias Úteis */}
                  <div>
                    <label className="block text-xs font-normal text-gray-600 mb-1">
                      DuraçÍo (dias úteis)
                    </label>
                    <input
                      type="number"
                      title="DuraçÍo em dias úteis"
                      placeholder="Digite a duraçÍo"
                      value={duracoesPorNucleo[nucleo]}
                      onChange={(e) => {
                        setDuracoesPorNucleo({
                          ...duracoesPorNucleo,
                          [nucleo]: parseInt(e.target.value) || 0,
                        });
                      }}
                      min="1"
                      className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Data de término estimada:{" "}
                      {new Date(
                        adicionarDiasUteis(
                          new Date(),
                          duracoesPorNucleo[nucleo]
                        )
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SeçÍo: Forma de Pagamento INDIVIDUAL por Núcleo */}
        {nucleosSelecionados.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-2">
              Forma de Pagamento por Núcleo
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure entrada, parcelas e conta bancária individualmente para
              cada núcleo
            </p>

            {nucleosSelecionados.map((nucleo) => {
              const nucleoConfig = {
                arquitetura: {
                  label: "Arquitetura",
                  color: "#8B5CF6",
                  bgColor: "#EDE9FE",
                },
                engenharia: {
                  label: "Engenharia",
                  color: "#3B82F6",
                  bgColor: "#DBEAFE",
                },
                marcenaria: {
                  label: "Marcenaria",
                  color: "#F59E0B",
                  bgColor: "#FEF3C7",
                },
              }[nucleo];

              const valorTotal = arredondar2Casas(
                valoresPorNucleo[nucleo as UnidadeNegocio].valor_total
              );
              const config = pagamentoPorNucleo[nucleo as UnidadeNegocio];
              const valorEntrada = arredondar2Casas(
                valorTotal * (config.percentual_entrada / 100)
              );
              const valorRestante = arredondar2Casas(valorTotal - valorEntrada);
              const valorParcela = arredondar2Casas(
                config.numero_parcelas > 0
                  ? valorRestante / config.numero_parcelas
                  : 0
              );

              // Filtrar contas do núcleo
              const contasDoNucleo = contasBancarias.filter(
                (c) => c.nucleo === nucleo || c.nucleo === "grupo"
              );

              return (
                <div
                  key={nucleo}
                  className="mb-6 last:mb-0 border rounded-xl p-5"
                  style={{
                    borderColor: nucleoConfig.color,
                    backgroundColor: `${nucleoConfig.bgColor}20`,
                  }}
                >
                  {/* Header do Núcleo */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: nucleoConfig.color }}
                      />
                      <h3 className="font-normal text-gray-900 text-[16px]">
                        {nucleoConfig.label}
                      </h3>
                      <span className="text-sm text-gray-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(valorTotal)}
                      </span>
                    </div>

                    {/* Badge Conta Real/Virtual */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo]: { ...config, conta_tipo: "real" },
                          });
                        }}
                        className={`px-3 py-1 text-xs font-normal rounded-full transition-all ${
                          config.conta_tipo === "real"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        Conta Real
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo]: { ...config, conta_tipo: "virtual" },
                          });
                        }}
                        className={`px-3 py-1 text-xs font-normal rounded-full transition-all ${
                          config.conta_tipo === "virtual"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        Conta Virtual
                      </button>
                    </div>
                  </div>

                  {/* Campos de Pagamento */}
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        % Entrada
                      </label>
                      <input
                        type="number"
                        title="Percentual de entrada (%)"
                        placeholder="Digite o percentual de entrada"
                        value={config.percentual_entrada}
                        onChange={(e) => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo]: {
                              ...config,
                              percentual_entrada:
                                parseFloat(e.target.value) || 0,
                            },
                          });
                        }}
                        min="0"
                        max="100"
                        step="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        Nº Parcelas
                      </label>
                      <input
                        type="number"
                        title="Número de parcelas"
                        placeholder="Digite o número de parcelas"
                        value={config.numero_parcelas}
                        onChange={(e) => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo]: {
                              ...config,
                              numero_parcelas: parseInt(e.target.value) || 0,
                            },
                          });
                        }}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-normal text-gray-600 mb-1" htmlFor={`dia-vencimento-${nucleo}`}>
                        Dia Venc.
                      </label>
                      <input
                        id={`dia-vencimento-${nucleo}`}
                        type="number"
                        value={config.dia_vencimento}
                        onChange={(e) => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo]: {
                              ...config,
                              dia_vencimento: parseInt(e.target.value) || 10,
                            },
                          });
                        }}
                        min="1"
                        max="28"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        title="Dia de vencimento da parcela"
                        placeholder="Dia de vencimento"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        Forma Pagamento
                      </label>
                      <select
                        value={config.forma_pagamento}
                        onChange={(e) => {
                          setPagamentoPorNucleo({
                            ...pagamentoPorNucleo,
                            [nucleo as UnidadeNegocio]: {
                              ...config,
                              forma_pagamento: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="PIX/Transferência">
                          PIX/Transferência
                        </option>
                        <option value="Boleto">Boleto</option>
                        <option value="CartÍo (Stripe)">CartÍo (Stripe)</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  {/* ENGENHARIA: Modalidade de Materiais */}
                  {nucleo === "engenharia" &&
                    valoresPorNucleo[nucleo as UnidadeNegocio].valor_materiais >
                      0 && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-normal text-blue-800 mb-3">
                          MATERIAIS: Quem compra?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPagamentoPorNucleo({
                                ...pagamentoPorNucleo,
                                [nucleo as UnidadeNegocio]: {
                                  ...config,
                                  modalidade_materiais: "revenda",
                                  conta_tipo: "real",
                                },
                              });
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              config.modalidade_materiais === "revenda"
                                ? "border-blue-500 bg-blue-100"
                                : "border-gray-200 bg-white hover:border-blue-300"
                            }`}
                          >
                            <p className="font-normal text-sm text-gray-900">
                              REVENDA
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Empresa compra e revende ao cliente
                            </p>
                            <p className="text-xs text-blue-600 font-normal mt-2">
                              Conta Real - Receita Total
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPagamentoPorNucleo({
                                ...pagamentoPorNucleo,
                                [nucleo as UnidadeNegocio]: {
                                  ...config,
                                  modalidade_materiais: "gestao",
                                  conta_tipo: "virtual",
                                },
                              });
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              config.modalidade_materiais === "gestao"
                                ? "border-amber-500 bg-amber-100"
                                : "border-gray-200 bg-white hover:border-amber-300"
                            }`}
                          >
                            <p className="font-normal text-sm text-gray-900">
                              GESTÍO
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Cliente compra, empresa administra
                            </p>
                            <p className="text-xs text-amber-600 font-normal mt-2">
                              Conta Virtual - Fee {config.fee_gestao_percentual}
                              %
                            </p>
                          </button>
                        </div>

                        {/* Se GestÍo, mostrar cálculo do Fee */}
                        {config.modalidade_materiais === "gestao" && (
                          <div className="mt-3 p-3 bg-amber-100 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-amber-800">
                                  Valor Materiais Gerenciados
                                </p>
                                <p className="font-normal text-amber-900">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(
                                    valoresPorNucleo[nucleo as UnidadeNegocio]
                                      .valor_materiais
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-amber-800">
                                  Fee de GestÍo ({config.fee_gestao_percentual}
                                  %)
                                </p>
                                <p className="font-normal text-amber-900 text-[20px]">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(
                                    valoresPorNucleo[nucleo as UnidadeNegocio]
                                      .valor_materiais *
                                      (config.fee_gestao_percentual / 100)
                                  )}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-amber-700 mt-2">
                              * Fee será cobrado conforme as compras forem
                              realizadas
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Conta Bancária (se houver) */}
                  {contasDoNucleo.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-xs font-normal text-gray-600 mb-1">
                        Conta Bancária
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" title="Conta Bancária">
                        {contasDoNucleo.map((conta) => (
                          <option key={conta.id} value={conta.id}>
                            {conta.nome} - {conta.banco} (
                            {conta.integracao_tipo || "Manual"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Resumo do Núcleo */}
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: nucleoConfig.bgColor }}
                  >
                    <p className="text-xs font-normal text-gray-700 mb-2">
                      RESUMO {nucleoConfig.label.toUpperCase()}
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Valor Total</p>
                        <p className="font-normal text-gray-900">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(valorTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          Entrada ({config.percentual_entrada}%)
                        </p>
                        <p className="font-normal text-green-600">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(valorEntrada)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {config.numero_parcelas}x Parcelas
                        </p>
                        <p className="font-normal text-blue-600">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(valorParcela)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* RESUMO GERAL */}
            <div className="mt-6 p-5 bg-gray-900 rounded-xl text-white">
              <p className="text-xs font-normal text-gray-400 mb-3">
                RESUMO GERAL
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Valor Total</p>
                  <p className="text-xl font-normal">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      arredondar2Casas(
                        nucleosSelecionados.reduce(
                          (acc, n) =>
                            acc +
                            valoresPorNucleo[n as UnidadeNegocio].valor_total,
                          0
                        )
                      )
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Entradas</p>
                  <p className="text-xl font-normal text-green-400">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      arredondar2Casas(
                        nucleosSelecionados.reduce((acc, n) => {
                          const valorTotal =
                            valoresPorNucleo[n as UnidadeNegocio].valor_total;
                          const entrada = arredondar2Casas(
                            valorTotal *
                              (pagamentoPorNucleo[n as UnidadeNegocio]
                                .percentual_entrada /
                                100)
                          );
                          return acc + entrada;
                        }, 0)
                      )
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Parcelas</p>
                  <p className="text-xl font-normal text-blue-400">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      arredondar2Casas(
                        nucleosSelecionados.reduce((acc, n) => {
                          const valorTotal =
                            valoresPorNucleo[n as UnidadeNegocio].valor_total;
                          const entrada = arredondar2Casas(
                            valorTotal *
                              (pagamentoPorNucleo[n as UnidadeNegocio]
                                .percentual_entrada /
                                100)
                          );
                          return acc + (valorTotal - entrada);
                        }, 0)
                      )
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Núcleos</p>
                  <p className="text-xl font-normal">
                    {nucleosSelecionados.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de AçÍo */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/contratos")}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || nucleosSelecionados.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Criando contratos...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Criar {nucleosSelecionados.length} Contrato(s)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

