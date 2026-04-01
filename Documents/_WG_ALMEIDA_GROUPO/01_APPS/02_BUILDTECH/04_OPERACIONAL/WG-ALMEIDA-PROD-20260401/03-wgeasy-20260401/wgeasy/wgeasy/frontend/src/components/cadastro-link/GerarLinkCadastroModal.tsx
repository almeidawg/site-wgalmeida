// src/components/cadastro-link/GerarLinkCadastroModal.tsx
// Modal para gerar e compartilhar link de cadastro

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Mail,
  MessageCircle,
  Copy,
  CheckCircle2,
  Loader2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  criarLinkCadastro,
  TipoCadastro,
  getLabelTipoCadastro,
} from "@/lib/cadastroLinkApi";
import {
  gerarMensagemWhatsApp,
  gerarUrlWhatsApp,
  gerarMensagemEmail,
  gerarUrlEmail,
  mapearTipoCadastroParaTemplate,
} from "@/lib/mensagemTemplates";
import { useToast } from "@/hooks/use-toast";

// Cores de terceiros (WhatsApp, Email)
const TERCEIROS_COLORS = {
  whatsapp: "#25D366",
  email: "#EA4335",
};

interface GerarLinkCadastroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoCadastro;
  nucleoId?: string;
}

type Step = "generate" | "share";

export default function GerarLinkCadastroModal({
  open,
  onOpenChange,
  tipo,
  nucleoId,
}: GerarLinkCadastroModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("generate");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailDestino, setEmailDestino] = useState("");
  const [reutilizavel, setReutilizavel] = useState(false);
  const [isReutilizavel, setIsReutilizavel] = useState(false);
  const [tituloPagina, setTituloPagina] = useState("");

  // Gerar novo link
  async function handleGenerateLink() {
    setIsLoading(true);
    try {
      const result = await criarLinkCadastro({
        tipo,
        nucleoId,
        reutilizavel,
        tituloPagina: tituloPagina.trim() || undefined,
      });
      setGeneratedUrl(result.url);
      setIsReutilizavel(result.reutilizavel);
      setStep("share");
      toast({
        title: "Link gerado!",
        description: reutilizavel
          ? "Link para disparo em massa criado. Pode ser usado por várias pessoas."
          : "Agora escolha como enviar o link.",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao gerar link",
        description: error instanceof Error ? error.message : "Erro ao gerar link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Copiar link
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Cole onde preferir para compartilhar.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  }

  // Enviar por WhatsApp
  function handleSendWhatsApp() {
    const tipoTemplate = mapearTipoCadastroParaTemplate(tipo);
    const mensagem = gerarMensagemWhatsApp(tipoTemplate, { LINK: generatedUrl });
    const whatsappUrl = gerarUrlWhatsApp(mensagem);
    window.open(whatsappUrl, "_blank");
    toast({
      title: "Abrindo WhatsApp",
      description: "Escolha o contato para enviar.",
    });
  }

  // Enviar por Email
  function handleSendEmail() {
    const tipoTemplate = mapearTipoCadastroParaTemplate(tipo);
    const corpo = gerarMensagemEmail(tipoTemplate, { LINK: generatedUrl });
    const assunto = `Convite para Cadastro de ${getLabelTipoCadastro(tipo)} - WG Almeida`;
    const mailtoUrl = gerarUrlEmail(assunto, corpo, emailDestino);
    window.location.href = mailtoUrl;
    toast({
      title: "Abrindo Email",
      description: "Complete o envio no seu cliente de email.",
    });
  }

  // Reset ao fechar
  function handleClose() {
    setStep("generate");
    setGeneratedUrl("");
    setCopied(false);
    setEmailDestino("");
    setReutilizavel(false);
    setIsReutilizavel(false);
    setTituloPagina("");
    onOpenChange(false);
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative z-[121] w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-[18px] font-normal text-gray-900">
            <Link2 className="w-5 h-5 text-wg-primary" />
            Gerar Link de Cadastro
          </h2>
          <p className="text-[13px] text-gray-500 mt-1">
            Envie um link para cadastro de{" "}
            <span className="font-medium text-wg-primary">
              {getLabelTipoCadastro(tipo)}
            </span>
          </p>
        </div>
        <AnimatePresence mode="wait">
          {step === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center bg-wg-primary/10">
                  {reutilizavel ? (
                    <Users className="w-8 h-8 text-wg-primary" />
                  ) : (
                    <Link2 className="w-8 h-8 text-wg-primary" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {reutilizavel ? (
                    <>
                      Link para <strong>disparo em massa</strong> - pode ser usado por várias pessoas.
                      <br />
                      Expira em <strong>7 dias</strong>.
                    </>
                  ) : (
                    <>
                      Será gerado um link único que expira em <strong>7 dias</strong>.
                      <br />
                      Após o preenchimento, você será notificado para aprovar.
                    </>
                  )}
                </p>
              </div>

              {/* Campo para título personalizado */}
              <div className="space-y-2">
                <Label htmlFor="titulo-pagina" className="text-sm font-medium">
                  Título da Página (opcional)
                </Label>
                <Input
                  id="titulo-pagina"
                  value={tituloPagina}
                  onChange={(e) => setTituloPagina(e.target.value)}
                  placeholder={`Ex: Cadastro de ${getLabelTipoCadastro(tipo)}`}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Personaliza o título exibido na página de cadastro. Se vazio, usa o título padrÍo.
                </p>
              </div>

              {/* Switch para disparo em massa */}
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-wg-primary" />
                  <div>
                    <Label htmlFor="reutilizavel" className="font-medium cursor-pointer">
                      Disparo em massa
                    </Label>
                    <p className="text-xs text-gray-500">
                      Permite múltiplos cadastros com o mesmo link
                    </p>
                  </div>
                </div>
                <Switch
                  id="reutilizavel"
                  checked={reutilizavel}
                  onCheckedChange={setReutilizavel}
                />
              </div>

              <Button
                onClick={handleGenerateLink}
                disabled={isLoading}
                className="w-full h-12 bg-wg-primary hover:bg-wg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 mr-2" />
                    Gerar Link
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {step === "share" && (
            <motion.div
              key="share"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Badge indicando tipo de link */}
              {isReutilizavel && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Link para disparo em massa - pode ser usado por várias pessoas
                  </span>
                </div>
              )}

              {/* Link gerado */}
              <div className="space-y-2">
                <Label>Link gerado:</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedUrl}
                    readOnly
                    className="text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Opções de envio */}
              <div className="space-y-2">
                <Label>Enviar por:</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${TERCEIROS_COLORS.whatsapp}15` }}
                    >
                      <MessageCircle className="w-6 h-6" style={{ color: TERCEIROS_COLORS.whatsapp }} />
                    </div>
                    <span className="text-sm font-medium">WhatsApp</span>
                  </motion.button>

                  {/* Email */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendEmail}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-red-400 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${TERCEIROS_COLORS.email}15` }}
                    >
                      <Mail className="w-6 h-6" style={{ color: TERCEIROS_COLORS.email }} />
                    </div>
                    <span className="text-sm font-medium">Email</span>
                  </motion.button>
                </div>
              </div>

              {/* Input de email opcional */}
              <div className="space-y-2">
                <Label htmlFor="email-destino">Email do destinatário (opcional):</Label>
                <Input
                  id="email-destino"
                  type="email"
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("generate")}
                  className="flex-1"
                >
                  Gerar Outro
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-wg-primary hover:bg-wg-primary/90"
                >
                  Concluído
                </Button>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-400 text-center">
                Você será notificado quando o cadastro for preenchido.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================
// BOTÍO PARA USAR NAS PÁGINAS
// ============================================================

interface BotaoGerarLinkProps {
  tipo: TipoCadastro;
  nucleoId?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function BotaoGerarLink({
  tipo,
  nucleoId,
  className,
  style,
}: BotaoGerarLinkProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={className || "px-4 py-2 rounded-lg bg-wg-primary hover:bg-wg-primary/90 text-white text-sm font-medium flex items-center gap-2"}
        style={style}
      >
        <Link2 className="w-4 h-4" />
        <span className="hidden sm:inline">Gerar Link</span>
      </button>

      <GerarLinkCadastroModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tipo={tipo}
        nucleoId={nucleoId}
      />
    </>
  );
}


