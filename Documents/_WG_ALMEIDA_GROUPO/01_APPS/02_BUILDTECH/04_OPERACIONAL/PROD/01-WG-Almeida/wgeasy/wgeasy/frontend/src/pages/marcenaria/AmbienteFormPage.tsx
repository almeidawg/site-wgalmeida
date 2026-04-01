/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/AmbienteFormPage.tsx
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  Ambiente,
  AmbienteInput,
  AmbienteQuantitativo,
  buscarAmbiente,
  criarAmbiente,
  atualizarAmbiente,
  recalcularQuantitativosAmbiente,
} from "@/lib/ambientesApi";

const AmbienteFormPage = () => {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();

  const [dados, setDados] = useState<Partial<AmbienteInput & Ambiente>>({
    nome: "",
    area_m2: null,
    perimetro_ml: null,
    pe_direito_m: null,
    pavimento: "",
    uso: "",
  });

  const [loading, setLoading] = useState<boolean>(!!id);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const ambienteId: string = id;

    async function carregar() {
      try {
        const amb = await buscarAmbiente(ambienteId);
        setDados(amb);
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao carregar ambiente.");
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [id]);

  function atualizarCampo<K extends keyof (AmbienteInput & Ambiente)>(campo: K, valor: unknown) {
    setDados((ant) => ({ ...ant, [campo]: valor }));
  }

  const quantitativosPreview: AmbienteQuantitativo[] = useMemo(() => {
    const area = Number(dados.area_m2 || 0);
    const perimetro = Number(dados.perimetro_ml || 0);
    const peDireito = Number(dados.pe_direito_m || 0);
    const areaParede = perimetro * peDireito;

    return [
      {
        id: "preview-piso",
        ambiente_id: "preview",
        tipo: "piso",
        quantidade: area,
        unidade: "m2",
        descricao: "Área de piso",
      },
      {
        id: "preview-parede",
        ambiente_id: "preview",
        tipo: "parede",
        quantidade: areaParede,
        unidade: "m2",
        descricao: "Área de parede",
      },
      {
        id: "preview-teto",
        ambiente_id: "preview",
        tipo: "teto",
        quantidade: area,
        unidade: "m2",
        descricao: "Área de teto",
      },
    ].filter((item) => item.quantidade > 0);
  }, [dados.area_m2, dados.perimetro_ml, dados.pe_direito_m]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    try {
      const payload: AmbienteInput = {
        proposta_id: String(dados.proposta_id ?? ""),
        nome: String(dados.nome ?? ""),
        largura: Number(dados.largura ?? 0),
        comprimento: Number(dados.comprimento ?? 0),
        pe_direito: Number(dados.pe_direito ?? dados.pe_direito_m ?? 2.7),
        pavimento: dados.pavimento ?? null,
        uso: dados.uso ?? null,
        area_m2: Number(dados.area_m2 ?? 0) || null,
        perimetro_ml: Number(dados.perimetro_ml ?? 0) || null,
        pe_direito_m: Number(dados.pe_direito_m ?? 0) || null,
      };

      if (editando && id) {
        const atualizado = await atualizarAmbiente(id, payload);
        await recalcularQuantitativosAmbiente(atualizado.id);
      } else {
        const criado = await criarAmbiente(payload);
        await recalcularQuantitativosAmbiente(criado.id);
      }

      navigate("/arquitetura/ambientes");
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao salvar ambiente.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <div className="p-6">Carregando ambiente...</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/arquitetura/ambientes")}
        className="mb-4 text-[14px] text-[#4C4C4C]"
      >
        ← Voltar
      </button>

      <h1 className="mb-4 text-[18px] sm:text-[24px] font-normal text-[#8B5E3C]">
        {editando ? "Editar Ambiente" : "Novo Ambiente"}
      </h1>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-[14px] text-red-700">
          {erro}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* FORMULÁRIO */}
        <form onSubmit={onSubmit} className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome do ambiente
            </label>
            <input
              type="text"
              value={dados.nome ?? ""}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Área (m²)
              </label>
              <input
                type="number"
                step="0.01"
                value={dados.area_m2 ?? ""}
                onChange={(e) =>
                  atualizarCampo("area_m2", e.target.value ? Number(e.target.value) : null)
                }
                className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Perímetro (ml)
              </label>
              <input
                type="number"
                step="0.01"
                value={dados.perimetro_ml ?? ""}
                onChange={(e) =>
                  atualizarCampo(
                    "perimetro_ml",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pé-direito (m)
              </label>
              <input
                type="number"
                step="0.01"
                value={dados.pe_direito_m ?? ""}
                onChange={(e) =>
                  atualizarCampo(
                    "pe_direito_m",
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pavimento
              </label>
              <input
                type="text"
                value={dados.pavimento ?? ""}
                onChange={(e) => atualizarCampo("pavimento", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Uso
              </label>
              <input
                type="text"
                value={dados.uso ?? ""}
                onChange={(e) => atualizarCampo("uso", e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-[14px] outline-none focus:border-[#F25C26]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="mt-4 rounded-full bg-primary px-6 py-2 text-[14px] font-medium text-white shadow-md hover:bg-[#e25221] disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar ambiente"}
          </button>
        </form>

        {/* PREVIEW DE QUANTITATIVOS */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-[#E5E5E5]">
          <h2 className="mb-3 text-[20px] font-normal text-[#8B5E3C]">
            Quantitativos calculados
          </h2>

          {quantitativosPreview.length === 0 ? (
            <p className="text-[16px] text-gray-500">
              Preencha área, perímetro e pé-direito para ver os quantitativos.
            </p>
          ) : (
            <ul className="space-y-2 text-[14px] text-gray-700">
              {quantitativosPreview.map((q, idx) => (
                <li
                  key={`${q.tipo}-${idx}`}
                  className="rounded-lg bg-[#FAFAFA] px-3 py-2 border border-[#F3F3F3]"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{q.tipo}</span>
                    <span>
                      {q.quantidade.toFixed(2)} {q.unidade}
                    </span>
                  </div>
                  {q.descricao && (
                    <div className="mt-1 text-sm text-gray-500">
                      {q.descricao}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmbienteFormPage;
