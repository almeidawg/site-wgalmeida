import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { ESTAGIOS } from "@/constants/oportunidades";
import { DateInputBR } from "@/components/ui/DateInputBR";
import { Target, ArrowLeft, Save } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function CriarOportunidadePage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  type ClienteOption = {
    id: string;
    nome: string;
  };

  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [titulo, setTitulo] = useState("");
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [estagio, setEstagio] = useState("ProspecçÍo");
  const [origem, setOrigem] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [previsao, setPrevisao] = useState("");

  const carregarClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      setClientes((data || []) as ClienteOption[]);
    } catch (err: any) {
      console.error("Erro ao carregar clientes:", err);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  async function salvar() {
    if (!titulo.trim() || !cliente) {
      toast({ title: "Titulo e cliente sao obrigatorios!" });
      return;
    }

    const { error } = await supabase.from("oportunidades").insert({
      titulo,
      cliente_id: cliente,
      valor_estimado: valor ? Number(valor) : null,
      estagio,
      origem,
      descricao,
      observacoes,
      previsao_fechamento: previsao || null,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro", description: `Erro ao criar oportunidade: : ${error.message}` });
      return;
    }

    toast({ title: "Sucesso", description: "Oportunidade criada com sucesso!" });
    navigate("/oportunidades");
  }

  return (
    <div className={`min-h-screen bg-white ${LAYOUT.pageContainer}`}>
      {/* Header WG System */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className={LAYOUT.pageHeader}>
          <div className={LAYOUT.pageTitleWrapper}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl flex items-center justify-center shadow-lg">
              <Target className={TYPOGRAPHY.iconLarge + " text-white"} />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>Criar Nova Oportunidade</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>Preencha os dados da nova oportunidade</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/oportunidades")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-normal hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <button
              onClick={salvar}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Save className="w-5 h-5" />
              Salvar Oportunidade
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className={LAYOUT.formContainer}>
        <div className={`bg-gray-50 rounded-xl ${LAYOUT.cardPadding} ${LAYOUT.sectionGap}`}>
          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Titulo *</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all"
              placeholder="Digite o titulo da oportunidade"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Cliente *</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all bg-white"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={LAYOUT.formGrid}>
            <div>
              <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Valor Estimado</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all"
                placeholder="R$ 0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>

            <div>
              <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Estagio</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all bg-white"
                value={estagio}
                onChange={(e) => setEstagio(e.target.value)}
              >
                {ESTAGIOS.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={LAYOUT.formGrid}>
            <div>
              <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Origem</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all"
                placeholder="Ex: Indicacao, Site, Redes Sociais"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
              />
            </div>

            <div>
              <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Previsao de Fechamento</label>
              <DateInputBR
                value={previsao}
                onChange={(val) => setPrevisao(val)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all"
              />
            </div>
          </div>

          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Descricao</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all resize-none"
              rows={3}
              placeholder="Descreva os detalhes da oportunidade"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label className={`block ${TYPOGRAPHY.formLabel} mb-1.5`}>Observacoes</label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] transition-all resize-none"
              rows={3}
              placeholder="Observacoes adicionais"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
