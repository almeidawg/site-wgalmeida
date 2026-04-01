// src/components/DashboardMarcenariaStatus.tsx

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface StatusCount {
  pendente: number;
  em_producao: number;
  entregue: number;
}

export default function DashboardMarcenariaStatus({ obraId }: { obraId: string }) {
  const [status, setStatus] = useState<StatusCount>({ pendente: 0, em_producao: 0, entregue: 0 });

  useEffect(() => {
    async function carregarStatus() {
      const { data, error } = await supabase
        .from("marcenaria_itens")
        .select("status")
        .eq("obra_id", obraId);

      if (error) {
        console.error("Erro ao carregar status:", error.message);
        return;
      }

      const contagem: StatusCount = { pendente: 0, em_producao: 0, entregue: 0 };
      for (const item of data || []) {
        const s = item.status as keyof StatusCount;
        if (contagem[s] !== undefined) {
          contagem[s]++;
        }
      }
      setStatus(contagem);
    }
    carregarStatus();
  }, [obraId]);

  return (
    <div style={{ marginBottom: 24, display: "flex", gap: 24 }}>
      <div style={cardStyle("#999")}>Pendente: {status.pendente}</div>
      <div style={cardStyle("#ffc107")}>Em produçÍo: {status.em_producao}</div>
      <div style={cardStyle("#28a745")}>Entregue: {status.entregue}</div>
    </div>
  );
}

function cardStyle(color: string): CSSProperties {
  return {
    background: color,
    padding: "16px 24px",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
  };
}

