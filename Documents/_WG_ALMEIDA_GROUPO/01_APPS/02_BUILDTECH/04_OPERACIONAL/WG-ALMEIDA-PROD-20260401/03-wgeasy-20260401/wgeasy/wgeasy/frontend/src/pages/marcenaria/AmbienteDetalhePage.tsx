// src/pages/AmbienteDetalhePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  Ambiente,
  AmbienteQuantitativo,
  buscarAmbiente,
  listarQuantitativosAmbiente,
} from "@/lib/ambientesApi";
import AmbientesTimeline from "@/components/ambientes/AmbientesTimeline";

const AmbienteDetalhePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [quantitativos, setQuantitativos] = useState<AmbienteQuantitativo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const ambienteId: string = id;

    async function carregar() {
      const a = await buscarAmbiente(ambienteId);
      const qs = await listarQuantitativosAmbiente(ambienteId);
      setAmbiente(a);
      setQuantitativos(qs);
      setLoading(false);
    }

    carregar();
  }, [id]);

  if (loading) return <div className={LAYOUT.pageContainer}>Carregando ambiente...</div>;
  if (!ambiente) return <div className={`${LAYOUT.pageContainer} text-red-600`}>Ambiente nÍo encontrado.</div>;

  return (
    <div className={LAYOUT.pageContainer}>
      <button
        onClick={() => navigate("/arquitetura/ambientes")}
        className={`mb-4 ${TYPOGRAPHY.bodySmall}`}
      >
        ← Voltar
      </button>

      <h1 className={TYPOGRAPHY.pageTitle}>
        {ambiente.nome}
      </h1>

      <div className={`mt-4 sm:mt-6 ${LAYOUT.gridHalf}`}>
        <div className={LAYOUT.card}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-3`}>
            Dados do Ambiente
          </h2>

          <div className={`${TYPOGRAPHY.bodySmall} space-y-2`}>
            <p>Area: {ambiente.area_m2} m2</p>
            <p>Perimetro: {ambiente.perimetro_ml} ml</p>
            <p>Pe-direito: {ambiente.pe_direito_m} m</p>
            <p>Uso: {ambiente.uso ?? "-"}</p>
            <p>Pavimento: {ambiente.pavimento ?? "-"}</p>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-3`}>
            Quantitativos
          </h2>

          {quantitativos.length === 0 ? (
            <p className={TYPOGRAPHY.bodyMedium}>Nenhum quantitativo calculado.</p>
          ) : (
            <ul className="space-y-2">
              {quantitativos.map((q) => (
                <li
                  key={q.id}
                  className="rounded-xl bg-[#FAFAFA] p-2 sm:p-3 border border-[#F3F3F3]"
                >
                  <div className={`flex justify-between ${TYPOGRAPHY.bodySmall}`}>
                    <span>{q.tipo}</span>
                    <span>
                      {q.quantidade.toFixed(2)} {q.unidade}
                    </span>
                  </div>
                  {q.descricao && (
                    <div className={`mt-1 ${TYPOGRAPHY.cardMeta}`}>{q.descricao}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <AmbientesTimeline ambientes={[ambiente]} />
      </div>
    </div>
  );
};

export default AmbienteDetalhePage;

