// src/pages/pessoas/painel/InfoTab.tsx
import React from "react";
import type { Pessoa } from "@/types/pessoas";

interface InfoTabProps {
  pessoa: Pessoa;
}

export const InfoTab: React.FC<InfoTabProps> = ({ pessoa }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-normal text-gray-900 mb-3">
          Dados principais
        </h2>

        <div className="grid gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Nome</div>
            <div className="text-gray-900">{pessoa.nome}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500 text-xs">E-mail</div>
              <div className="text-gray-900">
                {pessoa.email || <span className="text-gray-400">NÍo informado</span>}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Telefone</div>
              <div className="text-gray-900">
                {pessoa.telefone || (
                  <span className="text-gray-400">NÍo informado</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-gray-500 text-xs">Tipo</div>
              <div className="text-gray-900">
                {pessoa.tipo || <span className="text-gray-400">-</span>}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Cargo</div>
              <div className="text-gray-900">
                {pessoa.cargo || <span className="text-gray-400">-</span>}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Unidade</div>
              <div className="text-gray-900">
                {pessoa.unidade || <span className="text-gray-400">-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card lateral para uso futuro: IA, score, etc. */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-lg font-normal text-gray-900 mb-3">
          Insights & Score
        </h2>
        <p className="text-xs text-gray-500">
          Área preparada para IA (prioridade, risco, oportunidades, follow-ups).
        </p>
      </div>
    </div>
  );
};

