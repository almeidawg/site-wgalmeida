// ============================================================
// COMPONENTE: ToastProvider
// Sistema WG Easy — notificações globais
// ============================================================

import React, { useState, useCallback, useMemo } from "react";
import { ToastContext, Toast, ToastFn, ToastType } from "./use-toast";

// Polyfill para crypto.randomUUID (compatibilidade com navegadores antigos)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: gera um UUID v4 simples
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function normalizeToastInput(
  type: ToastType,
  payload: string | Partial<Toast>
): Toast {
  if (typeof payload === "string") {
    return { title: payload, type, variant: type };
  }
  return {
    ...payload,
    type: payload.type ?? type,
    variant: payload.variant ?? type,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((t: Toast) => {
    const id = generateUUID();
    const novo = { ...t, id };

    setToasts((current) => [...current, novo]);

    setTimeout(() => {
      setToasts((current) => current.filter((x) => x.id !== id));
    }, t.duration ?? 3500);
  }, []);

  const toast = useMemo<ToastFn>(() => {
    const base = ((t: Toast) => pushToast(t)) as ToastFn;
    base.success = (message) => pushToast(normalizeToastInput("success", message));
    base.error = (message) => pushToast(normalizeToastInput("error", message));
    base.warning = (message) => pushToast(normalizeToastInput("warning", message));
    base.info = (message) => pushToast(normalizeToastInput("info", message));
    return base;
  }, [pushToast]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" | "info" = "info") => {
      if (type === "error") {
        toast.error(message);
        return;
      }
      toast[type](message);
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}

      {/* Container dos toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => {
          // não renderiza toast sem título nem descriçÍo
          if (!t.title && !t.description) return null;

          const tone = t.type === "destructive" ? "error" : t.type ?? t.variant ?? "info";
          return (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-white text-sm
              ${tone === "success" ? "bg-green-600 border-green-700" : ""}
              ${tone === "error" ? "bg-red-600 border-red-700" : ""}
              ${tone === "warning" ? "bg-yellow-500 border-yellow-600" : ""}
              ${tone === "info" ? "bg-blue-600 border-blue-700" : ""}
            `}
          >
            {t.title && <div className="font-normal">{t.title}</div>}
            {t.description && (
              <div className="text-xs opacity-90">{t.description}</div>
            )}
          </div>
        );})}
      </div>
    </ToastContext.Provider>
  );
}


