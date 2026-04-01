/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// PÁGINA: VisualizaçÍo de Proposta para PDF
// Sistema WG Easy - Grupo WG Almeida
// Layout idêntico ao mockup aprovado (PropostaContratoTemplateMockupPage)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, CheckCircle, XCircle, Copy, Check, X, MessageSquare, Send, Mail, ExternalLink, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { buscarPropostaParaPDF, buscarPropostaPorToken, solicitarRevisaoProposta, rejeitarPropostaComMotivo, gerarTokenCompartilhamento, gerarMensagemPropostaWhatsApp, obterLinkProposta } from "@/lib/propostasApi";
import { getFormaPagamentoLabel, getNucleoLabel } from "@/types/propostas";
import type { PropostaVisualizacao } from "@/types/propostas";
import { gerarIniciais, gerarCorPorNome } from "@/utils/avatarUtils";
import { ativarContrato } from "@/lib/workflows/contratoWorkflow";
import { criarContrato } from "@/lib/contratosApi";

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

// Calcula data limite adicionando dias úteis (seg-sex) a partir de hoje
function calcularDataLimiteDiasUteis(diasUteis: number): Date {
  const data = new Date();
  let adicionados = 0;
  while (adicionados < diasUteis) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) adicionados++;
  }
  return data;
}

export default function PropostaVisualizarPage() {
  const { toast } = useToast();
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const [proposta, setProposta] = useState<PropostaVisualizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [avatarErro, setAvatarErro] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [acaoConcluida, setAcaoConcluida] = useState<"aprovada" | "recusada" | "revisao" | null>(null);
  const [pixCopiado, setPixCopiado] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Notificar no sino + e-mail (best-effort)
  const notificar = async (
    tipo: string,
    titulo: string,
    mensagem: string,
    urlAcao?: string | null
  ) => {
    try {
      await supabase.from("notificacoes_sistema").insert({
        tipo,
        titulo,
        mensagem,
        referencia_tipo: "proposta",
        referencia_id: propostaId,
        para_todos_admins: true,
        url_acao: urlAcao || `/propostas/${propostaId}/visualizar`,
        texto_acao: "Ver",
      });
    } catch (err) {
      console.warn("[PropostaVisualizarPage] Falha ao registrar notificacao no sino", err);
    }

    try {
      await supabase.functions.invoke("send-email", {
        body: {
          to: "william@wgalmeida.com.br",
          subject: titulo,
          text: `${mensagem}\n\nAcesse: ${urlAcao || `${window.location.origin}/propostas/${propostaId}/visualizar`}`,
        },
      });
    } catch (err) {
      console.warn("[PropostaVisualizarPage] Falha ao enviar e-mail", err);
    }
  };

  // Modal states
  const [showModalRevisao, setShowModalRevisao] = useState(false);
  const [textoRevisao, setTextoRevisao] = useState("");
  const [showModalRecusa, setShowModalRecusa] = useState(false);
  const [textoRecusa, setTextoRecusa] = useState("");

  // Share states
  const [showModalCompartilhar, setShowModalCompartilhar] = useState(false);
  const [linkCompartilhamento, setLinkCompartilhamento] = useState<string | null>(null);
  const [copiouLink, setCopiouLink] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);

  // Modo: token-based ou ID-based
  const modoToken = !!token && !id;
  const propostaId = proposta?.id || id;

  // Status permite açÍo:
  // - Link público (token): somente quando enviada
  // - VisualizaçÍo interna (id): permitir também rascunho para testes/validaçÍo interna
  const podeAgir = !!proposta && (
    proposta.status === "enviada" ||
    (!modoToken && proposta.status === "rascunho")
  );

  // Handler: Aprovar proposta → criar contrato → ativar financeiro + cronograma
  const handleAprovar = async () => {
    if (!propostaId || !proposta || processando) return;
    setProcessando(true);
    try {
      // 1. Atualizar status da proposta
      const { error: updateError } = await supabase
        .from("propostas")
        .update({
          status: "aprovada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", propostaId);

      if (updateError) throw updateError;

      // 2. Criar contrato automaticamente
      let contrato: any = null;
      try {
        contrato = await criarContrato(
          {
            proposta_id: propostaId,
            cliente_id: proposta.cliente_id,
            valor_total: proposta.valor_total,
            tipo_contrato: proposta.nucleo || "servico",
            unidade_negocio: (proposta.nucleo as any) || "arquitetura",
            forma_pagamento: proposta.forma_pagamento || null,
            percentual_entrada: proposta.percentual_entrada || null,
            numero_parcelas: proposta.numero_parcelas || null,
            duracao_dias_uteis: proposta.prazo_execucao_dias || null,
            titulo: proposta.titulo,
            descricao: proposta.descricao || null,
            data_inicio: new Date().toISOString(),
            observacoes: `Contrato gerado automaticamente a partir da proposta ${proposta.numero || propostaId}`,
          } as any,
          false
        );
      } catch (contratoError) {
        console.error("[PropostaVisualizarPage] Erro ao criar contrato:", contratoError);
      }

      // 3. Ativar contrato (gerar financeiro + cronograma + compras)
      if (contrato) {
        try {
          await ativarContrato({
            contrato_id: contrato.id,
            gerar_financeiro: true,
            gerar_compras: true,
            gerar_cronograma: true,
            ativacao_automatica: true,
            configuracao_parcelas: {
              numero_parcelas: proposta.numero_parcelas || 3,
              dia_vencimento: new Date().getDate(),
              periodicidade: "mensal",
              valor_entrada: proposta.percentual_entrada
                ? (proposta.valor_total * proposta.percentual_entrada) / 100
                : 0,
              percentual_entrada: proposta.percentual_entrada || 0,
              primeira_parcela_entrada: (proposta.percentual_entrada || 0) > 0,
            },
          });
          if (import.meta.env.DEV) console.log("[PropostaVisualizarPage] Contrato ativado com sucesso");
        } catch (e) {
          console.warn("[PropostaVisualizarPage] Erro na ativaçÍo automática:", e);
        }
      }

      // 4. Criar notificaçÍo
      await supabase.from("notificacoes").insert({
        tipo: "proposta_aprovada",
        titulo: `Proposta ${proposta.numero || ""} aprovada pelo cliente`,
        descricao: `O cliente ${proposta.cliente_nome || ""} aprovou a proposta. Contrato criado automaticamente.`,
        dados: { proposta_id: propostaId, contrato_id: contrato?.id },
      }).then(() => {});

      await notificar(
        "proposta_aprovada",
        `Proposta ${proposta.numero || propostaId} aprovada`,
        `O cliente ${proposta.cliente_nome || "N/A"} aprovou a proposta.`,
        `/propostas/${propostaId}/visualizar`
      );

      setAcaoConcluida("aprovada");
      setProposta({ ...proposta, status: "aprovada" });
    } catch (err: any) {
      console.error("[PropostaVisualizarPage] Erro ao aprovar:", err);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao processar aprovaçÍo: : ${err.message || "Tente novamente"}` });
    } finally {
      setProcessando(false);
    }
  };

  // Handler: Recusar proposta (via modal com motivo)
  const handleRecusar = async () => {
    if (!propostaId || !proposta || processando) return;
    setProcessando(true);
    try {
      await rejeitarPropostaComMotivo(propostaId, textoRecusa || undefined);
      setAcaoConcluida("recusada");
      setShowModalRecusa(false);
      setProposta({ ...proposta, status: "rejeitada" });

      await notificar(
        "proposta_recusada",
        `Proposta ${proposta?.numero || propostaId} recusada`,
        textoRecusa || "O cliente recusou a proposta.",
        `/propostas/${propostaId}/visualizar`
      );
    } catch (err: any) {
      console.error("[PropostaVisualizarPage] Erro ao recusar:", err);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao processar recusa: : ${err.message || "Tente novamente"}` });
    } finally {
      setProcessando(false);
    }
  };

  // Handler: Solicitar revisÍo (via modal com feedback)
  const handleRevisar = async () => {
    if (!propostaId || !proposta || processando || textoRevisao.trim().length < 10) return;
    setProcessando(true);
    try {
      await solicitarRevisaoProposta(propostaId, textoRevisao.trim());
      setAcaoConcluida("revisao");
      setShowModalRevisao(false);
      setProposta({ ...proposta, status: "em_revisao" as any });

      await notificar(
        "proposta_revisao",
        `Cliente pediu revisÍo da proposta ${proposta?.numero || propostaId}`,
        textoRevisao.trim(),
        `/propostas/${propostaId}/visualizar`
      );
    } catch (err: any) {
      console.error("[PropostaVisualizarPage] Erro ao solicitar revisÍo:", err);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao solicitar revisÍo: : ${err.message || "Tente novamente"}` });
    } finally {
      setProcessando(false);
    }
  };

  // Handler: Gerar link e abrir modal de compartilhamento
  const handleCompartilhar = async () => {
    if (!propostaId || gerandoLink) return;
    setGerandoLink(true);
    try {
      // Verifica se já existe link válido
      const linkExistente = await obterLinkProposta(propostaId);
      if (linkExistente && proposta?.numero) {
        setLinkCompartilhamento(linkExistente);
        setShowModalCompartilhar(true);
        setGerandoLink(false);
        return;
      }
      // Gerar novo token
      const resultado = await gerarTokenCompartilhamento(propostaId, {
        validadeDias: 30,
        enviadaVia: "link_direto",
      });
      setLinkCompartilhamento(resultado.url);
      if (resultado.numero) {
        setProposta((prev) => (prev ? { ...prev, numero: resultado.numero || prev.numero } : prev));
      }
      setShowModalCompartilhar(true);
      // Atualizar status local se era rascunho
      if (proposta && proposta.status === "rascunho") {
        setProposta((prev) =>
          prev ? { ...prev, status: "enviada", numero: resultado.numero || prev.numero } : prev
        );
      }
    } catch (err: any) {
      console.error("[PropostaVisualizarPage] Erro ao gerar link:", err);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao gerar link: : ${err.message || "Tente novamente"}` });
    } finally {
      setGerandoLink(false);
    }
  };

  const copiarLinkCompartilhamento = async () => {
    if (!linkCompartilhamento) return;
    try {
      await navigator.clipboard.writeText(linkCompartilhamento);
      setCopiouLink(true);
      setTimeout(() => setCopiouLink(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = linkCompartilhamento;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiouLink(true);
      setTimeout(() => setCopiouLink(false), 2500);
    }
  };

  const enviarWhatsApp = () => {
    if (!linkCompartilhamento || !proposta) return;
    const nome = proposta.cliente_nome || "Cliente";
    const mensagem = gerarMensagemPropostaWhatsApp(
      nome,
      proposta.numero || null,
      proposta.valor_total,
      linkCompartilhamento
    );
    const telefone = proposta.cliente_telefone?.replace(/\D/g, "") || "";
    const url = `https://wa.me/${telefone ? `55${telefone}` : ""}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  };

  const enviarEmail = () => {
    if (!linkCompartilhamento || !proposta) return;
    const nome = proposta.cliente_nome || "Cliente";
    const assunto = encodeURIComponent(`Proposta ${proposta.numero || ""} - Grupo WG Almeida`);
    const corpo = encodeURIComponent(
      `Olá ${nome},\n\nSegue o link da sua proposta:\n${linkCompartilhamento}\n\nAtenciosamente,\nGrupo WG Almeida`
    );
    const email = proposta.cliente_email || "";
    window.open(`mailto:${email}?subject=${assunto}&body=${corpo}`, "_self");
  };

  useEffect(() => {
    if (!id && !token) {
      setErro("Link inválido");
      setLoading(false);
      return;
    }
    setLoading(true);

    const carregarProposta = token
      ? buscarPropostaPorToken(token).then((data) => {
          if (!data) throw new Error("Proposta nÍo encontrada ou link expirado");
          return data;
        })
      : buscarPropostaParaPDF(id!);

    carregarProposta
      .then((data) => {
        setProposta(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[PropostaVisualizarPage] Erro ao carregar proposta:", err);
        setErro(err.message || "Erro ao carregar proposta");
        setLoading(false);
      });
  }, [id, token]);

  const handleExportarPDF = async () => {
    const el = pdfRef.current;
    if (!el) return;

    setExportando(true);
    try {
      // Esconder elementos interativos antes de capturar
      const noPdfEls = el.querySelectorAll<HTMLElement>(".no-pdf");
      noPdfEls.forEach(e => e.style.display = "none");

      const nomeArquivo = proposta?.numero
        ? `Proposta_WG_${proposta.numero}.pdf`
        : `Proposta_WG_${propostaId}.pdf`;
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = (html2pdfModule.default ?? html2pdfModule) as () => any;

      await html2pdf()
        .set({
          margin: 0,
          filename: nomeArquivo,
          image: { type: "jpeg", quality: 1 },
          html2canvas: { scale: 3, useCORS: true, backgroundColor: "#F6F2EB" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();

      // Restaurar elementos
      noPdfEls.forEach(e => e.style.display = "");
    } catch (err) {
      console.error("[PropostaVisualizarPage] Erro ao exportar PDF:", err);
      // Restaurar em caso de erro
      const noPdfEls = el.querySelectorAll<HTMLElement>(".no-pdf");
      noPdfEls.forEach(e => e.style.display = "");
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F2EB]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#F25C26] animate-spin" />
          <p className="text-sm text-gray-500">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (erro || !proposta) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F6F2EB]">
        <div className="text-center space-y-4">
          <img
            src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
            alt="WG"
            className="h-12 w-auto object-contain mx-auto mb-4"
          />
          <p className="text-sm text-red-600">{erro || "Proposta nÍo encontrada"}</p>
          {modoToken && (
            <p className="text-xs text-gray-500">O link pode ter expirado ou a proposta foi removida.</p>
          )}
          {!modoToken && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm text-[#F25C26] underline"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Dados computados
  const clienteNome = proposta.cliente_nome || "Cliente";
  // Usar foto real do cliente se disponível; caso contrário, iniciais
  const fotoRealUrl = proposta.cliente_avatar_url || proposta.cliente_foto_url || null;
  const iniciais = gerarIniciais(clienteNome);
  const corAvatar = gerarCorPorNome(clienteNome);
  const dataFormatada = proposta.criado_em
    ? new Date(proposta.criado_em).toLocaleDateString("pt-BR")
    : "";
  const nucleoLabel = proposta.nucleo ? getNucleoLabel(proposta.nucleo as any) : null;
  const formaPagamentoLabel = proposta.forma_pagamento
    ? getFormaPagamentoLabel(proposta.forma_pagamento)
    : null;

  const valorEntrada =
    proposta.percentual_entrada && proposta.valor_total
      ? (proposta.valor_total * proposta.percentual_entrada) / 100
      : null;
  const valorParcela =
    proposta.numero_parcelas && proposta.valor_total && valorEntrada !== null
      ? (proposta.valor_total - valorEntrada) / proposta.numero_parcelas
      : null;

  // Prazo de execuçÍo: data limite em dias úteis
  const dataLimitePrazo = proposta.prazo_execucao_dias
    ? calcularDataLimiteDiasUteis(proposta.prazo_execucao_dias)
    : null;
  const dataLimiteFormatada = dataLimitePrazo
    ? dataLimitePrazo.toLocaleDateString("pt-BR")
    : null;

  // Contato do cliente
  const contatoCliente = [proposta.cliente_email, proposta.cliente_telefone]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-[#F6F2EB] text-[#1C1B1A]">
      {/* Toolbar flutuante (nÍo vai pro PDF) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-[#E7DED2] px-6 py-3 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#5C5148] hover:text-[#F25C26] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          {/* BotÍo compartilhar - apenas para usuários internos */}
          {!modoToken && (
            <button
              type="button"
              onClick={handleCompartilhar}
              disabled={gerandoLink}
              className="flex items-center gap-2 rounded-full border border-[#E7DED2] bg-white px-4 py-2 text-sm font-medium text-[#5C5148] hover:border-[#F25C26] hover:text-[#F25C26] disabled:opacity-50 transition-colors"
              title="Compartilhar proposta"
            >
              {gerandoLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Compartilhar
            </button>
          )}
          <button
            type="button"
            onClick={handleExportarPDF}
            disabled={exportando}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#D94E1F] disabled:opacity-50 transition-colors"
          >
            {exportando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exportando ? "Gerando PDF..." : "Baixar PDF"}
          </button>
        </div>
      </div>

      {/* Conteúdo do PDF */}
      <div ref={pdfRef} id="proposta-pdf">
        <style>
          {`:root {
            --wg-ink: #1C1B1A;
            --wg-sand: #F6F2EB;
            --wg-cream: #FFF9F1;
            --wg-orange: #F25C26;
            --wg-teal: #0ABAB5;
            --wg-green: #5E9B94;
            --wg-charcoal: #2B2A28;
          }
          .wg-glow {
            min-height: 100vh;
            background: radial-gradient(circle at top left, rgba(10, 186, 181, 0.18), transparent 55%),
              radial-gradient(circle at bottom right, rgba(242, 92, 38, 0.15), transparent 55%);
            background-color: #F6F2EB;
          }
          /* Escala de fontes otimizada para PDF A4 */
          #proposta-pdf h1 { font-size: 16px !important; }
          #proposta-pdf h2 { font-size: 12px !important; }
          #proposta-pdf h3 { font-size: 12px !important; }
          #proposta-pdf .pdf-valor-total { font-size: 22px !important; }
          #proposta-pdf .pdf-subtitle { font-size: 10px !important; }
          #proposta-pdf .pdf-body { font-size: 10px !important; }
          #proposta-pdf .pdf-body-sm { font-size: 9px !important; }
          #proposta-pdf .pdf-overline { font-size: 8px !important; }
          #proposta-pdf .pdf-badge { font-size: 8px !important; }
          #proposta-pdf .pdf-table-header { font-size: 8px !important; }
          #proposta-pdf .pdf-table-cell { font-size: 9px !important; }
          #proposta-pdf .pdf-logo { height: 56px !important; }
          `}
        </style>

        <div className="wg-glow">
          {/* Header */}
          <header className="mx-auto max-w-6xl px-6 pt-8">
            <div className="flex flex-col gap-5 rounded-3xl border border-[#E7DED2] bg-white/90 p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                      alt="WG"
                      className="pdf-logo h-14 w-auto object-contain"
                    />
                    <p className="pdf-overline text-[8px] uppercase tracking-wider text-gray-500">WG Easy · Proposta & Contrato</p>
                  </div>
                  <h1
                    className="text-[16px] font-light tracking-tight mt-2 text-[var(--wg-charcoal)]"
                  >
                    {proposta.titulo || "Proposta Comercial"}
                  </h1>
                  <p className="pdf-subtitle text-[10px] text-gray-600 mt-1">
                    {dataFormatada ? `Criado em ${dataFormatada}` : ""}
                    {proposta.numero ? ` · Número: ${proposta.numero}` : ""}
                    {` · Status: ${proposta.status || "rascunho"}`}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                {/* Card Cliente & Projeto */}
                <div className="rounded-2xl border border-[#EFE6DA] bg-white p-4">
                  <h2 className="text-[12px] font-normal text-[#F25C26] mb-3 pb-2 border-b border-[#EFE6DA]">
                    Cliente & Projeto
                  </h2>
                  <div
                    className="grid gap-3 pdf-body text-[10px] text-[#3E372F]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar - 46px (h-10 + 15%) */}
                      <div
                        className="relative overflow-hidden rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                        style={{
                          width: 46,
                          height: 46,
                          backgroundColor: fotoRealUrl && !avatarErro ? "#EFE6DA" : `#${corAvatar}`,
                          color: fotoRealUrl && !avatarErro ? "#6B6258" : "#FFFFFF",
                        }}
                      >
                        {fotoRealUrl && !avatarErro ? (
                          <img
                            src={fotoRealUrl}
                            alt="Foto do cliente"
                            className="h-full w-full object-cover"
                            onError={() => setAvatarErro(true)}
                          />
                        ) : (
                          <span className="text-base font-bold">{iniciais}</span>
                        )}
                      </div>
                      <div>
                        <p className="pdf-overline text-[8px] uppercase tracking-wider text-gray-500">Cliente</p>
                        <p className="font-medium text-[10px]">{clienteNome}</p>
                        {contatoCliente && (
                          <p className="pdf-body-sm text-[9px] text-[#7C7368]">
                            {contatoCliente}
                          </p>
                        )}
                      </div>
                    </div>

                    {proposta.cliente_endereco && (
                      <div>
                        <p className="pdf-overline text-[8px] uppercase tracking-wider text-gray-500">Endereço da obra</p>
                        <p className="text-[10px]">{proposta.cliente_endereco}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {nucleoLabel && (
                        <span
                          className="rounded-full bg-white px-3 py-1 pdf-badge text-[8px] font-normal text-[#6E655A]"
                        >
                          Núcleo: {nucleoLabel}
                        </span>
                      )}
                      {proposta.prazo_execucao_dias && (
                        <span
                          className="rounded-full bg-white px-3 py-1 pdf-badge text-[8px] font-normal text-[#6E655A]"
                        >
                          Prazo: {proposta.prazo_execucao_dias} dias úteis{dataLimiteFormatada ? ` (até ${dataLimiteFormatada})` : ""}
                        </span>
                      )}
                    </div>

                    {/* Ações de compartilhamento - apenas usuário interno */}
                    {!modoToken && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#EFE6DA] no-pdf">
                        <button
                          type="button"
                          onClick={handleCompartilhar}
                          disabled={gerandoLink}
                          className="flex items-center gap-1.5 rounded-full border border-[#E7DED2] px-3 py-1 text-[9px] font-medium text-[#5C5148] hover:border-[#F25C26] hover:text-[#F25C26] disabled:opacity-50 transition-colors"
                          title="Gerar link de compartilhamento"
                        >
                          {gerandoLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={linkCompartilhamento ? enviarWhatsApp : handleCompartilhar}
                          disabled={gerandoLink}
                          className="flex items-center gap-1.5 rounded-full border border-[#E7DED2] px-3 py-1 text-[9px] font-medium text-[#25D366] hover:border-[#25D366] disabled:opacity-50 transition-colors"
                          title={linkCompartilhamento ? "Enviar por WhatsApp" : "Gerar link primeiro"}
                        >
                          <Send className="w-3 h-3" />
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={linkCompartilhamento ? enviarEmail : handleCompartilhar}
                          disabled={gerandoLink}
                          className="flex items-center gap-1.5 rounded-full border border-[#E7DED2] px-3 py-1 text-[9px] font-medium text-[#5C5148] hover:border-[#3B82F6] hover:text-[#3B82F6] disabled:opacity-50 transition-colors"
                          title={linkCompartilhamento ? "Enviar por e-mail" : "Gerar link primeiro"}
                        >
                          <Mail className="w-3 h-3" />
                          E-mail
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Valor Total (Laranja) */}
                <div className="rounded-2xl border border-[#F0D6C9] bg-[var(--wg-orange)] p-4 text-white text-right">
                  <p className="pdf-overline text-[8px] uppercase tracking-wider text-white/80">Valor total</p>
                  <p className="pdf-valor-total mt-2 text-[22px] font-semibold">
                    {formatarMoeda(proposta.valor_total || 0)}
                  </p>
                  <p className="pdf-body-sm text-[9px] mt-1 text-white/80">
                    {proposta.itens?.length || 0} itens incluídos
                    {proposta.validade_dias
                      ? ` · Validade ${proposta.validade_dias} dias`
                      : ""}
                  </p>

                  {(valorEntrada !== null || valorParcela !== null) && (
                    <div className="mt-4 grid gap-2 pdf-body-sm text-[9px]">
                      {valorEntrada !== null && proposta.percentual_entrada && (
                        <div className="flex items-center justify-between">
                          <span>
                            Entrada {proposta.percentual_entrada}%
                          </span>
                          <span>{formatarMoeda(valorEntrada)}</span>
                        </div>
                      )}
                      {valorParcela !== null && proposta.numero_parcelas && (
                        <div className="flex items-center justify-between">
                          <span>
                            Saldo {proposta.numero_parcelas}x
                          </span>
                          <span>{formatarMoeda(valorParcela)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões de açÍo do cliente */}
                  {podeAgir && !acaoConcluida && (
                    <div className="mt-4 grid gap-2 no-pdf">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setShowModalRecusa(true)}
                          disabled={processando}
                          className="rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold text-white/90 hover:border-white hover:text-white disabled:opacity-50 transition-colors"
                        >
                          Recusar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowModalRevisao(true)}
                          disabled={processando}
                          className="rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold text-white/90 hover:border-white hover:text-white disabled:opacity-50 transition-colors"
                        >
                          Revisar
                        </button>
                      </div>
                      <button
                        onClick={handleAprovar}
                        disabled={processando}
                        className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#C2451F] shadow-[0_6px_14px_rgba(0,0,0,0.12)] hover:bg-white/95 disabled:opacity-50 transition-colors"
                      >
                        {processando ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando...
                          </span>
                        ) : (
                          "Aprovar"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Feedback após açÍo */}
                  {acaoConcluida && (
                    <div className="mt-4 flex items-center justify-center gap-2 py-2">
                      {acaoConcluida === "aprovada" ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-white" />
                          <span className="text-sm font-semibold text-white">Proposta aprovada!</span>
                        </>
                      ) : acaoConcluida === "recusada" ? (
                        <>
                          <XCircle className="w-5 h-5 text-white" />
                          <span className="text-sm font-semibold text-white">Proposta recusada</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-white">RevisÍo solicitada</span>
                      )}
                    </div>
                  )}

                  {/* Status já processada */}
                  {!podeAgir && !acaoConcluida && proposta.status !== "rascunho" && (
                    <div className="mt-4 text-center py-2">
                      <span className="text-xs text-white/70">
                        {proposta.status === "aprovada" ? "Proposta aprovada" :
                         proposta.status === "rejeitada" ? "Proposta recusada" :
                         proposta.status === "em_revisao" ? "RevisÍo solicitada" :
                         `Status: ${proposta.status}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="mx-auto mt-6 grid max-w-6xl gap-5 px-6 pb-12">
            {/* Itens do Orçamento - Agrupados por Núcleo */}
            {proposta.itens && proposta.itens.length > 0 && (() => {
              // Agrupar itens por núcleo (engenharia separado em MO e Material)
              const gruposMap: Record<string, { label: string; cor: string; itens: typeof proposta.itens }> = {};
              const ordemGrupos = [
                "arquitetura",
                "engenharia_mo",
                "engenharia_material",
                "marcenaria",
                "produtos",
                "outros",
              ];
              const configGrupos: Record<string, { label: string; cor: string }> = {
                arquitetura: { label: "Arquitetura", cor: "#5E9B94" },
                engenharia_mo: { label: "Engenharia - MÍo de Obra", cor: "#2B4580" },
                engenharia_material: { label: "Engenharia - Materiais & Insumos", cor: "#2B4580" },
                marcenaria: { label: "Marcenaria", cor: "#8B5E3C" },
                produtos: { label: "Produtos", cor: "#F59E0B" },
                outros: { label: "Outros", cor: "#6B7280" },
              };

              proposta.itens.forEach((item) => {
                let grupoKey: string;
                if (item.nucleo === "arquitetura") {
                  grupoKey = "arquitetura";
                } else if (item.nucleo === "engenharia") {
                  grupoKey = item.tipo === "mao_obra" || item.tipo === "servico"
                    ? "engenharia_mo"
                    : "engenharia_material";
                } else if (item.nucleo === "marcenaria") {
                  grupoKey = "marcenaria";
                } else if (item.nucleo === "produtos") {
                  grupoKey = "produtos";
                } else {
                  grupoKey = "outros";
                }
                if (!gruposMap[grupoKey]) {
                  const cfg = configGrupos[grupoKey];
                  gruposMap[grupoKey] = { label: cfg.label, cor: cfg.cor, itens: [] };
                }
                gruposMap[grupoKey].itens.push(item);
              });

              const gruposOrdenados = ordemGrupos
                .filter((k) => gruposMap[k] && gruposMap[k].itens.length > 0)
                .map((k) => ({ key: k, ...gruposMap[k] }));

              // Se todos os itens caem num único grupo, mostra sem separaçÍo de núcleo
              const mostrarAgrupado = gruposOrdenados.length > 1;

              return (
                <section className="space-y-4">
                  {/* Header geral */}
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-[12px] font-normal text-[#2B2A28]">
                      Itens do orçamento
                    </h2>
                    <span className="text-[8px] text-[#8A8176]">
                      {proposta.itens.length} itens
                    </span>
                  </div>

                  {gruposOrdenados.map((grupo) => {
                    const totalGrupo = grupo.itens.reduce(
                      (acc, it) => acc + it.quantidade * it.valor_unitario, 0
                    );
                    return (
                      <div
                        key={grupo.key}
                        className="rounded-3xl border border-[#E7DED2] bg-white overflow-hidden"
                      >
                        {/* Header do núcleo */}
                        {mostrarAgrupado && (
                          <div
                            className="flex items-center justify-between px-5 py-3"
                            style={{ borderBottom: `2px solid ${grupo.cor}` }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: grupo.cor }}
                              />
                              <span className="text-[11px] font-semibold" style={{ color: grupo.cor }}>
                                {grupo.label}
                              </span>
                              <span className="text-[8px] text-[#8A8176] ml-1">
                                {grupo.itens.length} {grupo.itens.length === 1 ? "item" : "itens"}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold" style={{ color: grupo.cor }}>
                              {formatarMoeda(totalGrupo)}
                            </span>
                          </div>
                        )}

                        {/* Tabela de itens */}
                        <div className={`overflow-hidden ${mostrarAgrupado ? "" : "rounded-2xl border border-[#E5E7EB]"}`}>
                          <div className="grid grid-cols-[2.5fr_0.5fr_0.5fr_0.5fr] bg-white px-4 py-3 pdf-table-header text-[8px] font-normal text-[#8A8176] border-b border-[#E5E7EB]">
                            <span>DescriçÍo</span>
                            <span>Qtd</span>
                            <span>Valor unit.</span>
                            <span>Subtotal</span>
                          </div>
                          {grupo.itens.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="grid grid-cols-[2.5fr_0.5fr_0.5fr_0.5fr] items-center border-t border-[#F1F5F9] px-4 py-2.5 pdf-table-cell text-[9px] text-[#3A342D]"
                            >
                              <span className="font-medium">
                                {item.descricao_customizada || item.nome || item.descricao || "Item"}
                              </span>
                              <span>
                                {item.quantidade} {item.unidade || "un"}
                              </span>
                              <span>{formatarMoeda(item.valor_unitario)}</span>
                              <span className="font-semibold text-[#2B2A28]">
                                {formatarMoeda(item.quantidade * item.valor_unitario)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>
              );
            })()}

            {/* Escopo e Entregáveis */}
            {proposta.descricao && (
              <section className="rounded-3xl border border-[#E7DED2] bg-white p-5">
                <h3 className="text-[12px] font-normal text-[#2B2A28]">
                  Escopo e entregáveis
                </h3>
                <div className="mt-2 space-y-2 pdf-body-sm text-[9px] text-[#5C5148] whitespace-pre-line">
                  {proposta.descricao}
                </div>
              </section>
            )}

            {/* Condições Comerciais + Dados Bancários */}
            <section className="grid gap-5 md:grid-cols-2">
              {/* Bloco 1: Condições Comerciais */}
              <div className="rounded-3xl border border-[#E7DED2] bg-white p-5">
                <h3 className="text-[12px] font-normal text-[#2B2A28]">
                  Condições comerciais
                </h3>
                <ul className="mt-2 space-y-2 pdf-body-sm text-[9px] text-[#5C5148]">
                  {formaPagamentoLabel && (
                    <li>• Forma de pagamento: {formaPagamentoLabel}</li>
                  )}
                  {proposta.percentual_entrada && valorEntrada !== null && (
                    <li>
                      • Entrada: {proposta.percentual_entrada}% ({formatarMoeda(valorEntrada)})
                    </li>
                  )}
                  {proposta.numero_parcelas && valorParcela !== null && (
                    <li>
                      • Saldo: {proposta.numero_parcelas}x de {formatarMoeda(valorParcela)}
                    </li>
                  )}
                  {proposta.validade_dias && (
                    <li>• Proposta válida por {proposta.validade_dias} dias</li>
                  )}
                  {proposta.prazo_execucao_dias && (
                    <li>
                      • Prazo de execuçÍo: {proposta.prazo_execucao_dias} dias úteis{dataLimiteFormatada ? ` (previsÍo até ${dataLimiteFormatada})` : ""}
                    </li>
                  )}
                </ul>
              </div>

              {/* Bloco 2: Dados Bancários por Núcleo */}
              {proposta.dados_bancarios && proposta.dados_bancarios.length > 0 && (
                <div className="rounded-3xl border border-[#E7DED2] bg-white p-5">
                  <h3 className="text-[12px] font-normal text-[#2B2A28]">
                    Dados bancários
                  </h3>
                  <div className="mt-2 space-y-4">
                    {proposta.dados_bancarios.map((conta, idx) => (
                      <div key={idx} className="pdf-body-sm text-[9px] text-[#5C5148]">
                        {proposta.dados_bancarios!.length > 1 && (
                          <p className="pdf-overline text-[8px] uppercase tracking-wider text-gray-500 mb-1">
                            {conta.nucleo === "arquitetura" ? "Arquitetura" :
                             conta.nucleo === "engenharia" ? "Engenharia" :
                             conta.nucleo === "marcenaria" ? "Marcenaria" :
                             conta.nucleo}
                          </p>
                        )}
                        <ul className="space-y-1">
                          {conta.nome && <li>• {conta.nome}</li>}
                          <li>• Banco: {conta.banco}</li>
                          {conta.agencia && <li>• Agência: {conta.agencia}</li>}
                          {conta.conta && (
                            <li>• Conta{conta.tipo_conta ? ` ${conta.tipo_conta}` : ""}: {conta.conta}</li>
                          )}
                          {conta.pix_chave && (
                            <li>
                              <span>• PIX{conta.pix_tipo ? ` (${conta.pix_tipo})` : ""}: </span>
                              <span
                                className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-[#0ABAB5] transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(conta.pix_chave!).then(() => {
                                    setPixCopiado(conta.pix_chave!);
                                    setTimeout(() => setPixCopiado(null), 2500);
                                  });
                                }}
                                title="Clique para copiar a chave PIX"
                              >
                                {conta.pix_chave}
                              </span>
                              <span className="no-pdf inline-flex items-center gap-0.5 ml-1.5 align-middle">
                                {pixCopiado === conta.pix_chave ? (
                                  <span className="inline-flex items-center gap-0.5 text-[#0ABAB5]">
                                    <Check className="w-3 h-3" />
                                    <span className="text-[8px] font-medium">Copiado!</span>
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-0.5 text-[#0ABAB5]/60 hover:text-[#0ABAB5] cursor-pointer transition-colors"
                                    onClick={() => {
                                      navigator.clipboard.writeText(conta.pix_chave!).then(() => {
                                        setPixCopiado(conta.pix_chave!);
                                        setTimeout(() => setPixCopiado(null), 2500);
                                      });
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span className="text-[8px] font-medium">Copiar</span>
                                  </span>
                                )}
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {/* Modal: Compartilhar Proposta */}
      {showModalCompartilhar && linkCompartilhamento && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#F25C26]" />
                <h3 className="text-sm font-semibold text-gray-900">Compartilhar Proposta</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowModalCompartilhar(false); setCopiouLink(false); }}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Link copiável */}
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <input
                type="text"
                readOnly
                value={linkCompartilhamento}
                title="Link de compartilhamento da proposta"
                className="flex-1 bg-transparent text-xs text-gray-700 outline-none truncate"
              />
              <button
                type="button"
                onClick={copiarLinkCompartilhamento}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  copiouLink
                    ? "bg-green-100 text-green-700"
                    : "bg-primary text-white hover:bg-[#D94E1F]"
                }`}
              >
                {copiouLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiouLink ? "Copiado!" : "Copiar"}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-2 text-center">
              Link válido por 30 dias
            </p>

            {/* Ações de envio */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={enviarWhatsApp}
                className="flex items-center justify-center gap-2 rounded-full border border-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={enviarEmail}
                className="flex items-center justify-center gap-2 rounded-full border border-[#3B82F6] px-4 py-2.5 text-sm font-semibold text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                E-mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Solicitar RevisÍo */}
      {showModalRevisao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-sm font-semibold text-gray-900">Solicitar RevisÍo</h3>
              </div>
              <button type="button" onClick={() => setShowModalRevisao(false)} className="text-gray-400 hover:text-gray-600" title="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Descreva o que gostaria de alterar na proposta. Nossa equipe analisará seu feedback.
            </p>
            <textarea
              value={textoRevisao}
              onChange={(e) => setTextoRevisao(e.target.value)}
              placeholder="Ex: Gostaria de ajustar o valor da marcenaria e incluir mais um item de iluminaçÍo..."
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] focus:outline-none resize-none"
              rows={4}
            />
            {textoRevisao.length > 0 && textoRevisao.trim().length < 10 && (
              <p className="text-xs text-red-500 mt-1">Mínimo de 10 caracteres</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModalRevisao(false)}
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevisar}
                disabled={processando || textoRevisao.trim().length < 10}
                className="flex-1 rounded-full bg-[#F59E0B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#D97706] disabled:opacity-50 transition-colors"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Enviando...
                  </span>
                ) : (
                  "Enviar SolicitaçÍo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Recusar Proposta */}
      {showModalRecusa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-semibold text-gray-900">Recusar Proposta</h3>
              </div>
              <button type="button" onClick={() => setShowModalRecusa(false)} className="text-gray-400 hover:text-gray-600" title="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Tem certeza que deseja recusar esta proposta? Opcionalmente, informe o motivo.
            </p>
            <textarea
              value={textoRecusa}
              onChange={(e) => setTextoRecusa(e.target.value)}
              placeholder="Motivo da recusa (opcional)..."
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-red-400 focus:ring-1 focus:ring-red-400 focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowModalRecusa(false)}
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRecusar}
                disabled={processando}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {processando ? (
                  <span className="flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processando...
                  </span>
                ) : (
                  "Confirmar Recusa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
