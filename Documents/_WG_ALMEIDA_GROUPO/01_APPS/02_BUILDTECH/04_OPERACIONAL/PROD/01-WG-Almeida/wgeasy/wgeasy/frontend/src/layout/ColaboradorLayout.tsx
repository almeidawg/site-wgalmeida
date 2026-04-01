/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Layout para Área do Colaborador
 * Design Mobile-First com navegaçÍo inferior estilo app
 * Menu: DASHBOARD > PROJETOS > SERVIÇOS > MATERIAIS > DIÁRIO
 */

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import NotificationBell from "@/components/layout/NotificationBell";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  LogOut,
  User,
  ChevronDown,
  Sun,
  Moon,
  Check,
  Truck,
  Package,
  Quote,
  TrendingUp,
  Bell,
  Wallet,
  ListChecks,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { formatarDataInicioWG } from "@/hooks/useSaudacao";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { listarProjetosColaborador } from "@/lib/colaboradorApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Menu items para navegaçÍo
const menuItems = [
  {
    label: "Início",
    href: "/colaborador",
    icon: LayoutDashboard,
  },
  {
    label: "Projetos",
    href: "/colaborador/projetos",
    icon: FolderKanban,
  },
  {
    label: "Serviços",
    href: "/colaborador/servicos",
    icon: Truck,
  },
  {
    label: "Checklist",
    href: "/colaborador/checklist",
    icon: ListChecks,
  },
  {
    label: "Financeiro",
    href: "/colaborador/financeiro",
    icon: Wallet,
  },
];

// Interface para frase do dia
interface FraseDoDia {
  frase: string;
  autor: string;
}

// Interface para status geral
interface StatusGeral {
  progresso: number;
  tarefasConcluidas: number;
  tarefasTotal: number;
}

export default function ColaboradorLayout() {
  const { logout, usuarioCompleto } = useAuth();
  const { usuario } = useUsuarioLogado();
  const location = useLocation();
  const navigate = useNavigate();
  const [fraseDoDia, setFraseDoDia] = useState<FraseDoDia | null>(null);
  const [statusGeral, setStatusGeral] = useState<StatusGeral>({
    progresso: 0,
    tarefasConcluidas: 0,
    tarefasTotal: 0,
  });

  // Carregar status geral dos projetos
  const carregarStatusGeral = useCallback(async () => {
    if (!usuarioCompleto?.pessoa_id) return;

    try {
      const projetos = await listarProjetosColaborador(usuarioCompleto.pessoa_id);
      const projetosAtivos = projetos.filter(
        (p) => p.projeto?.status === "ativo" || p.projeto?.status === "em_execucao"
      );

      if (projetosAtivos.length === 0) {
        setStatusGeral({ progresso: 0, tarefasConcluidas: 0, tarefasTotal: 0 });
        return;
      }

      const somaProgresso = projetosAtivos.reduce(
        (acc, p) => acc + ((p.projeto as { progresso?: number } | undefined)?.progresso || 0),
        0
      );
      const mediaProgresso = Math.round(somaProgresso / projetosAtivos.length);

      const { data: etapas } = await supabase
        .from("projeto_etapas")
        .select("id, concluida, projeto_id")
        .in("projeto_id", projetosAtivos.map((p) => p.projeto_id).filter(Boolean));

      const tarefasTotal = etapas?.length || 0;
      const tarefasConcluidas = etapas?.filter((e) => e.concluida).length || 0;

      setStatusGeral({
        progresso: mediaProgresso,
        tarefasConcluidas,
        tarefasTotal,
      });
    } catch (error) {
      console.error("Erro ao carregar status geral:", error);
    }
  }, [usuarioCompleto?.pessoa_id]);

  // Carregar frase do dia e status geral
  useEffect(() => {
    const carregarFrase = async () => {
      try {
        const { data } = await supabase
          .from("frases_motivacionais")
          .select("frase, autor")
          .limit(50);

        if (data && data.length > 0) {
          const indice = Math.floor(Math.random() * data.length);
          setFraseDoDia(data[indice]);
        }
      } catch (error) {
        console.error("Erro ao carregar frase:", error);
      }
    };
    carregarFrase();
    carregarStatusGeral();
  }, [carregarStatusGeral]);

  // Formatar data de início na WG
  const dataInicioFormatada = formatarDataInicioWG(usuario?.data_inicio_wg);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // SaudaçÍo dinâmica baseada na hora
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return { texto: "Bom dia", icon: Sun, cor: "text-amber-400" };
    } else if (hora >= 12 && hora < 18) {
      return { texto: "Boa tarde", icon: Sun, cor: "text-orange-400" };
    } else {
      return { texto: "Boa noite", icon: Moon, cor: "text-indigo-300" };
    }
  }, []);

  // Data formatada
  const dataHoje = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* ====== BANNER HEADER MOBILE-FIRST ====== */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-4 md:p-6 lg:p-8 shadow-lg relative">
        {/* Ícones no canto superior direito - MOBILE */}
        <div className="absolute top-3 right-3 flex items-center gap-2 md:hidden">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-slate-700/50">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={usuario?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {getInitials(usuario?.nome)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{usuario?.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{usuario?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/colaborador/perfil" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Layout Mobile: Avatar + SaudaçÍo na mesma linha */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {usuario?.avatar_url ? (
                  <img
                    src={usuario.avatar_url}
                    alt={usuario?.nome || "Colaborador"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-normal text-white">
                    {getInitials(usuario?.nome)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-slate-800">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                WG Easy · Portal do Colaborador
              </p>
              <div className="flex items-center gap-1.5">
                <saudacao.icon className={`w-4 h-4 ${saudacao.cor}`} />
                <h1 className="text-lg font-light text-white truncate">
                  {saudacao.texto},{" "}
                  <span className="font-normal text-orange-400">
                    {usuario?.nome?.split(" ")[0] || "Colaborador"}
                  </span>
                </h1>
              </div>
              <p className="text-gray-400 text-xs capitalize truncate">{dataHoje}</p>
            </div>
          </div>

          {/* Layout Desktop */}
          <div className="hidden md:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
              {/* Avatar e SaudaçÍo */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {usuario?.avatar_url ? (
                      <img
                        src={usuario.avatar_url}
                        alt={usuario?.nome || "Colaborador"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-normal text-white">
                        {getInitials(usuario?.nome)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-slate-800">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    WG Easy · Portal do Colaborador
                  </p>
                  <div className="flex items-center gap-2">
                    <saudacao.icon className={`w-5 h-5 ${saudacao.cor}`} />
                    <h1 className="text-2xl lg:text-3xl font-light text-white">
                      {saudacao.texto},{" "}
                      <span className="font-normal text-orange-400">
                        {usuario?.nome?.split(" ")[0] || "Colaborador"}
                      </span>
                    </h1>
                  </div>
                  <p className="text-gray-400 text-sm capitalize">{dataHoje}</p>
                  {dataInicioFormatada && (
                    <p className="text-gray-500 text-xs mt-1">
                      No time desde{" "}
                      <span className="font-medium text-orange-400">
                        {dataInicioFormatada}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              {/* Frase motivacional - Desktop */}
              {fraseDoDia && (
                <div className="hidden lg:flex items-center gap-3 max-w-2xl bg-slate-700/30 rounded-xl px-6 py-3 border border-slate-600/30 ml-8">
                  <Quote className="w-5 h-5 text-orange-400/80 flex-shrink-0" />
                  <p className="text-sm text-gray-200 italic">
                    "{fraseDoDia.frase}"{" "}
                    <span className="text-gray-400 not-italic">— {fraseDoDia.autor}</span>
                  </p>
                </div>
              )}
            </div>
            {/* Status Geral - Desktop */}
            <div className="flex items-center gap-4 flex-shrink-0">
              { (usuario?.cargo || usuario?.profissao) && (
                <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 min-w-[160px]">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cargo / FunçÍo</p>
                  <p className="text-lg font-normal text-white">
                    {usuario?.cargo || usuario?.profissao}
                  </p>
                  {usuario?.empresa && (
                    <p className="text-xs text-gray-400 mt-1">{usuario.empresa}</p>
                  )}
                </div>
              )}
              <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 min-w-[180px]">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status Geral</p>
                <p className="text-3xl font-normal text-orange-400">{statusGeral.progresso}%</p>
                <p className="text-xs text-gray-400 mt-1">
                  {statusGeral.tarefasConcluidas}/{statusGeral.tarefasTotal} tarefas do mês
                </p>
                <div className="mt-2 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${statusGeral.tarefasTotal > 0 ? (statusGeral.tarefasConcluidas / statusGeral.tarefasTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Mobile: Frase + Status */}
          <div className="mt-4 space-y-2 md:hidden">
            {/* Frase motivacional - Mobile */}
            {fraseDoDia && (
              <div className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-600/30">
                <Quote className="w-4 h-4 text-orange-400/80 flex-shrink-0" />
                <p className="text-xs text-gray-200 italic line-clamp-2">
                  "{fraseDoDia.frase}" <span className="text-gray-400 not-italic">— {fraseDoDia.autor}</span>
                </p>
              </div>
            )}

            {/* Status Geral - Mobile (mesmo formato da frase) */}
            <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-3 py-2 border border-slate-600/30">
              <TrendingUp className="w-4 h-4 text-orange-400/80 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase">Status Geral</span>
                  <span className="text-sm font-normal text-orange-400">{statusGeral.progresso}%</span>
                </div>
                <div className="mt-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                    style={{ width: `${statusGeral.tarefasTotal > 0 ? (statusGeral.tarefasConcluidas / statusGeral.tarefasTotal) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {statusGeral.tarefasConcluidas}/{statusGeral.tarefasTotal} tarefas do mês
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header de navegaçÍo Desktop */}
      <header className="hidden md:block sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-[#F25C26]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side - Desktop */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={usuario?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {getInitials(usuario?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{usuario?.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{usuario?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/colaborador/perfil" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Usa toda a largura da tela */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <Outlet />
      </main>

      {/* Footer - Desktop only */}
      <footer className="hidden md:block border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Portal do Colaborador WG &copy; {new Date().getFullYear()} - Grupo WG Almeida
          </p>
        </div>
      </footer>

      {/* ====== NAVEGAÇÍO INFERIOR MOBILE (ESTILO APP) ====== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
                  isActive ? "text-[#F25C26]" : "text-gray-500"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-colors",
                    isActive ? "bg-primary/10" : ""
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "")} />
                </div>
                <span className={cn("text-[10px] mt-0.5", isActive ? "font-normal" : "font-medium")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}


