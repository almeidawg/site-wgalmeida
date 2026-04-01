import { formatarMoeda } from "@/utils/formatadores";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState, useMemo, useCallback } from "react";
import { listarPessoas } from "@/lib/pessoasApi";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  ESTAGIOS,
  NUCLEOS,
  CORES_NUCLEOS,
  type Nucleo,
} from "@/constants/oportunidades";
import { DateInputBR } from "@/components/ui/DateInputBR";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function OportunidadeFormPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  type PessoaOption = {
    id: string;
    nome: string;
  };

  type OportunidadeNucleoRow = {
    nucleo: string;
    valor: number | null;
  };

  type FormState = {
    titulo: string;
    cliente_id: string;
    valor_estimado: string;
    estagio: string;
    origem: string;
    observacoes: string;
    data_previsao_fechamento: string;
    especificador_id: string;
    condominio_nome: string;
    condominio_contato: string;
    obra_seg_sex_entrada: string;
    obra_seg_sex_saida: string;
    obra_sab_entrada: string;
    obra_sab_saida: string;
    obra_regras_obs: string;
  };

  const [clientes, setClientes] = useState<PessoaOption[]>([]);

  const [form, setForm] = useState<FormState>({
    titulo: "",
    cliente_id: "",
    valor_estimado: "",
    estagio: "Lead",
    origem: "",
    observacoes: "",
    data_previsao_fechamento: "",
    especificador_id: "",
    condominio_nome: "",
    condominio_contato: "",
    obra_seg_sex_entrada: "",
    obra_seg_sex_saida: "",
    obra_sab_entrada: "",
    obra_sab_saida: "",
    obra_regras_obs: "",
  });

  const [especificadores, setEspecificadores] = useState<PessoaOption[]>([]);

  const [nucleosSelecionados, setNucleosSelecionados] = useState<string[]>([]);
  const [valoresNucleos, setValoresNucleos] = useState<Record<string, string>>(
    {}
  );

  const carregarClientes = useCallback(async () => {
    const { data, error } = await supabase
      .from("pessoas")
      .select("id, nome, status")
      .eq("tipo", "CLIENTE")
      .eq("ativo", true)
      .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
      .order("nome", { ascending: true });

    if (!error) setClientes((data || []) as PessoaOption[]);
  }, []);

  const carregarEspecificadores = useCallback(async () => {
    const lista = await listarPessoas({ tipo: "ESPECIFICADOR", ativo: true });
    setEspecificadores((lista || []) as PessoaOption[]);
  }, []);

  const carregarOportunidade = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("oportunidades")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return;

    setForm({
      titulo: data.titulo ?? "",
      cliente_id: data.cliente_id ?? "",
      valor_estimado: data.valor ?? "",
      estagio: data.estagio ?? "Lead",
      origem: data.origem ?? "",
      observacoes: data.observacoes ?? "",
      data_previsao_fechamento: data.data_previsao_fechamento
        ? data.data_previsao_fechamento.split("T")[0]
        : "",
      especificador_id: data.especificador_id ?? "",
      // Regras de Obras
      condominio_nome: data.condominio_nome ?? "",
      condominio_contato: data.condominio_contato ?? "",
      obra_seg_sex_entrada: data.obra_seg_sex_entrada ?? "",
      obra_seg_sex_saida: data.obra_seg_sex_saida ?? "",
      obra_sab_entrada: data.obra_sab_entrada ?? "",
      obra_sab_saida: data.obra_sab_saida ?? "",
      obra_regras_obs: data.obra_regras_obs ?? "",
    });

    // Carregar núcleos
    const { data: nucleos } = await supabase
      .from("oportunidades_nucleos")
      .select("*")
      .eq("oportunidade_id", id);

    if (nucleos && nucleos.length > 0) {
      const nucleosData = nucleos as OportunidadeNucleoRow[];
      setNucleosSelecionados(nucleosData.map((n) => n.nucleo));
      const map: Record<string, string> = {};
      nucleosData.forEach((n) => {
        map[n.nucleo] = n.valor ? String(n.valor) : "";
      });
      setValoresNucleos(map);
    }
  }, [id]);

  useEffect(() => {
    carregarClientes();
    carregarEspecificadores();
    carregarOportunidade();
  }, [carregarClientes, carregarEspecificadores, carregarOportunidade]);

  function alterar(campo: keyof FormState, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function toggleNucleo(n: string) {
    setNucleosSelecionados((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  // Calcular valor estimado automaticamente como soma dos núcleos
  const valorEstimadoCalculado = useMemo(() => {
    const soma = nucleosSelecionados.reduce((total, nucleo) => {
      const valor = valoresNucleos[nucleo];
      return total + (valor ? Number(valor) : 0);
    }, 0);
    return soma;
  }, [nucleosSelecionados, valoresNucleos]);

  async function salvar() {
    if (!form.titulo.trim() || !form.cliente_id) {
      toast({ title: "Título e Cliente sÍo obrigatórios." });
      return;
    }

    // Montar payload apenas com campos válidos da tabela
    const payload = {
      titulo: form.titulo.trim(),
      cliente_id: form.cliente_id,
      valor: valorEstimadoCalculado || null,
      estagio: form.estagio,
      origem: form.origem || null,
      observacoes: form.observacoes || null,
      data_previsao_fechamento: form.data_previsao_fechamento || null,
      // Regras de Obras (todos opcionais)
      condominio_nome: form.condominio_nome || null,
      condominio_contato: form.condominio_contato || null,
      obra_seg_sex_entrada: form.obra_seg_sex_entrada || null,
      obra_seg_sex_saida: form.obra_seg_sex_saida || null,
      obra_sab_entrada: form.obra_sab_entrada || null,
      obra_sab_saida: form.obra_sab_saida || null,
      obra_regras_obs: form.obra_regras_obs || null,
    };

    let oportunidadeId = id || "";

    if (id) {
      const { error } = await supabase
        .from("oportunidades")
        .update(payload)
        .eq("id", id);

      if (error) {
        let msg = "Erro ao atualizar oportunidade: " + error.message;
        if (error.message && error.message.includes("condominio_contato")) {
          msg +=
            "\n\nPossível causa: O campo 'condominio_contato' nÍo existe ou nÍo está sincronizado no schema do banco. Verifique se a migration foi aplicada e se o cache do Supabase está atualizado.";
        }
        toast({ variant: "destructive", title: "Erro", description: msg });
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("oportunidades")
        .insert(payload)
        .select("id")
        .single();

      if (error || !data) {
        toast({ variant: "destructive", title: "Erro", description: `Erro ao criar oportunidade: : ${error?.message}` });
        return;
      }
      oportunidadeId = data.id;
    }

    // Salvar unidades (núcleos)
    if (oportunidadeId) {
      await supabase
        .from("oportunidades_nucleos")
        .delete()
        .eq("oportunidade_id", oportunidadeId);

      for (const nucleo of nucleosSelecionados) {
        // Garante que o valor salvo é sempre o valor exibido no campo, nunca vazio ou nulo
        const valorOriginal = valoresNucleos[nucleo];
        let valor: number | null;
        // Se o valor for string vazia, null ou NaN, nÍo salva (ou salva como null)
        if (valorOriginal === undefined || valorOriginal === null || valorOriginal === "") {
          valor = null;
        } else {
          // Substitui vírgula por ponto para aceitar valores como "0,00"
          const valorConvertido = Number(String(valorOriginal).replace(",", "."));
          valor = Number.isNaN(valorConvertido) ? null : valorConvertido;
        }
        await supabase.from("oportunidades_nucleos").insert({
          oportunidade_id: oportunidadeId,
          nucleo,
          valor,
        });
      }

      // NOTA: Cards só sÍo copiados para os Kanbans dos núcleos quando
      // a oportunidade chega ao estágio "Fechamento" no Kanban principal.
      // Até lá, sÍo apenas clientes em potencial.
    }

    toast({ title: "Sucesso", description: "Oportunidade salva com sucesso!" });
    navigate("/oportunidades");
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <h1 className={`${TYPOGRAPHY.pageTitle} mb-4`}>
        {id ? "Editar Oportunidade" : "Nova Oportunidade"}
      </h1>

      {/* Campos principais */}
      <div>
        <label htmlFor="especificador_id" className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
          Especificador (Indicacao)
        </label>
        <select
            id="especificador_id"
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            value={form.especificador_id}
            onChange={(e) => alterar("especificador_id", e.target.value)}
            title="Selecione o especificador"
          >
          <option value="">Nenhum</option>
          {especificadores.map((esp) => (
            <option key={esp.id} value={esp.id}>
              {esp.nome}
            </option>
          ))}
        </select>
      </div>
      <div className={LAYOUT.formGrid}>
        <div>
          <label htmlFor="titulo" className={`block ${TYPOGRAPHY.formLabel} mb-1`}>Titulo *</label>
          <input
            id="titulo"
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            value={form.titulo}
            onChange={(e) => alterar("titulo", e.target.value)}
            title="Título da oportunidade"
            placeholder="Digite o título"
          />
        </div>

        <div>
          <label htmlFor="cliente_id" className={`block ${TYPOGRAPHY.formLabel} mb-1`}>Cliente *</label>
          <select
            id="cliente_id"
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            value={form.cliente_id}
            onChange={(e) => alterar("cliente_id", e.target.value)}
            title="Selecione o cliente"
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
            Valor Estimado (Total) - Automatico
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded border-[#D9D9D9] bg-gray-100 text-gray-500 cursor-not-allowed text-lg"
            value={formatarMoeda(valorEstimadoCalculado)}
            disabled
            title="Este valor é calculado automaticamente pela soma dos núcleos"
          />
        </div>

        <div>
          <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>Estagio</label>
          <select
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            value={form.estagio}
            onChange={(e) => alterar("estagio", e.target.value)}
            title="Selecione o estágio da oportunidade"
          >
            {ESTAGIOS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>Origem</label>
          <input
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            value={form.origem}
            onChange={(e) => alterar("origem", e.target.value)}
            placeholder="IndicaçÍo, Instagram, Google..."
          />
        </div>

        <div>
          <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
            Previsao de Fechamento
          </label>
          <DateInputBR
            value={form.data_previsao_fechamento}
            onChange={(val) => alterar("data_previsao_fechamento", val)}
            title="Selecione a data prevista para fechar este negócio"
            className="w-full p-2.5 border rounded-lg border-[#D9D9D9] focus:border-[#2B4580] focus:ring-2 focus:ring-[#2B4580]/20 transition-all text-lg"
          />
          {form.data_previsao_fechamento && (
            <p className="text-xs text-gray-500 mt-1">
              {new Date(
                form.data_previsao_fechamento + "T00:00:00"
              ).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Unidades (Nucleos) WG */}
      <div className="mt-4 sm:mt-6">
        <label className={`block ${TYPOGRAPHY.formLabel} mb-2`}>
          Unidades do Grupo WG envolvidas
        </label>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {NUCLEOS.map((n) => {
            const selected = nucleosSelecionados.includes(n);
            const cores = CORES_NUCLEOS[n as Nucleo];
            return (
              <div key={n} className="flex flex-col gap-2">
                {/* BotÍo do Núcleo */}
                <button
                  type="button"
                  onClick={() => toggleNucleo(n)}
                  className="p-3 text-lg font-normal rounded-xl border-2 transition-all"
                  style={
                    selected
                      ? {
                          backgroundColor: cores.primary,
                          borderColor: cores.border,
                          color: "white",
                        }
                      : {
                          backgroundColor: cores.secondary,
                          borderColor: cores.border,
                          color: cores.text,
                        }
                  }
                >
                  {n}
                </button>

                {/* Input de Valor aparece diretamente abaixo quando selecionado */}
                {selected && (
                  <input
                    type="number"
                    className="p-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all text-lg"
                    style={{
                      borderColor: cores.border,
                      backgroundColor: cores.secondary,
                    }}
                    value={valoresNucleos[n] || ""}
                    onChange={(e) =>
                      setValoresNucleos((prev) => ({
                        ...prev,
                        [n]: e.target.value,
                      }))
                    }
                    placeholder="R$ 0,00"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Regras de Obras */}
      <div className={`mt-4 sm:mt-6 ${LAYOUT.cardPadding} bg-gray-50 rounded-lg border border-gray-200`}>
        <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4 flex items-center gap-2`}>
          Regras de Obras do Condominio
        </h3>

        <div className={LAYOUT.formGrid}>
          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
              Nome do Condominio
            </label>
            <input
              className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
              value={form.condominio_nome}
              onChange={(e) => alterar("condominio_nome", e.target.value)}
              placeholder="Ex: Condomínio Residencial..."
            />
          </div>

          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
              Contato do Condominio
            </label>
            <input
              className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
              value={form.condominio_contato}
              onChange={(e) => alterar("condominio_contato", e.target.value)}
              placeholder="Telefone, síndico, portaria..."
            />
          </div>
        </div>

        {/* Horarios de Obra */}
        <div className="mt-3 sm:mt-4">
          <label className={`block ${TYPOGRAPHY.formLabel} mb-2`}>
            Horarios Permitidos para Obras
          </label>

          <div className={LAYOUT.formGrid}>
            {/* Segunda a Sexta */}
            <div className="p-3 bg-white rounded border border-gray-200">
              <span className="text-xs font-medium text-gray-600 mb-2 block">
                Segunda a Sexta
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Entrada</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
                    value={form.obra_seg_sex_entrada}
                    onChange={(e) =>
                      alterar("obra_seg_sex_entrada", e.target.value)
                    }
                    min="00:00"
                    max="23:59"
                    title="Horário de entrada de segunda a sexta"
                    placeholder="HH:MM"
                  />
                </div>
                <span className="text-gray-400 mt-4">às</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Saída</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
                    value={form.obra_seg_sex_saida}
                    onChange={(e) =>
                      alterar("obra_seg_sex_saida", e.target.value)
                    }
                    min="00:00"
                    max="23:59"
                    title="Horário de saída de segunda a sexta"
                    placeholder="HH:MM"
                  />
                </div>
              </div>
            </div>

            {/* Sábados */}
            <div className="p-3 bg-white rounded border border-gray-200">
              <span className="text-xs font-medium text-gray-600 mb-2 block">
                Sábados
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Entrada</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded border-[#D9D9D9]"
                    value={form.obra_sab_entrada}
                    onChange={(e) =>
                      alterar("obra_sab_entrada", e.target.value)
                    }
                    min="00:00"
                    max="23:59"
                    title="Horário de entrada aos sábados"
                    placeholder="HH:MM"
                  />
                </div>
                <span className="text-gray-400 mt-4">às</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Saída</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded border-[#D9D9D9]"
                    value={form.obra_sab_saida}
                    onChange={(e) => alterar("obra_sab_saida", e.target.value)}
                    min="00:00"
                    max="23:59"
                    title="Horário de saída aos sábados"
                    placeholder="HH:MM"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observacoes das Regras */}
        <div className="mt-3 sm:mt-4">
          <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
            Observacoes sobre as Regras
          </label>
          <textarea
            className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
            rows={3}
            value={form.obra_regras_obs}
            onChange={(e) => alterar("obra_regras_obs", e.target.value)}
            placeholder="Restrições especiais, regras adicionais, normas do condomínio..."
          />
        </div>
      </div>

      {/* Observacoes */}
      <div className="mt-4 sm:mt-6">
        <label className={`block ${TYPOGRAPHY.formLabel} mb-1`}>
          Observacoes Gerais
        </label>
        <textarea
          className="w-full p-2 border rounded border-[#D9D9D9] text-lg"
          rows={4}
          value={form.observacoes}
          onChange={(e) => alterar("observacoes", e.target.value)}
          placeholder="Anotações, detalhes do cliente, informações relevantes..."
        />
      </div>

      <div className="mt-4 sm:mt-6 flex justify-between">
        <button
          className="px-4 py-2 bg-[#F3F3F3] text-[#2E2E2E] rounded hover:bg-[#E5E5E5] text-lg"
          onClick={() => navigate("/oportunidades")}
        >
          Voltar
        </button>
        <button
          className="px-4 py-2 bg-primary text-white rounded hover:bg-[#D94E1F] transition-colors text-lg"
          onClick={salvar}
        >
          Salvar Oportunidade
        </button>
      </div>
    </div>
  );
}
