import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Bot, Cpu, Zap, BarChart, ArrowRight, ShieldCheck, Rocket, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const BuildTech = () => {
  const { t } = useTranslation();

  const services = [
    {
      icon: Bot,
      title: "Consultoria de IA para Construção",
      description: "Implementação estratégica de Inteligência Artificial para otimizar processos de projeto, orçamento e gestão de obras.",
    },
    {
      icon: LayoutDashboard,
      title: "Licenciamento WG Easy",
      description: "Acesse a plataforma completa de gestão que utilizamos no Grupo WG Almeida para controlar leads, propostas e obras.",
    },
    {
      icon: Cpu,
      title: "Automação de Workflow",
      description: "Elimine tarefas repetitivas e conecte seu canteiro de obras ao escritório com dados em tempo real.",
    },
    {
      icon: BarChart,
      title: "Data Intelligence",
      description: "Análise preditiva de custos e prazos para garantir que seus projetos sejam entregues com precisão matemática.",
    },
  ];

  return (
    <>
      <SEO
        pathname="/buildtech"
        title="WG Build.tech | Consultoria de IA e Tecnologia para Construção"
        description="Liderança mundial em arquitetura e tecnologia. Conheça as soluções de IA e o ecossistema WG Easy para o mercado imobiliário."
      />

      {/* Hero Tecnológico */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt="Tecnologia WG Build.tech"
            src="/images/banners/PROCESSOS.webp" 
            width="1920"
            height="1080"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-blue/60 via-wg-blue/80 to-wg-black/90"></div>
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-wg-orange" />
            <div className="w-2 h-2 bg-wg-orange rounded-full shadow-[0_0_10px_#F25C26]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-wg-orange" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-wg-orange font-medium tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            A Próxima Fronteira da Construção
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-inter font-light mb-6 tracking-tight"
          >
            WG <span className="font-bold text-wg-orange">Build.tech</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-90"
          >
            Transformamos o canteiro de obras em um ecossistema inteligente orientado por dados e IA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8"
          >
            <Link
              to="/solicite-proposta"
              className="inline-flex items-center gap-2 px-8 py-3 bg-wg-orange text-white rounded-full hover:bg-wg-orange/90 transition-all shadow-lg hover:shadow-wg-orange/20"
            >
              Falar com Especialista
              <Zap className="w-4 h-4 fill-white" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Serviços Tech */}
      <section className="section-padding bg-wg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-blue rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-wg-orange/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-wg-orange/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-wg-orange" />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Destaque WG Easy */}
          <motion.div
            {...fadeInUp}
            className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-wg-blue/20 to-wg-orange/10 border border-white/10 flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-1">
              <span className="text-wg-orange font-bold text-sm tracking-widest uppercase mb-4 block">Powered by WG Easy</span>
              <h2 className="text-3xl md:text-5xl font-light mb-6 tracking-tight">O Sistema de Gestão das Maiores Obras de Luxo</h2>
              <p className="text-white/70 text-lg mb-8">
                Utilize a mesma tecnologia que permitiu ao Grupo WG Almeida escalar sua operação para o nível Enterprise. Do CRM ao controle de suprimentos em um só lugar.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <ShieldCheck className="w-5 h-5 text-wg-orange" />
                  Segurança de dados padrão bancário
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Rocket className="w-5 h-5 text-wg-orange" />
                  Implementação rápida em 15 dias
                </li>
              </ul>
              <Link
                to="/solicite-proposta"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all"
              >
                Solicitar Demonstração
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10">
                 <img src="/images/imagens/CONSTRUTORA-BROOKLIN.webp" alt="Interface WG Easy" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-wg-blue/20 flex items-center justify-center">
                    <div className="p-4 bg-wg-black/80 backdrop-blur-md rounded-xl text-center">
                       <LayoutDashboard className="w-12 h-12 text-wg-orange mx-auto mb-2" />
                       <span className="text-xs font-bold uppercase tracking-tighter">Dashboard Ativo</span>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default BuildTech;
