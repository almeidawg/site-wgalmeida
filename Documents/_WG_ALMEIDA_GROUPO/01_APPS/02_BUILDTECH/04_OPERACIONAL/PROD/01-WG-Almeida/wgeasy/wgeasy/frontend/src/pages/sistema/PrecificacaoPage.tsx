/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Calculator, TrendingUp, Info, ChevronRight, Percent, DollarSign, Building2, Search, Package, CreditCard, AlertTriangle, Save, CheckCircle2 } from "lucide-react";
import {
  useConfiguracoesPagamento,
  PLATAFORMAS_INFO,
  PRESETS_PLATAFORMA,
  type PlataformaPagamento,
} from "@/hooks/useConfiguracoesPagamento";

type ItemTipo = "percentual" | "valor";
type CategoriaVariavel = "Despesa" | "Profissional";

type Item = {
  id: string;
  nome: string;
  tipo: ItemTipo;
  valor: number;
  categoria?: CategoriaVariavel;
  modelo?: string;
};

type TabKey =
  | "cartao"
  | "impostos"
  | "hora"
  | "variaveis"
  | "fixos"
  | "margem"
  | "calculadora";

type FormState = {
  id?: string;
  nome: string;
  tipo: ItemTipo;
  valor: string;
  categoria?: CategoriaVariavel;
  modelo?: string;
};

type Empresa = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
};

type DetalheCusto = {
  nome: string;
  custo: string;
  periodo: string;
  semanal: string;
  mensal: string;
  anual: string;
};

const TAB_CONFIG: Record<
  TabKey,
  { titulo: string; descricao: string; cor: string }
> = {
  calculadora: {
    titulo: "Calculadora",
    descricao: "Calculadora inteligente de precificaçÍo com fórmula completa.",
    cor: "from-green-500 to-emerald-600",
  },
  cartao: {
    titulo: "Taxas de cartÍo",
    descricao: "Taxas de adquirentes / gateways (crédito/débito).",
    cor: "from-orange-400 to-orange-600",
  },
  impostos: {
    titulo: "Impostos",
    descricao: "ISS, PIS/COFINS, IRPJ/CSLL ou outros tributos.",
    cor: "from-amber-400 to-amber-600",
  },
  hora: {
    titulo: "Custo hora (William)",
    descricao: "Custo/hora da liderança/técnico-chave.",
    cor: "from-blue-400 to-blue-600",
  },
  variaveis: {
    titulo: "Custos variáveis",
    descricao: "Custos que variam por projeto (deslocamentos, diárias, etc).",
    cor: "from-emerald-400 to-emerald-600",
  },
  fixos: {
    titulo: "Custos fixos",
    descricao: "Rateio de custos fixos aplicados por contrato/projeto.",
    cor: "from-slate-400 to-slate-600",
  },
  margem: {
    titulo: "Margem de lucro",
    descricao: "Margem desejada sobre o subtotal (após custos).",
    cor: "from-purple-400 to-purple-600",
  },
};

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const initialItems: Record<TabKey, Item[]> = {
  calculadora: [],
  cartao: [
    { id: makeId(), nome: "Crédito à vista", tipo: "percentual", valor: 3.15 },
    { id: makeId(), nome: "2x", tipo: "percentual", valor: 5.39 },
    { id: makeId(), nome: "3x", tipo: "percentual", valor: 6.12 },
    { id: makeId(), nome: "4x", tipo: "percentual", valor: 6.85 },
    { id: makeId(), nome: "5x", tipo: "percentual", valor: 7.57 },
    { id: makeId(), nome: "6x", tipo: "percentual", valor: 8.28 },
    { id: makeId(), nome: "7x", tipo: "percentual", valor: 8.99 },
    { id: makeId(), nome: "8x", tipo: "percentual", valor: 9.69 },
    { id: makeId(), nome: "9x", tipo: "percentual", valor: 10.38 },
    { id: makeId(), nome: "10x", tipo: "percentual", valor: 11.06 },
    { id: makeId(), nome: "11x", tipo: "percentual", valor: 11.74 },
    { id: makeId(), nome: "12x", tipo: "percentual", valor: 12.4 },
  ],
  impostos: [{ id: makeId(), nome: "ISS", tipo: "percentual", valor: 5 }],
  hora: [{ id: makeId(), nome: "Hora William", tipo: "valor", valor: 250 }],
  variaveis: [],
  fixos: [],
  margem: [{ id: makeId(), nome: "Margem padrÍo", tipo: "percentual", valor: 20 }],
};

const CUSTO_HORA_DETALHES: {
  sections: { titulo: string; itens: DetalheCusto[] }[];
  resumo: { semanal: string; mensal: string; anual: string };
  horaTrabalho: { pago5contas: string; jornada: string; valorHora: string; semanal: string; mensal: string; anual: string };
} = {
  sections: [
    {
      titulo: "Day by day",
      itens: [
        { nome: "Agua", custo: "R$ 76,70", periodo: "mensal", semanal: "R$ 19,18", mensal: "R$ 76,70", anual: "R$ 920,40" },
        { nome: "Aluguel", custo: "R$ 4.000,00", periodo: "mensal", semanal: "R$ 1.000,00", mensal: "R$ 4.000,00", anual: "R$ 48.000,00" },
        { nome: "Almoço", custo: "R$ 60,00", periodo: "diário", semanal: "R$ 300,00", mensal: "R$ 1.320,00", anual: "R$ 15.840,00" },
        { nome: "Diarista", custo: "R$ 300,00", periodo: "mensal", semanal: "R$ 75,00", mensal: "R$ 300,00", anual: "R$ 3.600,00" },
        { nome: "Farmacia", custo: "R$ 240,00", periodo: "mensal", semanal: "R$ 60,00", mensal: "R$ 240,00", anual: "R$ 2.880,00" },
        { nome: "Gasolina", custo: "R$ 400,00", periodo: "mensal", semanal: "R$ 100,00", mensal: "R$ 400,00", anual: "R$ 4.800,00" },
        { nome: "Internet", custo: "R$ 159,95", periodo: "mensal", semanal: "R$ 39,99", mensal: "R$ 159,95", anual: "R$ 1.919,40" },
        { nome: "Ipe", custo: "R$ 150,00", periodo: "mensal", semanal: "R$ 37,50", mensal: "R$ 150,00", anual: "R$ 1.800,00" },
        { nome: "Lavanderia", custo: "R$ 345,00", periodo: "mensal", semanal: "R$ 86,25", mensal: "R$ 345,00", anual: "R$ 4.140,00" },
        { nome: "Luz", custo: "R$ 369,20", periodo: "mensal", semanal: "R$ 92,30", mensal: "R$ 369,20", anual: "R$ 4.430,40" },
        { nome: "Manutencao Carro", custo: "R$ 1.000,00", periodo: "semestral", semanal: "R$ 41,67", mensal: "R$ 180,00", anual: "R$ 2.160,00" },
        { nome: "Mercado", custo: "R$ 1.500,00", periodo: "mensal", semanal: "R$ 375,00", mensal: "R$ 1.500,00", anual: "R$ 18.000,00" },
        { nome: "Netflix", custo: "R$ 55,00", periodo: "mensal", semanal: "R$ 13,75", mensal: "R$ 55,00", anual: "R$ 660,00" },
        { nome: "Personal Trainer", custo: "R$ 500,00", periodo: "mensal", semanal: "R$ 125,00", mensal: "R$ 500,00", anual: "R$ 6.000,00" },
        { nome: "Plano de Saude", custo: "R$ 3.000,00", periodo: "mensal", semanal: "R$ 750,00", mensal: "R$ 3.000,00", anual: "R$ 36.000,00" },
        { nome: "Reserva de Seguranca", custo: "R$ 350,00", periodo: "mensal", semanal: "R$ 87,50", mensal: "R$ 350,00", anual: "R$ 4.200,00" },
        { nome: "Remedio Vanessa", custo: "R$ 50,00", periodo: "mensal", semanal: "R$ 12,50", mensal: "R$ 50,00", anual: "R$ 600,00" },
        { nome: "Seguro Bike", custo: "R$ 100,00", periodo: "mensal", semanal: "R$ 25,00", mensal: "R$ 100,00", anual: "R$ 1.200,00" },
        { nome: "Terapia", custo: "R$ 450,00", periodo: "mensal", semanal: "R$ 112,50", mensal: "R$ 450,00", anual: "R$ 5.400,00" },
        { nome: "Transporte", custo: "R$ 500,00", periodo: "mensal", semanal: "R$ 125,00", mensal: "R$ 500,00", anual: "R$ 6.000,00" },
        { nome: "Treino - Bike da Tosa", custo: "R$ 180,00", periodo: "mensal", semanal: "R$ 45,00", mensal: "R$ 180,00", anual: "R$ 2.160,00" },
        { nome: "Treino - Corrida", custo: "R$ 200,00", periodo: "mensal", semanal: "R$ 50,00", mensal: "R$ 200,00", anual: "R$ 2.400,00" },
        { nome: "Theo - Plano de Saude", custo: "R$ 126,40", periodo: "mensal", semanal: "R$ 31,60", mensal: "R$ 126,40", anual: "R$ 1.516,80" },
      ],
    },
    {
      titulo: "Ferramentas de Trabalho",
      itens: [
        { nome: "Ponto iD", custo: "R$ 39,90", periodo: "mensal", semanal: "R$ 9,98", mensal: "R$ 39,90", anual: "R$ 478,80" },
        { nome: "Chat GPT", custo: "R$ 100,00", periodo: "mensal", semanal: "R$ 25,00", mensal: "R$ 100,00", anual: "R$ 1.200,00" },
        { nome: "Genesys", custo: "R$ 75,00", periodo: "mensal", semanal: "R$ 18,75", mensal: "R$ 75,00", anual: "R$ 900,00" },
        { nome: "Dropbox", custo: "R$ 49,99", periodo: "mensal", semanal: "R$ 12,50", mensal: "R$ 49,99", anual: "R$ 599,88" },
        { nome: "Google WorkSpace", custo: "R$ 55,00", periodo: "mensal", semanal: "R$ 13,75", mensal: "R$ 55,00", anual: "R$ 660,00" },
        { nome: "Hubspot", custo: "R$ 1.300,00", periodo: "mensal", semanal: "R$ 325,00", mensal: "R$ 1.300,00", anual: "R$ 15.600,00" },
        { nome: "Spotify", custo: "R$ 39,90", periodo: "mensal", semanal: "R$ 9,98", mensal: "R$ 39,90", anual: "R$ 478,80" },
        { nome: "Juridioco", custo: "R$ 99,90", periodo: "mensal", semanal: "R$ 24,98", mensal: "R$ 99,90", anual: "R$ 1.198,80" },
        { nome: "Contabilidade", custo: "R$ 210,00", periodo: "mensal", semanal: "R$ 52,50", mensal: "R$ 210,00", anual: "R$ 2.520,00" },
        { nome: "ZapSign", custo: "R$ 49,90", periodo: "mensal", semanal: "R$ 12,48", mensal: "R$ 49,90", anual: "R$ 598,80" },
        { nome: "Protegou", custo: "R$ 49,90", periodo: "mensal", semanal: "R$ 12,48", mensal: "R$ 49,90", anual: "R$ 598,80" },
      ],
    },
  ],
  resumo: {
    semanal: "R$ 5.324,28",
    mensal: "R$ 21.297,12",
    anual: "R$ 255.665,44",
  },
  horaTrabalho: {
    pago5contas: "R$ 133,11",
    jornada: "8h/dia",
    valorHora: "R$ 292,84",
    semanal: "R$ 11.713,42",
    mensal: "R$ 46.853,66",
    anual: "R$ 562.243,97",
  },
};


const formatCurrency = (v?: number | null) =>
  `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const storageKey = (empresaId: string | null) => `precificacao_empresa_${empresaId || "global"}`;

type FixedMatrixRow = { id: string; nome: string; valor: string };
const FIXED_MATRIX_EMPRESAS = ["Design", "Arquitetura", "Engenharia", "Marcenaria"] as const;
const FIXOS_AUTO_ID = "fixos_auto_empresa";

export default function PrecificacaoPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("calculadora");
  const [custoBase, setCustoBase] = useState("0");
  const [itemsByTab, setItemsByTab] = useState<Record<TabKey, Item[]>>(initialItems);
  const [salvoOk, setSalvoOk] = useState(false);

  // Estados da Calculadora de PrecificaçÍo
  const [faturamentoMeta, setFaturamentoMeta] = useState("100000"); // Meta mensal R$ 100.000
  const [horasTrabalhoMes, setHorasTrabalhoMes] = useState("160"); // 8h x 20 dias
  const [custoMensalWilliam, setCustoMensalWilliam] = useState("21297.12"); // Do CUSTO_HORA_DETALHES
  const [parcelamentoSelecionado, setParcelamentoSelecionado] = useState("0"); // ÍÍndice do cartÍo (0 = à vista)

  // Estados para busca no Pricelist
  const [buscaPricelist, setBuscaPricelist] = useState("");
  const [pricelistItens, setPricelistItens] = useState<any[]>([]);
  const [pricelistLoading, setPricelistLoading] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any | null>(null);
  const initialFixedByEmp: Record<(typeof FIXED_MATRIX_EMPRESAS)[number], FixedMatrixRow[]> = {
    Design: [
      { id: makeId(), nome: "Água", valor: "20" },
      { id: makeId(), nome: "Aluguel", valor: "1000" },
      { id: makeId(), nome: "Bonés (ano)", valor: "31,25" },
      { id: makeId(), nome: "Certificado Digital (ano)", valor: "13,50" },
      { id: makeId(), nome: "Contabilidade", valor: "200" },
      { id: makeId(), nome: "Google WorkSpace", valor: "55" },
      { id: makeId(), nome: "Hospedagem Site", valor: "10" },
      { id: makeId(), nome: "Desenvolvedor Sistema", valor: "500" },
      { id: makeId(), nome: "Juridico", valor: "200" },
      { id: makeId(), nome: "Luz", valor: "62,50" },
      { id: makeId(), nome: "Marketing", valor: "25" },
      { id: makeId(), nome: "Registro Br", valor: "0,83" },
      { id: makeId(), nome: "Uniformes (ano)", valor: "41,66" },
    ],
    Arquitetura: [
      { id: makeId(), nome: "Água", valor: "20" },
      { id: makeId(), nome: "Aluguel", valor: "1000" },
      { id: makeId(), nome: "Bonés (ano)", valor: "31,25" },
      { id: makeId(), nome: "Certificado Digital (ano)", valor: "13,50" },
      { id: makeId(), nome: "Contabilidade", valor: "200" },
      { id: makeId(), nome: "Google WorkSpace", valor: "55" },
      { id: makeId(), nome: "Hospedagem Site", valor: "10" },
      { id: makeId(), nome: "Desenvolvedor Sistema", valor: "500" },
      { id: makeId(), nome: "Juridico", valor: "200" },
      { id: makeId(), nome: "Luz", valor: "62,50" },
      { id: makeId(), nome: "Marketing", valor: "25" },
      { id: makeId(), nome: "Registro Br", valor: "0,83" },
      { id: makeId(), nome: "Uniformes (ano)", valor: "41,66" },
    ],
    Engenharia: [
      { id: makeId(), nome: "Água", valor: "20" },
      { id: makeId(), nome: "Aluguel", valor: "1000" },
      { id: makeId(), nome: "Bonés (ano)", valor: "31,25" },
      { id: makeId(), nome: "Certificado Digital (ano)", valor: "13,50" },
      { id: makeId(), nome: "Contabilidade", valor: "200" },
      { id: makeId(), nome: "Google WorkSpace", valor: "55" },
      { id: makeId(), nome: "Hospedagem Site", valor: "10" },
      { id: makeId(), nome: "Desenvolvedor Sistema", valor: "500" },
      { id: makeId(), nome: "Juridico", valor: "200" },
      { id: makeId(), nome: "Luz", valor: "62,50" },
      { id: makeId(), nome: "Marketing", valor: "25" },
      { id: makeId(), nome: "Registro Br", valor: "0,83" },
      { id: makeId(), nome: "Uniformes (ano)", valor: "41,66" },
    ],
    Marcenaria: [
      { id: makeId(), nome: "Água", valor: "20" },
      { id: makeId(), nome: "Aluguel", valor: "1000" },
      { id: makeId(), nome: "Bonés (ano)", valor: "31,25" },
      { id: makeId(), nome: "Certificado Digital (ano)", valor: "13,50" },
      { id: makeId(), nome: "Contabilidade", valor: "200" },
      { id: makeId(), nome: "Google WorkSpace", valor: "55" },
      { id: makeId(), nome: "Hospedagem Site", valor: "10" },
      { id: makeId(), nome: "Desenvolvedor Sistema", valor: "500" },
      { id: makeId(), nome: "Juridico", valor: "200" },
      { id: makeId(), nome: "Luz", valor: "62,50" },
      { id: makeId(), nome: "Marketing", valor: "25" },
      { id: makeId(), nome: "Registro Br", valor: "0,83" },
      { id: makeId(), nome: "Promob 4Mat 1", valor: "250" },
      { id: makeId(), nome: "Uniformes (ano)", valor: "41,66" },
    ],
  };
  const [fixedByEmpresa, setFixedByEmpresa] = useState<typeof initialFixedByEmp>(initialFixedByEmp);
  const [fixosEmpresaSelecionada, setFixosEmpresaSelecionada] = useState<(typeof FIXED_MATRIX_EMPRESAS)[number]>("Design");
  const [custosDayByDay, setCustosDayByDay] = useState<DetalheCusto[]>([
    ...CUSTO_HORA_DETALHES.sections[0].itens,
  ]);
  const [custosFerramentas, setCustosFerramentas] = useState<DetalheCusto[]>([
    ...CUSTO_HORA_DETALHES.sections[1].itens,
  ]);
  const [formState, setFormState] = useState<FormState>({
    nome: "",
    tipo: "percentual",
    valor: "",
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  // ── Configurações de Pagamento (Supabase) ─────────────────
  const {
    config: configPagamento,
    salvando: salvandoPagamento,
    salvar: salvarConfigPagamento,
    aplicarPreset,
  } = useConfiguracoesPagamento(empresaId);

  // Sincronizar taxas de cartÍo (Supabase → itemsByTab.cartao)
  useEffect(() => {
    if (configPagamento.taxas_cartao.length > 0) {
      const cartaoItems: Item[] = configPagamento.taxas_cartao.map((t) => ({
        id: t.parcelas.toString(),
        nome: t.nome,
        tipo: "percentual" as const,
        valor: t.percentual,
      }));
      setItemsByTab((prev) => ({ ...prev, cartao: cartaoItems }));
    }
  }, [configPagamento.taxas_cartao]);

  const handleSalvarTaxas = useCallback(async () => {
    const taxas = itemsByTab.cartao.map((item, i) => ({
      parcelas: i + 1,
      nome: item.nome,
      percentual: item.valor,
    }));
    const result = await salvarConfigPagamento({
      plataforma: configPagamento.plataforma,
      taxas_cartao: taxas,
    });
    if (result.ok) {
      setSalvoOk(true);
      setTimeout(() => setSalvoOk(false), 3000);
    }
  }, [itemsByTab.cartao, configPagamento.plataforma, salvarConfigPagamento]);

  const handleAplicarPreset = useCallback((plataforma: PlataformaPagamento) => {
    aplicarPreset(plataforma);
    // itemsByTab.cartao será atualizado pelo useEffect acima
  }, [aplicarPreset]);

  useEffect(() => {
    const fetchEmpresas = async () => {
      const { data, error } = await supabase
        .from("empresas_grupo")
        .select("id, razao_social, nome_fantasia, cnpj")
        .eq("ativo", true)
        .order("razao_social");
      if (!error && data) {
        setEmpresas(data as Empresa[]);
        if (data.length > 0 && !empresaId) setEmpresaId(data[0].id);
      }
    };
    fetchEmpresas();
  }, [empresaId]);

  // Buscar itens do Pricelist
  const buscarPricelist = useCallback(async (termo: string) => {
    if (termo.length < 2) {
      setPricelistItens([]);
      return;
    }
    setPricelistLoading(true);
    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, preco, unidade, categoria_id, pricelist_categorias(nome)")
        .ilike("nome", `%${termo}%`)
        .limit(10);
      if (!error && data) {
        setPricelistItens(data);
      }
    } catch (err) {
      console.error("Erro ao buscar pricelist:", err);
    } finally {
      setPricelistLoading(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarPricelist(buscaPricelist);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaPricelist, buscarPricelist]);

  // Selecionar item do pricelist
  const selecionarItem = (item: any) => {
    setItemSelecionado(item);
    setCustoBase(String(item.preco || 0));
    setBuscaPricelist("");
    setPricelistItens([]);
  };

  useEffect(() => {
    const key = storageKey(empresaId);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.itemsByTab) {
          const merged = { ...parsed.itemsByTab };
          if (!merged.cartao || merged.cartao.length === 0) {
            merged.cartao = initialItems.cartao;
          }
          setItemsByTab(merged);
        }
        if (parsed.custoBase) setCustoBase(String(parsed.custoBase));
      } catch (err) {
        console.warn("Erro ao ler precificaçÍo local:", err);
      }
    } else {
      setItemsByTab(initialItems);
      setCustoBase("0");
    }
  }, [empresaId]);

  useEffect(() => {
    const key = storageKey(empresaId);
    localStorage.setItem(
      key,
      JSON.stringify({
        itemsByTab,
        custoBase,
      })
    );
  }, [itemsByTab, custoBase, empresaId]);

  const handleEdit = (tab: TabKey, item: Item) => {
    setActiveTab(tab);
    setFormState({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      valor: String(item.valor),
      categoria: item.categoria,
      modelo: item.modelo,
    });
  };

  const handleDelete = (tab: TabKey, id: string) => {
    setItemsByTab((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((i) => i.id !== id),
    }));
    if (formState.id === id) {
      setFormState({ nome: "", tipo: "percentual", valor: "" });
    }
  };

  const handleSubmit = (tab: TabKey) => {
    const valor = Number(formState.valor || 0);
    if (!formState.nome.trim()) return;
    if (Number.isNaN(valor)) return;

    const categoria = formState.categoria;
    const modelo = formState.modelo;

    setItemsByTab((prev) => {
      const list = prev[tab];
      const isEdit = Boolean(formState.id);
      const next: Item[] = isEdit
        ? list.map((i) =>
            i.id === formState.id
              ? { ...i, nome: formState.nome.trim(), tipo: formState.tipo, valor, categoria, modelo }
              : i
          )
        : [
            ...list,
            {
              id: makeId(),
              nome: formState.nome.trim(),
              tipo: formState.tipo,
              valor,
              categoria,
              modelo,
            },
          ];
      return { ...prev, [tab]: next };
    });

    setFormState({ nome: "", tipo: "percentual", valor: "" });
  };

  const handleFixedMatrixChange = (rowId: string, valor: string) => {
    setFixedByEmpresa((prev) => {
      const list = prev[fixosEmpresaSelecionada] || [];
      return {
        ...prev,
        [fixosEmpresaSelecionada]: list.map((r) => (r.id === rowId ? { ...r, valor } : r)),
      };
    });
  };

  const handleFixedMatrixName = (rowId: string, nome: string) => {
    setFixedByEmpresa((prev) => {
      const list = prev[fixosEmpresaSelecionada] || [];
      return {
        ...prev,
        [fixosEmpresaSelecionada]: list.map((r) => (r.id === rowId ? { ...r, nome } : r)),
      };
    });
  };

  const handleFixedMatrixAdd = () => {
    setFixedByEmpresa((prev) => {
      const list = prev[fixosEmpresaSelecionada] || [];
      return {
        ...prev,
        [fixosEmpresaSelecionada]: [
          ...list,
          { id: makeId(), nome: "Novo custo", valor: "0" },
        ],
      };
    });
  };

  const handleFixedMatrixDelete = (rowId: string) => {
    setFixedByEmpresa((prev) => {
      const list = prev[fixosEmpresaSelecionada] || [];
      return {
        ...prev,
        [fixosEmpresaSelecionada]: list.filter((r) => r.id !== rowId),
      };
    });
  };

  const parseNumber = (v?: string) => {
    if (!v) return 0;
    const cleaned = v.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const fixedListSelecionada = fixedByEmpresa[fixosEmpresaSelecionada] || [];
  const autoFixoTotal = fixedListSelecionada.reduce(
    (sum, row) => sum + parseNumber(row.valor),
    0
  );

  useEffect(() => {
    // injeta/atualiza item automático em custos fixos com base na empresa selecionada
    setItemsByTab((prev) => {
      const list = prev.fixos || [];
      const idx = list.findIndex((i) => i.id === FIXOS_AUTO_ID);
      const autoItem: Item = {
        id: FIXOS_AUTO_ID,
        nome: `Custos fixos - ${fixosEmpresaSelecionada}`,
        tipo: "valor",
        valor: autoFixoTotal,
      };
      const nextList = idx >= 0 ? list.map((i, k) => (k === idx ? autoItem : i)) : [autoItem, ...list];
      return { ...prev, fixos: nextList };
    });
  }, [autoFixoTotal, fixosEmpresaSelecionada]);

  const updateDetalhe = (
    list: DetalheCusto[],
    setList: (v: DetalheCusto[]) => void,
    idx: number,
    field: keyof DetalheCusto,
    value: string
  ) => {
    setList(
      list.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const addDetalhe = (list: DetalheCusto[], setList: (v: DetalheCusto[]) => void) => {
    setList([
      ...list,
      { nome: "Novo item", custo: "0", periodo: "mensal", semanal: "0", mensal: "0", anual: "0" },
    ]);
  };

  const removeDetalhe = (list: DetalheCusto[], setList: (v: DetalheCusto[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const calcularAdicao = (list: Item[], base: number) =>
    list.reduce((acc, i) => acc + (i.tipo === "percentual" ? (base * i.valor) / 100 : i.valor), 0);

  const resumo = useMemo(() => {
    const base = Number(custoBase) || 0;
    const cartao = calcularAdicao(itemsByTab.cartao, base);
    const impostos = calcularAdicao(itemsByTab.impostos, base);
    const hora = calcularAdicao(itemsByTab.hora, base);
    const variaveis = calcularAdicao(itemsByTab.variaveis, base);
    const fixos = calcularAdicao(itemsByTab.fixos, base);

    const subtotal = base + cartao + impostos + hora + variaveis + fixos;

    const margemValor = itemsByTab.margem
      .filter((m) => m.tipo === "valor")
      .reduce((acc, m) => acc + m.valor, 0);
    const margemPerc = itemsByTab.margem
      .filter((m) => m.tipo === "percentual")
      .reduce((acc, m) => acc + m.valor, 0);

    const venda = subtotal + margemValor + subtotal * (margemPerc / 100);

    return {
      base,
      cartao,
      impostos,
      hora,
      variaveis,
      fixos,
      subtotal,
      margemValor,
      margemPerc,
      venda,
    };
  }, [custoBase, itemsByTab]);

  // ================================================================
  // CALCULADORA INTELIGENTE DE PRECIFICAÇÍO
  // FÓRMULA CORRETA:
  // 5 ITENS PARA CUSTO REAL → + MARGEM = PREÇO VENDA
  // TAXA DE CARTÍO APLICA SÓ NA PROPOSTA (conforme parcelamento)
  // ================================================================
  const calculadora = useMemo(() => {
    const custoProduto = Number(custoBase) || 0;
    const faturamento = Number(faturamentoMeta) || 100000;
    const custoWilliam = Number(custoMensalWilliam) || 21297.12;
    const horas = Number(horasTrabalhoMes) || 160;

    // PERCENTUAIS CALCULADOS
    // Custo hora William convertido para % do faturamento
    const custoHoraWilliamPerc = (custoWilliam / faturamento) * 100;

    // Total de impostos em %
    const impostosPerc = itemsByTab.impostos
      .filter((i) => i.tipo === "percentual")
      .reduce((acc, i) => acc + i.valor, 0);

    // Custos variáveis em % (se houver tipo percentual)
    const variaveisPerc = itemsByTab.variaveis
      .filter((i) => i.tipo === "percentual")
      .reduce((acc, i) => acc + i.valor, 0);

    // Custos fixos em % (calculado sobre faturamento meta)
    const fixosValor = autoFixoTotal;
    const fixosPerc = (fixosValor / faturamento) * 100;

    // Margem de lucro em %
    const margemPerc = itemsByTab.margem
      .filter((i) => i.tipo === "percentual")
      .reduce((acc, i) => acc + i.valor, 0);

    // Taxa de cartÍo (apenas para preview - aplica na proposta)
    const parcelaIdx = Number(parcelamentoSelecionado) || 0;
    const taxaCartao = itemsByTab.cartao[parcelaIdx]?.valor || 0;

    // ================================================================
    // FÓRMULA: 5 ITENS PARA CUSTO REAL
    // ================================================================
    // ITEM 1: Custo do produto (Pricelist)
    const item1_custo = custoProduto;

    // ITEM 2: + Impostos
    const item2_impostos = custoProduto * (impostosPerc / 100);
    const subtotal2 = item1_custo + item2_impostos;

    // ITEM 3: + Custo Hora William (convertido em %)
    const item3_horaWilliam = subtotal2 * (custoHoraWilliamPerc / 100);
    const subtotal3 = subtotal2 + item3_horaWilliam;

    // ITEM 4: + Custos Variáveis
    const item4_variaveis = subtotal3 * (variaveisPerc / 100);
    const subtotal4 = subtotal3 + item4_variaveis;

    // ITEM 5: + Custos Fixos (rateio)
    const item5_fixos = subtotal4 * (fixosPerc / 100);
    const custoReal = subtotal4 + item5_fixos;

    // ================================================================
    // PREÇO DE VENDA = CUSTO REAL + MARGEM
    // ================================================================
    const margemValor = custoReal * (margemPerc / 100);
    const precoVenda = custoReal + margemValor;

    // ================================================================
    // TAXA DE CARTÍO (aplicada apenas na proposta)
    // ================================================================
    const taxaCartaoValor = precoVenda * (taxaCartao / 100);
    const precoComCartao = precoVenda + taxaCartaoValor;

    // Percentuais
    const percCustoReal = custoProduto > 0 ? ((custoReal - custoProduto) / custoProduto) * 100 : 0;
    const percPrecoVenda = custoProduto > 0 ? ((precoVenda - custoProduto) / custoProduto) * 100 : 0;
    const percComCartao = custoProduto > 0 ? ((precoComCartao - custoProduto) / custoProduto) * 100 : 0;

    // Lucro líquido
    const lucroLiquido = precoVenda - custoReal;

    return {
      custoProduto,
      faturamento,
      custoWilliam,
      horas,
      custoHoraWilliamPerc,
      impostosPerc,
      variaveisPerc,
      fixosPerc,
      fixosValor,
      margemPerc,
      taxaCartao,
      itens: {
        item1_custo,
        item2_impostos,
        subtotal2,
        item3_horaWilliam,
        subtotal3,
        item4_variaveis,
        subtotal4,
        item5_fixos,
        custoReal,
      },
      margemValor,
      precoVenda,
      taxaCartaoValor,
      precoComCartao,
      percCustoReal,
      percPrecoVenda,
      percComCartao,
      lucroLiquido,
    };
  }, [
    custoBase,
    faturamentoMeta,
    custoMensalWilliam,
    horasTrabalhoMes,
    parcelamentoSelecionado,
    itemsByTab,
    autoFixoTotal,
  ]);

  // ================================================================
  // RENDERIZAÇÍO DA ABA CALCULADORA
  // FÓRMULA: 5 ITENS → CUSTO REAL → + MARGEM = PREÇO VENDA
  // TAXA CARTÍO: APLICADA APENAS NA PROPOSTA
  // ================================================================
  const renderCalculadora = () => {
    const { itens, custoHoraWilliamPerc, impostosPerc, variaveisPerc, fixosPerc, fixosValor, margemPerc, margemValor, precoVenda, taxaCartao, taxaCartaoValor, precoComCartao, percPrecoVenda, percComCartao, lucroLiquido } = calculadora;

    return (
      <div className="space-y-6">
        {/* BUSCAR ITEM NO PRICELIST */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <Search className="h-6 w-6" />
              <div>
                <h3 className="text-[20px] font-light">Buscar Item no Pricelist</h3>
                <p className="text-[12px] text-white/80">Digite para buscar e selecionar um item</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="w-full border rounded-lg pl-10 pr-4 py-3 text-[12px]"
                placeholder="Digite o nome do item..."
                value={buscaPricelist}
                onChange={(e) => setBuscaPricelist(e.target.value)}
              />
              {pricelistLoading && (
                <div className="absolute right-3 top-3 text-gray-400">Buscando...</div>
              )}
            </div>
            {pricelistItens.length > 0 && (
              <div className="mt-2 border rounded-lg divide-y max-h-60 overflow-auto">
                {pricelistItens.map((item) => (
                  <button
                    key={item.id}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 flex justify-between items-center"
                    onClick={() => selecionarItem(item)}
                  >
                    <div>
                      <div className="font-medium text-gray-800">{item.nome}</div>
                      <div className="text-[12px] text-gray-500">
                        {item.pricelist_categorias?.nome || 'Sem categoria'} • {item.unidade || 'un'}
                      </div>
                    </div>
                    <div className="text-[18px] font-light text-emerald-600">
                      {formatCurrency(item.preco)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {itemSelecionado && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-emerald-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{itemSelecionado.nome}</div>
                    <div className="text-[12px] text-gray-500">{itemSelecionado.pricelist_categorias?.nome}</div>
                  </div>
                  <div className="text-[18px] font-light text-emerald-600">{formatCurrency(itemSelecionado.preco)}</div>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => { setItemSelecionado(null); setCustoBase("0"); }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONFIGURAÇÕES */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-8 w-8" />
            <div>
              <h2 className="text-[24px] font-light">Calculadora de PrecificaçÍo</h2>
              <p className="text-white/80">5 itens para Custo Real + Margem = Preço de Venda</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-[12px] text-white/80">Custo do Produto</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-emerald-700">R$</span>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 pl-10 font-medium"
                  value={custoBase}
                  onChange={(e) => { setCustoBase(e.target.value); setItemSelecionado(null); }}
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-white/80">Faturamento Meta Mensal</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-emerald-700">R$</span>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 pl-10 font-medium"
                  value={faturamentoMeta}
                  onChange={(e) => setFaturamentoMeta(e.target.value)}
                  placeholder="100000"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] text-white/80">Custo Mensal William</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-emerald-700">R$</span>
                <input
                  className="w-full bg-white text-gray-900 rounded-lg px-3 py-2 pl-10 font-medium"
                  value={custoMensalWilliam}
                  onChange={(e) => setCustoMensalWilliam(e.target.value)}
                  placeholder="21297.12"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FÓRMULA: 5 ITENS PARA CUSTO REAL */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-[20px] font-light text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Fórmula: 5 Itens para Custo Real
            </h3>
            <p className="text-[12px] text-gray-500">Sem taxa de cartÍo (aplicada apenas na proposta)</p>
          </div>

          <div className="p-3 sm:p-6 space-y-4">
            {/* Item 1 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-normal">1</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">Custo do Produto (Pricelist)</div>
                <div className="text-[12px] text-gray-500">Valor de aquisiçÍo/produçÍo</div>
              </div>
              <div className="text-[18px] font-light text-gray-900">{formatCurrency(itens.item1_custo)}</div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-normal">2</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">+ Impostos ({impostosPerc.toFixed(2)}%)</div>
                <div className="text-[12px] text-gray-500">ISS, PIS/COFINS, IRPJ/CSLL</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-amber-600">+{formatCurrency(itens.item2_impostos)}</div>
                <div className="text-[18px] font-light text-gray-900">{formatCurrency(itens.subtotal2)}</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-normal">3</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">+ Custo Hora William ({custoHoraWilliamPerc.toFixed(2)}%)</div>
                <div className="text-[12px] text-gray-500">
                  R$ {Number(custoMensalWilliam).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ÷ R$ {Number(faturamentoMeta).toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-blue-600">+{formatCurrency(itens.item3_horaWilliam)}</div>
                <div className="text-[18px] font-light text-gray-900">{formatCurrency(itens.subtotal3)}</div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
              <div className="flex-shrink-0 w-10 h-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-normal">4</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">+ Custos Variáveis ({variaveisPerc.toFixed(2)}%)</div>
                <div className="text-[12px] text-gray-500">Deslocamentos, diárias, etc.</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-teal-600">+{formatCurrency(itens.item4_variaveis)}</div>
                <div className="text-[18px] font-light text-gray-900">{formatCurrency(itens.subtotal4)}</div>
              </div>
            </div>

            {/* Item 5 */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border-l-4 border-slate-500">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-500 text-white rounded-full flex items-center justify-center font-normal">5</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">+ Custos Fixos ({fixosPerc.toFixed(2)}%)</div>
                <div className="text-[12px] text-gray-500">
                  R$ {fixosValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({fixosEmpresaSelecionada})
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-slate-600">+{formatCurrency(itens.item5_fixos)}</div>
                <div className="text-[18px] font-light text-gray-900">{formatCurrency(itens.custoReal)}</div>
              </div>
            </div>

            {/* CUSTO REAL */}
            <div className="flex items-center gap-4 p-5 bg-gray-800 rounded-xl text-white">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-[18px] font-light">= CUSTO REAL DO PRODUTO</div>
                <div className="text-[12px] text-white/70">Soma dos 5 itens de custo</div>
              </div>
              <div className="text-[18px] font-light">{formatCurrency(itens.custoReal)}</div>
            </div>

            {/* MARGEM */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center">
                <Percent className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">+ Margem de Lucro ({margemPerc.toFixed(2)}%)</div>
                <div className="text-[12px] text-gray-500">Lucro desejado sobre o custo real</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] text-purple-600">+{formatCurrency(margemValor)}</div>
              </div>
            </div>

            {/* PREÇO DE VENDA */}
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-[18px] font-light">PREÇO DE VENDA (Pricelist)</div>
                <div className="text-[12px] text-white/80">Custo Real + Margem</div>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-light">{formatCurrency(precoVenda)}</div>
                <div className="text-[12px] text-white/80">+{percPrecoVenda.toFixed(1)}% sobre o custo</div>
              </div>
            </div>
          </div>
        </div>

        {/* TAXA DE CARTÍO - APLICADA NA PROPOSTA */}
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-orange-100 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="text-[20px] font-light text-orange-800">Taxa de CartÍo (Aplicada na Proposta)</h3>
                <p className="text-[12px] text-orange-600">Esta taxa é adicionada apenas quando o cliente escolhe parcelamento</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <p className="text-[12px] text-orange-700">
                <strong>Importante:</strong> A taxa de cartÍo NÍO faz parte do Custo Real. Ela é adicionada ao Preço de Venda apenas quando o cliente escolhe pagar com cartÍo parcelado na criaçÍo da proposta.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] text-gray-600">SimulaçÍo de Parcelamento</label>
                <select
                  className="w-full mt-1 border rounded-lg px-3 py-2"
                  value={parcelamentoSelecionado}
                  onChange={(e) => setParcelamentoSelecionado(e.target.value)}
                >
                  {itemsByTab.cartao.map((c, idx) => (
                    <option key={c.id} value={idx}>{c.nome} ({c.valor}%)</option>
                  ))}
                </select>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-[12px] text-gray-500">Preço com cartÍo ({taxaCartao.toFixed(2)}%)</div>
                <div className="text-[18px] font-light text-orange-600">{formatCurrency(precoComCartao)}</div>
                <div className="text-[12px] text-gray-400">+{formatCurrency(taxaCartaoValor)} de taxa</div>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMO */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-light text-gray-800">5 Itens do Custo Real</h4>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-gray-600">1. Custo Produto</span><span className="font-medium">Base</span></div>
              <div className="flex justify-between"><span className="text-gray-600">2. Impostos</span><span className="font-medium">{impostosPerc.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-600">3. Hora William</span><span className="font-medium text-blue-600">{custoHoraWilliamPerc.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-600">4. Variáveis</span><span className="font-medium">{variaveisPerc.toFixed(2)}%</span></div>
              <div className="flex justify-between"><span className="text-gray-600">5. Fixos ({fixosEmpresaSelecionada})</span><span className="font-medium">{fixosPerc.toFixed(2)}%</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span>+ Margem</span>
                <span className="text-purple-600">{margemPerc.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <h4 className="font-light text-gray-800">Análise Financeira</h4>
            </div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-gray-600">Custo Produto</span><span className="font-medium">{formatCurrency(itens.item1_custo)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Overhead (4 itens)</span><span className="font-medium text-red-600">{formatCurrency(itens.custoReal - itens.item1_custo)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Custo Real</span><span className="font-medium">{formatCurrency(itens.custoReal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Margem</span><span className="font-medium text-purple-600">{formatCurrency(margemValor)}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between">
                <span>Preço Venda</span>
                <span className="text-emerald-600">{formatCurrency(precoVenda)}</span>
              </div>
              <div className="flex justify-between">
                <span>Lucro Líquido</span>
                <span className="text-green-600">{formatCurrency(lucroLiquido)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#2B4580] to-[#F25C26] rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="font-light">4 Empresas</h4>
            </div>
            <ul className="space-y-2 text-[12px] text-white/90">
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" /> W.G. Design</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" /> W.G. Arquitetura</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" /> W.G. Engenharia</li>
              <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" /> W.G. Marcenaria</li>
            </ul>
            <p className="mt-3 text-[12px] text-white/70">
              Mesma fórmula. Custos fixos variam por empresa.
            </p>
          </div>
        </div>

        {/* TABELA DE SIMULAÇÍO */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-[20px] font-light text-gray-800 flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              SimulaçÍo para Diferentes Valores
            </h3>
            <p className="text-[12px] text-gray-500">Fórmula aplicada proporcionalmente (sem taxa de cartÍo)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">+Impostos</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">+Hora William</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">+Variáveis</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">+Fixos</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Custo Real</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">+Margem</th>
                  <th className="px-4 py-3 text-right text-[13px] font-medium text-emerald-700 uppercase tracking-wider">Preço Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[50, 100, 250, 500, 1000, 2500].map((val) => {
                  const imp = val * (impostosPerc / 100);
                  const hora = (val + imp) * (custoHoraWilliamPerc / 100);
                  const varv = (val + imp + hora) * (variaveisPerc / 100);
                  const fix = (val + imp + hora + varv) * (fixosPerc / 100);
                  const custoR = val + imp + hora + varv + fix;
                  const marg = custoR * (margemPerc / 100);
                  const venda = custoR + marg;
                  return (
                    <tr key={val} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[12px]">{formatCurrency(val)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-amber-600">+{formatCurrency(imp)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-blue-600">+{formatCurrency(hora)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-teal-600">+{formatCurrency(varv)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-slate-600">+{formatCurrency(fix)}</td>
                      <td className="px-4 py-3 text-right text-[12px]">{formatCurrency(custoR)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-purple-600">+{formatCurrency(marg)}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-emerald-700">{formatCurrency(venda)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTab = (tab: TabKey) => {
    // Se for a aba calculadora, renderiza especial
    if (tab === "calculadora") {
      return renderCalculadora();
    }

    const items = itemsByTab[tab];
    const cfg = TAB_CONFIG[tab];

    return (
      <div className="space-y-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-gray-600">Nome</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="Ex: Taxa adquirente"
                value={formState.nome}
                onChange={(e) => setFormState((s) => ({ ...s, nome: e.target.value }))}
              />
            </div>
            {tab === "variaveis" && (
              <div>
                <label className="text-[12px] text-gray-600">Categoria</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={formState.categoria || ""}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, categoria: (e.target.value || undefined) as CategoriaVariavel }))
                  }
                >
                  <option value="">Despesa</option>
                  <option value="Profissional">Profissional (diária/modelo)</option>
                </select>
              </div>
            )}
            {tab === "variaveis" && (
              <div>
                <label className="text-[12px] text-gray-600">Modelo/Profissional</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  placeholder="Ex: Pintor nível A"
                  value={formState.modelo || ""}
                  onChange={(e) => setFormState((s) => ({ ...s, modelo: e.target.value }))}
                />
              </div>
            )}
            <div>
              <label className="text-[12px] text-gray-600">Tipo</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2"
                value={formState.tipo}
                onChange={(e) => setFormState((s) => ({ ...s, tipo: e.target.value as ItemTipo }))}
              >
                <option value="percentual">Percentual (%)</option>
                <option value="valor">Valor (R$)</option>
              </select>
            </div>
            <div className="w-40">
              <label className="text-[12px] text-gray-600">Valor</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder={formState.tipo === "percentual" ? "Ex: 3.5" : "Ex: 120"}
                value={formState.valor}
                onChange={(e) => setFormState((s) => ({ ...s, valor: e.target.value }))}
              />
            </div>
            <button
              className="bg-gradient-to-r from-[#F25C26] to-[#2B4580] text-white px-4 py-2 rounded-md"
              onClick={() => handleSubmit(tab)}
            >
              {formState.id ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </div>

          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b">
              <h4 className="font-light text-gray-800">{cfg.titulo}</h4>
              <p className="text-[12px] text-gray-500">{cfg.descricao}</p>
              {tab === "cartao" && (
                <div className="mt-3 space-y-3">
                  <p className="text-[12px] text-gray-500">
                    Taxas aplicadas a todas as empresas; edite os percentuais conforme adquirente.
                  </p>
                  {/* Seletor de Plataforma */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-orange-700 uppercase tracking-wide">
                          Plataforma de Pagamento
                        </label>
                        <select
                          className="w-full mt-1 border border-orange-300 rounded-lg px-3 py-2 text-[13px] bg-white"
                          value={configPagamento.plataforma}
                          onChange={(e) => handleAplicarPreset(e.target.value as PlataformaPagamento)}
                        >
                          {(Object.keys(PLATAFORMAS_INFO) as PlataformaPagamento[]).map((p) => (
                            <option key={p} value={p}>
                              {PLATAFORMAS_INFO[p].label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-orange-600 mt-1">
                          Selecionar a plataforma carrega as taxas padrÍo — você pode ajustar individualmente.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <div className="text-[11px] text-gray-500">
                          Pix: <strong>{configPagamento.taxa_pix}%</strong>
                          {" · "}Boleto: <strong>R$ {configPagamento.taxa_boleto}</strong>
                        </div>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-[12px] rounded-lg hover:bg-orange-700 disabled:opacity-50"
                          onClick={handleSalvarTaxas}
                          disabled={salvandoPagamento}
                        >
                          {salvoOk ? (
                            <><CheckCircle2 className="h-4 w-4" /> Salvo!</>
                          ) : (
                            <><Save className="h-4 w-4" /> {salvandoPagamento ? "Salvando..." : "Salvar taxas"}</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          <div className="divide-y">
            {items.length === 0 && (
              <div className="p-4 text-[12px] text-gray-500">Nenhum item cadastrado.</div>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium text-gray-800">{item.nome}</div>
                  <div className="text-[12px] text-gray-500">
                    {item.tipo === "percentual" ? `${item.valor}%` : formatCurrency(item.valor)}
                    {item.categoria ? ` · ${item.categoria}` : ""}
                    {item.modelo ? ` · ${item.modelo}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-[12px] text-[#2B4580] hover:text-[#F25C26]"
                    onClick={() => handleEdit(tab, item)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-[12px] text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(tab, item.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {tab === "fixos" && (
          <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-light text-gray-800">Custos fixos por empresa</h4>
                <p className="text-[12px] text-gray-500">Edite valores clicando na célula. Valores nÍo sÍo salvos no banco.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-gray-600">Usar no cálculo:</label>
                <select
                  className="border rounded px-2 py-1 text-[12px]"
                  value={fixosEmpresaSelecionada}
                  onChange={(e) => setFixosEmpresaSelecionada(e.target.value as any)}
                >
                  {FIXED_MATRIX_EMPRESAS.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
                <button
                  className="px-3 py-2 text-[12px] border rounded hover:bg-gray-50"
                  onClick={handleFixedMatrixAdd}
                >
                  + Adicionar linha
                </button>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Item ({fixosEmpresaSelecionada})</th>
                    <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fixedListSelecionada.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input
                          className="w-full border rounded px-2 py-1 text-[12px]"
                          value={row.nome}
                          onChange={(e) => handleFixedMatrixName(row.id, e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full border rounded px-2 py-1 text-[12px] text-right"
                          value={row.valor}
                          onChange={(e) => handleFixedMatrixChange(row.id, e.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-[12px] text-red-600 hover:text-red-700"
                          onClick={() => handleFixedMatrixDelete(row.id)}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fixedListSelecionada.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-center text-[12px] text-gray-500">
                        Nenhum custo fixo listado.
                      </td>
                    </tr>
                  )}
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 text-right text-[12px]">Total</td>
                    <td className="px-3 py-2 text-right text-[12px]">
                      R$ {autoFixoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] text-gray-500">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "hora" && (
          <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4 w-full">
            <div>
                  <h3 className="text-[20px] font-light text-gray-800">Detalhamento de Custos (William)</h3>
                  <p className="text-[12px] text-gray-600">
                Valores de referencia para compor a hora William. Nao sao persistidos no banco, apenas exibidos para consulta.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="border rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-light text-gray-800">Day by day</span>
                  <button
                    className="text-[12px] text-[#2B4580] hover:text-[#F25C26]"
                    onClick={() => addDetalhe(custosDayByDay, setCustosDayByDay)}
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                        <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Semanal</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Mensal</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Anual</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {custosDayByDay.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-[12px] text-gray-800">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px]"
                              value={i.nome}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "nome", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.custo}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "custo", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-[12px] text-gray-600">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px]"
                              value={i.periodo}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "periodo", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.semanal}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "semanal", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.mensal}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "mensal", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.anual}
                              onChange={(e) => updateDetalhe(custosDayByDay, setCustosDayByDay, idx, "anual", e.target.value)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px]">
                            <button
                              className="text-[12px] text-red-600 hover:text-red-700"
                              onClick={() => removeDetalhe(custosDayByDay, setCustosDayByDay, idx)}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="px-4 py-3 bg-gray-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-light text-gray-800">Ferramentas de Trabalho</span>
                  <button
                    className="text-[12px] text-[#2B4580] hover:text-[#F25C26]"
                    onClick={() => addDetalhe(custosFerramentas, setCustosFerramentas)}
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                        <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Periodo</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Semanal</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Mensal</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Anual</th>
                        <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {custosFerramentas.map((i, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-[12px] text-gray-800">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px]"
                              value={i.nome}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "nome", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.custo}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "custo", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-[12px] text-gray-600">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px]"
                              value={i.periodo}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "periodo", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.semanal}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "semanal", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.mensal}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "mensal", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px] text-gray-700">
                            <input
                              className="w-full border rounded px-2 py-1 text-[12px] text-right"
                              value={i.anual}
                              onChange={(e) =>
                                updateDetalhe(custosFerramentas, setCustosFerramentas, idx, "anual", e.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-[12px]">
                            <button
                              className="text-[12px] text-red-600 hover:text-red-700"
                              onClick={() => removeDetalhe(custosFerramentas, setCustosFerramentas, idx)}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-light text-gray-800 mb-2">Resumo dos custos</h4>
                <div className="space-y-1 text-[12px] text-gray-700">
                  <div className="flex justify-between"><span>Semanal</span><span>{CUSTO_HORA_DETALHES.resumo.semanal}</span></div>
                  <div className="flex justify-between"><span>Mensal</span><span>{CUSTO_HORA_DETALHES.resumo.mensal}</span></div>
                  <div className="flex justify-between"><span>Anual</span><span>{CUSTO_HORA_DETALHES.resumo.anual}</span></div>
                </div>
              </div>
              <div className="border rounded-lg p-4 md:col-span-2">
                <h4 className="font-light text-gray-800 mb-2">Hora de trabalho</h4>
                <div className="grid sm:grid-cols-2 gap-2 text-[12px] text-gray-700">
                  <div className="flex justify-between"><span>Pago 5 contas</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.pago5contas}</span></div>
                  <div className="flex justify-between"><span>Jornada</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.jornada}</span></div>
                  <div className="flex justify-between"><span>Valor hora</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.valorHora}</span></div>
                  <div className="flex justify-between"><span>Semanal</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.semanal}</span></div>
                  <div className="flex justify-between"><span>Mensal</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.mensal}</span></div>
                  <div className="flex justify-between"><span>Anual</span><span>{CUSTO_HORA_DETALHES.horaTrabalho.anual}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">PrecificaçÍo</h1>
            <p className="text-[12px] text-gray-600">
            Configure taxas, impostos, custos e margem. O preço de venda é calculado sobre o preço de custo do
            pricelist.
          </p>
          <div className="mt-3">
            <label className="text-[12px] text-gray-600">Empresa do grupo</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              value={empresaId || ""}
              onChange={(e) => setEmpresaId(e.target.value || null)}
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.razao_social || e.nome_fantasia || "Empresa"}{e.cnpj ? ` - ${e.cnpj}` : ""}
                </option>
              ))}
            </select>
            {empresas.length === 0 && (
              <p className="text-[12px] text-gray-500 mt-1">
                Cadastre empresas em Sistema &gt; Empresas. A precificaçÍo é salva localmente por empresa selecionada.
              </p>
            )}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm w-full md:w-96 space-y-3">
          <label className="text-[12px] text-gray-600">Preço de custo (pricelist)</label>
          <input
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="Ex: 1000"
            value={custoBase}
            onChange={(e) => setCustoBase(e.target.value)}
          />
          <div className="text-[12px] text-gray-500 mt-1">
            Use o valor do item no pricelist para calcular o preço de venda real.
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap">
          {(Object.keys(TAB_CONFIG) as TabKey[]).map((tab) => {
            const cfg = TAB_CONFIG[tab];
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                className={`px-4 py-3 text-[12px] border-b-2 ${
                  active ? "border-[#F25C26] text-[#F25C26]" : "border-transparent text-gray-600"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {cfg.titulo}
              </button>
            );
          })}
        </div>
        <div className="p-4">{renderTab(activeTab)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h3 className="text-[20px] font-light text-gray-800 mb-2">Resumo</h3>
          <div className="space-y-2 text-[12px] text-gray-700">
            <div className="flex justify-between"><span>Preço de custo (pricelist)</span><span>{formatCurrency(resumo.base)}</span></div>
            <div className="flex justify-between"><span>Taxas de cartÍo</span><span>{formatCurrency(resumo.cartao)}</span></div>
            <div className="flex justify-between"><span>Impostos</span><span>{formatCurrency(resumo.impostos)}</span></div>
            <div className="flex justify-between"><span>Custo hora</span><span>{formatCurrency(resumo.hora)}</span></div>
            <div className="flex justify-between"><span>Custos variáveis</span><span>{formatCurrency(resumo.variaveis)}</span></div>
            <div className="flex justify-between"><span>Custos fixos</span><span>{formatCurrency(resumo.fixos)}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(resumo.subtotal)}</span></div>
            <div className="flex justify-between"><span>Margem valor</span><span>{formatCurrency(resumo.margemValor)}</span></div>
            <div className="flex justify-between"><span>Margem percentual</span><span>{resumo.margemPerc.toFixed(2)}%</span></div>
            <div className="flex justify-between text-[18px] font-light text-[#2B4580]">
              <span>Preço de venda sugerido</span>
              <span>{formatCurrency(resumo.venda)}</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#2B4580] to-[#F25C26] text-white rounded-lg p-4 shadow-sm">
          <h3 className="text-[20px] font-light mb-2">Regra do preço de custo</h3>
          <p className="text-[12px] text-white/90">
            O preço de custo vem do Pricelist. Aplicamos taxas, impostos, custos e margem para chegar no preço de
            venda real. Ajuste as listas por aba para refletir a operaçÍo.
          </p>
          <ul className="mt-3 text-[12px] space-y-1 text-white/90 list-disc list-inside">
            <li>Base: preço do item no pricelist.</li>
            <li>Adições: cartÍo, impostos, hora, variáveis, fixos (valor ou % sobre a base).</li>
            <li>Margem: valor fixo + % sobre o subtotal.</li>
            <li>Custos variáveis permitem cadastrar modelos de profissional/diária.</li>
            <li>Dados sÍo salvos localmente por empresa. Para persistir no banco, criar tabela/endpoint dedicado.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



