import { useState, ChangeEvent, FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle, Mail } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Se tem token na URL, é redefiniçÍo de senha
  // Se não tem, é solicitaçÍo de reset
  const isResetMode =
    searchParams.get("type") === "recovery" || searchParams.has("token");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // Solicitar email de recuperaçÍo
  const handleRequestReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setEmailSent(true);
    } catch (err: unknown) {
      console.error("Erro ao solicitar reset:", err);
      const message = err instanceof Error ? err.message : "Erro ao enviar email. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Definir nova senha
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 12) {
      setError("A senha deve ter pelo menos 12 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      console.error("Erro ao redefinir senha:", err);
      const message = err instanceof Error ? err.message : "Erro ao redefinir senha. Tente novamente.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Email enviado com sucesso
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-normal text-gray-900 mb-2">
            Verifique seu email
          </h2>
          <p className="text-gray-600 mb-6">
            Enviamos um link de recuperaçÍo para{" "}
            <strong>{formData.email}</strong>. Clique no link para redefinir sua
            senha.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Voltar para Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Senha redefinida com sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-normal text-gray-900 mb-2">
            Senha alterada!
          </h2>
          <p className="text-gray-600 mb-6">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o
            login.
          </p>
          <Link to="/login">
            <Button className="w-full">Ir para Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-normal text-gray-900">
            {isResetMode ? "Nova Senha" : "Recuperar Senha"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isResetMode
              ? "Digite sua nova senha"
              : "Digite seu email para receber o link de recuperaçÍo"}
          </p>
        </div>

        <form
          onSubmit={isResetMode ? handleResetPassword : handleRequestReset}
          className="space-y-4"
        >
          {!isResetMode && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {isResetMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 12 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={12}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isResetMode ? "Salvando..." : "Enviando..."}
              </>
            ) : isResetMode ? (
              "Salvar nova senha"
            ) : (
              "Enviar link de recuperaçÍo"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}


