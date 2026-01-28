// Supabase Edge Function - Notificacao de Novo Cadastro
// Deploy: supabase functions deploy notify-registration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "contato@wgalmeida.com.br";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationPayload {
  type: "INSERT";
  table: "pending_registrations";
  record: {
    id: string;
    nome: string;
    email: string;
    created_at: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RegistrationPayload = await req.json();

    // Extrair dados do novo cadastro
    const { nome, email, created_at } = payload.record;

    // Formatar data
    const dataFormatada = new Date(created_at).toLocaleString("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    });

    // Enviar email de notificacao usando Resend
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "WG Almeida <noreply@wgalmeida.com.br>",
          to: [ADMIN_EMAIL],
          subject: `[Site WG] Novo Cadastro: ${nome}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Novo Cadastro no Site</h1>
              </div>

              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333; margin-top: 0;">Dados do Cliente:</h2>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Nome:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${nome}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Data:</td>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${dataFormatada}</td>
                  </tr>
                </table>

                <div style="margin-top: 30px; text-align: center;">
                  <a href="https://easy.wgalmeida.com.br/admin/cadastros"
                     style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Ver Cadastros Pendentes
                  </a>
                </div>
              </div>

              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
                <p>Este email foi enviado automaticamente pelo sistema WG Almeida.</p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Erro ao enviar email:", await emailResponse.text());
      }
    } else {
      console.log("RESEND_API_KEY nao configurada. Email nao enviado.");
      console.log("Novo cadastro:", { nome, email, created_at });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notificacao processada" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na funcao:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
