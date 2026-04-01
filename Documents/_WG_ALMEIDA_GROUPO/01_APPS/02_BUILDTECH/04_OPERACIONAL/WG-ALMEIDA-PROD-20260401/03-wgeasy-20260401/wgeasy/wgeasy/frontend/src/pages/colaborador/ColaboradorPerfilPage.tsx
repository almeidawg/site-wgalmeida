/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Página de Perfil do Colaborador
 * Permite visualizar e editar informações pessoais
 */

import { useState } from "react";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { useAuth } from "@/auth/AuthContext";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { formatarData } from "@/lib/utils";
import PessoaAvatarUploader from "@/components/pessoas/PessoaAvatarUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Key,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ColaboradorPerfilPage() {
  const { usuario, loading } = useUsuarioLogado();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado para ediçÍo de dados
  const [formData, setFormData] = useState({
    telefone: usuario?.telefone || "",
  });
  const cargoDisplay =
    usuario?.cargo === "ADMIN-COLABORADOR"
      ? "Coordenador"
      : usuario?.cargo || "Colaborador";

  // Estado para alteraçÍo de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Atualizar formData quando usuario carregar
  useState(() => {
    if (usuario?.telefone) {
      setFormData({ telefone: usuario.telefone });
    }
  });

  const handleAvatarChange = async (data: { avatar_url?: string }) => {
    if (data.avatar_url && usuario?.pessoa_id) {
      try {
        await supabase
          .from("pessoas")
          .update({ avatar_url: data.avatar_url })
          .eq("id", usuario.pessoa_id);

        setMessage({ type: "success", text: "Foto atualizada com sucesso!" });
        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        setMessage({ type: "error", text: "Erro ao atualizar foto" });
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!usuario?.pessoa_id) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("pessoas")
        .update({ telefone: formData.telefone })
        .eq("id", usuario.pessoa_id);

      if (error) throw error;

      setMessage({ type: "success", text: "Dados atualizados com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao atualizar dados" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "As senhas nÍo coincidem" });
      return;
    }

    if (passwordData.newPassword.length < 12) {
      setMessage({ type: "error", text: "A senha deve ter pelo menos 12 caracteres" });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao alterar senha" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-wg-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <User className="w-6 h-6 text-wg-primary" />
        <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Meu Perfil</h1>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal - Dados do Perfil */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Informações Pessoais</h2>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <PessoaAvatarUploader
                pessoaId={usuario?.pessoa_id || undefined}
                nome={usuario?.nome || "Colaborador"}
                avatar_url={usuario?.avatar_url}
                foto_url={usuario?.foto_url}
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Clique para alterar
              </p>
            </div>

            {/* Dados */}
            <div className="flex-1 space-y-4">
              {/* Nome (somente leitura) */}
              <div>
                <Label className="flex items-center gap-2 text-gray-600 mb-1">
                  <User className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  value={usuario?.nome || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Email (somente leitura) */}
              <div>
                <Label className="flex items-center gap-2 text-gray-600 mb-1">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  value={usuario?.email || user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Telefone (editável) */}
              <div>
                <Label className="flex items-center gap-2 text-gray-600 mb-1">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Cargo (somente leitura) */}
              <div>
                <Label className="flex items-center gap-2 text-gray-600 mb-1">
                  <Briefcase className="w-4 h-4" />
                  Cargo
                </Label>
                <Input
                  value={cargoDisplay}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Empresa (somente leitura) */}
              {usuario?.empresa && (
                <div>
                  <Label className="flex items-center gap-2 text-gray-600 mb-1">
                    <Building2 className="w-4 h-4" />
                    Empresa
                  </Label>
                  <Input
                    value={usuario.empresa}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}

              {/* Data de início (somente leitura) */}
              {usuario?.data_inicio_wg && (
                <div>
                  <Label className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    Na WG desde
                  </Label>
                  <Input
                    value={formatarData(usuario.data_inicio_wg)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              )}

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-wg-primary hover:bg-wg-primary/90 text-white text-[14px]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>

        {/* Card Lateral - Alterar Senha */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-wg-primary" />
            Alterar Senha
          </h2>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-600 mb-1">Nova Senha</Label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                placeholder="Digite a nova senha"
              />
            </div>

            <div>
              <Label className="text-gray-600 mb-1">Confirmar Senha</Label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="Confirme a nova senha"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              variant="outline"
              className="w-full text-[14px]"
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Alterar Senha
            </Button>

            <p className="text-xs text-gray-500">
              A senha deve ter pelo menos 12 caracteres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

