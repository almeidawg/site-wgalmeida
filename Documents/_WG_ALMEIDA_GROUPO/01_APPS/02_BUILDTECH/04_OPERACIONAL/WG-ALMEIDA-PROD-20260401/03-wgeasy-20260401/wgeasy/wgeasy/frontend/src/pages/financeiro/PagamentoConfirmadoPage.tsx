import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PagamentoConfirmadoPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const parcelaId = searchParams.get('parcela');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Redirecionar automaticamente após 10 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/financeiro/lancamentos');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={64} className="text-green-600" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900 mb-4"
        >
          Pagamento Confirmado!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[12px] text-gray-600 mb-8"
        >
          Seu pagamento foi processado com sucesso através do Stripe.
          {parcelaId && (
            <span className="block mt-2 text-[12px]">
              Parcela: <strong>#{parcelaId.substring(0, 8)}</strong>
            </span>
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-[12px] text-blue-800">
              <strong>✅ Comprovante enviado por email</strong>
            </p>
            <p className="text-[12px] text-blue-600 mt-1">
              Você receberá um email de confirmaçÍo do Stripe com todos os detalhes da transaçÍo.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/financeiro/lancamentos')}
              className="w-full bg-[#2B4580] hover:bg-[#1e3060]"
            >
              <Receipt size={18} className="mr-2" />
              Ver Meus Lançamentos
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <Home size={18} className="mr-2" />
              Voltar ao Início
            </Button>
          </div>

          <p className="text-[12px] text-gray-500 mt-6">
            Redirecionando automaticamente em <strong>{countdown}s</strong>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <p className="text-[12px] text-gray-500">
            Pagamento processado com segurança por{' '}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#635BFF] hover:underline"
            >
              Stripe
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PagamentoConfirmadoPage;

