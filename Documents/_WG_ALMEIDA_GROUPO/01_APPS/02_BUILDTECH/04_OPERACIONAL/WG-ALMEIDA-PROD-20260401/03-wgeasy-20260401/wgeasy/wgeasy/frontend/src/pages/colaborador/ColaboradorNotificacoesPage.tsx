import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/auth/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  AtSign,
  MessageSquare,
  Info,
  AlertTriangle,
  Filter,
} from "lucide-react";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  referencia_tipo: string | null;
  referencia_id: string | null;
  destinatario_id: string | null;
  lida: boolean;
  lida_em: string | null;
  url_acao: string | null;
  texto_acao: string | null;
  criado_em: string;
}

type FiltroTipo = "todas" | "mencoes" | "sistema" | "lidas";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

function getNotificationIcon(tipo: string) {
  switch (tipo) {
    case "mencao":
      return <AtSign className="w-5 h-5 text-teal-600" />;
    case "mencao_checklist":
      return <CheckSquare className="w-5 h-5 text-teal-600" />;
    case "mencao_comentario":
      return <AtSign className="w-5 h-5 text-blue-600" />;
    case "comentario":
    case "comentario_cliente":
      return <MessageSquare className="w-5 h-5 text-purple-600" />;
    case "tarefa":
      return <CheckSquare className="w-5 h-5 text-green-600" />;
    case "aviso":
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case "info":
    case "sucesso":
      return <Info className="w-5 h-5 text-blue-500" />;
    case "erro":
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
}

function getNotificationBgColor(tipo: string, lida: boolean): string {
  if (lida) return "bg-gray-50";
  switch (tipo) {
    case "mencao":
    case "mencao_checklist":
      return "bg-teal-50 border-teal-200";
    case "mencao_comentario":
      return "bg-blue-50 border-blue-200";
    case "comentario":
    case "comentario_cliente":
      return "bg-purple-50 border-purple-200";
    case "tarefa":
      return "bg-green-50 border-green-200";
    case "aviso":
      return "bg-amber-50 border-amber-200";
    case "erro":
      return "bg-red-50 border-red-200";
    default:
      return "bg-white border-gray-200";
  }
}

function isMencao(tipo: string): boolean {
  return tipo === "mencao" || tipo === "mencao_checklist" || tipo === "mencao_comentario";
}

export default function ColaboradorNotificacoesPage() {
  const { usuarioCompleto } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroTipo>("todas");
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const pessoaId = usuarioCompleto?.pessoa_id;

  const carregarNotificacoes = useCallback(async () => {
    if (!pessoaId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notificacoes_sistema")
        .select("*")
        .eq("destinatario_id", pessoaId)
        .order("criado_em", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao carregar notificações:", error);
        return;
      }

      setNotificacoes(data || []);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [pessoaId]);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const marcarComoLida = async (id: string) => {
    const { error } = await supabase
      .from("notificacoes_sistema")
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true, lida_em: new Date().toISOString() } : n))
      );
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!pessoaId) return;
    setMarcandoTodas(true);

    try {
      const idsNaoLidas = notificacoes.filter((n) => !n.lida).map((n) => n.id);
      if (idsNaoLidas.length === 0) return;

      const { error } = await supabase
        .from("notificacoes_sistema")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .in("id", idsNaoLidas);

      if (!error) {
        setNotificacoes((prev) =>
          prev.map((n) => ({ ...n, lida: true, lida_em: new Date().toISOString() }))
        );
      }
    } finally {
      setMarcandoTodas(false);
    }
  };

  // Filtragem
  const notificacoesFiltradas = notificacoes.filter((n) => {
    switch (filtro) {
      case "mencoes":
        return isMencao(n.tipo);
      case "sistema":
        return !isMencao(n.tipo);
      case "lidas":
        return n.lida;
      case "todas":
      default:
        return !n.lida;
    }
  });

  const totalNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const totalMencoes = notificacoes.filter((n) => !n.lida && isMencao(n.tipo)).length;

  const filtros: { key: FiltroTipo; label: string; count?: number }[] = [
    { key: "todas", label: "NÍo lidas", count: totalNaoLidas },
    { key: "mencoes", label: "Menções", count: totalMencoes },
    { key: "sistema", label: "Sistema" },
    { key: "lidas", label: "Lidas" },
  ];

  if (loading) {
    return (
      <div className={LAYOUT.pageContainer}>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F25C26]" />
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.sectionGap}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F25C26]" />
            <h1 className={TYPOGRAPHY.pageTitle}>Notificações</h1>
            {totalNaoLidas > 0 && (
              <Badge className="bg-primary text-white text-[10px] px-2 py-0.5">
                {totalNaoLidas} nova{totalNaoLidas !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {totalNaoLidas > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={marcarTodasComoLidas}
              disabled={marcandoTodas}
              className="text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              {marcandoTodas ? "Marcando..." : "Marcar todas como lidas"}
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`
                px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors
                ${filtro === f.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={`ml-1 ${filtro === f.key ? "text-white/80" : "text-gray-400"}`}>
                  ({f.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de notificações */}
        {notificacoesFiltradas.length === 0 ? (
          <Card className={LAYOUT.card}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-10 h-10 text-gray-300 mb-3" />
              <p className={`${TYPOGRAPHY.bodyMedium} text-gray-500`}>
                {filtro === "todas" && "Nenhuma notificaçÍo pendente"}
                {filtro === "mencoes" && "Nenhuma mençÍo pendente"}
                {filtro === "sistema" && "Nenhuma notificaçÍo de sistema"}
                {filtro === "lidas" && "Nenhuma notificaçÍo lida"}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Quando alguém mencionar você em um checklist ou nota, aparecerá aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notificacoesFiltradas.map((notif) => (
              <div
                key={notif.id}
                className={`
                  flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all
                  ${getNotificationBgColor(notif.tipo, notif.lida)}
                  ${!notif.lida ? "shadow-sm" : ""}
                `}
              >
                {/* Ícone */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notif.tipo)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-[13px] font-medium ${notif.lida ? "text-gray-500" : "text-gray-900"}`}>
                        {notif.titulo}
                      </p>
                      {notif.mensagem && (
                        <p className={`text-[11px] mt-0.5 ${notif.lida ? "text-gray-400" : "text-gray-600"}`}>
                          {notif.mensagem}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(notif.criado_em)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {isMencao(notif.tipo) ? "MençÍo" : notif.tipo}
                        </Badge>
                        {notif.referencia_tipo === "checklist_item" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-teal-100 text-teal-700"
                          >
                            Checklist
                          </Badge>
                        )}
                        {notif.referencia_tipo === "nota_sistema" && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700"
                          >
                            Nota
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AçÍo: marcar como lida */}
                    {!notif.lida && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-7 w-7 hover:bg-green-50"
                        onClick={() => marcarComoLida(notif.id)}
                        title="Marcar como lida"
                      >
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resumo */}
        {notificacoes.length > 0 && (
          <p className="text-center text-[10px] text-gray-400 pt-2">
            {notificacoes.length} notificaçÍo{notificacoes.length !== 1 ? "ões" : ""} no total
            {totalNaoLidas > 0 && ` · ${totalNaoLidas} nÍo lida${totalNaoLidas !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>
    </div>
  );
}

