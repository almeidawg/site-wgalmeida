// src/components/layout/NotificationBell.tsx
// Componente de sino de notificações para o header

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  UserPlus,
  FileCheck,
  X,
  ExternalLink,
  FileText,
  FileX,
  FilePlus,
  MessageSquare,
  AtSign,
  LogIn,
  Activity,
  CheckSquare,
  Camera,
  Package,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listarNotificacoesNaoLidas,
  contarNotificacoesNaoLidas,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  NotificacaoSistema,
} from "@/lib/cadastroLinkApi";

// Cores
const WG_COLORS = {
  laranja: "#F25C26",
  verde: "#22c55e",
  amarelo: "#f59e0b",
  vermelho: "#ef4444",
};

// Ícone por tipo de notificaçÍo
function getNotificationIcon(tipo: string) {
  switch (tipo) {
    case "novo_cadastro":
    case "cadastro_pendente":
      return <UserPlus className="w-4 h-4 text-yellow-500" />;
    case "cadastro_aprovado":
      return <FileCheck className="w-4 h-4 text-green-500" />;
    case "cadastro_rejeitado":
      return <X className="w-4 h-4 text-red-500" />;
    case "proposta_aprovada":
      return <FileCheck className="w-4 h-4 text-green-500" />;
    case "proposta_recusada":
      return <FileX className="w-4 h-4 text-red-500" />;
    case "contrato_criado":
      return <FilePlus className="w-4 h-4 text-blue-500" />;
    case "nova_proposta":
      return <FileText className="w-4 h-4 text-orange-500" />;
    case "nova_solicitacao":
      return <UserPlus className="w-4 h-4 text-orange-500" />;
    // Novos tipos de notificaçÍo
    case "comentario_cliente":
      return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case "mencao_comentario":
      return <AtSign className="w-4 h-4 text-blue-500" />;
    case "mencao":
      return <AtSign className="w-4 h-4 text-teal-500" />;
    case "mencao_checklist":
      return <CheckSquare className="w-4 h-4 text-teal-500" />;
    case "acesso_sistema":
      return <LogIn className="w-4 h-4 text-green-500" />;
    case "movimento_sistema":
      return <Activity className="w-4 h-4 text-indigo-500" />;
    case "publicacao_obra":
      return <Camera className="w-4 h-4 text-orange-500" />;
    case "nova_solicitacao_assistencia":
      return <Package className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

// Formatar data relativa
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return date.toLocaleDateString("pt-BR");
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificacaoSistema[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar contagem inicial
  useEffect(() => {
    loadCount();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Carregar notificações quando abrir
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  async function loadCount() {
    try {
      const total = await contarNotificacoesNaoLidas();
      setCount(total);
    } catch (error) {
      console.warn("Notificações indisponíveis:", error);
      setCount(0);
    }
  }

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const data = await listarNotificacoesNaoLidas();
      setNotifications(data);
    } catch (error) {
      console.warn("Erro ao carregar notificações:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAsRead(notif: NotificacaoSistema) {
    await marcarNotificacaoComoLida(notif.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    setCount((prev) => Math.max(0, prev - 1));

    // Navegar se tiver URL
    if (notif.url_acao) {
      setOpen(false);
      navigate(notif.url_acao);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await marcarTodasNotificacoesComoLidas();
      setNotifications([]);
      setCount(0);
    } catch (error) {
      console.warn("[NotificationBell] Erro ao marcar todas:", error);
      await loadNotifications();
      await loadCount();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={() => setOpen(!open)}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-0.5 -right-0.5 ${count > 9 ? 'min-w-[20px] px-1' : 'w-5'} h-5 rounded-full text-white text-[10px] font-normal flex items-center justify-center`}
                style={{ background: WG_COLORS.laranja }}
              >
                {count > 99 ? "99+" : count}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(320px,calc(100vw-16px))] p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-normal text-sm">Notificações</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="overflow-y-auto" style={{ maxHeight: '420px' }}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-400 text-sm">Nenhuma notificaçÍo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleMarkAsRead(notif)}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notif.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {notif.titulo}
                      </p>
                      {notif.mensagem && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.mensagem}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(notif.criado_em)}
                        </span>
                        {notif.url_acao && (
                          <span className="text-xs flex items-center gap-0.5" style={{ color: WG_COLORS.laranja }}>
                            <ExternalLink className="w-3 h-3" />
                            {notif.texto_acao || "Ver"}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif);
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-xs h-8"
              onClick={() => {
                setOpen(false);
                navigate("/sistema/cadastros-pendentes");
              }}
            >
              Ver todos os cadastros pendentes
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

