/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// Sidebar com suporte a mobile (off-canvas) e secoes recolhidas
// Integrado com permissoes do banco via Planta do Sistema
import { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import wgMenus, { MenuSection, MenuItem } from "@/config/wg-menus";
import "@/styles/wg-sidebar.css";
import { SidebarItem } from "./index";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { usePreviewTipoUsuario } from "@/hooks/usePreviewTipoUsuario";
import { useModulosPermitidos } from "@/hooks/useModulosPermitidos";
import { useTenant } from "@/hooks/useTenant";
import {
  LayoutDashboard,
  Users,
  BadgeDollarSign,
  FileText,
  ClipboardList,
  Building2,
  Wrench,
  ShoppingCart,
  Coins,
  Settings,
  CalendarCheck,
  Box,
  BarChart3,
  Wallet,
  Store,
  Home,
  LogOut,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  X,
  Scale,
  Truck,
  HardHat,
  Landmark,
  Trees,
  ListChecks,
  ChevronsLeft,
  ChevronsRight,
  Rocket,
} from "lucide-react";

type SidebarProps = {
  open?: boolean;
  onToggle?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

function sectionIcon(section: string) {
  const size = 16;
  switch (section.toLowerCase()) {
    case "dashboard":
      return <LayoutDashboard size={size} />;
    case "pessoas":
      return <Users size={size} />;
    case "oportunidades":
      return <BadgeDollarSign size={size} />;
    case "comercial":
      return <FileText size={size} />;
    case "arquitetura":
      return <Landmark size={size} />;
    case "engenharia":
      return <Settings size={size} />;
    case "marcenaria":
      return <Trees size={size} />;
    case "planejamento":
      return <ClipboardList size={size} />;
    case "cronograma":
      return <CalendarCheck size={size} />;
    case "wg experience":
    case "wgxperience":
      return <CheckSquare size={size} />;
    case "financeiro":
      return <Coins size={size} />;
    case "meu financeiro":
      return <Wallet size={size} />;
    case "deposito wg":
    case "depósito wg":
      return <Box size={size} />;
    case "wg store":
      return <Store size={size} />;
    case "area do cliente":
    case "área do cliente":
      return <Home size={size} />;
    case "onboarding":
      return <BarChart3 size={size} />;
    case "sistema":
      return <Settings size={size} />;
    case "pos vendas":
    case "pós vendas":
      return <Wallet size={size} />;
    case "sessao":
    case "sessÍo":
      return <LogOut size={size} />;
    case "juridico":
    case "jurídico":
      return <Scale size={size} />;
    case "serviços":
    case "servicos":
      return <Truck size={size} />;
    case "minha área":
    case "minha area":
      return <HardHat size={size} />;
    case "tarefas":
      return <ListChecks size={size} />;
    case "gestÍo saas":
    case "gestao saas":
    case "saas":
      return <Rocket size={size} />;
    case "willhub":
      return <Rocket size={size} />;
    default:
      return <Circle size={size} />;
  }
}

function itemIcon(section: string) {
  const size = 16;
  switch (section.toLowerCase()) {
    case "pessoas":
      return <Users size={size} />;
    case "oportunidades":
      return <BadgeDollarSign size={size} />;
    case "comercial":
      return <FileText size={size} />;
    case "planejamento":
      return <ClipboardList size={size} />;
    case "cronograma":
      return <CalendarCheck size={size} />;
    case "financeiro":
      return <Coins size={size} />;
    case "compras":
      return <ShoppingCart size={size} />;
    case "sistema":
      return <Settings size={size} />;
    default:
      return <Circle size={size} />;
  }
}

// Mapeamento de secoes permitidas por tipo de usuario restrito
const MENU_POR_TIPO: Record<string, string[]> = {
  JURIDICO: ["Jurídico", "SessÍo"],
  FINANCEIRO: ["Financeiro", "SessÍo"],
  COLABORADOR: ["Minha Área", "SessÍo"],
  CLIENTE: ["Área do Cliente", "SessÍo"],
};

export default function Sidebar({ open = false, onToggle, collapsed = false, onToggleCollapse }: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { usuario, isMaster, isAdmin } = useUsuarioLogado();
  const { previewTipo, isPreviewMode } = usePreviewTipoUsuario();
  const { podeVerSecao, podeVerModulo, modulos } = useModulosPermitidos();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const sortedMenus = useMemo(() => {
    const isAdminOrMaster = (isMaster || isAdmin) && !isPreviewMode;

    // Se for admin ou master, retorna todos os menus sem filtrar.
    if (isAdminOrMaster) {
      return wgMenus;
    }

    // Para usuários regulares, filtra baseado nos módulos do tenant.
    const activeModules = new Set(tenant?.modulos_ativos || []);

    const filterItemsRecursive = (items: MenuItem[]): MenuItem[] => {
      const result: MenuItem[] = [];
      for (const item of items) {
        const hasPermission = !item.moduleSlug || activeModules.has(item.moduleSlug);
        
        if (item.children) {
          const filteredChildren = filterItemsRecursive(item.children);
          if (filteredChildren.length > 0) {
            result.push({ ...item, children: filteredChildren });
          }
        } else if (hasPermission) {
          result.push(item);
        }
      }
      return result;
    };

    return wgMenus.reduce<MenuSection[]>((acc, section) => {
      const hasPermission = !section.moduleSlug || activeModules.has(section.moduleSlug);
      
      if (!hasPermission) {
        return acc;
      }

      const visibleItems = filterItemsRecursive(section.items);
      
      if (visibleItems.length > 0) {
        acc.push({ ...section, items: visibleItems });
      }
      
      return acc;
    }, []);

  }, [tenant, isMaster, isAdmin, isPreviewMode]);

  const toggleSection = (section: string, path?: string, hasItems?: boolean) => {
    if (path) {
      navigate(path);
      if (open && onToggle) {
        onToggle();
      }
    }
    if (hasItems) {
      setOpenSections((prev) => ({
        ...prev,
        [section]: !(prev[section] ?? false),
      }));
    }
  };

  const isSectionActive = (sectionPath?: string) => {
    if (!sectionPath) return false;
    return location.pathname === sectionPath || location.pathname.startsWith(sectionPath + '/');
  };

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !(prev[groupKey] ?? false),
    }));
  };

  // Ao clicar numa seçÍo no modo collapsed, expandir a sidebar
  const handleSectionClickCollapsed = (section: string, path?: string, hasItems?: boolean) => {
    if (collapsed && hasItems && onToggleCollapse) {
      onToggleCollapse();
      // Depois de expandir, abrir a seçÍo
      setTimeout(() => {
        setOpenSections((prev) => ({ ...prev, [section]: true }));
      }, 50);
      return;
    }
    if (collapsed && path) {
      navigate(path);
      return;
    }
    toggleSection(section, path, hasItems);
  };

  return (
    <aside className={`wg-sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}>
      <div className="wg-sidebar-logo">
        <img
          src={tenant?.config_white_label?.logo_url || "/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"}
          alt={tenant?.nome_empresa || "Grupo WG Almeida"}
          className={collapsed ? "h-8 w-auto" : "h-28 w-auto"}
          style={{ objectFit: 'contain' }}
        />
        {!collapsed && !tenant?.config_white_label?.logo_url && <span className="wg-logo-secondary">EASY</span>}
        <button
          type="button"
          className="wg-sidebar-close md:hidden"
          onClick={onToggle}
          aria-label="Fechar menu"
          style={{ marginLeft: 'auto' }}
        >
          <X size={18} />
        </button>
      </div>

      {sortedMenus.map((section) => {
        const isOpen = openSections[section.section] ?? false;
        const hasItems = section.items.length > 0;

        // Determinar núcleo para cores específicas
        const getNucleo = (sectionName: string): string | undefined => {
          const name = sectionName.toLowerCase();
          if (name === "arquitetura") return "arquitetura";
          if (name === "engenharia") return "engenharia";
          if (name === "marcenaria") return "marcenaria";
          return undefined;
        };
        const nucleo = getNucleo(section.section);

        return (
          <div
            key={section.section}
            className="wg-sidebar-section"
            data-nucleo={nucleo}
          >
            <button
              type="button"
              className={`wg-sidebar-section-head ${isOpen && hasItems ? 'expanded' : ''} ${section.path && isSectionActive(section.path) ? 'active' : ''}`}
              onClick={() => handleSectionClickCollapsed(section.section, section.path, hasItems)}
              aria-expanded={isOpen && hasItems ? "true" : "false"}
              data-tooltip={collapsed ? section.section : undefined}
            >
              <span className="wg-sidebar-head-left">
                <span className="wg-sidebar-head-icon">
                  {sectionIcon(section.section)}
                </span>
                <span className="wg-sidebar-section-title">
                  {section.section}
                </span>
              </span>
              {hasItems && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
            </button>

            {isOpen && hasItems && (
              <div className="wg-sidebar-items">
                {section.items.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    const groupKey = `${section.section}-${item.label}`;
                    const isGroupOpen = openGroups[groupKey] ?? false;

                    return (
                      <div key={groupKey} className="wg-sidebar-subgroup">
                        <button
                          type="button"
                          className={`wg-sidebar-item subgroup-head ${isGroupOpen ? "active" : ""}`}
                          onClick={() => toggleGroup(groupKey)}
                        >
                          <span className="wg-sidebar-icon">
                            {item.icon ? <span>{item.icon}</span> : itemIcon(section.section)}
                          </span>
                          <span className="wg-sidebar-label">{item.label}</span>
                          {isGroupOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {isGroupOpen && (
                          <div className="wg-sidebar-subitems">
                            {item.children!.map((child) => {
                              const modInfoChild = modulos.find(m => m.path === child.path || m.codigo === child.path?.replace("/", ""));
                              const isTrialChild = modInfoChild?.status_saas === "trial";

                              return child.path ? (
                                <SidebarItem
                                  key={child.path}
                                  to={child.path}
                                  icon={child.icon ? <span>{child.icon}</span> : itemIcon(section.section)}
                                  label={child.label}
                                  badge={isTrialChild ? (
                                    <span className="text-[9px] bg-orange-100 text-[#F25C26] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                      TRIAL
                                    </span>
                                  ) : undefined}
                                />
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (!item.path) return null;

                  const modInfo = modulos.find(m => m.path === item.path || m.codigo === item.path?.replace("/", ""));
                  const isTrial = modInfo?.status_saas === "trial";

                  return (
                    <SidebarItem
                      key={item.path}
                      to={item.path}
                      icon={item.icon ? <span>{item.icon}</span> : itemIcon(section.section)}
                      label={item.label}
                      badge={isTrial ? (
                        <span className="text-[9px] bg-orange-100 text-[#F25C26] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                          TRIAL
                        </span>
                      ) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* BotÍo de recolher/expandir (apenas desktop) */}
      <button
        type="button"
        className="wg-sidebar-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>
    </aside>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

