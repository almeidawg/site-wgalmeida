/**
 * Layout para Área do Fornecedor
 * Layout simples e objetivo para fornecedores externos
 * Com AreaHeader unificado (avatar, saudaçÍo, data, "Com a WG desde...")
 */

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import AreaHeader from "@/components/layout/AreaHeader";
import NotificationBell from "@/components/layout/NotificationBell";
import {
  LayoutDashboard,
  FileSearch,
  Wallet,
  Briefcase,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  {
    label: "Início",
    href: "/fornecedor",
    icon: LayoutDashboard,
  },
  {
    label: "Cotações",
    href: "/fornecedor/cotacoes",
    icon: FileSearch,
  },
  {
    label: "Meus Serviços",
    href: "/fornecedor/servicos",
    icon: Briefcase,
  },
  {
    label: "Financeiro",
    href: "/fornecedor/financeiro",
    icon: Wallet,
  },
];

export default function FornecedorLayout() {
  const { logout } = useAuth();
  const { usuario } = useUsuarioLogado();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "F";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* AreaHeader - Banner de boas-vindas */}
      <AreaHeader
        usuario={{
          nome: usuario?.nome || "Fornecedor",
          avatar_url: usuario?.avatar_url,
          data_inicio_wg: usuario?.data_inicio_wg,
          cargo: usuario?.cargo,
          empresa: usuario?.empresa,
        }}
        titulo="Portal do Fornecedor"
      />

      {/* Header de navegaçÍo */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/fornecedor" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-normal text-sm">WG</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
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

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notificações */}
              <NotificationBell />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={usuario?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-white text-xs">
                        {getInitials(usuario?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {usuario?.nome}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {usuario?.email}
                    </p>
                    {usuario?.empresa && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {usuario.empresa}
                      </p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/fornecedor/perfil" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Meus Dados
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <nav className="px-4 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-[#F25C26]"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Portal do Fornecedor WG &copy; {new Date().getFullYear()} - Grupo WG
            Almeida
          </p>
        </div>
      </footer>
    </div>
  );
}

