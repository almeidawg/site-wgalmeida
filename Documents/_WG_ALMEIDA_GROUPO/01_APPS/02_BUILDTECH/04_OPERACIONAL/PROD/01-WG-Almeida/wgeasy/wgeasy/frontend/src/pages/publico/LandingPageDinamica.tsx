import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, CheckCircle2, ArrowRight, X, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function LandingPageDinamica() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    empresa: ""
  });

  const { data: produto, isLoading } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_produtos")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("saas_leads_landing")
        .insert([{
          produto_id: produto.id,
          nome: formData.nome,
          email: formData.email,
          whatsapp: formData.whatsapp,
          empresa: formData.empresa,
          origem_url: window.location.href,
          ip_address: "captura_client_side" // Em prod usaremos RPC para pegar o IP real
        }]);

      if (error) throw error;

      toast({
        title: "SolicitaçÍo Enviada!",
        description: "Em instantes nossa consultoria entrará em contato via WhatsApp.",
        variant: "success"
      });
      
      setIsModalOpen(false);
      setFormData({ nome: "", email: "", whatsapp: "", empresa: "" });
    } catch (err) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050C18]">
        <Loader2 className="animate-spin text-[#F25C26]" size={48} />
      </div>
    );
  }

  if (!produto) return <div className="p-20 text-center text-gray-500 font-sans">Produto nÍo encontrado no ecossistema WG.</div>;

  const config = produto.config_landing_page;
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const primaryCtaUrl = config?.cta_primary_url || config?.hero_primary_url || "";
  const primaryCtaLabel = config?.cta_primary_label || "Começar teste de 7 dias";
  const secondaryCtaUrl = config?.cta_secondary_url || config?.hero_secondary_url || config?.video_url || "";
  const secondaryCtaLabel = config?.cta_secondary_label || "Ver Vídeo";
  const isExternal = (url: string) => /^https?:\/\//i.test(url) && baseOrigin && !url.startsWith(baseOrigin);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-orange-100">
      {/* HEADER */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold flex items-center gap-3">
           <div className="w-10 h-10 bg-[#050C18] rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/20">WG</div>
           <span className="tracking-tight text-gray-900">{produto.nome}</span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F25C26] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-200 active:scale-95">
          Agendar DemonstraçÍo
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="py-24 px-6 bg-[#050C18] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-gray-300 font-mono text-[10px] tracking-widest uppercase">Tecnologia WG BuildTech Ativa</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
            {config.hero_title || produto.nome}
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            {config.hero_subtitle || produto.descricao}
          </p>
          <div className="flex flex-col md:flex-row gap-5 justify-center">
            {primaryCtaUrl ? (
              <a
                href={primaryCtaUrl}
                target={isExternal(primaryCtaUrl) ? "_blank" : undefined}
                rel={isExternal(primaryCtaUrl) ? "noreferrer" : undefined}
                className="bg-[#F25C26] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-400/20 active:scale-95 inline-flex items-center justify-center"
              >
                {primaryCtaLabel}
              </a>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#F25C26] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-xl shadow-orange-400/20 active:scale-95"
              >
                {primaryCtaLabel}
              </button>
            )}
            {secondaryCtaUrl ? (
              <a
                href={secondaryCtaUrl}
                target={isExternal(secondaryCtaUrl) ? "_blank" : undefined}
                rel={isExternal(secondaryCtaUrl) ? "noreferrer" : undefined}
                className="border border-white/10 bg-white/5 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                {secondaryCtaLabel} <ArrowRight size={20} className="text-[#F25C26]" />
              </a>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="border border-white/10 bg-white/5 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                {secondaryCtaLabel} <ArrowRight size={20} className="text-[#F25C26]" />
              </button>
            )}
          </div>
        </div>
        
        {/* Gradients de Fundo Premium */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-orange-600/30 rounded-full blur-[140px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-blue-600/20 rounded-full blur-[140px]"></div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-32 max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {config.features_section?.title || "Potencialize sua operaçÍo"}
          </h2>
          <p className="text-gray-500 mt-5 text-lg max-w-2xl mx-auto font-light">
            {config.features_section?.subtitle || "Uma arquitetura robusta, segura e escalável desenvolvida pelo Grupo WG Almeida."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(config.features_section?.features || [
            { t: "GestÍo Inteligente", d: "Relatórios e Dashboards em tempo real com IA." },
            { t: "AutomaçÍo Total", d: "Processos financeiros e de vendas que rodam sozinhos." },
            { t: "Suporte Especializado", d: "Time técnico à disposiçÍo para sua escala." }
          ]).map((feat, i) => (
            <div key={i} className="group p-10 rounded-3xl border border-gray-100 bg-white hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-500">
              <div className="w-14 h-14 bg-gray-50 text-[#F25C26] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-orange-50 group-hover:scale-110 transition-all duration-500">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{feat.t}</h3>
              <p className="text-gray-500 leading-relaxed">{feat.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL DE CONVERSÍO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#050C18]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden relative z-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 sm:p-12">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
              
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Quase lá! 🚀</h3>
                <p className="text-gray-500">Preencha os dados abaixo para receber seu acesso ao <b>{produto.nome}</b>.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Seu Nome</label>
                  <input 
                    required
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    type="text" 
                    placeholder="Ex: William Almeida" 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail Corporativo</label>
                    <input 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      type="email" 
                      placeholder="seu@email.com" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">WhatsApp</label>
                    <input 
                      required
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                      type="tel" 
                      placeholder="(11) 99999-9999" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Nome da Empresa</label>
                  <input 
                    required
                    value={formData.empresa}
                    onChange={e => setFormData({...formData, empresa: e.target.value})}
                    type="text" 
                    placeholder="Sua Empresa LTDA" 
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full bg-[#050C18] text-white py-5 rounded-2xl font-bold text-lg hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Solicitar Acesso Agora</>}
                </button>

                <p className="text-[10px] text-center text-gray-400">
                  Ao clicar em solicitar, você concorda com nossos termos e política de privacidade.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

