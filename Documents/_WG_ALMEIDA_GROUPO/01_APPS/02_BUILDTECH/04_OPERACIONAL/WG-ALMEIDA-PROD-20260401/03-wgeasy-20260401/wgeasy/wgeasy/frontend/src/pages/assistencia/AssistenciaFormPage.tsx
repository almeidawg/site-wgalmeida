/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  criarOS,
  atualizarOS,
  buscarOS,
  atualizarValorMaoObra,
  type OrdemServicoFormData,
  type OrdemServicoCompleta,
} from "@/lib/assistenciaApi";
import { listarPessoas } from "@/lib/pessoasApi";
import {
  validarOS,
  TIPO_ATENDIMENTO_LABELS,
  PRIORIDADE_LABELS,
} from "@/types/assistenciaTecnica";
import { DateInputBR } from "@/components/ui/DateInputBR";

export default function AssistenciaFormPage() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdicao = !!id;

  const [loading, setLoading] = useState(false);
  const [os, setOS] = useState<OrdemServicoCompleta | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);

  // Dados do formulário
  const [clienteId, setClienteId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoAtendimento, setTipoAtendimento] = useState<any>("manutencao");
  const [prioridade, setPrioridade] = useState<any>("media");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [enderecoAtendimento, setEnderecoAtendimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [valorMaoObra, setValorMaoObra] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      // Carregar pessoas
      const pessoasData = await listarPessoas();
      const clientesData = pessoasData.filter((p) => p.tipo === "CLIENTE");
      const tecnicosData = pessoasData.filter((p) => p.tipo === "COLABORADOR");
      setClientes(clientesData);
      setTecnicos(tecnicosData);

      // Se for ediçÍo, carregar OS
      if (id) {
        const osData = await buscarOS(id);
        setOS(osData);
        setClienteId(osData.cliente_id);
        setTecnicoId(osData.tecnico_responsavel_id || "");
        setTitulo(osData.titulo);
        setDescricao(osData.descricao);
        setTipoAtendimento(osData.tipo_atendimento);
        setPrioridade(osData.prioridade);
        setDataPrevisao(osData.data_previsao || "");
        setEnderecoAtendimento(osData.endereco_atendimento || "");
        setObservacoes(osData.observacoes || "");
        setValorMaoObra(osData.valor_mao_obra);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar dados" });
    }
  }

  async function salvar() {
    const formData: OrdemServicoFormData = {
      cliente_id: clienteId,
      titulo,
      descricao,
      tipo_atendimento: tipoAtendimento,
      prioridade,
      data_previsao: dataPrevisao || undefined,
      tecnico_responsavel_id: tecnicoId || undefined,
      endereco_atendimento: enderecoAtendimento || undefined,
      observacoes: observacoes || undefined,
    };

    const erros = validarOS(formData);
    if (erros.length > 0) {
      toast({ variant: "destructive", title: "Erro de validaçÍo", description: erros.join(", ") });
      return;
    }

    setLoading(true);
    try {
      if (isEdicao && id) {
        await atualizarOS(id, formData);

        // Atualizar valor de mÍo de obra se alterado
        if (os && valorMaoObra !== os.valor_mao_obra) {
          await atualizarValorMaoObra(id, valorMaoObra);
        }

        toast({ title: "Sucesso", description: "Ordem de serviço atualizada com sucesso!" });
        navigate(`/assistencia/detalhe/${id}`);
      } else {
        const novaOS = await criarOS(formData);

        // Definir valor de mÍo de obra se informado
        if (valorMaoObra > 0) {
          await atualizarValorMaoObra(novaOS.id, valorMaoObra);
        }

        toast({ title: "Sucesso", description: "Ordem de serviço criada com sucesso!" });
        navigate(`/assistencia/detalhe/${novaOS.id}`);
      }
    } catch (err) {
      console.error("Erro ao salvar OS:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar ordem de serviço" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
          {isEdicao ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
        </h1>
        <p className="text-sm text-[#4C4C4C]">
          {isEdicao
            ? `Editando OS ${os?.numero || ""}`
            : "Preencha os dados da nova ordem de serviço"}
        </p>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6 space-y-4">
        <h2 className="text-lg font-normal text-[#2E2E2E]">Dados da OS</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Cliente *
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Técnico Responsável
            </label>
            <select
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            >
              <option value="">Selecione um técnico</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: ManutençÍo preventiva - Ar condicionado"
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              DescriçÍo *
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva o problema ou serviço solicitado..."
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Tipo de Atendimento *
            </label>
            <select
              value={tipoAtendimento}
              onChange={(e) => setTipoAtendimento(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            >
              {Object.entries(TIPO_ATENDIMENTO_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Prioridade *
            </label>
            <select
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            >
              {Object.entries(PRIORIDADE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Data de PrevisÍo
            </label>
            <DateInputBR
              value={dataPrevisao}
              onChange={(val) => setDataPrevisao(val)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Valor MÍo de Obra (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={valorMaoObra}
              onChange={(e) => setValorMaoObra(Number(e.target.value))}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Endereço de Atendimento
            </label>
            <input
              type="text"
              value={enderecoAtendimento}
              onChange={(e) => setEnderecoAtendimento(e.target.value)}
              placeholder="Endereço completo onde será realizado o atendimento"
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-lg font-medium text-[#4C4C4C] mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Observações gerais sobre o atendimento..."
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={salvar}
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-[#d54b1c] disabled:opacity-50"
          >
            {loading ? "Salvando..." : isEdicao ? "Atualizar OS" : "Criar OS"}
          </button>
          <button
            onClick={() => navigate("/assistencia")}
            className="px-4 py-2 bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Cancelar
          </button>
          {isEdicao && id && (
            <button
              onClick={() => navigate(`/assistencia/detalhe/${id}`)}
              className="px-4 py-2 bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
            >
              Ver Detalhes
            </button>
          )}
        </div>
      </div>

      {/* INFORMAÇÕES */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div className="text-sm text-blue-800">
            <div className="font-normal mb-1">Dica:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Após criar a OS, você poderá adicionar itens/peças na página de detalhes</li>
              <li>O valor total será calculado automaticamente (mÍo de obra + peças)</li>
              <li>Você pode atribuir ou alterar o técnico responsável a qualquer momento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
