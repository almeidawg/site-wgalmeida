// src/components/cadastro-link/LinksAtivosPanel.tsx
// Painel de Links Ativos - listagem, cópia e revogaçÍo de links gerados

import { useState, useEffect, useCallback } from "react";
import {
  Link2, Copy, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff,
  Users, Clock, Hash, ChevronDown, ChevronUp, Search, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { TipoCadastro } from "@/lib/cadastroLinkApi";

const PRODUCTION_URL = "https://easy.wgalmeida.com.br";

function getBaseUrl() {
  return import.meta.env.PROD ? PRODUCTION_URL : window.location.origin;
}

interface LinkAtivo {
  id: string;
  token: string;
  tipo_solicitado: TipoCadastro;
  status: string;
  reutilizavel: boolean;
  uso_maximo: number | null;
  total_usos: number;
  expira_em: string;
  criado_em: string;
  titulo_pagina: string | null;
  nome: string | null;
  enviado_por_nome: string | null;
}

const TIPO_LABEL: Record<string, { label: string; color: string }> = {
  CLIENTE:       { label: "Cliente",       color: "#F25C26" },
  COLABORADOR:   { label: "Colaborador",   color: "#2B4580" },
  FORNECEDOR:    { label: "Fornecedor",    color: "#8B5E3C" },
  ESPECIFICADOR: { label: "Especificador", color: "#5E9B94" },
};

function diasRestantes(expiraEm: string): number {
  return Math.ceil((new Date(expiraEm).getTime() - Date.now()) / 86400000);
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function LinksAtivosPanel() {
  const { toast } = useToast();
  const [links, setLinks] = useState<LinkAtivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"ativos" | "todos">("ativos");
  const [mostrarExpirados, setMostrarExpirados] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmRevogar, setConfirmRevogar] = useState<LinkAtivo | null>(null);
  const [revogando, setRevogando] = useState(false);
  const [expandido, setExpandido] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vw_cadastros_pendentes")
        .select("id, token, tipo_solicitado, status, reutilizavel, uso_maximo, total_usos, expira_em, criado_em, titulo_pagina, nome, enviado_por_nome")
        .order("criado_em", { ascending: false })
        .limit(100);

      if (!mostrarExpirados) {
        query = query.gt("expira_em", new Date().toISOString());
      }
      if (filtroStatus === "ativos") {
        query = query.eq("status", "aguardando_preenchimento");
      }

      const { data, error } = await query;
      if (error) throw error;
      setLinks(data || []);
    } catch (e: any) {
      toast({ title: "Erro ao carregar links", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [mostrarExpirados, filtroStatus, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleCopiar(link: LinkAtivo) {
    const url = `${getBaseUrl()}/cadastro-publico/${link.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    toast({ title: "Link copiado!", description: "Pronto para colar no WhatsApp ou e-mail." });
    setTimeout(() => setCopiedId(null), 3000);
  }

  async function handleRevogar() {
    if (!confirmRevogar) return;
    setRevogando(true);
    try {
      const { error } = await supabase
        .from("cadastros_pendentes")
        .update({ expira_em: new Date().toISOString(), status: "rejeitado" })
        .eq("id", confirmRevogar.id);
      if (error) throw error;
      toast({ title: "Link revogado", description: "O link não pode mais ser acessado." });
      setConfirmRevogar(null);
      carregar();
    } catch (e: any) {
      toast({ title: "Erro ao revogar", description: e.message, variant: "destructive" });
    } finally {
      setRevogando(false);
    }
  }

  const linksFiltrados = links.filter((l) => {
    if (!busca.trim()) return true;
    const b = busca.toLowerCase();
    return (
      l.tipo_solicitado.toLowerCase().includes(b) ||
      (l.titulo_pagina || "").toLowerCase().includes(b) ||
      (l.nome || "").toLowerCase().includes(b) ||
      (l.enviado_por_nome || "").toLowerCase().includes(b) ||
      l.token.toLowerCase().includes(b)
    );
  });

  const totalAtivos = links.length;
  const totalReutilizaveis = links.filter((l) => l.reutilizavel).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[20px] font-light flex items-center gap-2">
                <Link2 className="w-5 h-5 text-indigo-500" />
                Links Ativos
              </CardTitle>
              <CardDescription className="text-[12px]">
                Gerencie, copie e revogue links de cadastro já criados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Stats rápidas */}
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <span className="text-[12px] text-gray-500">
                  <span className="font-normal text-gray-900">{totalAtivos}</span> ativos
                </span>
                {totalReutilizaveis > 0 && (
                  <span className="text-[12px] text-gray-500">
                    <span className="font-normal text-gray-900">{totalReutilizaveis}</span> em massa
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={carregar} title="Recarregar">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpandido(!expandido)}>
                {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {expandido && (
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Busca */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por tipo, token, nome..."
                  className="pl-8 h-8 text-[12px]"
                />
              </div>
              {/* Filtro status */}
              <div className="flex gap-1">
                {(["ativos", "todos"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFiltroStatus(f)}
                    className={`px-3 h-8 rounded-lg text-[12px] border transition-all ${
                      filtroStatus === f
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {f === "ativos" ? "Aguardando" : "Todos"}
                  </button>
                ))}
              </div>
              {/* Toggle expirados */}
              <button
                type="button"
                onClick={() => setMostrarExpirados(!mostrarExpirados)}
                className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] border transition-all ${
                  mostrarExpirados
                    ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {mostrarExpirados ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Expirados
              </button>
            </div>
          )}
        </CardHeader>

        {expandido && (
          <CardContent className="pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="ml-2 text-[12px] text-gray-500">Carregando links...</span>
              </div>
            ) : linksFiltrados.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-[13px] text-gray-500">Nenhum link encontrado</p>
                <p className="text-[12px] text-gray-400 mt-1">
                  {filtroStatus === "ativos" ? "Gere um link nas seções acima." : "Tente ajustar os filtros."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {linksFiltrados.map((link) => {
                  const tipo = TIPO_LABEL[link.tipo_solicitado] ?? { label: link.tipo_solicitado, color: "#666" };
                  const dias = diasRestantes(link.expira_em);
                  const expirado = dias <= 0;
                  const isCopied = copiedId === link.id;
                  const url = `${getBaseUrl()}/cadastro-publico/${link.token}`;

                  return (
                    <div
                      key={link.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        expirado
                          ? "bg-gray-50 border-gray-200 opacity-60"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      {/* Tipo badge */}
                      <div
                        className="w-2 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: tipo.color }}
                      />

                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-[12px] font-normal px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${tipo.color}18`, color: tipo.color }}
                          >
                            {tipo.label}
                          </span>
                          {link.reutilizavel && (
                            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                              <Users className="w-3 h-3" />
                              Em massa
                            </span>
                          )}
                          {link.titulo_pagina && (
                            <span className="text-[12px] text-gray-600 truncate max-w-[200px]">
                              {link.titulo_pagina}
                            </span>
                          )}
                          {link.nome && !link.titulo_pagina && (
                            <span className="text-[12px] text-gray-500 truncate max-w-[200px]">
                              {link.nome}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-gray-400 font-mono truncate max-w-[140px]">
                            …{link.token.slice(-10)}
                          </span>
                          {link.reutilizavel && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-500">
                              <Hash className="w-3 h-3" />
                              {link.total_usos ?? 0}
                              {link.uso_maximo ? `/${link.uso_maximo}` : ""} usos
                            </span>
                          )}
                          <span className={`flex items-center gap-1 text-[11px] ${expirado ? "text-red-500" : dias <= 2 ? "text-amber-500" : "text-gray-400"}`}>
                            <Clock className="w-3 h-3" />
                            {expirado ? "Expirado" : `${dias}d restantes`}
                          </span>
                          <span className="text-[11px] text-gray-400 hidden sm:inline">
                            {formatarData(link.criado_em)}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* URL display + copiar */}
                        <button
                          type="button"
                          onClick={() => handleCopiar(link)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all"
                          title={url}
                        >
                          {isCopied
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                          <span className="hidden sm:inline">{isCopied ? "Copiado!" : "Copiar"}</span>
                        </button>

                        {/* Revogar */}
                        {!expirado && (
                          <button
                            type="button"
                            onClick={() => setConfirmRevogar(link)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                            title="Revogar este link"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Revogar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal confirmaçÍo de revogaçÍo */}
      <Dialog open={!!confirmRevogar} onOpenChange={() => setConfirmRevogar(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[18px] font-normal">
              <XCircle className="w-5 h-5 text-red-500" />
              Revogar Link
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              O link para{" "}
              <strong>{confirmRevogar && TIPO_LABEL[confirmRevogar.tipo_solicitado]?.label}</strong>
              {confirmRevogar?.titulo_pagina && ` (${confirmRevogar.titulo_pagina})`} será
              desativado imediatamente. Quem tentar acessá-lo verá uma mensagem de link inválido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRevogar(null)} disabled={revogando}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevogar}
              disabled={revogando}
            >
              {revogando ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Revogar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


