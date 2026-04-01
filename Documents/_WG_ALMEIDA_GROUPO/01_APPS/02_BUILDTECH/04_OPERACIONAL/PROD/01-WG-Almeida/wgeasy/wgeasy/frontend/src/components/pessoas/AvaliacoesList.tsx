import React from "react";
// src/components/pessoas/AvaliacoesList.tsx
import { PessoaAvaliacao } from "@/lib/pessoasApi";

interface Props {
  avaliacoes: PessoaAvaliacao[];
}

const AvaliacoesList: React.FC<Props> = ({ avaliacoes }) => {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-xs font-normal uppercase tracking-[0.2em] text-[#4C4C4C]">
        Avaliações
      </h2>
      {avaliacoes.length === 0 ? (
        <p className="text-sm text-[#7A7A7A]">
          Nenhuma avaliaçÍo registrada para este colaborador.
        </p>
      ) : (
        <ul className="space-y-2 text-sm text-[#4C4C4C]">
          {avaliacoes.map((av) => (
            <li
              key={av.id}
              className="rounded-xl border border-[#F3F3F3] bg-[#FAFAFA] px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
                  Nota
                </div>
                <div className="text-sm font-normal text-[#2E2E2E]">
                  {av.nota} / 10
                </div>
              </div>
              {av.comentario && (
                <p className="mt-1 text-xs text-[#4C4C4C]">{av.comentario}</p>
              )}
              <div className="mt-1 text-[10px] text-[#7A7A7A]">
                {new Date(av.criado_em).toLocaleDateString("pt-BR")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AvaliacoesList;

