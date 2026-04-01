import { useCallback, useEffect, useState } from "react";
import type { DragEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface Tab {
  title: string;
  path: string;
  isFixed?: boolean;
}

const MAX_TABS = 8;
const STORAGE_KEY = "wgeasy:tabs";
const DASHBOARD_TAB: Tab = { title: "Dashboard", path: "/", isFixed: true };

export default function TabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<Tab[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Tab[] = JSON.parse(stored);
        if (!parsed.some((t) => t.path === "/")) {
          return [DASHBOARD_TAB, ...parsed];
        }
        return parsed;
      }
    } catch (error) {
      console.warn("não foi possível ler abas salvas", error);
    }
    return [DASHBOARD_TAB];
  });

  const [active, setActive] = useState(location.pathname);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  /** ====== BLINDAGEM: SEMPRE PERSISTIR COM SEGURANÇA ====== */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch (error) {
      console.warn("não foi possível persistir abas", error);
    }
  }, [tabs]);

  /** ====== ADICIONA TAB AO TROCAR DE ROTA ====== */
  useEffect(() => {
    let current = location.pathname || "/";

    setTabs((prev) => {
      const exists = prev.some((t) => t.path === current);
      if (exists) return prev;

      const safeTitle = gerarTituloSeguro(current);

      if (prev.length >= MAX_TABS) {
        const removable = prev.filter((t) => !t.isFixed);
        if (removable.length > 0) {
          const toRemove = removable[0];
          const filtered = prev.filter((t) => t.path !== toRemove.path);

          return [...filtered, { title: safeTitle, path: current }];
        }
        return prev; // todas fixas
      }

      return [...prev, { title: safeTitle, path: current }];
    });

    setActive(current);
  }, [location.pathname]);

  /** ====== FECHAR TAB ====== */
  const closeTab = useCallback((path: string) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.path === path);
      if (tab?.isFixed) return prev;

      const updated = prev.filter((t) => t.path !== path);

      if (path === active && updated.length > 0) {
        navigate(updated.at(-1)!.path);
      }

      return updated;
    });
  }, [active, navigate]);

  /** ====== ATALHOS DE TECLADO - CTRL+W, TAB, SHIFT+TAB ====== */
  useEffect(() => {
    function handleKeyboard(e: KeyboardEvent) {
      const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
      const cmd = isMac ? e.metaKey : e.ctrlKey;

      if (cmd && e.key === "w") {
        e.preventDefault();
        const tab = tabs.find((t) => t.path === active);
        if (tab && !tab.isFixed) closeTab(active);
      }

      if (cmd && e.key === "Tab") {
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.path === active);
        const next = e.shiftKey ? idx - 1 : idx + 1;
        const go = (next + tabs.length) % tabs.length;
        navigate(tabs[go].path);
      }

      if (cmd && e.key >= "1" && e.key <= "8") {
        const idx = Number(e.key) - 1;
        if (tabs[idx]) navigate(tabs[idx].path);
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [tabs, active, navigate, closeTab]);

  /** ====== NOVA FUNÇÍO À PROVA DE ERRO ====== */
  function gerarTituloSeguro(path: string): string {
    if (!path || typeof path !== "string") return "Página";

    const clean = path.split("/").filter(Boolean);
    if (clean.length === 0) return "Dashboard";

    const last = clean.at(-1);
    if (!last) return "Página";

    return last
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /** ====== DRAG ====== */
  function handleDragStart(i: number) {
    if (!tabs[i].isFixed) setDraggedIndex(i);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, i: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === i) return;
    if (tabs[i].isFixed) return;

    setTabs((prev) => {
      const arr = [...prev];
      const [dragged] = arr.splice(draggedIndex, 1);
      arr.splice(i, 0, dragged);
      return arr;
    });

    setDraggedIndex(i);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
  }

  return (
    <div className="wg-tabs" role="tablist">
      {tabs.map((tab, i) => (
        <div
          key={tab.path}
          className={`wg-tab ${tab.path === active ? "active" : ""}`}
          draggable={!tab.isFixed}
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnd={handleDragEnd}
          onClick={() => navigate(tab.path)}
        >
          <span>{tab.title}</span>

          {!tab.isFixed && (
            <button
              className="wg-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.path);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}

      {tabs.length >= MAX_TABS && (
        <div className="wg-tabs-limit-warning">Máx. {MAX_TABS}</div>
      )}
    </div>
  );
}



