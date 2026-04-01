/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CondicoesComerciaisCard - Card de condições comerciais
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { CreditCard, Settings } from "lucide-react";
import type { CondicoesComerciais } from "../types";
import { formatarMoeda } from "@/lib/utils";

interface CondicoesComerciaisCardProps {
  condicoes: CondicoesComerciais;
  taxaCartaoPerc: number;
  valorTaxaCartao: number;
  totalComCartao: number;
  valorTotal: number;
  onChange: <K extends keyof CondicoesComerciais>(campo: K, valor: CondicoesComerciais[K]) => void;
}

export default function CondicoesComerciaisCard({
  condicoes,
  taxaCartaoPerc,
  valorTaxaCartao,
  totalComCartao,
  valorTotal,
  onChange,
}: CondicoesComerciaisCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
          Condições Comerciais
        </h3>
      </div>

      <div className="space-y-3">
        {/* Forma de pagamento */}
        <div className="grid grid-cols-3 gap-1">
          {[
            { value: "a_vista", label: "À Vista" },
            { value: "parcelado", label: "Parcelado" },
            { value: "etapas", label: "Etapas" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange("forma_pagamento", opt.value as any)}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                condicoes.forma_pagamento === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Entrada e Parcelas */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Entrada</label>
            {/* Seletor de tipo de entrada (% ou R$) */}
            <div className="flex gap-1 mb-1">
              <button
                type="button"
                onClick={() => onChange("tipo_entrada" as any, "percentual")}
                className={`flex-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  (condicoes as any).tipo_entrada === "percentual" || !(condicoes as any).tipo_entrada
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => onChange("tipo_entrada" as any, "valor")}
                className={`flex-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  (condicoes as any).tipo_entrada === "valor"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                R$
              </button>
            </div>
            <div className="flex items-center gap-1">
              {(condicoes as any).tipo_entrada === "valor" ? (
                <>
                  <span className="text-xs text-gray-500">R$</span>
                  <input
                    type="number"
                    value={(condicoes as any).valor_entrada || ""}
                    onChange={(e) => {
                      const valor = Number(e.target.value);
                      onChange("valor_entrada" as any, valor);
                      // Calcular percentual automaticamente
                      if (valorTotal > 0) {
                        const perc = (valor / valorTotal) * 100;
                        onChange("percentual_entrada", Math.round(perc));
                      }
                    }}
                    placeholder="0,00"
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
                  />
                </>
              ) : (
                <>
                  <input
                    type="number"
                    value={condicoes.percentual_entrada}
                    onChange={(e) => {
                      const perc = Number(e.target.value);
                      onChange("percentual_entrada", perc);
                      // Calcular valor automaticamente
                      if (valorTotal > 0) {
                        const valor = (valorTotal * perc) / 100;
                        onChange("valor_entrada" as any, Math.round(valor));
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </>
              )}
            </div>
            {/* Mostrar equivalência */}
            {valorTotal > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {(condicoes as any).tipo_entrada === "valor"
                  ? `${condicoes.percentual_entrada}%`
                  : `R$ ${formatarMoeda((valorTotal * condicoes.percentual_entrada) / 100)}`}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Parcelas</label>
            <input
              type="number"
              value={condicoes.numero_parcelas}
              onChange={(e) => onChange("numero_parcelas", Number(e.target.value))}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F25C26] mt-[21px]"
            />
          </div>
        </div>

        {/* Validade e Prazo */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Validade</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={condicoes.validade_dias}
                onChange={(e) => onChange("validade_dias", Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
              />
              <span className="text-xs text-gray-500">dias</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prazo Exec.</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={condicoes.prazo_execucao_dias}
                onChange={(e) => onChange("prazo_execucao_dias", Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
              />
              <span className="text-xs text-gray-500">dias</span>
            </div>
          </div>
        </div>

        {/* Pagamento com cartÍo */}
        {condicoes.forma_pagamento === "parcelado" && (
          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={condicoes.pagamento_cartao}
                onChange={(e) => onChange("pagamento_cartao", e.target.checked)}
                className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
              />
              <span className="text-xs font-medium text-gray-700">CartÍo de Crédito</span>
            </label>

            {condicoes.pagamento_cartao && valorTotal > 0 && (
              <div className="mt-2 p-2 bg-orange-50 rounded-lg text-xs">
                <div className="flex justify-between">
                  <span className="text-orange-600">Taxa ({condicoes.numero_parcelas}x)</span>
                  <span className="font-medium text-orange-700">{taxaCartaoPerc.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-orange-600">Valor taxa</span>
                  <span className="font-medium text-orange-700">{formatarMoeda(valorTaxaCartao)}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-orange-200">
                  <span className="font-normal text-gray-700">Total c/ cartÍo</span>
                  <span className="font-normal text-[#F25C26]">{formatarMoeda(totalComCartao)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

