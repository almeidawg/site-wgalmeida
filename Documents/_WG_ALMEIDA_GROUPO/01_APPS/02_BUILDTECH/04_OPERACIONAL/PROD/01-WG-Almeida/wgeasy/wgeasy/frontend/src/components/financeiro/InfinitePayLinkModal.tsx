/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { CreditCard, Copy, Check, ExternalLink, MessageCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { formatarMoeda } from "@/lib/utils";
import {
  gerarLinkPagamento,
  copiarLinkPagamento,
  enviarLinkWhatsApp,
} from "@/lib/infinitepayApi";

interface InfinitePayLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobranca: {
    id: string;
    cliente: string;
    valor: number;
    vencimento?: string;
  } | null;
  onLinkGerado?: () => void;
}

export default function InfinitePayLinkModal({
  open,
  onOpenChange,
  cobranca,
  onLinkGerado,
}: InfinitePayLinkModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState<{ id: string; url: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Dados do cliente (formulário)
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");

  // Métodos de pagamento
  const [metodoPix, setMetodoPix] = useState(true);
  const [metodoCredito, setMetodoCredito] = useState(true);
  const [metodoDebito, setMetodoDebito] = useState(true);
  const [metodoBoleto, setMetodoBoleto] = useState(true);

  // Resetar estado ao abrir
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && cobranca) {
      setLinkGerado(null);
      setCopiado(false);
      setNome(cobranca.cliente || "");
      setEmail("");
      setTelefone("");
      setCpfCnpj("");
      setMetodoPix(true);
      setMetodoCredito(true);
      setMetodoDebito(true);
      setMetodoBoleto(true);
    }
    onOpenChange(isOpen);
  };

  const handleGerarLink = async () => {
    if (!cobranca) return;

    const metodos: string[] = [];
    if (metodoPix) metodos.push("pix");
    if (metodoCredito) metodos.push("credit");
    if (metodoDebito) metodos.push("debit");
    if (metodoBoleto) metodos.push("boleto");

    if (metodos.length === 0) {
      toast({ variant: "destructive", title: "Selecione ao menos um método de pagamento" });
      return;
    }

    setLoading(true);
    try {
      const result = await gerarLinkPagamento({
        cobrancaId: cobranca.id,
        valor: cobranca.valor,
        descricao: `Cobrança - ${cobranca.cliente}`,
        cliente: nome ? { nome, email: email || undefined, telefone: telefone || undefined, cpfCnpj: cpfCnpj || undefined } : undefined,
        metodosPagamento: metodos,
      });

      if (result.success && result.id && result.url) {
        setLinkGerado({ id: result.id, url: result.url });
        toast({ title: "Link gerado com sucesso!" });
        onLinkGerado?.();
      } else {
        toast({ variant: "destructive", title: "Erro ao gerar link", description: result.error });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    if (!linkGerado) return;
    const ok = await copiarLinkPagamento(linkGerado.url);
    if (ok) {
      setCopiado(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!linkGerado) return;
    const tel = telefone.replace(/\D/g, "");
    enviarLinkWhatsApp(tel, linkGerado.url, nome || cobranca?.cliente);
  };

  if (!cobranca) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-light flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0ABAB5]" />
            Link de Pagamento
          </DialogTitle>
          <DialogDescription>
            Gere um link InfinitePay para esta cobrança
          </DialogDescription>
        </DialogHeader>

        {/* Valor */}
        <div className="rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-[11px] text-gray-500">Valor da cobrança</p>
          <p className="text-[20px] font-light text-[#16a34a]">{formatarMoeda(cobranca.valor)}</p>
          <p className="text-[11px] text-gray-400">{cobranca.cliente}</p>
        </div>

        {!linkGerado ? (
          <>
            {/* Dados do Cliente */}
            <div className="space-y-3">
              <p className="text-[12px] font-medium text-gray-700">Dados do cliente (opcional)</p>
              <Input
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="text-[12px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[12px]"
                />
                <Input
                  placeholder="Telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="text-[12px]"
                />
              </div>
              <Input
                placeholder="CPF ou CNPJ"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="text-[12px]"
              />
            </div>

            {/* Métodos de Pagamento */}
            <div className="space-y-2">
              <p className="text-[12px] font-medium text-gray-700">Métodos de pagamento</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "pix", label: "PIX", state: metodoPix, set: setMetodoPix },
                  { key: "credit", label: "Crédito", state: metodoCredito, set: setMetodoCredito },
                  { key: "debit", label: "Débito", state: metodoDebito, set: setMetodoDebito },
                  { key: "boleto", label: "Boleto", state: metodoBoleto, set: setMetodoBoleto },
                ].map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => m.set(!m.state)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-normal transition-colors border ${
                      m.state
                        ? "bg-[#0ABAB5]/10 text-[#0ABAB5] border-[#0ABAB5]/30"
                        : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BotÍo Gerar */}
            <DialogFooter>
              <Button
                onClick={handleGerarLink}
                disabled={loading}
                className="w-full bg-[#0ABAB5] hover:bg-[#099e9a] text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gerar Link de Pagamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* Estado de Sucesso */
          <div className="space-y-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-[11px] text-green-600 font-medium mb-1">Link gerado com sucesso!</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={linkGerado.url}
                  className="flex-1 text-[11px] bg-white border border-green-200 rounded px-2 py-1.5 text-gray-700"
                />
                <button
                  type="button"
                  onClick={handleCopiar}
                  className="p-1.5 rounded bg-white border border-green-200 hover:bg-green-100 transition-colors"
                  title="Copiar link"
                >
                  {copiado ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[11px]"
                onClick={handleCopiar}
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {copiado ? "Copiado!" : "Copiar Link"}
              </Button>
              {telefone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[11px] text-green-600 border-green-200 hover:bg-green-50"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  WhatsApp
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-[11px]"
                onClick={() => window.open(linkGerado.url, "_blank")}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Abrir
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

