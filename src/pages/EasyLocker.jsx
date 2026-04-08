import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Box, Lock, Smartphone, Truck, ShieldCheck, CheckCircle2, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const EasyLocker = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Smartphone,
      title: "Acesso via Smartphone",
      description: "Abertura simplificada via QR Code ou App, sem necessidade de chaves físicas.",
    },
    {
      icon: ShieldCheck,
      title: "Segurança de Alto Padrão",
      description: "Monitoramento 24h e estrutura reforçada para proteger as encomendas dos moradores.",
    },
    {
      icon: Truck,
      title: "Entrega Sem Contato",
      description: "Receba encomendas de qualquer transportadora a qualquer hora, com total conveniência.",
    },
    {
      icon: Box,
      title: "Módulos Customizáveis",
      description: "Design que se integra à arquitetura do condomínio, com tamanhos variados de gavetas.",
    },
  ];

  return (
    <>
      <SEO
        pathname="/easylocker"
        title="Easy Locker | Armários Inteligentes para Condomínios de Luxo"
        description="A solução definitiva para gestão de encomendas. Armários inteligentes automatizados com a tecnologia do Grupo WG Almeida."
      />

      {/* Hero Impactante */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt="Easy Locker Armários Inteligentes"
            src="/images/banners/MARCENARIA.webp"
            width="1920"
            height="1080"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-orange/40 via-wg-black/70 to-wg-black/90"></div>
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 1 }}
            className="w-20 h-20 bg-wg-orange rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-[0_0_30px_#F25C2660]"
          >
            <Lock className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-inter font-light mb-6 tracking-tighter"
          >
            EASY <span className="text-wg-orange">LOCKER</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl font-light max-w-2xl mx-auto opacity-90"
          >
            A revolução na recepção de encomendas para condomínios inteligentes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10"
          >
            <Link
              to="/solicite-proposta"
              className="btn-primary px-10 py-4 text-lg rounded-full"
            >
              Solicitar Orçamento
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, index) => (
              <motion.div
                key={index}
                {...fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-wg-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <item.icon className="w-8 h-8 text-wg-orange" />
                </div>
                <h3 className="text-xl font-light text-wg-black mb-3">{item.title}</h3>
                <p className="text-wg-gray text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Produto */}
      <section className="section-padding bg-wg-gray-light">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-wg-orange/10 rounded-3xl rotate-3" />
              <img
                src="/images/logo-easylocker.webp"
                alt="Easy Locker Detalhes"
                className="relative rounded-2xl shadow-2xl z-10 w-full h-[500px] object-cover bg-white"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
                  event.currentTarget.dataset.fallbackApplied = 'true';
                  event.currentTarget.src = '/images/banners/MARCENARIA.webp';
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-wg-orange font-bold tracking-widest uppercase text-sm mb-4 block">Conveniência Total</span>
              <h2 className="text-4xl md:text-5xl font-inter font-light text-wg-black mb-8 tracking-tight">
                Design que se integra ao seu <span className="font-bold">Lobby</span>
              </h2>
              
              <div className="space-y-6 mb-10">
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-wg-orange flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-wg-black">Instalação Plug & Play</h4>
                    <p className="text-wg-gray text-sm">Conectividade Wi-Fi e alimentação bivolt simplificada.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-wg-orange flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-wg-black">Gestão via Nuvem</h4>
                    <p className="text-wg-gray text-sm">Relatórios completos de uso e ocupação para o síndico.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-wg-orange flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-wg-black">Notificações em Tempo Real</h4>
                    <p className="text-wg-gray text-sm">Moradores recebem SMS/Push assim que a encomenda chega.</p>
                  </div>
                </div>
              </div>

              <Link
                to="/solicite-proposta"
                className="inline-flex items-center gap-2 text-wg-black font-bold border-b-2 border-wg-orange pb-1 hover:gap-4 transition-all"
              >
                Quero Easy Locker no meu condomínio
                <ArrowRight className="w-5 h-5 text-wg-orange" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default EasyLocker;
