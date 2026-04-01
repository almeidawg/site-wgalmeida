import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Zap, ShieldCheck, Clock, ArrowLeft, Loader2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useToast } from "@/components/ui/use-toast";

export default function UpsellPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moduloNome = searchParams.get("modulo") || "este módulo";
  const moduloCodigo = searchParams.get("codigo");

  // MutaçÍo para Ativar Trial
  const ativarTrial = useMutation({
    mutationFn: async () => {
      if (!tenant?.id || !moduloCodigo) return;

      // 1. Busca o ID do módulo pelo código
      const { data: modulo } = await supabase
        .from("sistema_modulos")
        .select("id")
        .eq("codigo", moduloCodigo)
        .single();

      if (!modulo) throw new Error("Módulo nÍo encontrado");

      // 2. Ativa o Trial na tabela saas_tenant_modulos
      const { error } = await supabase
        .from("saas_tenant_modulos")
        .upsert({
          tenant_id: tenant.id,
          modulo_id: modulo.id,
          status: "trial",
          data_expiracao_trial: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, { onConflict: "tenant_id,modulo_id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-tenant-modulos"] });
      toast({ title: "Módulo Liberado!", description: "Você tem 7 dias para testar todas as funcionalidades.", variant: "success" });
      navigate("/"); // Volta para o início para atualizar o menu
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-xl overflow-hidden border border-gray-100">
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-orange-100 text-[#F25C26] rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Zap size={40} fill="currentColor" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Potencialize seu {tenant?.nome_empresa}</h1>
          <p className="text-gray-500 text-lg mb-10">
            O módulo <b>{moduloNome}</b> nÍo está ativo no seu plano atual.
            Que tal testar gratuitamente e ver como ele pode acelerar seus resultados?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <FeatureCard icon={<ShieldCheck className="text-green-500" />} title="Acesso Total" sub="Sem restrições" />
            <FeatureCard icon={<Clock className="text-blue-500" />} title="7 Dias Grátis" sub="Teste sem compromisso" />
            <FeatureCard icon={<Zap className="text-orange-500" />} title="AtivaçÍo Instantânea" sub="Comece agora" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={20} /> Agora nÍo
            </button>
            <button
              onClick={() => ativarTrial.mutate()}
              disabled={ativarTrial.isPending}
              className="bg-[#050C18] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3">
              {ativarTrial.isPending ? <Loader2 className="animate-spin" /> : "Ativar 7 Dias Grátis" }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, sub }: any) {
  return (
    <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="mb-3">{icon}</div>
      <div className="font-bold text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}

