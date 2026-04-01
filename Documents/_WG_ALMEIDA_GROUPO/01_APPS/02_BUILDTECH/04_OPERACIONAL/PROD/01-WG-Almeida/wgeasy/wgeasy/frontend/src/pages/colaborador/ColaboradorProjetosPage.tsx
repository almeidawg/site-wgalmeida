import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Building2,
  CheckCircle2,
  HardHat,
  Camera,
  FileText,
} from "lucide-react";
import { formatarData } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DiarioObraForm } from "@/components/diario-obra";
import { listarDiariosPorColaborador } from "@/lib/diarioObraApi";
import { listarProjetosColaborador, ColaboradorProjeto } from "@/lib/colaboradorApi";
import { supabase } from "@/lib/supabaseClient";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import type { DiarioObra } from "@/types/diarioObra";
import Avatar from "@/components/common/Avatar";

// Tipo para dados do card de cliente com diário
type ClienteDiarioCard = {
  clienteId: string;
  clienteNome: string;
  avatarUrl?: string | null;
  fotoUrl?: string | null;
  registros: number;
  totalFotos: number;
  ultimaData: string;
  progresso: number;
  fotosRecentes: Array<{ id: string; url: string; data: string; legenda: string | null }>;
};

// Card de Cliente com Diário - estilo solicitado
const ClienteDiarioCardCompact = ({
  card,
  onClick,
}: {
  card: ClienteDiarioCard;
  onClick: () => void;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="w-full bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-200 hover:border-[#F25C26] cursor-pointer"
    >
      {/* Header com Avatar e Nome */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            nome={card.clienteNome}
            avatar_url={card.avatarUrl || null}
            foto_url={card.fotoUrl || null}
            size={32}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-normal text-gray-900 truncate uppercase">
              {card.clienteNome}
            </p>
            <p className="text-[10px] text-gray-500">
              {card.registros} registro{card.registros !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[9px] font-normal text-white bg-primary">
          Diário
        </span>
      </div>

      {/* Grid de Fotos Recentes */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-3 gap-1.5">
          {card.fotosRecentes.slice(0, 3).map((foto) => (
            <div
              key={foto.id}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
            >
              <img
                src={foto.url}
                alt="Foto da obra"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[8px] text-white flex items-center justify-between gap-1">
                <span className="truncate flex-1">{foto.legenda || "foto"}</span>
                <span className="flex-shrink-0">{foto.data}</span>
              </div>
            </div>
          ))}
          {card.fotosRecentes.length === 0 && (
            <div className="col-span-3 flex items-center justify-center h-16 text-[10px] text-gray-400 border border-dashed rounded-lg">
              <Camera className="w-4 h-4 mr-1" />
              Sem fotos
            </div>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
          <span>Progresso do projeto</span>
          <span className="font-medium text-[#F25C26]">{card.progresso}%</span>
        </div>
        <Progress value={card.progresso} className="h-1.5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-[10px] text-gray-500">
        <span>{card.totalFotos} foto{card.totalFotos !== 1 ? "s" : ""}</span>
        <span>{card.ultimaData ? formatarData(card.ultimaData) : "Sem registros"}</span>
      </div>
    </motion.div>
  );
};

// ============================================================
// Componente Principal
// ============================================================
export default function ColaboradorProjetosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { usuario } = useUsuarioLogado();
  const colaboradorId = usuario?.pessoa_id || "";

  const [loading, setLoading] = useState(true);
  const [projetos, setProjetos] = useState<ColaboradorProjeto[]>([]);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Progresso real do cronograma por contrato_id
  const [progressoMap, setProgressoMap] = useState<Map<string, number>>(new Map());

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [projetosData, diariosData] = await Promise.all([
        colaboradorId ? listarProjetosColaborador(colaboradorId) : Promise.resolve([]),
        colaboradorId ? listarDiariosPorColaborador(colaboradorId) : Promise.resolve([]),
      ]);
      setProjetos(projetosData);
      setDiarios(diariosData);

      // Buscar progresso real do cronograma para cada projeto
      const contratoIds = projetosData
        .map((p: any) => p.projeto_id || p.projeto?.id)
        .filter(Boolean);

      if (contratoIds.length > 0) {
        // projetos.contrato_id → cronograma_tarefas.projeto_id
        const { data: projetosRows } = await supabase
          .from("projetos")
          .select("id, contrato_id")
          .in("contrato_id", contratoIds);

        const projetoIds = (projetosRows || []).map((p: any) => p.id);
        const projetoToContrato = new Map<string, string>();
        for (const p of projetosRows || []) {
          projetoToContrato.set(p.id, p.contrato_id);
        }

        if (projetoIds.length > 0) {
          const { data: tarefas } = await supabase
            .from("cronograma_tarefas")
            .select("projeto_id, status, progresso")
            .in("projeto_id", projetoIds);

          // Agregar progresso por contrato
          const contratoStats = new Map<string, { total: number; concluidas: number }>();
          for (const t of tarefas || []) {
            const contratoId = projetoToContrato.get(t.projeto_id);
            if (!contratoId) continue;
            const s = contratoStats.get(contratoId) || { total: 0, concluidas: 0 };
            s.total += 1;
            if (t.status === "concluido" || Number(t.progresso || 0) >= 100) {
              s.concluidas += 1;
            }
            contratoStats.set(contratoId, s);
          }

          const map = new Map<string, number>();
          for (const [cid, s] of contratoStats) {
            map.set(cid, s.total > 0 ? Math.round((s.concluidas / s.total) * 100) : 0);
          }
          setProgressoMap(map);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar projetos",
        description: "NÍo foi possível obter a lista de projetos.",
      });
    } finally {
      setLoading(false);
    }
  }, [colaboradorId, toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Handler para novo registro criado
  const handleNovoRegistro = useCallback(() => {
    setSheetOpen(false);
    carregarDados();
  }, [carregarDados]);

  // Agrupar diários por cliente
  const clientesComDiario = useMemo<ClienteDiarioCard[]>(() => {
    const clienteMap = new Map<string, {
      registros: DiarioObra[];
      projeto?: ColaboradorProjeto;
    }>();

    // Agrupar diários por cliente
    diarios.forEach((registro) => {
      const clienteId = registro.cliente_id;
      if (!clienteId) return;

      const atual = clienteMap.get(clienteId) || { registros: [] };
      atual.registros.push(registro);
      clienteMap.set(clienteId, atual);
    });

    // Associar projetos aos clientes
    projetos.forEach((projeto) => {
      const clienteIdProjeto = projeto.projeto?.cliente_id;
      if (clienteIdProjeto) {
        const atual = clienteMap.get(clienteIdProjeto);
        if (atual) {
          atual.projeto = projeto;
        }
      }
    });

    // Converter para array de cards
    return Array.from(clienteMap.entries())
      .map(([clienteId, data]) => {
        const registros = data.registros;
        const projeto = data.projeto;
        const clienteNome = registros[0]?.cliente?.nome || projeto?.projeto?.cliente_nome || "Cliente";

        // Obter avatar/foto do cliente (prioriza dados do registro, depois do projeto)
        const clienteAvatar = registros[0]?.cliente?.avatar_url || projeto?.projeto?.cliente_avatar_url;
        const clienteFoto = registros[0]?.cliente?.foto_url || projeto?.projeto?.cliente_foto_url;

        // Calcular fotos
        const todasFotos = registros.flatMap((r) =>
          (r.fotos || []).map((f) => ({
            id: f.id,
            url: f.arquivo_url,
            data: new Date(f.criado_em).toLocaleDateString("pt-BR"),
            legenda: f.legenda,
          }))
        ).sort((a, b) => b.data.localeCompare(a.data));

        // Calcular última data
        const ultimaData = registros.reduce((prev, current) => {
          if (!prev) return current.data_registro;
          return new Date(current.data_registro) > new Date(prev)
            ? current.data_registro
            : prev;
        }, "");

        // Progresso real do cronograma (espelhado de cronograma_tarefas)
        const contratoIdProjeto = projeto?.projeto?.id || projeto?.projeto_id;
        const progresso = contratoIdProjeto ? (progressoMap.get(contratoIdProjeto) ?? 0) : 0;

        return {
          clienteId,
          clienteNome,
          avatarUrl: clienteAvatar,
          fotoUrl: clienteFoto,
          registros: registros.length,
          totalFotos: todasFotos.length,
          ultimaData,
          progresso,
          fotosRecentes: todasFotos.slice(0, 3),
        };
      })
      .sort((a, b) => {
        if (!a.ultimaData) return 1;
        if (!b.ultimaData) return -1;
        return new Date(b.ultimaData).getTime() - new Date(a.ultimaData).getTime();
      });
  }, [diarios, projetos, progressoMap]);

  const handleAbrirDiario = (clienteId: string) => {
    navigate(`/colaborador/diariodeobra/${clienteId}`);
  };

  // Estatísticas baseadas no progresso real do cronograma
  const stats = useMemo(() => {
    let emAndamento = 0;
    let concluidos = 0;
    for (const p of projetos) {
      const cid = p.projeto?.id || (p as any).projeto_id;
      const prog = cid ? (progressoMap.get(cid) ?? 0) : 0;
      if (prog >= 100) concluidos++;
      else if (prog > 0) emAndamento++;
    }
    return {
      total: projetos.length,
      emAndamento,
      atrasados: 0,
      concluidos,
    };
  }, [projetos, progressoMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Projetos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus projetos e registros de obra</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-wg-primary hover:bg-wg-primary/90 gap-2 text-lg">
              <Camera className="h-4 w-4" />
              Novo Registro
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo Registro</SheetTitle>
              <SheetDescription>
                Adicione fotos e uma descriçÍo do dia de trabalho
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <DiarioObraForm
                colaboradorId={colaboradorId}
                onSuccess={handleNovoRegistro}
                onCancel={() => setSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[20px] font-normal text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 rounded-md">
              <HardHat className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-[20px] font-normal text-gray-900">{stats.emAndamento}</span>
            <span className="text-xs text-gray-500">Em Andamento</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Clock className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[20px] font-normal text-gray-900">{stats.atrasados}</span>
            <span className="text-xs text-gray-500">Atrasados</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[20px] font-normal text-gray-900">{stats.concluidos}</span>
            <span className="text-xs text-gray-500">Concluídos</span>
          </div>
        </div>
      </div>

      {/* Cards de Clientes com Diário */}
      {clientesComDiario.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F25C26]" />
                Diário de Obra
              </h2>
              <p className="text-xs text-gray-500">Clientes com registros de obra ativos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {clientesComDiario.map((card) => (
              <ClienteDiarioCardCompact
                key={card.clienteId}
                card={card}
                onClick={() => handleAbrirDiario(card.clienteId)}
              />
            ))}
          </div>
        </div>
      )}


    </div>
  );
}

