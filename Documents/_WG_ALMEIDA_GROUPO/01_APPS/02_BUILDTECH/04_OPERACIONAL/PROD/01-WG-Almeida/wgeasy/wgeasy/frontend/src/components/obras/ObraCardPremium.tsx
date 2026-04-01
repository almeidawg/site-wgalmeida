import React from "react";
// src/components/obras/ObraCardPremium.tsx
import { PessoaObra } from "@/lib/pessoasApi";

interface Props {
  obra: PessoaObra;
}

const ObraCardPremium: React.FC<Props> = ({ obra }) => {
  const nomeObra = obra.obras?.nome ?? "Obra sem nome";

  return (
    <div className="rounded-2xl bg-white shadow-md border border-[#E5E5E5] p-4 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <h3 className="text-base font-normal text-[#2E2E2E]">{nomeObra}</h3>

        <span className="text-xs rounded-full bg-[#F3F3F3] px-3 py-1 text-[#4C4C4C]">
          {obra.funcao_na_obra ?? "FunçÍo não definida"}
        </span>
      </div>

      <div className="mt-3 text-xs text-[#7A7A7A]">
        <p>
          <b>Início:</b>{" "}
          {obra.data_inicio
            ? new Date(obra.data_inicio).toLocaleDateString("pt-BR")
            : "N/A"}
        </p>
        <p>
          <b>Fim:</b>{" "}
          {obra.data_fim
            ? new Date(obra.data_fim).toLocaleDateString("pt-BR")
            : "Atual"}
        </p>
      </div>
    </div>
  );
};

export default ObraCardPremium;


