// ============================================================
// OnboardingWizard — Wizard de 5 passos para novos tenants
// Sistema WG Easy · buildtech.wgalmeida.com.br
// Refatorado por Liz, Arquiteta de Soluções
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2, Users, CreditCard, CheckCircle2, ChevronRight, ChevronLeft,
  Sparkles, User, QrCode, Receipt, Zap, Star, AlertTriangle,
} from "lucide-react";

// (Omitindo tipos e componentes de UI que nÍo mudaram para brevidade)
// ...

// ============================================================
// WIZARD PRINCIPAL
// ============================================================
export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ tenant_id?: string } | null>(null);
  const [searchParams] = useSearchParams();
  const produtoSlug = searchParams.get("produto");

  // Busca dinâmica dos dados do produto a partir do slug na URL
  const { data: saasProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["saas_product_by_slug", produtoSlug],
    queryFn: async () => {
      if (!produtoSlug) return null;
      const { data, error } = await supabase
        .from("saas_produtos")
        .select("id, nome")
        .eq("slug", produtoSlug)
        .single();
      if (error) throw new Error("Produto SaaS nÍo encontrado.");
      return data;
    },
    enabled: !!produtoSlug,
  });

  const [empresa, setEmpresa] = useState<DadosEmpresa>({
    nome: "", cnpj: "", email_admin: "", telefone: "",
    cidade: "", estado: "", site: "", segmento: "",
  });
  const [admin, setAdmin] = useState<DadosAdmin>({
    nome: "", cargo: "", senha: "", confirmar_senha: "",
  });
  const [equipe, setEquipe] = useState<DadosConvites>({ emails: [], novo_email: "" });
  const [billing, setBilling] = useState<DadosBilling>({
    plano_slug: "pro", billing_type: "PIX", cpf_cnpj: "",
  });

  function podeAvancar(): boolean {
    if (!produtoSlug || !saasProduct) return false; // Bloqueia se nÍo houver produto
    if (step === 1) return !!empresa.nome && !!empresa.email_admin && !!empresa.segmento;
    if (step === 2) return !!admin.nome && admin.senha.length >= 12 && admin.senha === admin.confirmar_senha;
    if (step === 3) return true;
    if (step === 4) return !!billing.plano_slug;
    return true;
  }

  async function handleAvancar() {
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (step === 4) {
      if (!saasProduct) {
        setErro("Produto SaaS inválido. NÍo é possível continuar.");
        return;
      }

      setLoading(true);
      setErro(null);
      
      try {
        // 1. Criar usuário de autenticaçÍo com a flag de onboarding
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: empresa.email_admin,
          password: admin.senha,
          options: {
            data: {
              full_name: admin.nome,
              is_onboarding: true, // Flag para o "janitor"
            },
          },
        });

        if (signUpError) throw new Error(signUpError.message);
        if (!signUpData.user) throw new Error("NÍo foi possível criar o usuário de autenticaçÍo.");

        // 2. Chamar a RPC para provisionar o restante (tenant, pessoas, contrato)
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "finish_tenant_provisioning",
          {
            p_user_id: signUpData.user.id,
            p_empresa_nome: empresa.nome,
            p_empresa_cnpj: empresa.cnpj,
            p_admin_nome: admin.nome,
            p_admin_email: empresa.email_admin,
            p_saas_produto_id: saasProduct.id,
            p_plano_slug: billing.plano_slug,
          }
        );

        if (rpcError) throw new Error(rpcError.message);
        if (!rpcData.success) throw new Error(rpcData.error || "Erro desconhecido durante o provisionamento.");
        
        setResultado({ tenant_id: rpcData.tenant_id });
        setStep(5);

      } catch (err) {
        // Se qualquer etapa falhar, o usuário órfÍo será limpo pelo "janitor"
        setErro(err instanceof Error ? err.message : "Ocorreu um erro inesperado. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
  }

  // RenderizaçÍo principal do Wizard
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-black text-gray-900">WG Easy</span>
          </div>
          <p className="text-xs text-gray-400">
            {isLoadingProduct ? "Carregando produto..." : `Iniciando setup para ${saasProduct?.nome || "produto inválido"}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
          {!produtoSlug || !saasProduct ? (
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Produto nÍo especificado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Para iniciar o cadastro, acesse este link a partir de uma de nossas páginas de produto.
              </p>
            </div>
          ) : (
            <>
              <ProgressBar step={step} />
              {/* RenderizaçÍo dos Passos (Steps) */}
              {step === 1 && <PassoEmpresa dados={empresa} onChange={setEmpresa} />}
              {step === 2 && <PassoAdmin dados={admin} onChange={setAdmin} />}
              {step === 3 && <PassoEquipe dados={equipe} onChange={setEquipe} />}
              {step === 4 && <PassoBilling dados={billing} onChange={setBilling} />}
              {step === 5 && <PassoConclusao empresa={empresa.nome} emails={equipe.emails} resultado={resultado} />}
              
              {erro && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {erro}
                </div>
              )}

              {step < 5 && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => setStep(step - 1)} disabled={step === 1} className="...">Voltar</button>
                  <span className="text-xs text-gray-400">Passo {step} de {STEPS.length - 1}</span>
                  <button onClick={handleAvancar} disabled={!podeAvancar() || loading} className="...">
                    {loading ? "Processando..." : (step === 4 ? "Finalizar e ativar trial" : "Próximo")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Já tem conta? <a href="/login" className="text-orange-500 hover:underline">Fazer login</a>
        </p>
      </div>
    </div>
  );
}

// (Omitindo novamente os componentes de passo para brevidade)
// ...

