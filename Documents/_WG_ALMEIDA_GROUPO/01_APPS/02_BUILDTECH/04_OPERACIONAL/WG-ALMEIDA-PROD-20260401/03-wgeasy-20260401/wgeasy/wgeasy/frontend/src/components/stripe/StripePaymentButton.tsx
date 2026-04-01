/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Copy,
  Mail,
  MessageCircle,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  createPaymentLink,
  copyPaymentLink,
  sendPaymentLinkViaWhatsApp,
  sendPaymentLinkViaEmail,
  formatStripeStatus,
} from '@/services/stripeService';

interface StripePaymentButtonProps {
  parcelaId: string;
  valor: number;
  descricao?: string;
  clienteNome?: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  existingPaymentUrl?: string;
  existingStatus?: string;
  onPaymentLinkCreated?: (url: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const StripePaymentButton: React.FC<StripePaymentButtonProps> = ({
  parcelaId,
  valor,
  descricao,
  clienteNome,
  clienteEmail,
  clienteTelefone,
  existingPaymentUrl,
  existingStatus,
  onPaymentLinkCreated,
  variant = 'default',
  size = 'default',
  className = '',
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(existingPaymentUrl || '');
  const [copied, setCopied] = useState(false);

  const statusInfo = formatStripeStatus(existingStatus || null);

  const handleCreatePaymentLink = async () => {
    setIsLoading(true);
    try {
      const result = await createPaymentLink({
        parcelaId,
        valor,
        descricao,
        clienteNome,
        clienteEmail,
      });

      if (result.success && result.paymentLink) {
        setPaymentUrl(result.paymentLink.url);
        onPaymentLinkCreated?.(result.paymentLink.url);
        toast({
          title: 'Link criado com sucesso!',
          description: 'O link de pagamento está pronto para ser compartilhado.',
        });
        setIsDialogOpen(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar link',
          description: result.error || 'Tente novamente',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'não foi possível criar o link de pagamento',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyPaymentLink(paymentUrl);
      setCopied(true);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'não foi possível copiar o link',
      });
    }
  };

  const handleSendViaWhatsApp = () => {
    if (!clienteTelefone) {
      toast({
        variant: 'destructive',
        title: 'Telefone não cadastrado',
        description: 'Cadastre um telefone para o cliente',
      });
      return;
    }
    sendPaymentLinkViaWhatsApp(clienteTelefone, paymentUrl, clienteNome || 'Cliente', valor);
  };

  const handleSendViaEmail = () => {
    if (!clienteEmail) {
      toast({
        variant: 'destructive',
        title: 'Email não cadastrado',
        description: 'Cadastre um email para o cliente',
      });
      return;
    }
    sendPaymentLinkViaEmail(clienteEmail, paymentUrl, clienteNome || 'Cliente', valor);
  };

  const handleOpenLink = () => {
    window.open(paymentUrl, '_blank');
  };

  // Se já existe link e está pago
  if (existingStatus === 'paid') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="text-green-600" size={20} />
        <span className="text-sm text-green-600 font-medium">Pago via Stripe</span>
      </div>
    );
  }

  // Se existe link mas não foi pago ainda
  if (paymentUrl || existingPaymentUrl) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setIsDialogOpen(true)}
        >
          <CreditCard size={16} className="mr-2" />
          Ver Link de Pagamento
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Link de Pagamento Stripe</DialogTitle>
              <DialogDescription>
                Compartilhe este link com o cliente para receber o pagamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${statusInfo.color}`}>
                <p className="font-medium text-center">{statusInfo.label}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg break-all text-sm">
                {paymentUrl || existingPaymentUrl}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleCopyLink} variant="outline" className="w-full">
                  {copied ? <CheckCircle size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>

                <Button onClick={handleOpenLink} variant="outline" className="w-full">
                  <ExternalLink size={16} className="mr-2" />
                  Abrir Link
                </Button>
              </div>

              {clienteTelefone && (
                <Button onClick={handleSendViaWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                  <MessageCircle size={16} className="mr-2" />
                  Enviar por WhatsApp
                </Button>
              )}

              {clienteEmail && (
                <Button onClick={handleSendViaEmail} variant="outline" className="w-full">
                  <Mail size={16} className="mr-2" />
                  Enviar por Email
                </Button>
              )}

              <div className="text-sm text-gray-500 text-center">
                <p>Valor: R$ {valor.toFixed(2)}</p>
                {clienteNome && <p>Cliente: {clienteNome}</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // BotÍo para criar novo link
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCreatePaymentLink}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <CreditCard size={16} className="mr-2" />
          Gerar Link Stripe
        </>
      )}
    </Button>
  );
};

export default StripePaymentButton;
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


