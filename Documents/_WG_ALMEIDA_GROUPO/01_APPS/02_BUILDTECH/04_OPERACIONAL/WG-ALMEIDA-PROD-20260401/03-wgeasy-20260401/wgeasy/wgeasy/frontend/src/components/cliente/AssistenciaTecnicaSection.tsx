// ============================================================
// COMPONENTE: AssistenciaTecnicaSection
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// SeçÍo de Assistência Técnica com links para Termo de Aceite e Garantia
// ============================================================

import { useNavigate } from "react-router-dom";
import {
  FileCheck,
  Shield,
  ChevronRight,
  Headphones
} from "lucide-react";

interface AssistenciaTecnicaSectionProps {
  clienteId: string;
  contratoId?: string;
}

export default function AssistenciaTecnicaSection(_props: AssistenciaTecnicaSectionProps) {
  const navigate = useNavigate();

  const modulos = [
    {
      id: "termo-aceite",
      titulo: "Módulo de Termo de Aceite",
      descricao: "CriaçÍo e gestÍo de termos",
      icon: FileCheck,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      link: "/wgx/termos",
    },
    {
      id: "garantia",
      titulo: "Módulo de Garantia",
      descricao: "Gerencie garantias do projeto",
      icon: Shield,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      link: "/wgx/garantia",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
          <Headphones className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-normal">Assistência Técnica</h2>
          <p className="text-white/60 text-sm">Gerencie ordens de serviço, atendimento e suporte</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <button
              key={modulo.id}
              onClick={() => navigate(modulo.link)}
              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group text-left"
            >
              <div className={`w-12 h-12 ${modulo.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${modulo.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-normal text-white">{modulo.titulo}</p>
                <p className="text-xs text-white/60">{modulo.descricao}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

