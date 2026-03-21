import React from 'react';
import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { Wine, Package, Star, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Animações
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const services = [
  {
    icon: Wine,
    title: 'Curadoria de Vinhos',
    description: 'Seleção exclusiva de rótulos nacionais e importados, com foco em qualidade e custo-benefício para cada ocasião.',
  },
  {
    icon: Package,
    title: 'Clube de Assinatura',
    description: 'Receba mensalmente vinhos selecionados por sommeliers diretamente na sua casa, com experiências exclusivas para assinantes.',
  },
  {
    icon: Star,
    title: 'Experiências & Eventos',
    description: 'Harmonizações, degustações e eventos privados para empresas e celebrações especiais.',
  },
  {
    icon: MapPin,
    title: 'Entrega em São Paulo',
    description: 'Delivery rápido para toda a Grande São Paulo, com embalagem adequada para garantir a qualidade dos rótulos.',
  },
];

const Wnomas = () => {
  return (
    <>
      <SEO
        pathname="/wnomas"
        title="W Nomas Vinhos & Cia — Curadoria de Vinhos | Grupo WG Almeida"
        description="Vinhos selecionados, clube de assinatura e experiências exclusivas. W Nomas Vinhos & Cia, empresa do Grupo WG Almeida."
      />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden hero-under-header bg-wg-black">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#4a0e1a]/70 via-[#2d0810]/60 to-wg-black/90" />
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="h-px w-16 bg-[#8B1A2E]" />
            <span className="text-[#C09040] text-xs tracking-[0.35em] uppercase font-light">
              Grupo WG Almeida
            </span>
            <div className="h-px w-16 bg-[#8B1A2E]" />
          </motion.div>

          <motion.h1
            className="font-serif text-4xl md:text-6xl font-light text-white mb-4 tracking-wide"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            W Nomas <em className="text-[#C09040] not-italic">Vinhos &amp; Cia</em>
          </motion.h1>

          <motion.p
            className="text-white/70 text-lg font-light max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
          >
            Curadoria de vinhos, clube de assinatura e experiências exclusivas para amantes da boa bebida.
          </motion.p>
        </div>
      </section>

      {/* Serviços */}
      <section className="py-24 bg-white">
        <div className="container-custom px-4">
          <motion.div className="text-center mb-16" {...fadeInUp}>
            <span className="text-[#8B1A2E] text-xs tracking-[0.3em] uppercase font-light">O que oferecemos</span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-wg-black mt-3">
              Uma experiência completa com vinhos
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={index}
                  className="p-8 border border-gray-100 hover:border-[#8B1A2E]/30 transition-colors group"
                  {...fadeInUp}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="w-12 h-12 rounded-full bg-[#8B1A2E]/10 flex items-center justify-center mb-6 group-hover:bg-[#8B1A2E]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[#8B1A2E]" />
                  </div>
                  <h3 className="font-serif text-xl font-light text-wg-black mb-3">{service.title}</h3>
                  <p className="text-gray-500 font-light leading-relaxed text-sm">{service.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1a0508]">
        <div className="container-custom px-4 text-center">
          <motion.div {...fadeInUp}>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Descubra o mundo dos vinhos
            </h2>
            <p className="text-white/60 font-light mb-10 max-w-md mx-auto">
              Assine nosso clube ou faça seu pedido avulso. Entregamos em toda a Grande São Paulo.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/5511976889417?text=Quero+saber+mais+sobre+a+W+Nomas+Vinhos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#C09040] text-white text-sm tracking-widest uppercase font-light hover:bg-[#a07830] transition-colors"
              >
                Falar com a equipe
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white text-sm tracking-widest uppercase font-light hover:border-white/60 transition-colors"
              >
                Voltar ao grupo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Wnomas;
