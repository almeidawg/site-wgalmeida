import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Settings, Shield, Zap, Clock, Check, AlertCircle, ArrowLeft, Loader2, HardDrive, CheckCircle2, Link, Package, Send, Copy, MessageCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type CloudDriveProvider = "supabase" | "google" | "onedrive" | "dropbox";

const CLOUD_PROVIDERS: { value: CloudDriveProvider; label: string; logo: string }[] = [
  { value: "supabase", label: "Supabase Storage (padrão)", logo: "🗄️" },
  { value: "google", label: "Google Drive", logo: "📂" },
  { value: "onedrive", label: "OneDrive", logo: "☁️" },
  { value: "dropbox", label: "Dropbox", logo: "📦" },
];

export default function SaaSTenantConfigPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cloudProvider, setCloudProvider] = useState<CloudDriveProvider>("supabase");
  const [modulosSelecionados, setModulosSelecionados] = useState<Set<string>>(new Set());

  // 1. Busca dados do Tenant
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ["saas-tenant", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_tenants")
        .select("*, saas_produtos(nome)")
        .eq("id", tenantId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // 2. Busca todos os módulos e o status deles para este tenant
  const { data: modulos, isLoading: loadingModulos } = useQuery({
    queryKey: ["saas-tenant-modulos", tenantId],
    queryFn: async () => {
      // Busca todos os módulos do sistema
      const { data: todos } = await supabase.from("sistema_modulos").select("*").eq("ativo", true);
      // Busca o que o tenant já tem configurado
      const { data: ativos } = await supabase.from("saas_tenant_modulos").select("*").eq("tenant_id", tenantId);
      
      return todos?.map(m => ({
        ...m,
        config: ativos?.find(a => a.modulo_id === m.id) || null
      }));
    }
  });

  // 3. Busca todos os módulos do catálogo SaaS (Builder)
  const { data: catalogoModulos, isLoading: loadingCatalogo } = useQuery({
    queryKey: ["saas-catalogo-modulos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_modulos_catalogo")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    }
  });

  // 4. Busca módulos do produto do tenant (para pré-selecionar checkboxes)
  const { data: produtoModulos } = useQuery({
    queryKey: ["saas-produto-modulos", tenant?.produto_id],
    enabled: !!tenant?.produto_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_produtos_modulos")
        .select("modulo_id")
        .eq("produto_id", tenant!.produto_id);
      if (error) throw error;
      return data ?? [];
    }
  });

  // Inicializa checkboxes quando os dados do produto chegarem
  useEffect(() => {
    if (produtoModulos) {
      setModulosSelecionados(new Set(produtoModulos.map((m: any) => m.modulo_id)));
    }
  }, [produtoModulos]);

  // 5. Mutação para salvar módulos do produto
  const salvarModulosProduto = useMutation({
    mutationFn: async (modulosIds: string[]) => {
      if (!tenant?.produto_id) throw new Error("Produto não encontrado");
      // Remove todos os módulos atuais do produto
      const { error: delError } = await supabase
        .from("saas_produtos_modulos")
        .delete()
        .eq("produto_id", tenant.produto_id);
      if (delError) throw delError;
      // Insere os selecionados
      if (modulosIds.length > 0) {
        const { error: insError } = await supabase
          .from("saas_produtos_modulos")
          .insert(modulosIds.map(id => ({ produto_id: tenant.produto_id, modulo_id: id })));
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-produto-modulos"] });
      toast({ title: "Módulos do produto atualizados!", variant: "success" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar módulos", description: err.message, variant: "destructive" });
    }
  });

  // 6. Mutação para ligar/desligar módulo (Base para o Up-sell automático)
  const toggleModulo = useMutation({
    mutationFn: async ({ moduloId, status, isTrial }: { moduloId: string, status: string, isTrial?: boolean }) => {
      const { error } = await supabase
        .from("saas_tenant_modulos")
        .upsert({
          tenant_id: tenantId,
          modulo_id: moduloId,
          status: status,
          data_expiracao_trial: isTrial ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
          atualizado_em: new Date().toISOString()
        }, { onConflict: "tenant_id,modulo_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenant-modulos"] });
      toast({ title: "Configuração atualizada", variant: "success" });
    }
  });

  if (loadingTenant || loadingModulos) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate("/admin-saas")} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm font-medium">
        <ArrowLeft size={16} /> Voltar ao Cérebro
      </button>

      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tenant?.nome_empresa}</h1>
          <p className="text-gray-500">Produto: <span className="text-orange-600 font-medium">{tenant?.saas_produtos?.nome}</span> • ID: {tenant?.id.slice(0,8)}</p>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">Ver Logs de Acesso</button>
           <button className="px-4 py-2 bg-[#050C18] text-white rounded-lg text-sm font-medium hover:bg-black shadow-lg shadow-black/10">Salvar Alterações</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Seção Enviar Acesso */}
        <section className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-orange-100 flex items-center gap-2">
            <Send className="text-orange-500" size={20} />
            <h2 className="font-bold text-gray-800">Enviar Link de Acesso ao Cliente</h2>
            <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${
              tenant?.status === "cortesia" ? "bg-purple-100 text-purple-700" :
              tenant?.status === "trial" ? "bg-blue-100 text-blue-700" :
              tenant?.status === "ativo" ? "bg-green-100 text-green-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              {tenant?.status === "cortesia" ? "Cortesia" :
               tenant?.status === "trial" ? "Trial 7d" :
               tenant?.status === "ativo" ? "Ativo" : tenant?.status}
            </span>
          </div>
          <div className="p-6">
            {(() => {
              const link = tenant?.dominio_personalizado || tenant?.dominio || window.location.origin;
              const linkCompleto = link.startsWith("http") ? link : `https://${link}`;
              const msgWpp = `Olá! Seu acesso ao WGEasy está pronto 🚀\n\nEmpresa: ${tenant?.nome_empresa}\nProduto: ${tenant?.saas_produtos?.nome}\nLink de acesso: ${linkCompleto}\n\nQualquer dúvida estou à disposição. 👍`;

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
                    <ExternalLink size={16} className="text-orange-500 shrink-0" />
                    <span className="text-sm font-mono text-gray-700 flex-1 truncate">{linkCompleto}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(linkCompleto);
                        toast({ title: "Link copiado!", description: linkCompleto, variant: "success" });
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Copy size={15} /> Copiar Link
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(msgWpp)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 rounded-xl text-sm font-bold text-white hover:bg-green-600 transition"
                    >
                      <MessageCircle size={15} /> Enviar WhatsApp
                    </a>

                    <a
                      href={linkCompleto}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#050C18] rounded-xl text-sm font-bold text-white hover:bg-black transition"
                    >
                      <ExternalLink size={15} /> Abrir Portal
                    </a>
                  </div>

                  <p className="text-xs text-gray-400">
                    O link acima é o domínio configurado para este tenant. Para personalizar, atualize o domínio na lista de tenants.
                  </p>
                </div>
              );
            })()}
          </div>
        </section>

        {/* Seção Cloud Drive */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <HardDrive className="text-orange-500" size={20} />
            <h2 className="font-bold text-gray-800">Integração de Arquivos (Cloud Drive)</h2>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-500 mb-5">
              Escolha onde os arquivos deste tenant serão armazenados. O Supabase Storage é o padrão e não exige configuração adicional.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {CLOUD_PROVIDERS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setCloudProvider(p.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    cloudProvider === p.value
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-500"
                  }`}>
                  <span className="text-2xl">{p.logo}</span>
                  <span className="text-xs text-center leading-tight">{p.label}</span>
                  {cloudProvider === p.value && (
                    <CheckCircle2 size={14} className="text-orange-500" />
                  )}
                </button>
              ))}
            </div>

            {cloudProvider === "supabase" && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl text-sm text-green-700 border border-green-100">
                <CheckCircle2 size={16} className="shrink-0" />
                Supabase Storage ativo — pasta isolada em <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">wg-tenants/{tenantId}/</code>
              </div>
            )}

            {(cloudProvider === "google" || cloudProvider === "onedrive" || cloudProvider === "dropbox") && (
              <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 font-medium">
                  {cloudProvider === "google" && "Conecte uma conta Google Drive para armazenar os arquivos deste tenant."}
                  {cloudProvider === "onedrive" && "Conecte uma conta Microsoft OneDrive para armazenar os arquivos deste tenant."}
                  {cloudProvider === "dropbox" && "Conecte uma conta Dropbox para armazenar os arquivos deste tenant."}
                </p>
                <button
                  className="flex items-center gap-2 self-start px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                  onClick={() => toast({ title: "Em breve!", description: "OAuth flow será implementado na próxima sprint." })}>
                  <Link size={14} /> Conectar {CLOUD_PROVIDERS.find(p => p.value === cloudProvider)?.label}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
            <Shield className="text-orange-500" size={20} />
            <h2 className="font-bold text-gray-800">Chaves Seletoras de Módulos (Up-sell & Planos)</h2>
          </div>
          
          <div className="divide-y divide-gray-50">
            {modulos?.map((m) => (
              <div key={m.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.config?.status === "ativo" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{m.nome}</h3>
                    <p className="text-xs text-gray-500">Código: {m.codigo} • Path: {m.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status Badge */}
                  {m.config?.status === "trial" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                      <Clock size={12} /> Trial Ativo
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => toggleModulo.mutate({ moduloId: m.id, status: "ativo" })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${m.config?.status === "ativo" ? "bg-white text-green-600 shadow-sm" : "text-gray-400"}`}>
                      ATIVO
                    </button>
                    <button 
                      onClick={() => toggleModulo.mutate({ moduloId: m.id, status: "trial", isTrial: true })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${m.config?.status === "trial" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"}`}>
                      TRIAL 7D
                    </button>
                    <button 
                      onClick={() => toggleModulo.mutate({ moduloId: m.id, status: "bloqueado" })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${m.config?.status === "bloqueado" || !m.config ? "bg-white text-red-600 shadow-sm" : "text-gray-400"}`}>
                      OFF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Seção: Módulos do Catálogo SaaS (Builder) */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="text-orange-500" size={20} />
              <div>
                <h2 className="font-bold text-gray-800">Módulos do Produto (Builder SaaS)</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Módulos incluídos no produto <span className="font-semibold text-orange-600">{tenant?.saas_produtos?.nome}</span>. Afeta todos os tenants deste produto.
                </p>
              </div>
            </div>
            <button
              onClick={() => salvarModulosProduto.mutate(Array.from(modulosSelecionados))}
              disabled={salvarModulosProduto.isPending || loadingCatalogo}
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all disabled:opacity-50 shadow-sm"
            >
              {salvarModulosProduto.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Salvar Módulos
            </button>
          </div>

          {loadingCatalogo ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-orange-400" size={24} /></div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalogoModulos?.map((modulo: any) => {
                const checked = modulosSelecionados.has(modulo.id);
                return (
                  <label
                    key={modulo.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      checked
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setModulosSelecionados(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(modulo.id);
                          else next.delete(modulo.id);
                          return next;
                        });
                      }}
                      className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${checked ? "text-orange-700" : "text-gray-700"}`}>
                        {modulo.nome}
                      </p>
                      {modulo.descricao && (
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{modulo.descricao}</p>
                      )}
                      <span className="text-[10px] font-mono text-gray-300 mt-1 block">{modulo.slug}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="px-6 pb-5 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {modulosSelecionados.size} de {catalogoModulos?.length ?? 0} módulos selecionados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setModulosSelecionados(new Set(catalogoModulos?.map((m: any) => m.id) ?? []))}
                className="text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                Selecionar todos
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setModulosSelecionados(new Set())}
                className="text-xs text-gray-500 hover:text-gray-800 underline transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}