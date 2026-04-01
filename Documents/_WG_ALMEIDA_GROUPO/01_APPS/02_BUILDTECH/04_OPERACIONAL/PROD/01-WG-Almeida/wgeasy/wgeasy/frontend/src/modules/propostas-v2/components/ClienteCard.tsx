/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// ClienteCard - Card de seleçÍo de cliente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useRef } from "react";
import { User, Search, Phone, Mail, CheckCircle } from "lucide-react";
import Badge from "@/components/ui/badge";
import type { Cliente } from "../types";
import { useClientes } from "../hooks/useClientes";

interface ClienteCardProps {
  cliente: Cliente | null;
  onSelecionar: (cliente: Cliente) => void;
  analiseVinculada?: boolean;
  quantitativoVinculado?: boolean;
  disabled?: boolean;
}

export default function ClienteCard({
  cliente,
  onSelecionar,
  analiseVinculada,
  quantitativoVinculado,
  disabled,
}: ClienteCardProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const { clientes, loading, buscar, limpar } = useClientes();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBuscar = (termo: string) => {
    setBusca(termo);
    buscar(termo);
    setAberto(true);
  };

  const handleSelecionar = (c: Cliente) => {
    onSelecionar(c);
    setBusca("");
    limpar();
    setAberto(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
          Cliente
        </h3>
      </div>

      {/* Busca */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar cliente..."
          value={busca}
          onChange={(e) => handleBuscar(e.target.value)}
          onFocus={() => clientes.length > 0 && setAberto(true)}
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Dropdown de resultados */}
        {aberto && clientes.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelecionar(c)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              >
                <p className="font-medium text-gray-900 text-sm">{c.nome}</p>
                <p className="text-xs text-gray-500">
                  {c.cpf && `CPF: ${c.cpf.slice(-6)}`}
                  {c.email && ` • ${c.email}`}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cliente selecionado */}
      {cliente ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F25C26] to-[#e04a1a] flex items-center justify-center text-white font-normal text-sm">
              {cliente.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-normal text-gray-900 text-sm truncate">{cliente.nome}</p>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {cliente.status && (
                  <Badge variant="success" size="sm">
                    {cliente.status === "novo" ? "Novo" :
                     cliente.status === "em_obra" ? "Em Obra" : "Recorrente"}
                  </Badge>
                )}
                {analiseVinculada && (
                  <Badge variant="default" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">
                    Análise IA
                  </Badge>
                )}
                {quantitativoVinculado && (
                  <Badge variant="default" size="sm" className="bg-purple-50 text-purple-600 border-purple-200">
                    Quantitativo
                  </Badge>
                )}
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            {cliente.telefone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                <span>{cliente.telefone}</span>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" />
                <span className="truncate">{cliente.email}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500">
          Busque e selecione um cliente
        </div>
      )}
    </div>
  );
}

