/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/publico/SolicitarPropostaPage.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import IntroVideoWGAlmeida from "@/components/cadastro-publico/IntroVideoWGAlmeida";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  Building2,
  FileText,
  Ruler,
  Paintbrush,
  Hammer,
  Grid3X3,
  Package,
  ClipboardCheck,
  User,
  Instagram,
  Globe,
  CheckCircle2,
  X,
  MapPin,
  Loader2
} from "lucide-react";

// Tipos de serviços disponíveis
const SERVICOS = [
  { id: "marcenaria", label: "Marcenaria", icon: Grid3X3 },
  { id: "vidracaria", label: "Vidraçaria, box e espelhos", icon: Package },
  { id: "marmoraria", label: "Marmoraria", icon: Ruler },
  { id: "marcenaria_alto_padrao", label: "Marcenaria de alto padrÍo", icon: Paintbrush },
  { id: "gestao_obra", label: "GestÍo de obra", icon: ClipboardCheck },
  { id: "gestao_materiais", label: "GestÍo de materiais", icon: Hammer },
];

export default function SolicitarPropostaPage() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref"); // Código do especificador/colaborador

  // Estado para controlar exibiçÍo da intro
  const skipIntro = searchParams.get("skip") === "1";
  const [showIntro, setShowIntro] = useState(!skipIntro);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const { toast } = useToast();

  // Campos do formulário
  const [empreendimento, setEmpreendimento] = useState("");
  const [metragem, setMetragem] = useState("");
  const [temPlanta, setTemPlanta] = useState<boolean | null>(null);
  const [arquivoPlanta, setArquivoPlanta] = useState<File | null>(null);
  const [temProjetoArq, setTemProjetoArq] = useState<boolean | null>(null);
  const [reformaTudo, setReformaTudo] = useState<boolean | null>(null);
  const [ambientesReforma, setAmbientesReforma] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);

  // Dados de contato
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [comoConheceu, setComoConheceu] = useState("");

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobile(isMobileWidth || isPortrait);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  const videoSrc = isMobile
    ? "/videos/hero/VERTICAL.mp4"
    : "/videos/hero/HORIZONTAL.mp4";

  const totalSteps = 8;

  const toggleServico = (id: string) => {
    setServicosSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  // FormataçÍo de telefone (aceita internacionais)
  const formatarTelefone = (valor: string) => {
    // Se começar com +, é internacional - preservar formato
    if (valor.startsWith("+")) {
      return valor.replace(/[^\d\s+()-]/g, "");
    }

    const numeros = valor.replace(/\D/g, "");

    // Se tiver mais de 11 dígitos, provavelmente é internacional
    if (numeros.length > 11) {
      return "+" + numeros;
    }

    // Formato brasileiro
    if (numeros.length <= 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  // FormataçÍo de CEP
  const formatarCep = (valor: string) => {
    const numeros = valor.replace(/\D/g, "");
    return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  // Buscar CEP automaticamente (ViaCEP)
  const buscarCep = async (cepValue: string) => {
    const cepLimpo = cepValue.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setEndereco(data.logradouro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  };

  // Handler de mudança do CEP
  const handleCepChange = (valor: string) => {
    const formatted = formatarCep(valor);
    setCep(formatted);

    // Buscar CEP automaticamente quando completo
    const numeros = valor.replace(/\D/g, "");
    if (numeros.length === 8) {
      buscarCep(numeros);
    }
  };

  const proximoStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const stepAnterior = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoPlanta(file);
    }
  };

  const enviarSolicitacao = async () => {
    setLoading(true);

    try {
      // 1. Upload do arquivo da planta se existir
      let plantaUrl = null;
      if (arquivoPlanta) {
        const fileExt = arquivoPlanta.name.split(".").pop();
        const fileName = `proposta_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(`plantas/${fileName}`, arquivoPlanta);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from("documentos")
            .getPublicUrl(`plantas/${fileName}`);
          plantaUrl = urlData.publicUrl;
        }
      }

      // 2. Buscar especificador pelo código ref se existir
      let especificadorId = null;
      let especificadorNome = null;
      if (refCode) {
        // O código pode ser ESP###, COL###, PAR###, VEN###
        const tipoRef = refCode.substring(0, 3).toUpperCase();
        const codigoRef = refCode;

        // Buscar na tabela de pessoas pelo código de referência
        const { data: especData } = await supabase
          .from("pessoas")
          .select("id, nome")
          .eq("codigo_referencia", codigoRef)
          .single();

        if (especData) {
          especificadorId = especData.id;
          especificadorNome = especData.nome;
        }
      }

      // 3. Criar a solicitaçÍo de proposta (opcional - tabela pode nÍo existir)
      let solicitacaoId: string | null = null;
      try {
        const { data: solicitacao, error: solError } = await supabase
          .from("solicitacoes_proposta")
          .insert({
            empreendimento,
            metragem: metragem ? parseFloat(metragem) : null,
            tem_planta: temPlanta,
            planta_url: plantaUrl,
            tem_projeto_arquitetonico: temProjetoArq,
            reforma_todos_ambientes: reformaTudo,
            ambientes_reforma: reformaTudo === false ? ambientesReforma : null,
            servicos_selecionados: servicosSelecionados,
            nome,
            email,
            telefone,
            cep,
            endereco,
            cidade,
            estado,
            como_conheceu: comoConheceu,
            codigo_referencia: refCode,
            especificador_id: especificadorId,
            especificador_nome: especificadorNome,
            status: "novo"
          })
          .select()
          .single();

        if (solError) {
          console.warn("Tabela solicitacoes_proposta nÍo disponível:", solError.message);
        } else {
          solicitacaoId = solicitacao?.id;
        }
      } catch (e) {
        console.warn("Erro ao salvar solicitaçÍo (ignorado):", e);
      }

      // 4. Montar descriçÍo completa para a oportunidade
      const servicosLabels = servicosSelecionados.map(s =>
        SERVICOS.find(x => x.id === s)?.label || s
      ).join(", ");

      const descricaoCompleta = `📋 SOLICITAÇÍO DE PROPOSTA VIA SITE

👤 CLIENTE
Nome: ${nome}
Email: ${email}
Telefone: ${telefone}
${cep ? `CEP: ${cep}` : ""}
${endereco ? `Endereço: ${endereco}` : ""}
${cidade ? `Cidade: ${cidade}/${estado}` : ""}

🏢 EMPREENDIMENTO
Nome: ${empreendimento || "NÍo informado"}
Metragem: ${metragem ? `${metragem}m²` : "NÍo informado"}

📄 DOCUMENTAÇÍO
Possui planta: ${temPlanta === true ? "Sim" : temPlanta === false ? "NÍo (WG fará levantamento)" : "NÍo informado"}
Possui projeto arquitetônico: ${temProjetoArq === true ? "Sim" : temProjetoArq === false ? "NÍo (WG pode fazer)" : "NÍo informado"}
${plantaUrl ? `Arquivo anexado: ${plantaUrl}` : ""}

🔧 ESCOPO
Reforma todos ambientes: ${reformaTudo === true ? "Sim" : reformaTudo === false ? `NÍo - ${ambientesReforma}` : "NÍo informado"}
Serviços solicitados: ${servicosLabels || "Nenhum selecionado"}

📌 ORIGEM
Como conheceu: ${comoConheceu || "NÍo informado"}
${refCode ? `IndicaçÍo: ${especificadorNome || refCode}` : "Acesso direto pelo site"}`;

      // 5. Usar funçÍo RPC (SECURITY DEFINER) para criar cliente e oportunidade
      // Isso permite que usuários anônimos insiram dados, contornando RLS
      const { data: resultado, error: rpcError } = await supabase.rpc('solicitar_proposta_publica', {
        p_nome: nome,
        p_email: email,
        p_telefone: telefone,
        p_cidade: cidade || null,
        p_estado: estado || null,
        p_empreendimento: empreendimento || null,
        p_descricao: descricaoCompleta,
        p_origem: refCode ? `IndicaçÍo: ${especificadorNome || refCode}` : "Site - Solicite Proposta",
        p_especificador_id: especificadorId || null,
        p_especificador_nome: especificadorNome || null
      });

      if (rpcError) {
        console.error("Erro na funçÍo RPC:", rpcError);

        // Fallback: tentar inserçÍo direta (caso RPC nÍo exista)
        if (rpcError.message?.includes("function") || rpcError.code === "42883") {
          if (import.meta.env.DEV) console.log("⚠️ FunçÍo RPC nÍo encontrada, tentando inserçÍo direta...");

          // InserçÍo direta como fallback
          let clienteId: string | null = null;

          // Buscar cliente existente
          const { data: clienteExistente } = await supabase
            .from("pessoas")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (clienteExistente) {
            clienteId = clienteExistente.id;
            if (import.meta.env.DEV) console.log("✅ Cliente já existente:", clienteId);
          } else {
            // Criar novo cliente
            const { data: pessoa, error: pessoaError } = await supabase
              .from("pessoas")
              .insert({
                nome,
                email,
                telefone,
                tipo: "CLIENTE",
                ativo: true,
                indicado_por_id: especificadorId
              })
              .select()
              .single();

            if (pessoa) {
              clienteId = pessoa.id;
              if (import.meta.env.DEV) console.log("✅ Novo cliente criado:", clienteId);
            } else if (pessoaError) {
              console.warn("Erro ao criar pessoa (fallback):", pessoaError.message);
            }
          }

          if (clienteId) {
            // Criar oportunidade
            const { data: op, error: opError } = await supabase
              .from("oportunidades")
              .insert({
                titulo: `Proposta: ${empreendimento || nome}`,
                cliente_id: clienteId,
                descricao: descricaoCompleta,
                estagio: "Lead",
                status: "novo",
                origem: refCode ? `IndicaçÍo: ${especificadorNome || refCode}` : "Site - Solicite Proposta",
                observacoes: `📞 Contato: ${telefone}\n📧 Email: ${email}\n📍 ${cidade}/${estado}`,
                especificador_id: especificadorId,
                indicado_por_id: especificadorId,
                vendedor_id: especificadorId
              })
              .select()
              .single();

            if (op) {
              if (import.meta.env.DEV) console.log("✅ Oportunidade criada (fallback):", op.id);
            } else if (opError) {
              console.error("Erro ao criar oportunidade (fallback):", opError.message);
            }
          }
        } else {
          // Erro diferente de funçÍo nÍo encontrada
          throw new Error(rpcError.message || "Erro ao processar solicitaçÍo");
        }
      } else if (resultado) {
        // RPC executou com sucesso
        if (resultado.sucesso) {
          if (import.meta.env.DEV) console.log("✅ Cliente criado via RPC:", resultado.cliente_id);
          if (import.meta.env.DEV) console.log("✅ Oportunidade criada via RPC:", resultado.oportunidade_id);
          if (especificadorId) {
            if (import.meta.env.DEV) console.log("✅ Especificador vinculado para comissÍo:", especificadorId, "-", especificadorNome);
          }
        } else {
          console.error("❌ Erro retornado pela RPC:", resultado.erro);
          throw new Error(resultado.erro || "Erro ao criar solicitaçÍo");
        }
      }

      toast({
        title: "SolicitaçÍo enviada!",
        description: "Nossa equipe entrará em contato em breve.",
      });

      setEnviado(true);
    } catch (error: any) {
      console.error("Erro ao enviar solicitaçÍo:", error);
      console.error("Detalhes do erro:", JSON.stringify(error, null, 2));

      // Mostrar mensagem mais específica
      const mensagemErro = error?.message || error?.details || "Erro desconhecido";
      toast({
        title: "Erro ao enviar",
        description: mensagemErro,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Intro de apresentaçÍo do Grupo WG Almeida
  if (showIntro) {
    return (
      <IntroVideoWGAlmeida
        onComplete={() => setShowIntro(false)}
        duration={15}
      />
    );
  }

  // Tela final de sucesso
  if (enviado) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* Vídeo de fundo */}
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
          <video
            key={videoSrc}
            className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Conteúdo de sucesso */}
        <div className="relative z-10 max-w-lg mx-auto px-6 text-center">
          <div className="bg-white/85 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-normal text-gray-900 mb-4">
              Solicitacao enviada com sucesso
            </h1>

            <p className="text-[16px] text-gray-600 mb-8">
              Obrigado por confiar na <strong>WG Almeida</strong>.<br />
              Em breve, nossa equipe entrará em contato com você.
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Enquanto isso, conheca mais do nosso trabalho:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://www.wgalmeida.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-[#D94E1F] transition-colors"
              >
                <Globe className="w-5 h-5" />
                Visitar o site
              </a>

              <a
                href="https://www.instagram.com/grupowgalmeida/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                @grupowgalmeida
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center py-8">
      {/* Vídeo de fundo */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <video
          key={videoSrc}
          className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Container do formulário */}
      <div className="relative z-10 w-full max-w-xl mx-auto px-4">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Logo WG */}
          <div className="pt-6 pb-2 text-center">
            <img
              src="/logo-wg.png"
              alt="WG Almeida"
              className="h-12 mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          <div className="p-6 md:p-8">

            {/* TELA 1 - Chamada Principal */}
            {step === 1 && (
              <div className="text-center space-y-6">
                <h1 className="text-2xl font-normal text-gray-900">
                  Solicite sua proposta personalizada
                </h1>
                <p className="text-[16px] text-gray-600">
                  Conte-nos o básico sobre o seu projeto.<br />
                  Nós cuidamos do planejamento, da documentaçÍo e da execuçÍo — do jeito certo.
                </p>
                {refCode && (
                  <p className="text-sm text-[#F25C26] font-medium">
                    IndicaçÍo: {refCode}
                  </p>
                )}
                <button
                  onClick={proximoStep}
                  className="w-full py-4 bg-primary text-white rounded-xl font-normal text-lg hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Comecar agora
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* TELA 2 - Sobre o Imóvel */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Building2 className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Sobre o Imovel</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Empreendimento
                  </label>
                  <input
                    type="text"
                    value={empreendimento}
                    onChange={(e) => setEmpreendimento(e.target.value)}
                    placeholder="Ex: Apartamento Brooklin, Casa Alphaville..."
                    className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metragem aproximada (m2)
                  </label>
                  <input
                    type="number"
                    value={metragem}
                    onChange={(e) => setMetragem(e.target.value)}
                    placeholder="Ex: 45, 78, 120..."
                    className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 3 - Planta ou Projeto */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <FileText className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Planta ou Projeto</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Voce possui a planta ou o projeto do imovel?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTemPlanta(true)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      temPlanta === true
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Check className={`w-6 h-6 mx-auto mb-2 ${temPlanta === true ? "text-[#F25C26]" : "text-gray-400"}`} />
                    <span className="text-lg font-medium">Sim</span>
                  </button>
                  <button
                    onClick={() => setTemPlanta(false)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      temPlanta === false
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <X className={`w-6 h-6 mx-auto mb-2 ${temPlanta === false ? "text-[#F25C26]" : "text-gray-400"}`} />
                    <span className="text-lg font-medium">Nao</span>
                  </button>
                </div>

                {temPlanta === true && (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.dwg"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="planta-upload"
                    />
                    <label
                      htmlFor="planta-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      {arquivoPlanta ? (
                        <span className="text-[#F25C26] font-medium">{arquivoPlanta.name}</span>
                      ) : (
                        <>
                          <span className="text-gray-600 font-medium">Clique para anexar</span>
                          <span className="text-xs text-gray-400">PDF, JPG ou DWG</span>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {temPlanta === false && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-[16px] text-green-800">
                      <strong>Sem problemas.</strong><br />
                      Nossa equipe tecnica faz o levantamento, cuida da documentacao necessaria e orienta todo o processo para liberacao da obra.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    disabled={temPlanta === null}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 4 - Projeto Arquitetonico */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Paintbrush className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Projeto Arquitetonico</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Voce ja possui projeto arquitetonico?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setTemProjetoArq(true)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      temProjetoArq === true
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Check className={`w-6 h-6 mx-auto mb-2 ${temProjetoArq === true ? "text-[#F25C26]" : "text-gray-400"}`} />
                    <span className="text-lg font-medium">Sim</span>
                  </button>
                  <button
                    onClick={() => setTemProjetoArq(false)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      temProjetoArq === false
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <X className={`w-6 h-6 mx-auto mb-2 ${temProjetoArq === false ? "text-[#F25C26]" : "text-gray-400"}`} />
                    <span className="text-lg font-medium">Nao</span>
                  </button>
                </div>

                {temProjetoArq === false && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-[16px] text-blue-800">
                      <strong>Perfeito.</strong><br />
                      A WG cuida do projeto arquitetonico, compatibilizacoes tecnicas e de toda a documentacao necessaria para sua obra acontecer com seguranca.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    disabled={temProjetoArq === null}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 5 - Escopo da Reforma */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Hammer className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Escopo da Reforma</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Voce pretende reformar todos os ambientes?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setReformaTudo(true)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reformaTudo === true
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Check className={`w-6 h-6 mx-auto mb-2 ${reformaTudo === true ? "text-[#F25C26]" : "text-gray-400"}`} />
                    <span className="text-lg font-medium">Sim</span>
                  </button>
                  <button
                    onClick={() => setReformaTudo(false)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reformaTudo === false
                        ? "border-[#F25C26] bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg font-medium">Apenas alguns</span>
                  </button>
                </div>

                {reformaTudo === false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descreva quais ambientes deseja reformar:
                    </label>
                    <textarea
                      value={ambientesReforma}
                      onChange={(e) => setAmbientesReforma(e.target.value)}
                      placeholder="Ex: cozinha e banheiros, area social, suite principal..."
                      rows={3}
                      className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent transition-all resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    disabled={reformaTudo === null}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 6 - Servicos */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <ClipboardCheck className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Servicos</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Podemos considerar na sua proposta os seguintes servicos:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {SERVICOS.map((servico) => {
                    const Icon = servico.icon;
                    const selecionado = servicosSelecionados.includes(servico.id);
                    return (
                      <button
                        key={servico.id}
                        onClick={() => toggleServico(servico.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          selecionado
                            ? "border-[#F25C26] bg-orange-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selecionado ? "bg-primary border-[#F25C26]" : "border-gray-300"
                          }`}>
                            {selecionado && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <Icon className={`w-5 h-5 ${selecionado ? "text-[#F25C26]" : "text-gray-400"}`} />
                        </div>
                        <span className={`block mt-2 text-sm font-medium ${selecionado ? "text-gray-900" : "text-gray-600"}`}>
                          {servico.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 7 - Dados de Contato */}
            {step === 7 && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <User className="w-12 h-12 text-[#F25C26] mx-auto mb-3" />
                  <h2 className="text-[20px] font-normal text-gray-900">Estamos quase la</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Preencha seus dados para que nossa equipe tecnica prepare sua proposta personalizada.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/WhatsApp *</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    placeholder="(11) 99999-9999 ou +1 555 123-4567"
                    maxLength={20}
                    className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                    {buscandoCep && <span className="ml-2 text-[#F25C26] text-xs">(Buscando...)</span>}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      inputMode="numeric"
                      className="w-full p-3 pl-10 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                    />
                    {buscandoCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#F25C26]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    CEP preenche endereco automaticamente
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, numero, complemento"
                    className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                    >
                      <option value="">UF</option>
                      <option value="SP">SP</option>
                      <option value="RJ">RJ</option>
                      <option value="MG">MG</option>
                      <option value="PR">PR</option>
                      <option value="SC">SC</option>
                      <option value="RS">RS</option>
                      <option value="BA">BA</option>
                      <option value="DF">DF</option>
                      <option value="GO">GO</option>
                      <option value="ES">ES</option>
                      <option value="PE">PE</option>
                      <option value="CE">CE</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Como conheceu a WG?</label>
                  <select
                    value={comoConheceu}
                    onChange={(e) => setComoConheceu(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    <option value="instagram">Instagram</option>
                    <option value="google">Google</option>
                    <option value="indicacao">IndicaçÍo</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="evento">Evento/Feira</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Voltar
                  </button>
                  <button
                    onClick={proximoStep}
                    disabled={!nome || !email || !telefone}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-lg font-medium hover:bg-[#D94E1F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* TELA 8 - Confirmacao */}
            {step === 8 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-[#F25C26]" />
                  </div>
                  <h2 className="text-[20px] font-normal text-gray-900">
                    Receba sua proposta em ate 48 horas
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Nossa equipe analisara suas informacoes com criterio tecnico, planejamento financeiro e padrao WG de entrega.
                  </p>
                </div>

                {/* Resumo */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Empreendimento:</span>
                    <span className="font-medium">{empreendimento || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Metragem:</span>
                    <span className="font-medium">{metragem ? `${metragem}m²` : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serviços:</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {servicosSelecionados.length > 0
                        ? servicosSelecionados.map(s => SERVICOS.find(x => x.id === s)?.label).join(", ")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contato:</span>
                    <span className="font-medium">{nome}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={stepAnterior}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-lg font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Revisar
                  </button>
                  <button
                    onClick={enviarSolicitacao}
                    disabled={loading}
                    className="flex-1 py-4 bg-primary text-white rounded-xl text-lg font-normal hover:bg-[#D94E1F] active:bg-[#D94E1F] disabled:bg-primary disabled:hover:bg-primary disabled:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F25C26]"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Enviar solicitaçÍo
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Rodapé discreto */}
        <div className="text-center mt-4">
          <p className="text-white/60 text-xs">
            WG Almeida Engenharia e Construções
          </p>
        </div>
      </div>
    </div>
  );
}

