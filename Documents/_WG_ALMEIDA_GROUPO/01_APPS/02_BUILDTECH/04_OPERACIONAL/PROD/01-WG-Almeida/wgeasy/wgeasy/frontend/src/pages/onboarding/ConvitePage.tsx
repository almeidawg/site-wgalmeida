// ============================================================
// ConvitePage — Aceitar convite de colaborador via token
// Sistema WG Easy · buildtech.wgalmeida.com.br
// ============================================================

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Lock, Zap, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

interface ConviteInfo {
  email: string;
  empresa: string;
  valido: boolean;
}

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [loadingConvite, setLoadingConvite] = useState(true);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Buscar info do convite via token (base64 simples: email|empresa)
    try {
      const decoded = atob(token);
      const [email, empresa] = decoded.split("|");
      if (email && empresa) {
        setConvite({ email, empresa, valido: true });
      } else {
        setConvite({ email: "", empresa: "", valido: false });
      }
    } catch {
      setConvite({ email: "", empresa: "", valido: false });
    }
    setLoadingConvite(false);
  }, [token]);

  const senhasOK = senha.length >= 12 && senha === confirmar;
  const forca = senha.length === 0 ? 0 : senha.length < 8 ? 1 : senha.length < 12 ? 2 : /[A-Z]/.test(senha) && /[0-9]/.test(senha) ? 3 : 2;
  const forcaCores = ["", "bg-red-400", "bg-amber-400", "bg-lime-400", "bg-green-500"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!convite?.valido || !senhasOK || !nome) return;
    setLoading(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: convite.email,
        password: senha,
        options: {
          data: { nome, empresa: convite.empresa, origem: "convite" },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw new Error(error.message);
      setSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  if (loadingConvite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!convite?.valido) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Convite inválido</h1>
          <p className="text-gray-500 text-sm mb-6">Este link de convite expirou ou nÍo é válido.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Conta criada! 🎉</h1>
          <p className="text-gray-500 text-sm mb-2">
            Verifique o e-mail <strong>{convite.email}</strong> para confirmar seu acesso.
          </p>
          <p className="text-xs text-gray-400 mb-6">Após confirmaçÍo, você já pode fazer login.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all"
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-1">
            <Zap className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-black text-gray-900">WG Easy</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7 text-orange-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Você foi convidado!</h1>
            <p className="text-sm text-gray-500 mt-1">
              <strong>{convite.empresa}</strong> te convidou para colaborar no WG Easy.
            </p>
            <div className="mt-3 px-4 py-2 bg-orange-50 rounded-xl text-xs text-orange-700 font-medium">
              {convite.email}
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Seu nome completo<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ana Silva"
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Criar senha<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 12 caracteres"
                  minLength={12}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                />
              </div>
              {senha.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {[1,2,3,4].map((n) => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n <= forca ? forcaCores[forca] : "bg-gray-200"}`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirmar senha<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
                  minLength={12}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                />
              </div>
              {confirmar.length > 0 && (
                <p className={`text-xs mt-1 ${senhasOK ? "text-green-600" : "text-red-500"}`}>
                  {senhasOK ? "✓ Senhas coincidem" : "✗ Senhas nÍo coincidem ou muito curtas"}
                </p>
              )}
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={!nome || !senhasOK || loading}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : (
                "Criar conta e entrar →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

