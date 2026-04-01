/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  FileText,
  Save,
  X,
  Download,
  Upload,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { normalizeSearchTerm } from "@/utils/searchUtils";

/* ==================== TIPOS ==================== */

type Nucleo = {
  id: string;
  codigo: string;
  nome: string;
  icone: string;
  cor: string;
  ordem: number;
};

type PlanoContaCategoria = {
  id: string;
  codigo: string;
  nome: string;
  classe: "custo" | "despesa";
  nucleo_id: string;
  tipo: "fixo" | "variavel";
  ativo: boolean;
  ordem: number;
  nucleo?: Nucleo;
};

/* ==================== DADOS PADRÍO ==================== */

const NUCLEOS_PADRAO: Omit<Nucleo, "id">[] = [
  { codigo: "01", nome: "Arquitetura", icone: "🏛️", cor: "#F25C26", ordem: 1 },
  { codigo: "02", nome: "Engenharia", icone: "⚙️", cor: "#3B82F6", ordem: 2 },
  { codigo: "03", nome: "Marcenaria", icone: "🪵", cor: "#8B5CF6", ordem: 3 },
  { codigo: "04", nome: "Compra e Venda de Produtos", icone: "🛒", cor: "#10B981", ordem: 4 },
  { codigo: "05", nome: "Compra e Venda de Materiais", icone: "🧰", cor: "#F59E0B", ordem: 5 },
];

const PLANO_CONTAS_PADRAO: Omit<PlanoContaCategoria, "id" | "nucleo_id">[] = [
  // ARQUITETURA - CUSTOS (4.1)
  { codigo: "4.1.01", nome: "Projetos arquitetônicos terceirizados", classe: "custo", tipo: "variavel", ativo: true, ordem: 1 },
  { codigo: "4.1.02", nome: "Freelancers de arquitetura", classe: "custo", tipo: "variavel", ativo: true, ordem: 2 },
  { codigo: "4.1.03", nome: "Maquetes eletrônicas / renderizaçÍo", classe: "custo", tipo: "variavel", ativo: true, ordem: 3 },
  { codigo: "4.1.04", nome: "Impressões e plotagens", classe: "custo", tipo: "variavel", ativo: true, ordem: 4 },
  { codigo: "4.1.05", nome: "Visitas técnicas por projeto", classe: "custo", tipo: "variavel", ativo: true, ordem: 5 },
  { codigo: "4.1.06", nome: "Revisões e ajustes extraordinários", classe: "custo", tipo: "variavel", ativo: true, ordem: 6 },
  { codigo: "4.1.07", nome: "CompatibilizaçÍo de projetos", classe: "custo", tipo: "variavel", ativo: true, ordem: 7 },
  // ARQUITETURA - DESPESAS (5.1)
  { codigo: "5.1.01", nome: "Salários – Arquitetura", classe: "despesa", tipo: "fixo", ativo: true, ordem: 8 },
  { codigo: "5.1.02", nome: "Encargos sociais – Arquitetura", classe: "despesa", tipo: "fixo", ativo: true, ordem: 9 },
  { codigo: "5.1.03", nome: "Pró-labore – Arquitetura", classe: "despesa", tipo: "fixo", ativo: true, ordem: 10 },
  { codigo: "5.1.04", nome: "Softwares e licenças", classe: "despesa", tipo: "fixo", ativo: true, ordem: 11 },
  { codigo: "5.1.05", nome: "Equipamentos e informática", classe: "despesa", tipo: "variavel", ativo: true, ordem: 12 },
  { codigo: "5.1.06", nome: "Internet e telefonia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 13 },
  { codigo: "5.1.07", nome: "Aluguel / rateio de estrutura", classe: "despesa", tipo: "fixo", ativo: true, ordem: 14 },
  { codigo: "5.1.08", nome: "Marketing institucional", classe: "despesa", tipo: "variavel", ativo: true, ordem: 15 },
  { codigo: "5.1.09", nome: "Cursos e treinamentos", classe: "despesa", tipo: "variavel", ativo: true, ordem: 16 },
  { codigo: "5.1.10", nome: "Despesas administrativas do núcleo", classe: "despesa", tipo: "variavel", ativo: true, ordem: 17 },

  // ENGENHARIA - CUSTOS (4.2)
  { codigo: "4.2.01", nome: "Projetos estruturais terceirizados", classe: "custo", tipo: "variavel", ativo: true, ordem: 1 },
  { codigo: "4.2.02", nome: "Projetos complementares (elétrica, hidráulica, gás etc.)", classe: "custo", tipo: "variavel", ativo: true, ordem: 2 },
  { codigo: "4.2.03", nome: "ART / RRT por obra", classe: "custo", tipo: "variavel", ativo: true, ordem: 3 },
  { codigo: "4.2.04", nome: "Laudos técnicos", classe: "custo", tipo: "variavel", ativo: true, ordem: 4 },
  { codigo: "4.2.05", nome: "Ensaios e testes", classe: "custo", tipo: "variavel", ativo: true, ordem: 5 },
  { codigo: "4.2.06", nome: "Consultorias técnicas", classe: "custo", tipo: "variavel", ativo: true, ordem: 6 },
  { codigo: "4.2.07", nome: "Vistorias técnicas", classe: "custo", tipo: "variavel", ativo: true, ordem: 7 },
  // ENGENHARIA - DESPESAS (5.2)
  { codigo: "5.2.01", nome: "Salários – Engenharia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 8 },
  { codigo: "5.2.02", nome: "Encargos sociais – Engenharia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 9 },
  { codigo: "5.2.03", nome: "Pró-labore – Engenharia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 10 },
  { codigo: "5.2.04", nome: "Softwares técnicos", classe: "despesa", tipo: "fixo", ativo: true, ordem: 11 },
  { codigo: "5.2.05", nome: "Equipamentos", classe: "despesa", tipo: "variavel", ativo: true, ordem: 12 },
  { codigo: "5.2.06", nome: "Seguros profissionais", classe: "despesa", tipo: "fixo", ativo: true, ordem: 13 },
  { codigo: "5.2.07", nome: "Veículos e deslocamentos", classe: "despesa", tipo: "variavel", ativo: true, ordem: 14 },
  { codigo: "5.2.08", nome: "Internet e telefonia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 15 },
  { codigo: "5.2.09", nome: "Cursos e certificações", classe: "despesa", tipo: "variavel", ativo: true, ordem: 16 },
  { codigo: "5.2.10", nome: "Despesas administrativas do núcleo", classe: "despesa", tipo: "variavel", ativo: true, ordem: 17 },

  // MARCENARIA - CUSTOS (4.3)
  { codigo: "4.3.01", nome: "MDF, madeiras e chapas", classe: "custo", tipo: "variavel", ativo: true, ordem: 1 },
  { codigo: "4.3.02", nome: "Ferragens", classe: "custo", tipo: "variavel", ativo: true, ordem: 2 },
  { codigo: "4.3.03", nome: "Insumos (cola, fita, verniz, tinta)", classe: "custo", tipo: "variavel", ativo: true, ordem: 3 },
  { codigo: "4.3.04", nome: "Vidros, espelhos e pedras", classe: "custo", tipo: "variavel", ativo: true, ordem: 4 },
  { codigo: "4.3.05", nome: "MÍo de obra terceirizada", classe: "custo", tipo: "variavel", ativo: true, ordem: 5 },
  { codigo: "4.3.06", nome: "Transporte e instalaçÍo", classe: "custo", tipo: "variavel", ativo: true, ordem: 6 },
  { codigo: "4.3.07", nome: "Embalagens e proteçÍo", classe: "custo", tipo: "variavel", ativo: true, ordem: 7 },
  { codigo: "4.3.08", nome: "Retrabalhos e ajustes", classe: "custo", tipo: "variavel", ativo: true, ordem: 8 },
  // MARCENARIA - DESPESAS (5.3)
  { codigo: "5.3.01", nome: "Salários – Marcenaria", classe: "despesa", tipo: "fixo", ativo: true, ordem: 9 },
  { codigo: "5.3.02", nome: "Encargos sociais – Marcenaria", classe: "despesa", tipo: "fixo", ativo: true, ordem: 10 },
  { codigo: "5.3.03", nome: "Pró-labore – Marcenaria", classe: "despesa", tipo: "fixo", ativo: true, ordem: 11 },
  { codigo: "5.3.04", nome: "Aluguel de galpÍo", classe: "despesa", tipo: "fixo", ativo: true, ordem: 12 },
  { codigo: "5.3.05", nome: "Energia elétrica", classe: "despesa", tipo: "variavel", ativo: true, ordem: 13 },
  { codigo: "5.3.06", nome: "ManutençÍo de máquinas", classe: "despesa", tipo: "variavel", ativo: true, ordem: 14 },
  { codigo: "5.3.07", nome: "Ferramentas e EPIs", classe: "despesa", tipo: "variavel", ativo: true, ordem: 15 },
  { codigo: "5.3.08", nome: "Seguro patrimonial", classe: "despesa", tipo: "fixo", ativo: true, ordem: 16 },
  { codigo: "5.3.09", nome: "Internet e telefonia", classe: "despesa", tipo: "fixo", ativo: true, ordem: 17 },
  { codigo: "5.3.10", nome: "Despesas administrativas", classe: "despesa", tipo: "variavel", ativo: true, ordem: 18 },

  // PRODUTOS - CUSTOS (4.4)
  { codigo: "4.4.01", nome: "Custo de aquisiçÍo de produtos", classe: "custo", tipo: "variavel", ativo: true, ordem: 1 },
  { codigo: "4.4.02", nome: "Frete de compra", classe: "custo", tipo: "variavel", ativo: true, ordem: 2 },
  { codigo: "4.4.03", nome: "Frete de entrega", classe: "custo", tipo: "variavel", ativo: true, ordem: 3 },
  { codigo: "4.4.04", nome: "Montagem e instalaçÍo", classe: "custo", tipo: "variavel", ativo: true, ordem: 4 },
  { codigo: "4.4.05", nome: "Comissões de venda", classe: "custo", tipo: "variavel", ativo: true, ordem: 5 },
  { codigo: "4.4.06", nome: "Taxas de cartÍo / gateway", classe: "custo", tipo: "variavel", ativo: true, ordem: 6 },
  { codigo: "4.4.07", nome: "Garantias e assistência", classe: "custo", tipo: "variavel", ativo: true, ordem: 7 },
  { codigo: "4.4.08", nome: "Perdas e avarias", classe: "custo", tipo: "variavel", ativo: true, ordem: 8 },
  // PRODUTOS - DESPESAS (5.4)
  { codigo: "5.4.01", nome: "Salários – Comercial", classe: "despesa", tipo: "fixo", ativo: true, ordem: 9 },
  { codigo: "5.4.02", nome: "Encargos sociais", classe: "despesa", tipo: "fixo", ativo: true, ordem: 10 },
  { codigo: "5.4.03", nome: "Aluguel de showroom", classe: "despesa", tipo: "fixo", ativo: true, ordem: 11 },
  { codigo: "5.4.04", nome: "Condomínio e IPTU", classe: "despesa", tipo: "fixo", ativo: true, ordem: 12 },
  { codigo: "5.4.05", nome: "Energia elétrica", classe: "despesa", tipo: "variavel", ativo: true, ordem: 13 },
  { codigo: "5.4.06", nome: "Marketing e vendas", classe: "despesa", tipo: "variavel", ativo: true, ordem: 14 },
  { codigo: "5.4.07", nome: "Sistemas / ERP", classe: "despesa", tipo: "fixo", ativo: true, ordem: 15 },
  { codigo: "5.4.08", nome: "Embalagens institucionais", classe: "despesa", tipo: "variavel", ativo: true, ordem: 16 },
  { codigo: "5.4.09", nome: "Despesas administrativas", classe: "despesa", tipo: "variavel", ativo: true, ordem: 17 },

  // MATERIAIS - CUSTOS (4.5)
  { codigo: "4.5.01", nome: "Compra de materiais", classe: "custo", tipo: "variavel", ativo: true, ordem: 1 },
  { codigo: "4.5.02", nome: "Frete de compra", classe: "custo", tipo: "variavel", ativo: true, ordem: 2 },
  { codigo: "4.5.03", nome: "Frete de entrega", classe: "custo", tipo: "variavel", ativo: true, ordem: 3 },
  { codigo: "4.5.04", nome: "Quebras e perdas", classe: "custo", tipo: "variavel", ativo: true, ordem: 4 },
  { codigo: "4.5.05", nome: "Armazenagem", classe: "custo", tipo: "variavel", ativo: true, ordem: 5 },
  { codigo: "4.5.06", nome: "Comissões", classe: "custo", tipo: "variavel", ativo: true, ordem: 6 },
  { codigo: "4.5.07", nome: "Impostos sobre vendas", classe: "custo", tipo: "variavel", ativo: true, ordem: 7 },
  { codigo: "4.5.08", nome: "Devoluções", classe: "custo", tipo: "variavel", ativo: true, ordem: 8 },
  // MATERIAIS - DESPESAS (5.5)
  { codigo: "5.5.01", nome: "Salários – Materiais", classe: "despesa", tipo: "fixo", ativo: true, ordem: 9 },
  { codigo: "5.5.02", nome: "Encargos sociais", classe: "despesa", tipo: "fixo", ativo: true, ordem: 10 },
  { codigo: "5.5.03", nome: "Aluguel de depósito", classe: "despesa", tipo: "fixo", ativo: true, ordem: 11 },
  { codigo: "5.5.04", nome: "Energia elétrica", classe: "despesa", tipo: "variavel", ativo: true, ordem: 12 },
  { codigo: "5.5.05", nome: "Sistemas de estoque", classe: "despesa", tipo: "fixo", ativo: true, ordem: 13 },
  { codigo: "5.5.06", nome: "Veículos e manutençÍo", classe: "despesa", tipo: "variavel", ativo: true, ordem: 14 },
  { codigo: "5.5.07", nome: "Marketing técnico", classe: "despesa", tipo: "variavel", ativo: true, ordem: 15 },
  { codigo: "5.5.08", nome: "Despesas administrativas", classe: "despesa", tipo: "variavel", ativo: true, ordem: 16 },
];

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function ConfigFinanceiroPage() {
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<PlanoContaCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nucleoExpandido, setNucleoExpandido] = useState<string | null>(null);
  const [filtroClasse, setFiltroClasse] = useState<"todos" | "custo" | "despesa">("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<PlanoContaCategoria | null>(null);
  const [isNucleoFormOpen, setIsNucleoFormOpen] = useState(false);
  const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);

  // Carregar dados
  async function carregarDados() {
    setLoading(true);
    try {
      // Carregar núcleos
      const { data: nucleosData, error: nucleosError } = await supabase
        .from("fin_nucleos")
        .select("*")
        .order("ordem");

      if (nucleosError) throw nucleosError;

      // Carregar categorias do plano de contas
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("fin_plano_contas")
        .select("*, nucleo:fin_nucleos(*)")
        .order("codigo");

      if (categoriasError) throw categoriasError;

      setNucleos(nucleosData || []);
      setCategorias(categoriasData || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // Importar plano de contas padrÍo
  async function importarPlanoPadrao() {
    if (!confirm("Deseja importar o Plano de Contas padrÍo? Isso criará os núcleos e categorias base.")) {
      return;
    }

    setLoading(true);
    try {
      // 1. Criar núcleos
      const nucleosCriados: Record<string, string> = {};

      for (const nucleo of NUCLEOS_PADRAO) {
        const { data, error } = await supabase
          .from("fin_nucleos")
          .insert([nucleo])
          .select()
          .single();

        if (error) {
          // Se já existe, buscar o ID
          const { data: existente } = await supabase
            .from("fin_nucleos")
            .select("id")
            .eq("codigo", nucleo.codigo)
            .single();

          if (existente) {
            nucleosCriados[nucleo.codigo] = existente.id;
          }
        } else {
          nucleosCriados[nucleo.codigo] = data.id;
        }
      }

      // 2. Criar categorias do plano de contas
      for (const cat of PLANO_CONTAS_PADRAO) {
        // Extrair o código do núcleo (ex: "4.1.01" -> "01")
        const partes = cat.codigo.split(".");
        const classeCod = partes[0]; // 4 ou 5
        const nucleoCod = partes[1]; // 1, 2, 3, 4, 5
        const nucleoCodigoCompleto = nucleoCod.padStart(2, "0");

        const nucleoId = nucleosCriados[nucleoCodigoCompleto];
        if (!nucleoId) continue;

        await supabase.from("fin_plano_contas").insert([
          {
            ...cat,
            nucleo_id: nucleoId,
          },
        ]);
      }

      toast({ title: "Sucesso", description: "Plano de Contas importado com sucesso!" });
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao importar:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao importar: " + error.message });
    } finally {
      setLoading(false);
    }
  }

  // Excluir categoria
  async function handleDeleteCategoria(id: string) {
    if (!confirm("Deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase.from("fin_plano_contas").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Categoria excluída!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro: " + error.message });
    }
  }

  // Excluir núcleo
  async function handleDeleteNucleo(id: string) {
    if (!confirm("Deseja excluir este núcleo? Todas as categorias associadas também serÍo excluídas.")) return;

    try {
      // Primeiro excluir categorias do núcleo
      await supabase.from("fin_plano_contas").delete().eq("nucleo_id", id);
      // Depois excluir o núcleo
      const { error } = await supabase.from("fin_nucleos").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Núcleo excluído!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro: " + error.message });
    }
  }

  // Filtrar categorias
  const categoriasFiltradas = categorias.filter((cat) => {
    const termo = normalizeSearchTerm(searchTerm);
    const matchSearch =
      normalizeSearchTerm(cat.nome).includes(termo) ||
      normalizeSearchTerm(cat.codigo).includes(termo);
    const matchClasse = filtroClasse === "todos" || cat.classe === filtroClasse;
    return matchSearch && matchClasse;
  });

  // Agrupar por núcleo
  const categoriasPorNucleo = nucleos.map((nucleo) => ({
    nucleo,
    custos: categoriasFiltradas.filter((c) => c.nucleo_id === nucleo.id && c.classe === "custo"),
    despesas: categoriasFiltradas.filter((c) => c.nucleo_id === nucleo.id && c.classe === "despesa"),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wg-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-[#1A1A1A] flex items-center gap-2">
            <Settings className="h-6 w-6 text-wg-primary" />
            ConfiguraçÍo Financeira
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Plano de Contas - PadrÍo Contábil/Fiscal | Estrutura: Classe.Núcleo.Subgrupo.Item
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {nucleos.length === 0 && (
            <button
              onClick={importarPlanoPadrao}
              className="px-4 py-2 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-[14px] flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Importar Plano PadrÍo
            </button>
          )}
          <button
            onClick={() => {
              setEditingNucleo(null);
              setIsNucleoFormOpen(true);
            }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-[14px] flex items-center gap-2 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            Novo Núcleo
          </button>
          <button
            onClick={() => {
              setEditingCategoria(null);
              setIsFormOpen(true);
            }}
              className="px-4 py-2 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-[14px] flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-[14px] font-light text-blue-800">Estrutura do Plano de Contas</h3>
            <div className="text-[12px] text-blue-700 mt-1 space-y-1">
              <p><strong>Empresa:</strong> Grupo WG Almeida</p>
              <p><strong>Classes:</strong> 4 - Custos | 5 - Despesas Operacionais</p>
              <p><strong>Núcleos:</strong> Arquitetura, Engenharia, Marcenaria, Produtos, Materiais</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-wg-primary focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-700">Filtrar:</span>
          <select
            value={filtroClasse}
            onChange={(e) => setFiltroClasse(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-wg-primary"
          >
            <option value="todos">Todos</option>
            <option value="custo">Custos (Classe 4)</option>
            <option value="despesa">Despesas (Classe 5)</option>
          </select>
        </div>
      </div>

      {/* NÚCLEOS E CATEGORIAS */}
      {nucleos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[20px] font-light text-gray-600 mb-2">Nenhum núcleo cadastrado</h3>
          <p className="text-[12px] text-gray-600 mb-4">
            Importe o plano de contas padrÍo ou crie seus núcleos manualmente.
          </p>
          <button
            onClick={importarPlanoPadrao}
            className="px-6 py-3 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-[14px] transition-colors"
          >
            Importar Plano de Contas PadrÍo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriasPorNucleo.map(({ nucleo, custos, despesas }) => (
            <motion.div
              key={nucleo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header do Núcleo */}
              <button
                type="button"
                onClick={() => setNucleoExpandido(nucleoExpandido === nucleo.id ? null : nucleo.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${nucleo.cor}15` }}
                  >
                    {nucleo.icone}
                  </div>
                  <div className="text-left">
                    <h3 className="text-[13px] font-light text-[#1A1A1A]">
                      NÚCLEO {nucleo.codigo} – {nucleo.nome.toUpperCase()}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {custos.length} custos | {despesas.length} despesas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNucleo(nucleo);
                      setIsNucleoFormOpen(true);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNucleo(nucleo.id);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                  {nucleoExpandido === nucleo.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {nucleoExpandido === nucleo.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200"
                  >
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* CUSTOS */}
                      <div className="bg-red-50/50 rounded-lg p-4">
                        <h4 className="text-[13px] font-light text-red-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-xs font-normal">4</span>
                          CUSTOS – {nucleo.nome.toUpperCase()}
                        </h4>
                        <div className="space-y-2">
                          {custos.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhum custo cadastrado</p>
                          ) : (
                            custos.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100 hover:border-red-300 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded">
                                    {cat.codigo}
                                  </span>
                                  <div>
                                    <p className="text-[12px] text-gray-800">{cat.nome}</p>
                                    <span className={`text-xs ${cat.tipo === "fixo" ? "text-blue-600" : "text-orange-600"}`}>
                                      {cat.tipo === "fixo" ? "Fixo" : "Variável"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCategoria(cat);
                                      setIsFormOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategoria(cat.id)}
                                    className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* DESPESAS */}
                      <div className="bg-blue-50/50 rounded-lg p-4">
                        <h4 className="text-[13px] font-light text-blue-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-normal">5</span>
                          DESPESAS OPERACIONAIS – {nucleo.nome.toUpperCase()}
                        </h4>
                        <div className="space-y-2">
                          {despesas.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhuma despesa cadastrada</p>
                          ) : (
                            despesas.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {cat.codigo}
                                  </span>
                                  <div>
                                    <p className="text-[12px] text-gray-800">{cat.nome}</p>
                                    <span className={`text-xs ${cat.tipo === "fixo" ? "text-blue-600" : "text-orange-600"}`}>
                                      {cat.tipo === "fixo" ? "Fixo" : "Variável"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingCategoria(cat);
                                      setIsFormOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategoria(cat.id)}
                                    className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL - CATEGORIA */}
      {isFormOpen && (
        <CategoriaForm
          categoria={editingCategoria}
          nucleos={nucleos}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            carregarDados();
          }}
        />
      )}

      {/* MODAL - NÚCLEO */}
      {isNucleoFormOpen && (
        <NucleoForm
          nucleo={editingNucleo}
          onClose={() => setIsNucleoFormOpen(false)}
          onSuccess={() => {
            setIsNucleoFormOpen(false);
            carregarDados();
          }}
        />
      )}
    </div>
  );
}

/* ==================== FORM CATEGORIA ==================== */

type CategoriaFormProps = {
  categoria: PlanoContaCategoria | null;
  nucleos: Nucleo[];
  onClose: () => void;
  onSuccess: () => void;
};

function CategoriaForm({ categoria, nucleos, onClose, onSuccess }: CategoriaFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    codigo: categoria?.codigo || "",
    nome: categoria?.nome || "",
    classe: categoria?.classe || "custo",
    nucleo_id: categoria?.nucleo_id || (nucleos[0]?.id || ""),
    tipo: categoria?.tipo || "variavel",
    ativo: categoria?.ativo ?? true,
    ordem: categoria?.ordem || 1,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.codigo || !formData.nome || !formData.nucleo_id) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    setSaving(true);
    try {
      if (categoria) {
        const { error } = await supabase
          .from("fin_plano_contas")
          .update(formData)
          .eq("id", categoria.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_plano_contas").insert([formData]);
        if (error) throw error;
      }
      toast({ title: "Sucesso", description: `Categoria ${categoria ? "atualizada" : "criada"} com sucesso!` });
      onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro: " + error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-[20px] font-light text-[#1A1A1A]">
            {categoria ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-gray-700 mb-1">Código *</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: 4.1.01"
                className="w-full border rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-wg-primary"
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-700 mb-1">Núcleo *</label>
              <select
                value={formData.nucleo_id}
                onChange={(e) => setFormData({ ...formData, nucleo_id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-wg-primary"
              >
                {nucleos.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.icone} {n.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-gray-700 mb-1">Nome da Categoria *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Projetos arquitetônicos terceirizados"
              className="w-full border rounded-lg px-3 py-2 text-[14px] focus:ring-2 focus:ring-wg-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-gray-700 mb-1">Classe *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, classe: "custo" })}
                  className={`flex-1 py-2 rounded-lg text-[12px] transition-colors ${
                    formData.classe === "custo"
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  4 - Custo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, classe: "despesa" })}
                  className={`flex-1 py-2 rounded-lg text-[12px] transition-colors ${
                    formData.classe === "despesa"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  5 - Despesa
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[12px] text-gray-700 mb-1">Tipo *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: "fixo" })}
                  className={`flex-1 py-2 rounded-lg text-[12px] transition-colors ${
                    formData.tipo === "fixo"
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Fixo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: "variavel" })}
                  className={`flex-1 py-2 rounded-lg text-[12px] transition-colors ${
                    formData.tipo === "variavel"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Variável
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-[14px] hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ==================== FORM NÚCLEO ==================== */

type NucleoFormProps = {
  nucleo: Nucleo | null;
  onClose: () => void;
  onSuccess: () => void;
};

function NucleoForm({ nucleo, onClose, onSuccess }: NucleoFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    codigo: nucleo?.codigo || "",
    nome: nucleo?.nome || "",
    icone: nucleo?.icone || "",
    cor: nucleo?.cor || "#F25C26",
    ordem: nucleo?.ordem || 1,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.codigo || !formData.nome) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha todos os campos obrigatórios." });
      return;
    }

    setSaving(true);
    try {
      if (nucleo) {
        const { error } = await supabase.from("fin_nucleos").update(formData).eq("id", nucleo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_nucleos").insert([formData]);
        if (error) throw error;
      }
      toast({ title: "Sucesso", description: `Núcleo ${nucleo ? "atualizado" : "criado"} com sucesso!` });
      onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro: " + error.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-normal text-[#1A1A1A]">
            {nucleo ? "Editar Núcleo" : "Novo Núcleo"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                placeholder="Ex: 01"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wg-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordem</label>
              <input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wg-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nome do Núcleo *</label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Arquitetura"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wg-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ícone (Emoji)</label>
              <input
                type="text"
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                placeholder="Ex: 🏛️"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wg-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-wg-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

