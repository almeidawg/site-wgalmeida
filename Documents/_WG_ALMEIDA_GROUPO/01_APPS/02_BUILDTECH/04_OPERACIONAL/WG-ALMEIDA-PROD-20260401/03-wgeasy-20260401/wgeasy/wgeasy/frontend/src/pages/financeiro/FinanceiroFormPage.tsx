// src/pages/FinanceiroFormPage.tsx
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  criarLancamento,
  atualizarLancamento,
  buscarLancamento,
  LancamentoFinanceiro,
  listarProjetos,
  listarPessoas,
  listarContratos,
  obterCategorias,
} from "@/lib/financeiroApi";
import { useNavigate, useParams } from "react-router-dom";
import { DateInputBR } from "@/components/ui/DateInputBR";

interface ProjetoResumo {
  id: string;
  nome: string;
  cliente_id?: string;
  contrato_id?: string;
}

interface PessoaResumo {
  id: string;
  nome: string;
}

interface ContratoResumo {
  id: string;
  numero: string;
  titulo: string;
  cliente_id?: string;
}

export default function FinanceiroFormPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState<Partial<LancamentoFinanceiro>>({
    descricao: "",
    valor_total: 0,
    tipo: "saida",
    status: "previsto",
    vencimento: "",
    data_pagamento: null,
    categoria_id: "",
    projeto_id: null,
    contrato_id: null,
    pessoa_id: null,
  });

  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [pessoas, setPessoas] = useState<PessoaResumo[]>([]);
  const [contratos, setContratos] = useState<ContratoResumo[]>([]);
  const [categorias, setCategorias] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function carregar() {
      try {
        const [projData, pessData, contData] = await Promise.all([
          listarProjetos(),
          listarPessoas(),
          listarContratos(),
        ]);

        setProjetos(projData as ProjetoResumo[]);
        setPessoas(pessData as PessoaResumo[]);
        setContratos(contData as ContratoResumo[]);
      } catch (error) {
        console.error("Erro ao carregar dados do formulário:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar dados. Tente recarregar a página." });
      }
    }

    carregar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Atualizar categorias quando o tipo mudar
    async function carregarCategorias() {
      try {
        const cats = await obterCategorias(form.tipo);
        setCategorias(cats);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        setCategorias([]);
      }
    }
    carregarCategorias();
  }, [form.tipo]);

  useEffect(() => {
    if (id) {
      buscarLancamento(id)
        .then((item) => {
          if (item) setForm(item);
        })
        .catch((error) => {
          console.error("Erro ao buscar lançamento:", error);
          toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar lançamento. Verifique se o ID é válido." });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Filtrar projetos baseado no cliente selecionado
  const projetosFiltrados = useMemo(() => {
    if (!form.pessoa_id) return projetos;
    return projetos.filter((p) => p.cliente_id === form.pessoa_id);
  }, [projetos, form.pessoa_id]);

  // Filtrar contratos baseado no cliente selecionado
  const contratosFiltrados = useMemo(() => {
    if (!form.pessoa_id) return contratos;
    return contratos.filter((c) => c.cliente_id === form.pessoa_id);
  }, [contratos, form.pessoa_id]);

  function handle(e: any) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value || null });
  }

  // Quando selecionar projeto, auto-preencher contrato
  function handleProjetoChange(e: any) {
    const projetoId = e.target.value || null;

    // Buscar o projeto selecionado
    const projetoSelecionado = projetos.find((p) => p.id === projetoId);

    // Auto-preencher contrato se o projeto tiver um vinculado
    const contratoId = projetoSelecionado?.contrato_id || null;

    setForm({
      ...form,
      projeto_id: projetoId,
      contrato_id: contratoId,
    });
  }

  // Quando selecionar cliente, limpar projeto e contrato
  function handleClienteChange(e: any) {
    const pessoaId = e.target.value || null;

    setForm({
      ...form,
      pessoa_id: pessoaId,
      projeto_id: null,  // Limpar projeto
      contrato_id: null, // Limpar contrato
    });
  }

  async function salvar() {
    if (!form.descricao || !form.valor_total || !form.vencimento) {
      return toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha descriçÍo, valor e data de vencimento." });
    }

    try {
      // Preparar dados convertendo strings vazias em null
      const dados = {
        ...form,
        categoria_id: form.categoria_id || null,  // ✅ Converte "" para null
        projeto_id: form.projeto_id || null,
        contrato_id: form.contrato_id || null,
        pessoa_id: form.pessoa_id || null,
      };

      if (id) {
        await atualizarLancamento(id, dados);
      } else {
        await criarLancamento(dados as Omit<LancamentoFinanceiro, 'id' | 'created_at' | 'updated_at'>);
      }

      navigate("/financeiro");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: `Erro ao salvar: : ${error.message}` });
    }
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">$</span>
          </div>
          <div>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
              {id ? "Editar Lancamento" : "Novo Lancamento"}
            </h1>
            <p className="text-[12px] text-gray-600">Preencha os dados do lancamento financeiro</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl space-y-4">

      {/* Tipo - Entrada/Saida */}
      <div>
        <label className="block text-[12px] font-normal text-gray-700 mb-2">
          Tipo *
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "entrada" })}
            className={`px-4 py-3 rounded-lg border-2 text-[12px] font-normal transition-all ${
              form.tipo === "entrada"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, tipo: "saida" })}
            className={`px-4 py-3 rounded-lg border-2 text-[12px] font-normal transition-all ${
              form.tipo === "saida"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            Saida
          </button>
        </div>
      </div>

      {/* Descricao */}
      <div>
        <label className="block text-[12px] font-normal text-gray-700 mb-2">
          Descricao *
        </label>
        <input
          name="descricao"
          value={form.descricao}
          onChange={handle}
          placeholder="Descricao do lancamento"
          className="border border-gray-200 p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
        />
      </div>

      {/* Valor */}
      <div>
        <label className="block text-[12px] font-normal text-gray-700 mb-2">
          Valor *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[12px]">
            R$
          </span>
          <input
            type="number"
            step="0.01"
            name="valor_total"
            value={form.valor_total}
            onChange={handle}
            placeholder="0,00"
            className="border border-gray-200 p-3 pl-12 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categoria */}
      <div>
        <label htmlFor="categoria_id" className="block text-[12px] font-normal text-gray-700 mb-2">
          Categoria
        </label>
        <select
          id="categoria_id"
          name="categoria_id"
          value={form.categoria_id ?? ""}
          onChange={handle}
          className="border border-gray-200 p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-[12px] font-normal text-gray-700 mb-2">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={form.status}
          onChange={handle}
          className="border border-gray-200 p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
        >
          <option value="previsto">Previsto</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Data de Vencimento */}
      <div>
        <label htmlFor="vencimento" className="block text-[12px] font-normal text-gray-700 mb-2">
          Data de Vencimento *
        </label>
        <DateInputBR
          value={form.vencimento || ""}
          onChange={(val) => setForm({ ...form, vencimento: val })}
          className="border border-gray-200 p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
          required
        />
      </div>

      {/* Data de Pagamento */}
      <div>
        <label htmlFor="data_pagamento" className="block text-[12px] font-normal text-gray-700 mb-2">
          Data de Pagamento
        </label>
        <DateInputBR
          value={form.data_pagamento ?? ""}
          onChange={(val) => setForm({ ...form, data_pagamento: val || null })}
          className="border p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
        />
      </div>

      {/* Cliente/Fornecedor */}
      <div>
        <label htmlFor="pessoa_id" className="block text-[12px] font-normal text-gray-700 mb-2">
          Cliente/Fornecedor
        </label>
        <select
          id="pessoa_id"
          name="pessoa_id"
          value={form.pessoa_id ?? ""}
          onChange={handleClienteChange}
          className="border p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
        >
          <option value="">Nenhum</option>
          {pessoas.map((pessoa) => (
            <option key={pessoa.id} value={pessoa.id}>
              {pessoa.nome}
            </option>
          ))}
        </select>
        {form.pessoa_id && (
          <p className="text-[12px] text-blue-600 mt-1">
            💡 Projetos e contratos foram filtrados para este cliente
          </p>
        )}
      </div>

      {/* Projeto */}
      <div>
        <label htmlFor="projeto_id" className="block text-[12px] font-normal text-gray-700 mb-2">
          Projeto
        </label>
        <select
          id="projeto_id"
          name="projeto_id"
          value={form.projeto_id ?? ""}
          onChange={handleProjetoChange}
          className="border p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
          disabled={!form.pessoa_id}
        >
          <option value="">Nenhum</option>
          {projetosFiltrados.map((projeto) => (
            <option key={projeto.id} value={projeto.id}>
              {projeto.nome}
            </option>
          ))}
        </select>
        {!form.pessoa_id && (
          <p className="text-[12px] text-gray-500 mt-1">
            Selecione um cliente primeiro
          </p>
        )}
        {form.projeto_id && projetos.find((p) => p.id === form.projeto_id)?.contrato_id && (
          <p className="text-[12px] text-green-600 mt-1">
            ✅ Contrato preenchido automaticamente
          </p>
        )}
      </div>

      {/* Contrato */}
      <div>
        <label htmlFor="contrato_id" className="block text-[12px] font-normal text-gray-700 mb-2">
          Contrato
        </label>
        <select
          id="contrato_id"
          name="contrato_id"
          value={form.contrato_id ?? ""}
          onChange={handle}
          className="border p-3 rounded-lg w-full text-[12px] focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
          disabled={!form.pessoa_id}
        >
          <option value="">Nenhum</option>
          {contratosFiltrados.map((contrato) => (
            <option key={contrato.id} value={contrato.id}>
              {contrato.numero} - {contrato.titulo}
            </option>
          ))}
        </select>
        {!form.pessoa_id && (
          <p className="text-[12px] text-gray-500 mt-1">
            Selecione um cliente primeiro
          </p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate("/financeiro")}
          className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-normal text-[13px] transition-all"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg hover:opacity-90 font-normal text-[13px] transition-all shadow-lg"
        >
          Salvar
        </button>
      </div>
      </div>
    </div>
  );
}
