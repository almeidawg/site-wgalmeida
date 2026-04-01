// src/components/ambientes/AmbientesTimeline.tsx
import type { FC } from "react";
import { Ambiente } from "@/lib/ambientesApi";

interface Props {
  ambientes: Ambiente[];
}

const AmbientesTimeline: FC<Props> = ({ ambientes }) => {
  // agrupando por pavimento ou uso
  const grupos = ambientes.reduce<Record<string, Ambiente[]>>((acc, amb) => {
    const chave = amb.pavimento || amb.uso || "Ambientes";
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(amb);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([chave, lista]) => (
        <div key={chave}>
          <div className="mb-2 text-xs font-normal uppercase tracking-[0.2em] text-[#4C4C4C]">
            {chave}
          </div>
          <div className="border-l-2 border-[#F25C26] pl-4 space-y-3">
            {(lista as Ambiente[]).map((amb) => (
              <div key={amb.id} className="rounded-xl bg-white p-3 shadow-sm border border-[#E5E5E5]">
                <div className="text-sm font-normal text-[#2E2E2E]">
                  {amb.nome}
                </div>
                <div className="mt-1 text-xs text-[#7A7A7A]">
                  {amb.area_m2 ? `${amb.area_m2.toFixed(2)} m²` : "Área não informada"} •{" "}
                  {amb.perimetro_ml ? `${amb.perimetro_ml.toFixed(2)} ml` : "Perímetro não informado"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AmbientesTimeline;


