// src/lib/registrarAssinatura.ts

import { supabase } from "@/lib/supabaseClient";

export async function registrarAssinatura(
  obraId: string,
  assinaturaBase64: string,
  email: string
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const ip = await buscarIP();
  const timestamp = new Date().toISOString();

  const { error } = await supabase.from("assinaturas").insert({
    obra_id: obraId,
    user_id: userId,
    email,
    assinatura: assinaturaBase64,
    ip,
    criado_em: timestamp,
  });

  if (error) {
    console.error("Erro ao registrar assinatura:", error.message);
    throw new Error("Erro ao salvar a assinatura.");
  }
}

async function buscarIP(): Promise<string> {
  try {
    const resp = await fetch("https://api64.ipify.org?format=json");
    const json = await resp.json();
    return json.ip || "0.0.0.0";
  } catch {
    return "0.0.0.0";
  }
}


