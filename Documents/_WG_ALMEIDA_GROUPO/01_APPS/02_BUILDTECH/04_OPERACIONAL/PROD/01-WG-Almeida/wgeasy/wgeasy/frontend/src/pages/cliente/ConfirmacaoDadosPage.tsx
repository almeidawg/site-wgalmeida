/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/ConfirmacaoDadosPage.tsx
// Página de confirmaçÍo de dados do cliente antes de acessar a área do cliente

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  CheckCircle2,
  Edit3,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/auth/AuthContext";

// Cores WG
const WG_COLORS = {
  laranja: "#F25C26",
  preto: "#2E2E2E",
  cinza: "#4C4C4C",
};

interface DadosCliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  cpf: string | null;
  cnpj: string | null;
  // Campos de endereço da obra
  obra_logradouro: string | null;
  obra_numero: string | null;
  obra_bairro: string | null;
  obra_cidade: string | null;
  obra_estado: string | null;
  empresa: string | null;
  avatar_url: string | null;
  genero: string | null;
}

export default function ConfirmacaoDadosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cliente, setCliente] = useState<DadosCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarDadosCliente();
  }, []);

  async function carregarDadosCliente() {
    try {
      setLoading(true);
      setErro(null);

      // Pegar usuário logado (evita chamada /auth/v1/user que pode retornar 403)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Erro ao carregar sessÍo:", sessionError);
      }
      const authUser = user ?? sessionData.session?.user ?? null;
      if (!authUser) {
        navigate("/login");
        return;
      }

      // Buscar informações do usuário/cliente
      const { data: usuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("pessoa_id")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (erroUsuario || !usuario?.pessoa_id) {
        console.error("Erro ao buscar usuário:", erroUsuario);
        setErro("não foi possível carregar seus dados. Entre em contato com o suporte.");
        setLoading(false);
        return;
      }

      // SEGURANÇA (VER-028): Especificar campos necessários em vez de SELECT *
      // Evita expor campos sensíveis desnecessários
      const { data: pessoa, error: erroPessoa } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone, celular, cpf, cnpj, obra_logradouro, obra_numero, obra_bairro, obra_cidade, obra_estado, empresa, avatar_url, genero")
        .eq("id", usuario.pessoa_id)
        .maybeSingle();

      if (erroPessoa || !pessoa) {
        console.error("Erro ao buscar pessoa:", erroPessoa);
        setErro("não foi possível carregar seus dados cadastrais.");
        setLoading(false);
        return;
      }

      setCliente(pessoa as DadosCliente);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErro("Erro inesperado ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarDados() {
    if (!cliente) return;

    setConfirmando(true);
    try {
      // Buscar o usuário logado para obter o ID
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Erro ao carregar sessÍo:", sessionError);
      }
      const authUser = user ?? sessionData.session?.user ?? null;
      if (!authUser) {
        setErro("SessÍo expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      // Buscar o ID do usuário na tabela usuarios
      const { data: usuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", authUser.id)
        .maybeSingle();

      if (erroUsuario || !usuario) {
        console.error("Erro ao buscar usuário:", erroUsuario);
        setErro("Erro ao confirmar dados. Tente novamente.");
        return;
      }

      // Salvar confirmaçÍo NO BANCO DE DADOS (mais seguro que localStorage)
      const { error: erroUpdate } = await supabase
        .from("usuarios")
        .update({
          dados_confirmados: true,
          dados_confirmados_em: new Date().toISOString()
        })
        .eq("id", usuario.id);

      if (erroUpdate) {
        console.error("Erro ao confirmar dados:", erroUpdate);
        // Fallback para localStorage se a coluna ainda não existir
        localStorage.setItem(`dados_confirmados_${cliente.id}`, "true");
        localStorage.setItem(`dados_confirmados_${cliente.id}_data`, new Date().toISOString());
      }

      // Pequeno delay para mostrar feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirecionar para a área do cliente
      navigate("/wgx");
    } catch (error) {
      console.error("Erro ao confirmar dados:", error);
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setConfirmando(false);
    }
  }

  function handleEditarDados() {
    // Redireciona para uma página de ediçÍo ou abre modal
    // Por enquanto, vamos para a área do cliente com flag de ediçÍo
    navigate("/wgx?editar=true");
  }

  // FunçÍo para formatar CPF/CNPJ
  function formatarDocumento(doc: string | null): string {
    if (!doc) return "não informado";
    const numeros = doc.replace(/\D/g, "");
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return doc;
  }

  // FunçÍo para formatar telefone
  function formatarTelefone(tel: string | null): string {
    if (!tel) return "não informado";
    const numeros = tel.replace(/\D/g, "");
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return tel;
  }

  // Obter iniciais do nome
  function getIniciais(): string {
    if (!cliente?.nome) return "C";
    return cliente.nome
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  // Determinar saudaçÍo
  function getSaudacao(): string {
    if (!cliente) return "Olá";
    if (cliente.genero === "F") return "Bem-vinda";
    if (cliente.genero === "M") return "Bem-vindo";
    return "Bem-vindo(a)";
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#F25C26] mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">Ops! Algo deu errado</h2>
            <p className="text-[16px] text-gray-600 mb-6">{erro}</p>
            <Button onClick={() => navigate("/login")} variant="outline">
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-black text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-wg-grupo.svg"
              alt="WG Grupo"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <h1 className="text-[20px] font-normal">WG Almeida</h1>
              <p className="text-sm text-gray-400">ConfirmaçÍo de Dados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Shield className="w-4 h-4" />
            Área Segura
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card de Boas-vindas */}
          <Card className="mb-6 overflow-hidden">
            <div
              className="p-8 text-white"
              style={{ background: `linear-gradient(135deg, ${WG_COLORS.preto} 0%, ${WG_COLORS.cinza} 100%)` }}
            >
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  {cliente?.avatar_url ? (
                    <img
                      src={cliente.avatar_url}
                      alt={cliente.nome}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-normal border-4 border-white shadow-lg"
                      style={{ background: WG_COLORS.laranja }}
                    >
                      {getIniciais()}
                    </div>
                  )}
                </div>

                {/* SaudaçÍo */}
                <div>
                  <p className="text-sm text-gray-300 mb-1">Portal do Cliente</p>
                  <h1 className="text-[18px] sm:text-[24px] font-normal mb-2">
                    {getSaudacao()}, {cliente?.nome?.split(" ")[0]}!
                  </h1>
                  <p className="text-[16px] text-gray-300">
                    Antes de acessar sua área exclusiva, confirme se seus dados estÍo corretos.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card de Dados */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-normal text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: WG_COLORS.laranja }} />
                  Seus Dados Cadastrais
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditarDados}
                  className="text-gray-600"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Solicitar AlteraçÍo
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Nome Completo */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Nome Completo
                  </label>
                  <p className="text-lg text-gray-900">
                    {cliente?.nome || "não informado"}
                  </p>
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {cliente?.cnpj ? "CNPJ" : "CPF"}
                  </label>
                  <p className="text-lg text-gray-900">
                    {formatarDocumento((cliente?.cnpj || cliente?.cpf) ?? null)}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    E-mail
                  </label>
                  <p className="text-lg text-gray-900">
                    {cliente?.email || "não informado"}
                  </p>
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Telefone
                  </label>
                  <p className="text-lg text-gray-900">
                    {formatarTelefone((cliente?.celular || cliente?.telefone) ?? null)}
                  </p>
                </div>

                {/* Empresa (se tiver) */}
                {cliente?.empresa && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Empresa
                    </label>
                    <p className="text-lg text-gray-900">
                      {cliente.empresa}
                    </p>
                  </div>
                )}

                {/* Endereço */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Endereço
                  </label>
                  <p className="text-lg text-gray-900">
                    {cliente?.obra_logradouro ? (
                      <>
                        {cliente.obra_logradouro}
                        {cliente.obra_numero && `, ${cliente.obra_numero}`}
                        {cliente.obra_bairro && ` - ${cliente.obra_bairro}`}
                        {cliente.obra_cidade && ` - ${cliente.obra_cidade}`}
                        {cliente.obra_estado && `/${cliente.obra_estado}`}
                      </>
                    ) : (
                      "Endereço não informado"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de ConfirmaçÍo */}
          <Card className="border-2" style={{ borderColor: `${WG_COLORS.laranja}30` }}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${WG_COLORS.laranja}15` }}
                  >
                    <CheckCircle2 className="w-6 h-6" style={{ color: WG_COLORS.laranja }} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-normal text-gray-900 mb-1">
                      Seus dados estÍo corretos?
                    </h3>
                    <p className="text-[16px] text-gray-600">
                      Ao confirmar, você terá acesso completo à sua área exclusiva WGxperience.
                      Caso precise alterar algum dado, clique em "Solicitar AlteraçÍo".
                    </p>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleConfirmarDados}
                  disabled={confirmando}
                  className="w-full md:w-auto whitespace-nowrap"
                  style={{ background: WG_COLORS.laranja }}
                >
                  {confirmando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      Confirmar e Acessar
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Segurança */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              Seus dados estÍo protegidos e serÍo utilizados apenas para comunicaçÍo sobre seu projeto.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


