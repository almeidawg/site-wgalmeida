// ============================================================
// STORE GLOBAL - Zustand
// Estado compartilhado entre componentes sem prop drilling
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Tipos ---

export type Tema = "light" | "dark" | "system";
export type DensidadeUI = "compact" | "normal" | "comfortable";

export interface Notificacao {
  id: string;
  tipo: "info" | "sucesso" | "aviso" | "erro";
  titulo: string;
  mensagem?: string;
  lida: boolean;
  criadaEm: Date;
}

interface AppState {
  // Layout / sidebar
  sidebarAberta: boolean;
  sidebarPinada: boolean;

  // Tema
  tema: Tema;

  // Densidade da UI
  densidadeUI: DensidadeUI;

  // Notificações in-app
  notificacoes: Notificacao[];

  // Loading global (ex: operações pesadas)
  carregandoGlobal: boolean;
  mensagemCarregamento: string;

  // Módulo ativo (para breadcrumb e analytics)
  moduloAtivo: string | null;
}

interface AppActions {
  // Sidebar
  toggleSidebar: () => void;
  setSidebarAberta: (aberta: boolean) => void;
  setSidebarPinada: (pinada: boolean) => void;

  // Tema
  setTema: (tema: Tema) => void;

  // Densidade
  setDensidadeUI: (densidade: DensidadeUI) => void;

  // Notificações
  adicionarNotificacao: (n: Omit<Notificacao, "id" | "lida" | "criadaEm">) => void;
  marcarNotificacaoLida: (id: string) => void;
  marcarTodasLidas: () => void;
  removerNotificacao: (id: string) => void;
  limparNotificacoes: () => void;

  // Loading global
  setCarregandoGlobal: (carregando: boolean, mensagem?: string) => void;

  // Módulo ativo
  setModuloAtivo: (modulo: string | null) => void;
}

// --- Store ---

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // Estado inicial
      sidebarAberta: true,
      sidebarPinada: false,
      tema: "system",
      densidadeUI: "normal",
      notificacoes: [],
      carregandoGlobal: false,
      mensagemCarregamento: "",
      moduloAtivo: null,

      // Sidebar
      toggleSidebar: () => set((s) => ({ sidebarAberta: !s.sidebarAberta })),
      setSidebarAberta: (aberta) => set({ sidebarAberta: aberta }),
      setSidebarPinada: (pinada) => set({ sidebarPinada: pinada }),

      // Tema
      setTema: (tema) => set({ tema }),

      // Densidade
      setDensidadeUI: (densidadeUI) => set({ densidadeUI }),

      // Notificações
      adicionarNotificacao: (n) =>
        set((s) => ({
          notificacoes: [
            {
              ...n,
              id: crypto.randomUUID(),
              lida: false,
              criadaEm: new Date(),
            },
            ...s.notificacoes,
          ].slice(0, 50), // máx 50 notificações
        })),

      marcarNotificacaoLida: (id) =>
        set((s) => ({
          notificacoes: s.notificacoes.map((n) =>
            n.id === id ? { ...n, lida: true } : n
          ),
        })),

      marcarTodasLidas: () =>
        set((s) => ({
          notificacoes: s.notificacoes.map((n) => ({ ...n, lida: true })),
        })),

      removerNotificacao: (id) =>
        set((s) => ({
          notificacoes: s.notificacoes.filter((n) => n.id !== id),
        })),

      limparNotificacoes: () => set({ notificacoes: [] }),

      // Loading global
      setCarregandoGlobal: (carregandoGlobal, mensagemCarregamento = "") =>
        set({ carregandoGlobal, mensagemCarregamento }),

      // Módulo ativo
      setModuloAtivo: (moduloAtivo) => set({ moduloAtivo }),
    }),
    {
      name: "wgeasy-app-store",
      partialize: (state) => ({
        // Persiste apenas preferências de UI
        sidebarPinada: state.sidebarPinada,
        tema: state.tema,
        densidadeUI: state.densidadeUI,
      }),
    }
  )
);

// --- Seletores derivados ---

/** Número de notificações nÍo lidas */
export const useNotificacoesNaoLidas = () =>
  useAppStore((s) => s.notificacoes.filter((n) => !n.lida).length);

/** Notificações nÍo lidas */
export const useNotificacoesPendentes = () =>
  useAppStore((s) => s.notificacoes.filter((n) => !n.lida));

