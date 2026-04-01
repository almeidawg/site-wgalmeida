/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/AmbientesPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { Ambiente, listarAmbientes } from "@/lib/ambientesApi";

const AmbientesPage = () => {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregar() {
      try {
        const data = await listarAmbientes();
        setAmbientes(data);
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao carregar ambientes.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) return <div className="p-6">Carregando ambientes...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#8B5E3C]">
          Ambientes
        </h1>
        <button
          onClick={() => navigate("/arquitetura/ambientes/novo")}
          className="rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-white shadow-md hover:bg-[#e25221]"
        >
          + Novo Ambiente
        </button>
      </div>

      {erro && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-[14px] text-red-700">
          {erro}
        </div>
      )}

      {ambientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-6 text-[16px] text-gray-500">
          Nenhum ambiente cadastrado ainda.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white shadow-sm">
          <table className="min-w-full text-left text-[14px]">
            <thead className="bg-[#F3F3F3] text-sm font-medium text-gray-700">
              <tr>
                <th className="px-4 py-3">Ambiente</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3">Área (m²)</th>
                <th className="px-4 py-3">Perímetro (ml)</th>
                <th className="px-4 py-3">Pé-direito (m)</th>
              </tr>
            </thead>
            <tbody>
              {ambientes.map((amb, i) => (
                <tr
                  key={amb.id}
                  onClick={() =>
                    navigate(`/arquitetura/ambientes/${amb.id}`)
                  }
                  className={[
                    "cursor-pointer hover:bg-[#FAFAFA] transition",
                    i % 2 === 1 ? "bg-[#FCFCFC]" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">{amb.nome}</td>
                  <td className="px-4 py-3">{amb.uso ?? "-"}</td>
                  <td className="px-4 py-3">
                    {amb.area_m2 ? amb.area_m2.toFixed(2) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {amb.perimetro_ml ? amb.perimetro_ml.toFixed(2) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {amb.pe_direito_m ? amb.pe_direito_m.toFixed(2) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AmbientesPage;
