/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cadastro-publico/CadastroPublicoPage.tsx
// Página pública para preenchimento de cadastro via link
// Otimizada para celular com busca automática de CEP e CNPJ

import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import IntroVideoWGAlmeida from "@/components/cadastro-publico/IntroVideoWGAlmeida";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Search,
  Landmark,
  CreditCard,
  QrCode,
  Camera,
  Upload,
  X,
  Wrench,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  buscarCadastroPorToken,
  preencherCadastro,
  atualizarCadastroPorToken,
  CadastroPendente,
  getLabelTipoCadastro,
  DadosCadastroPublico,
} from "@/lib/cadastroLinkApi";
import { PhoneInputInternacional } from "@/components/ui/PhoneInputInternacional";

// Estados brasileiros
const ESTADOS = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "MaranhÍo" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "SÍo Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

// Cores da marca
const WG_COLORS = {
  laranja: "#F25C26",
  preto: "#2E2E2E",
  cinza: "#4C4C4C",
  cinzaClaro: "#F3F3F3",
  branco: "#FFFFFF",
  arquitetura: "#5E9B94",
  engenharia: "#2B4580",
};

type PageStatus = "loading" | "not_found" | "expired" | "already_filled" | "form" | "success" | "error";

export default function CadastroPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  // Estado para controlar exibiçÍo da intro (skip=1 na URL pula a intro)
  const skipIntro = searchParams.get("skip") === "1";
  const [showIntro, setShowIntro] = useState(!skipIntro);

  // Detectar orientaçÍo para vídeo responsivo
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const videoSrc = isMobile ? "/videos/hero/VERTICAL.mp4" : "/videos/hero/HORIZONTAL.mp4";

  const [status, setStatus] = useState<PageStatus>("loading");
  const [cadastro, setCadastro] = useState<CadastroPendente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Estados de busca
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  // Form data
  const [formData, setFormData] = useState<DadosCadastroPublico>({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    empresa: "",
    cargo: "",
    endereco: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    cep: "",
    observacoes: "",
    // Dados bancários
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
    pix: "",
  });

  // Estados para upload de mídia
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Estado para serviço solicitado
  const [servicoDescricao, setServicoDescricao] = useState("");

  // Refs para inputs de arquivo
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Verificar se o link requer mídia ou serviço
  const requerVideo = cadastro?.descricao_link?.includes("video") || cadastro?.descricao_link?.includes("vídeo");
  const requerFoto = cadastro?.descricao_link?.includes("foto") || cadastro?.descricao_link?.includes("mídia");
  const requerServico = cadastro?.descricao_link?.includes("servico") || cadastro?.descricao_link?.includes("serviço");

  // Handlers de upload de mídia
  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  }

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setFotos(prev => [...prev, ...files].slice(0, 5)); // Max 5 fotos
      setFotoPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  }

  function removerVideo() {
    setVideoFile(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
  }

  function removerFoto(index: number) {
    URL.revokeObjectURL(fotoPreviews[index]);
    setFotos(prev => prev.filter((_, i) => i !== index));
    setFotoPreviews(prev => prev.filter((_, i) => i !== index));
  }

  // Carregar dados do cadastro
  useEffect(() => {
    async function loadCadastro() {
      if (!token) {
        setStatus("not_found");
        return;
      }

      const data = await buscarCadastroPorToken(token);

      if (!data) {
        setStatus("not_found");
        return;
      }

      // Verificar se expirou
      if (new Date(data.expira_em) < new Date()) {
        setStatus("expired");
        return;
      }

      // Verificar se já foi preenchido
      // Links reutilizáveis sempre permitem novos cadastros (desde que não atinjam o limite)
      if (data.status !== "aguardando_preenchimento" && !data.reutilizavel) {
        setStatus("already_filled");
        return;
      }

      // Para links reutilizáveis, verificar se atingiu o limite de usos
      if (data.reutilizavel && data.uso_maximo && data.total_usos && data.total_usos >= data.uso_maximo) {
        setStatus("already_filled");
        return;
      }

      setCadastro(data);
      setFormData((prev) => ({
        ...prev,
        nome: data.nome || prev.nome || "",
        email: data.email || prev.email || "",
        telefone: data.telefone || prev.telefone || "",
        cpf_cnpj: data.cpf_cnpj || prev.cpf_cnpj || "",
        empresa: data.empresa || prev.empresa || "",
        cargo: data.cargo || prev.cargo || "",
        endereco: data.endereco || prev.endereco || "",
        numero: data.numero || prev.numero || "",
        complemento: data.complemento || prev.complemento || "",
        cidade: data.cidade || prev.cidade || "",
        estado: data.estado || prev.estado || "",
        cep: data.cep || prev.cep || "",
        observacoes: data.observacoes || prev.observacoes || "",
        banco: data.banco || prev.banco || "",
        agencia: data.agencia || prev.agencia || "",
        conta: data.conta || prev.conta || "",
        tipo_conta: data.tipo_conta || prev.tipo_conta || "",
        pix: data.pix || prev.pix || "",
      }));
      setStatus("form");
    }

    loadCadastro();
  }, [token]);

  // Formatar CPF/CNPJ
  function formatCpfCnpj(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }


  // Formatar CEP
  function formatCep(value: string): string {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{3})/, "$1-$2");
  }

  // Buscar CEP automaticamente (ViaCEP)
  async function buscarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setBuscandoCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  }

  // Buscar CNPJ automaticamente (BrasilAPI)
  async function buscarCnpj(cnpj: string) {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) return;

    setBuscandoCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      const data = await response.json();

      if (!data.message) {
        setFormData((prev) => ({
          ...prev,
          empresa: data.razao_social || data.nome_fantasia || prev.empresa,
          endereco: data.logradouro || prev.endereco,
          numero: data.numero || prev.numero,
          complemento: data.complemento || prev.complemento,
          cidade: data.municipio || prev.cidade,
          estado: data.uf || prev.estado,
          cep: data.cep ? formatCep(data.cep) : prev.cep,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
    } finally {
      setBuscandoCnpj(false);
    }
  }

  // Handler de mudança
  function handleChange(field: keyof DadosCadastroPublico, value: string) {
    let formattedValue = value;

    if (field === "cpf_cnpj") {
      formattedValue = formatCpfCnpj(value);
      // Se for CNPJ (14 dígitos), buscar automaticamente
      const numbers = value.replace(/\D/g, "");
      if (numbers.length === 14) {
        buscarCnpj(numbers);
      }
    } else if (field === "cep") {
      formattedValue = formatCep(value);
      // Buscar CEP automaticamente quando completo
      const numbers = value.replace(/\D/g, "");
      if (numbers.length === 8) {
        buscarCep(numbers);
      }
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
  }

  // Enviar formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Validações
      if (!formData.nome.trim()) {
        throw new Error("Por favor, informe seu nome completo");
      }
      if (!formData.email.trim()) {
        throw new Error("Por favor, informe seu email");
      }

      const result = cadastro?.pessoa_id
        ? await atualizarCadastroPorToken(token!, formData)
        : await preencherCadastro(token!, formData);

      if (result.success) {
        setStatus("success");
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao enviar cadastro");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Renderizar conteúdo baseado no status
  function renderContent() {
    switch (status) {
      case "loading":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: WG_COLORS.laranja }} />
            <p className="text-gray-500 text-sm">Carregando...</p>
          </motion.div>
        );

      case "not_found":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
            <h2 className="text-[20px] font-normal text-gray-800 mb-2">Link Invalido</h2>
            <p className="text-[16px] text-gray-500 mb-6">
              Este link de cadastro não existe ou já foi utilizado.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "https://www.wgalmeida.com.br"}
                style={{ background: WG_COLORS.laranja }}
                className="w-full"
              >
                Visitar Nosso Site
              </Button>
              <Button
                onClick={() => window.location.href = "https://www.instagram.com/grupowgalmeida/"}
                variant="outline"
                className="w-full"
                style={{ borderColor: WG_COLORS.laranja, color: WG_COLORS.laranja }}
              >
                Seguir no Instagram
              </Button>
            </div>
          </motion.div>
        );

      case "expired":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Clock className="w-14 h-14 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-[20px] font-normal text-gray-800 mb-2">Link Expirado</h2>
            <p className="text-[16px] text-gray-500 mb-6">
              Este link expirou. Solicite um novo link.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "https://www.wgalmeida.com.br"}
                style={{ background: WG_COLORS.laranja }}
                className="w-full"
              >
                Visitar Nosso Site
              </Button>
              <Button
                onClick={() => window.location.href = "https://www.instagram.com/grupowgalmeida/"}
                variant="outline"
                className="w-full"
                style={{ borderColor: WG_COLORS.laranja, color: WG_COLORS.laranja }}
              >
                Seguir no Instagram
              </Button>
            </div>
          </motion.div>
        );

      case "already_filled":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertTriangle className="w-14 h-14 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-[20px] font-normal text-gray-800 mb-2">Ja Preenchido</h2>
            <p className="text-[16px] text-gray-500 mb-6">
              Este formulário já foi preenchido. Aguarde a aprovaçÍo.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "https://www.wgalmeida.com.br"}
                style={{ background: WG_COLORS.laranja }}
                className="w-full"
              >
                Visitar Nosso Site
              </Button>
              <Button
                onClick={() => window.location.href = "https://www.instagram.com/grupowgalmeida/"}
                variant="outline"
                className="w-full"
                style={{ borderColor: WG_COLORS.laranja, color: WG_COLORS.laranja }}
              >
                Seguir no Instagram
              </Button>
            </div>
          </motion.div>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            </motion.div>
            <h2 className="text-[20px] font-normal text-gray-800 mb-2">Cadastro Enviado!</h2>
            <p className="text-[16px] text-gray-500 mb-4">
              Aguardando aprovaçÍo. Você receberá um email com suas credenciais.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left mb-6">
              <p className="text-green-800 text-xs">
                <strong>Próximos passos:</strong><br />
                1. Nossa equipe analisará seu cadastro<br />
                2. Você receberá um email de confirmaçÍo<br />
                3. Use as credenciais para acessar o sistema
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = "https://www.wgalmeida.com.br"}
                style={{ background: WG_COLORS.laranja }}
                className="w-full"
              >
                Conheça Nosso Site
              </Button>
              <Button
                onClick={() => window.location.href = "https://www.instagram.com/grupowgalmeida/"}
                variant="outline"
                className="w-full"
                style={{ borderColor: WG_COLORS.laranja, color: WG_COLORS.laranja }}
              >
                Siga-nos no Instagram
              </Button>
            </div>
          </motion.div>
        );

      case "error":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <XCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
            <h2 className="text-[20px] font-normal text-gray-800 mb-2">Erro</h2>
            <p className="text-[16px] text-gray-500 mb-6">{errorMessage}</p>
            <Button
              onClick={() => setStatus("form")}
              style={{ background: WG_COLORS.laranja }}
              className="w-full"
            >
              Tentar Novamente
            </Button>
          </motion.div>
        );

      case "form": {
        const tituloPagina = cadastro?.titulo_pagina ||
          `Cadastro de ${cadastro ? getLabelTipoCadastro(cadastro.tipo_solicitado) : ""}`;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header compacto para mobile */}
            <div className="text-center mb-6">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
                style={{ background: `${WG_COLORS.laranja}15`, color: WG_COLORS.laranja }}
              >
                {cadastro && getLabelTipoCadastro(cadastro.tipo_solicitado)}
              </div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-800">{tituloPagina}</h1>
              {cadastro?.pessoa_id && (
                <p className="text-[13px] text-green-700 mt-2">
                  Link de atualizacao cadastral: os dados enviados serao salvos automaticamente.
                </p>
              )}
            </div>

            {/* Form otimizado para mobile */}
            <form onSubmit={handleSubmit} className="space-y-5 overflow-hidden">

              {/* Dados Pessoais */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: WG_COLORS.laranja }} />
                    Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-5">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="nome" className="text-[12px] font-medium">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value)}
                      placeholder="Seu nome completo"
                      className="h-12 text-[14px]"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-[12px] font-medium">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10 h-12 text-[14px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Telefone - Com seleçÍo de país */}
                  <div>
                    <Label htmlFor="telefone" className="text-[12px] font-medium">WhatsApp</Label>
                    <PhoneInputInternacional
                      value={formData.telefone}
                      onChange={(value) => setFormData((prev) => ({ ...prev, telefone: value || "" }))}
                      placeholder="Telefone com DDD"
                      defaultCountry="BR"
                      className="h-12 text-[14px]"
                    />
                  </div>

                  {/* CPF/CNPJ com busca automática */}
                  <div>
                    <Label htmlFor="cpf_cnpj" className="text-[12px] font-medium">
                      CPF ou CNPJ
                      {buscandoCnpj && <span className="ml-2 text-orange-500 font-normal">(Buscando...)</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="cpf_cnpj"
                        value={formData.cpf_cnpj}
                        onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className="h-12 text-[14px] pr-10"
                        maxLength={18}
                        inputMode="numeric"
                      />
                      {buscandoCnpj && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1.5">
                      CNPJ preenche empresa automaticamente
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Dados Profissionais */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                    <Briefcase className="w-4 h-4" style={{ color: WG_COLORS.engenharia }} />
                    Profissional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-5">
                  {/* Empresa */}
                  <div>
                    <Label htmlFor="empresa" className="text-[12px] font-medium">Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="empresa"
                        value={formData.empresa}
                        onChange={(e) => handleChange("empresa", e.target.value)}
                        placeholder="Nome da empresa"
                        className="pl-10 h-12 text-[14px]"
                      />
                    </div>
                  </div>

                  {/* Cargo */}
                  <div>
                    <Label htmlFor="cargo" className="text-[12px] font-medium">Cargo/FunçÍo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => handleChange("cargo", e.target.value)}
                      placeholder="Seu cargo"
                      className="h-12 text-[14px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Endereço com busca de CEP */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: WG_COLORS.arquitetura }} />
                    Endereco
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-5">
                  {/* CEP com busca automática */}
                  <div>
                    <Label htmlFor="cep" className="text-[12px] font-medium">
                      CEP
                      {buscandoCep && <span className="ml-2 text-orange-500 font-normal">(Buscando...)</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleChange("cep", e.target.value)}
                        placeholder="00000-000"
                        className="h-12 text-[14px] pr-10"
                        maxLength={9}
                        inputMode="numeric"
                      />
                      {buscandoCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 mt-1.5">
                      CEP preenche endereço automaticamente
                    </p>
                  </div>

                  {/* Endereço (Rua) */}
                  <div>
                    <Label htmlFor="endereco" className="text-[12px] font-medium">Rua/Logradouro</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleChange("endereco", e.target.value)}
                      placeholder="Nome da rua, avenida..."
                      className="h-12 text-[14px]"
                    />
                  </div>

                  {/* Número e Complemento em linha - empilha em mobile pequeno */}
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <Label htmlFor="numero" className="text-[12px] font-medium">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleChange("numero", e.target.value)}
                        placeholder="Nº"
                        className="h-12 text-[14px] w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="complemento" className="text-[12px] font-medium">Complemento</Label>
                      <Input
                        id="complemento"
                        value={formData.complemento}
                        onChange={(e) => handleChange("complemento", e.target.value)}
                        placeholder="Apto, Sala..."
                        className="h-12 text-[14px] w-full"
                      />
                    </div>
                  </div>

                  {/* Cidade e Estado em linha - empilha em mobile pequeno */}
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <Label htmlFor="cidade" className="text-[12px] font-medium">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleChange("cidade", e.target.value)}
                        placeholder="Cidade"
                        className="h-12 text-[14px] w-full"
                      />
                    </div>
                    <div className="min-w-0">
                      <Label htmlFor="estado" className="text-[12px] font-medium">Estado</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => handleChange("estado", value)}
                      >
                        <SelectTrigger className="h-12 text-[14px] w-full">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {ESTADOS.map((estado) => (
                            <SelectItem key={estado.uf} value={estado.uf} className="text-[14px] py-3">
                              {estado.uf} - {estado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dados Bancários - Para COLABORADOR, FORNECEDOR e ESPECIFICADOR (não para CLIENTE) */}
              {cadastro?.tipo_solicitado !== "CLIENTE" && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                      <Landmark className="w-4 h-4" style={{ color: WG_COLORS.engenharia }} />
                      Dados Bancarios
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Para recebimento de pagamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-5">
                    {/* Banco */}
                    <div>
                      <Label htmlFor="banco" className="text-[12px] font-medium">Banco</Label>
                      <Input
                        id="banco"
                        value={formData.banco}
                        onChange={(e) => handleChange("banco", e.target.value)}
                        placeholder="Ex: Bradesco, Itaú, Nubank..."
                        className="h-12 text-[14px]"
                      />
                    </div>

                    {/* Agência e Conta em linha - empilha em mobile pequeno */}
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 overflow-hidden">
                      <div className="min-w-0">
                        <Label htmlFor="agencia" className="text-[12px] font-medium">Agência</Label>
                        <Input
                          id="agencia"
                          value={formData.agencia}
                          onChange={(e) => handleChange("agencia", e.target.value)}
                          placeholder="0000"
                          className="h-12 text-[14px] w-full"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="min-w-0">
                        <Label htmlFor="conta" className="text-[12px] font-medium">Conta</Label>
                        <Input
                          id="conta"
                          value={formData.conta}
                          onChange={(e) => handleChange("conta", e.target.value)}
                          placeholder="00000-0"
                          className="h-12 text-[14px] w-full"
                        />
                      </div>
                    </div>

                    {/* Tipo de Conta */}
                    <div>
                      <Label htmlFor="tipo_conta" className="text-[12px] font-medium">Tipo de Conta</Label>
                      <Select
                        value={formData.tipo_conta}
                        onValueChange={(value) => handleChange("tipo_conta", value)}
                      >
                        <SelectTrigger className="h-12 text-[14px]">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente" className="text-[14px] py-3">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca" className="text-[14px] py-3">Conta Poupança</SelectItem>
                          <SelectItem value="salario" className="text-[14px] py-3">Conta Salário</SelectItem>
                          <SelectItem value="pagamento" className="text-[14px] py-3">Conta Pagamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PIX */}
                    <div>
                      <Label htmlFor="pix" className="text-[12px] font-medium flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        Chave PIX
                      </Label>
                      <Input
                        id="pix"
                        value={formData.pix}
                        onChange={(e) => handleChange("pix", e.target.value)}
                        placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                        className="h-12 text-[14px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SeçÍo de Mídia - Vídeo e Fotos */}
              {(requerVideo || requerFoto) && (
                <Card className="border-0 shadow-sm border-l-4 border-l-indigo-500">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                      <Camera className="w-4 h-4" style={{ color: "#6366f1" }} />
                      Midia
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Envie videos e fotos do local ou servico
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-5">
                    {/* Upload de Vídeo */}
                    {requerVideo && (
                      <div>
                        <Label className="text-[12px] font-medium flex items-center gap-1 mb-2">
                          <Camera className="w-3 h-3" />
                          Vídeo de ApresentaçÍo
                        </Label>
                        {videoPreview ? (
                          <div className="relative rounded-lg overflow-hidden bg-black">
                            <video
                              src={videoPreview}
                              controls
                              className="w-full h-40 object-contain"
                            />
                            <button
                              type="button"
                              onClick={removerVideo}
                              title="Remover vídeo"
                              aria-label="Remover vídeo"
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center gap-2 text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                          >
                            <Upload className="w-8 h-8" />
                            <span className="text-sm font-medium">Toque para gravar ou enviar vídeo</span>
                            <span className="text-xs text-gray-500">MP4, MOV, até 100MB</span>
                          </button>
                        )}
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                          aria-label="Selecionar vídeo"
                          title="Selecionar vídeo"
                        />
                      </div>
                    )}

                    {/* Upload de Fotos */}
                    {requerFoto && (
                      <div>
                        <Label className="text-[12px] font-medium flex items-center gap-1 mb-2">
                          <ImageIcon className="w-3 h-3" />
                          Fotos do Local ({fotos.length}/5)
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {fotoPreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img src={preview} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                              <button
                                type="button"
                                onClick={() => removerFoto(index)}
                                title={`Remover foto ${index + 1}`}
                                aria-label={`Remover foto ${index + 1}`}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {fotos.length < 5 && (
                            <button
                              type="button"
                              onClick={() => fotoInputRef.current?.click()}
                              className="aspect-square border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center gap-1 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                            >
                              <Camera className="w-6 h-6" />
                              <span className="text-[10px]">Adicionar</span>
                            </button>
                          )}
                        </div>
                        <input
                          ref={fotoInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFotoSelect}
                          className="hidden"
                          aria-label="Selecionar fotos"
                          title="Selecionar fotos"
                        />
                        <p className="text-[12px] text-gray-400 mt-2">
                          Tire fotos do local onde o serviço será realizado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* SeçÍo de Serviço Solicitado */}
              {requerServico && (
                <Card className="border-0 shadow-sm border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                      <Wrench className="w-4 h-4" style={{ color: WG_COLORS.laranja }} />
                      Servico Solicitado
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      Descreva o servico que voce precisa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-5">
                    <div>
                      <Label htmlFor="servico_descricao" className="text-[12px] font-medium">
                        DescriçÍo do Serviço *
                      </Label>
                      <Textarea
                        id="servico_descricao"
                        value={servicoDescricao}
                        onChange={(e) => setServicoDescricao(e.target.value)}
                        placeholder="Descreva detalhadamente o serviço que você precisa...&#10;Ex: Preciso de instalaçÍo elétrica em 3 cômodos, com 10 pontos de tomada e 5 pontos de luz..."
                        rows={4}
                        className="resize-none text-[14px] min-h-[120px]"
                        required={requerServico}
                      />
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700">
                        <strong>Dica:</strong> Quanto mais detalhes você fornecer, melhor poderemos atendê-lo.
                        Inclua medidas, quantidade, materiais desejados, etc.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Observações */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-[20px] font-normal flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: WG_COLORS.cinza }} />
                    Observacoes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-5">
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => handleChange("observacoes", e.target.value)}
                    placeholder="Alguma informaçÍo adicional..."
                    rows={3}
                    className="resize-none text-[14px] min-h-[100px]"
                  />
                </CardContent>
              </Card>

              {/* BotÍo Enviar - fixo no mobile com safe area */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm pt-4 pb-safe-bottom -mx-4 px-4 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-[14px] font-normal rounded-xl shadow-lg"
                  style={{ background: WG_COLORS.laranja }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Cadastro"
                  )}
                </Button>
                <p className="text-center text-[12px] text-gray-400 mt-3 pb-2">
                  Ao enviar, você concorda com nossos termos de uso
                </p>
              </div>
            </form>
          </motion.div>
        );
    }
      default:
        return null;
    }
  }

  return (
    <>
      {/* Intro Video - exibida antes do formulário */}
      {showIntro && (
        <IntroVideoWGAlmeida
          onComplete={() => setShowIntro(false)}
          duration={20}
        />
      )}

      {/* Página de Cadastro */}
      {!showIntro && (
        <div className="min-h-screen relative overflow-x-hidden overflow-y-auto">
          {/* Fundo Animado com Gradiente */}
          <div className="fixed inset-0" style={{ zIndex: 0 }}>
            {/* Gradiente base */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${WG_COLORS.preto} 0%, ${WG_COLORS.cinza} 50%, ${WG_COLORS.preto} 100%)`,
              }}
            />
            {/* Círculos de cor animados */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 20% 20%, ${WG_COLORS.laranja}40 0%, transparent 40%),
                             radial-gradient(circle at 80% 30%, ${WG_COLORS.arquitetura}30 0%, transparent 35%),
                             radial-gradient(circle at 70% 80%, ${WG_COLORS.engenharia}25 0%, transparent 30%),
                             radial-gradient(circle at 30% 70%, ${WG_COLORS.laranja}20 0%, transparent 35%)`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Pattern de textura sutil */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Overlay para melhor legibilidade */}
          <div
            className="fixed inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)",
              zIndex: 1,
            }}
          />

          {/* Conteúdo */}
          <div
            className="relative min-h-screen py-4 px-3 sm:py-8 sm:px-4"
            style={{ zIndex: 2 }}
          >
            <div className="max-w-lg mx-auto">
              {/* Logo menor para mobile */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4 sm:mb-6"
              >
                <img
                  src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                  alt="Grupo WG Almeida"
                  className="h-12 sm:h-16 mx-auto drop-shadow-lg"
                />
              </motion.div>

              {/* Content Card com transparência */}
              <Card className="shadow-2xl border-0 backdrop-blur-md overflow-hidden" style={{ background: "rgba(255,255,255,0.95)" }}>
                <CardContent className="p-4 sm:p-6 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {renderContent()}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-[10px] text-white/70 mt-4 drop-shadow"
              >
                © 2026 Grupo WG Almeida
              </motion.p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


