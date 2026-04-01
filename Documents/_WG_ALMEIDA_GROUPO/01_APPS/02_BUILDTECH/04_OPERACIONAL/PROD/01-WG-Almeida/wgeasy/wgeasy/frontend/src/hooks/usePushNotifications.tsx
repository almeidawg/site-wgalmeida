// ============================================================
// usePushNotifications — Hook para Push Notifications PWA
// Sistema WG Easy · buildtech.wgalmeida.com.br
// Fase 5 — PWA + Push Notifications
// ============================================================

import { useState, useEffect, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export type PushStatus = "unsupported" | "denied" | "granted" | "default" | "subscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushNotifications(userId?: string) {
  const [status, setStatus] = useState<PushStatus>("default");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Verificar suporte inicial
  useEffect(() => {
    let ativo = true;

    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") setStatus("denied");
    else if (perm === "granted") {
      // Verificar se já tem subscription ativa
      (async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (!ativo) return;
          if (sub) setStatus("subscribed");
          else setStatus("granted");
        } catch (err) {
          console.warn("[Push] Falha ao verificar subscription inicial:", err);
          if (ativo) setStatus("granted");
        }
      })();
    } else {
      setStatus("default");
    }

    return () => {
      ativo = false;
    };
  }, []);

  const assinar = useCallback(async () => {
    if (status === "unsupported") return;
    setLoading(true);
    setErro(null);
    try {
      // Pedir permissÍo
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setStatus("denied");
        return;
      }

      // Buscar chave VAPID pública
      const keyRes = await fetch(`${BACKEND_URL}/api/push/vapid-key`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("VAPID não configurado no servidor");

      // Criar subscription no service worker
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      // Enviar subscription ao backend
      await fetch(`${BACKEND_URL}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, userId }),
      });

      setStatus("subscribed");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao assinar notificações");
      setStatus("default");
    } finally {
      setLoading(false);
    }
  }, [status, userId]);

  const cancelar = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setStatus("default");
    } catch (err) {
      console.warn("[Push] Erro ao cancelar:", err);
    }
  }, []);

  return { status, loading, erro, assinar, cancelar };
}

// ============================================================
// Componente de botÍo de notificaçÍo (uso opcional)
// ============================================================

import React from "react";
import { Bell } from "lucide-react";

export function BotaoNotificacoes({ userId }: { userId?: string }) {
  const { status, loading, assinar, cancelar } = usePushNotifications(userId);

  if (status === "unsupported") return null;

  return (
    <button
      onClick={status === "subscribed" ? cancelar : assinar}
      disabled={loading || status === "denied"}
      title={
        status === "subscribed" ? "Desativar notificações"
        : status === "denied" ? "Notificações bloqueadas"
        : "Ativar notificações"
      }
      className={`p-2 rounded-xl transition-all ${
        status === "subscribed"
          ? "text-orange-500 bg-orange-50 hover:bg-orange-100"
          : status === "denied"
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-500 hover:bg-gray-100"
      } ${loading ? "animate-pulse" : ""}`}
    >
      <Bell className={`w-4 h-4 ${status === "subscribed" ? "" : "opacity-40"}`} />
    </button>
  );
}


