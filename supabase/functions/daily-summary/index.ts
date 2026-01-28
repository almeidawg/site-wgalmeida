// Supabase Edge Function - Resumo Diario de Atividades
// Deploy: supabase functions deploy daily-summary
// Agendar via Supabase Cron ou servico externo (Cron-job.org)

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Data de ontem (para resumo do dia anterior)
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split("T")[0];

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // Buscar cadastros do dia anterior
    const { data: cadastros, error: errCadastros } = await supabase
      .from("pending_registrations")
      .select("*")
      .gte("created_at", ontemStr)
      .lt("created_at", hojeStr)
      .order("created_at", { ascending: false });

    // Buscar contatos do dia anterior
    const { data: contatos, error: errContatos } = await supabase
      .from("contacts")
      .select("*")
      .gte("created_at", ontemStr)
      .lt("created_at", hojeStr)
      .order("created_at", { ascending: false });

    // Buscar total de cadastros pendentes
    const { count: pendentesTotal } = await supabase
      .from("pending_registrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // Formatar data
    const dataFormatada = ontem.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Gerar HTML do email
    const cadastrosHtml = cadastros?.length
      ? cadastros
          .map(
            (c) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.nome}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.email}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <span style="background: ${c.status === 'pendente' ? '#FFA500' : c.status === 'aprovado' ? '#4CAF50' : '#F44336'};
                          color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">
                ${c.status}
              </span>
            </td>
          </tr>
        `
          )
          .join("")
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Nenhum cadastro no periodo</td></tr>';

    const contatosHtml = contatos?.length
      ? contatos
          .map(
            (c) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.email}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.subject || '-'}</td>
          </tr>
        `
          )
          .join("")
      : '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Nenhum contato no periodo</td></tr>';

    // Enviar email
    if (RESEND_API_KEY && (cadastros?.length || contatos?.length)) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "WG Almeida <noreply@wgalmeida.com.br>",
          to: [ADMIN_EMAIL],
          subject: `[Site WG] Resumo Diario - ${dataFormatada}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Resumo Diario</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">${dataFormatada}</p>
              </div>

              <!-- Metricas -->
              <div style="display: flex; padding: 20px; background: #f9f9f9; gap: 15px;">
                <div style="flex: 1; background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="font-size: 32px; font-weight: bold; color: #FF6B35;">${cadastros?.length || 0}</div>
                  <div style="color: #666; font-size: 14px;">Novos Cadastros</div>
                </div>
                <div style="flex: 1; background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="font-size: 32px; font-weight: bold; color: #4CAF50;">${contatos?.length || 0}</div>
                  <div style="color: #666; font-size: 14px;">Contatos Recebidos</div>
                </div>
                <div style="flex: 1; background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="font-size: 32px; font-weight: bold; color: #FFA500;">${pendentesTotal || 0}</div>
                  <div style="color: #666; font-size: 14px;">Pendentes Total</div>
                </div>
              </div>

              <!-- Novos Cadastros -->
              <div style="padding: 20px;">
                <h2 style="color: #333; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">
                  Novos Cadastros
                </h2>
                <table style="width: 100%; border-collapse: collapse; background: white;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 10px; text-align: left;">Nome</th>
                      <th style="padding: 10px; text-align: left;">Email</th>
                      <th style="padding: 10px; text-align: left;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${cadastrosHtml}
                  </tbody>
                </table>
              </div>

              <!-- Contatos -->
              <div style="padding: 20px;">
                <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
                  Contatos Recebidos
                </h2>
                <table style="width: 100%; border-collapse: collapse; background: white;">
                  <thead>
                    <tr style="background: #f5f5f5;">
                      <th style="padding: 10px; text-align: left;">Nome</th>
                      <th style="padding: 10px; text-align: left;">Email</th>
                      <th style="padding: 10px; text-align: left;">Assunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contatosHtml}
                  </tbody>
                </table>
              </div>

              <!-- Acoes -->
              <div style="padding: 20px; text-align: center;">
                <a href="https://easy.wgalmeida.com.br/admin"
                   style="display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 5px;">
                  Acessar Painel Admin
                </a>
              </div>

              <div style="padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f5f5f5;">
                <p>Este email e enviado automaticamente todos os dias as 8h.</p>
                <p>Grupo WG Almeida - Sistema de Notificacoes</p>
              </div>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Erro ao enviar email:", await emailResponse.text());
        throw new Error("Falha ao enviar email");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Resumo enviado com sucesso",
          stats: {
            cadastros: cadastros?.length || 0,
            contatos: contatos?.length || 0,
            pendentes: pendentesTotal || 0,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (!cadastros?.length && !contatos?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Nenhuma atividade no periodo - email nao enviado",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "RESEND_API_KEY nao configurada",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
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
