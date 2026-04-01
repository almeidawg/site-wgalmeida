import React from "react";
// src/components/pessoas/ObrasList.tsx
import { PessoaObra } from "@/lib/pessoasApi";

interface Props {
  obras: PessoaObra[];
}

const ObrasList: React.FC<Props> = ({ obras }) => {
  if (!obras || obras.length === 0) {
    return (
      <p className="text-sm text-[#7A7A7A]">
        Nenhuma obra vinculada a este colaborador.
      </p>
    );
  }

  return (
    <ul className="space-y-3 mt-3">
      {obras.map((obra) => (
        <li
          key={obra.id}
          className="rounded-xl border border-[#F3F3F3] bg-[#FAFAFA] px-4 py-3"
        >
          <div className="flex justify-between">
            <div className="text-sm font-normal text-[#2E2E2E]">
              {obra.obras?.nome ?? "Nome da obra não disponível"}
            </div>

            <div className="text-xs text-[#7A7A7A]">
              {obra.funcao_na_obra || "FunçÍo não definida"}
            </div>
          </div>

          <div className="mt-1 text-xs text-[#4C4C4C]">
            {obra.data_inicio
              ? new Date(obra.data_inicio).toLocaleDateString("pt-BR")
              : "Sem início"}{" "}
            →{" "}
            {obra.data_fim
              ? new Date(obra.data_fim).toLocaleDateString("pt-BR")
              : "Atual"}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ObrasList;


