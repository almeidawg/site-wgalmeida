// ============================================================
// COMPONENTE: DiarioObra (Área do Cliente)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Reutiliza DiarioObraList que já funciona no módulo do colaborador
// Mantém consistência visual e evita duplicaçÍo de código
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DiarioObraList } from "@/components/diario-obra";
import { listarDiariosPorCliente } from "@/lib/diarioObraApi";
import type { DiarioObra as DiarioObraType } from "@/types/diarioObra";

interface DiarioObraProps {
  clienteId: string;
  contratoId?: string;
  oportunidadeId?: string;
}

export default function DiarioObra({ clienteId }: DiarioObraProps) {
  const [registros, setRegistros] = useState<DiarioObraType[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar registros do banco de dados
  const carregarRegistros = useCallback(async () => {
    if (!clienteId) {
      setRegistros([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const dados = await listarDiariosPorCliente(clienteId);
      setRegistros(dados);
    } catch (error) {
      console.error("[DiarioObra] Erro ao buscar registros:", error);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando diário...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (registros.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-600">Diário de Obra</h3>
          <p className="text-sm text-gray-400 mt-2">
            As fotos da sua obra aparecerÍo aqui conforme forem registradas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="w-5 h-5 text-gray-600" />
          DIÁRIO DE OBRA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Reutiliza o DiarioObraList do módulo colaborador */}
        <DiarioObraList
          registros={registros}
          readOnly={true}
          showCliente={false}
        />
      </CardContent>
    </Card>
  );
}

