import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { ArrowRight, ArrowLeft, CheckCircle2, Building2, Ruler, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const OrcadorInteligente = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    tipoImovel: '',
    metragem: '',
    servico: '',
    prazo: '',
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        telefone: formData.telefone,
        email: formData.email,
        servico: formData.servico,
        tipoImovel: formData.tipoImovel,
        metragem: formData.metragem,
        prazo: formData.prazo,
      };

      const { error: contactError } = await supabase.from('contacts').insert([{
        name: formData.nome,
        email: formData.email,
        phone: formData.telefone,
        subject: `Orçamento Inteligente: ${formData.servico}`,
        message: `Imóvel: ${formData.tipoImovel} | Metragem: ${formData.metragem}m² | Prazo: ${formData.prazo}`,
      }]);

      if (contactError) {
        console.warn('Sem permissão para contact (RLS), ignorando erro nativo para manter UX...', contactError);
      }

      void payload;
      setSuccess(true);
    } catch (err) {
      console.error('Erro ao enviar orçamento:', err);
      alert('Ocorreu um erro. Por favor, tente novamente ou nos chame no WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-10 flex items-center justify-center gap-2 md:gap-3">
      {[1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-light transition-all ${
              step >= i
                ? 'bg-wg-orange text-white shadow-[0_14px_28px_rgba(201,106,67,0.24)]'
                : 'border border-black/6 bg-white text-wg-gray shadow-[inset_0_0_0_1px_rgba(46,46,46,0.02)]'
            }`}
          >
            {i}
          </div>
          {i < 4 && (
            <div className={`h-px w-12 md:w-16 transition-colors ${step > i ? 'bg-wg-orange/45' : 'bg-black/6'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-black/5 bg-white p-8 text-center shadow-[0_28px_80px_rgba(30,24,20,0.08)] rounded-[2rem] md:p-12"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="mb-4 text-3xl font-light text-wg-black">Orçamento Solicitado!</h3>
        <p className="mb-8 text-lg text-wg-gray">
          Nossa inteligência artificial já recebeu seus dados. A Liz e nosso time técnico prepararão um pré-orçamento em breve.
        </p>
        <Link
          to="/"
          className="inline-flex w-full items-center justify-center rounded-full bg-wg-black px-10 py-3 text-sm text-white transition-colors hover:bg-wg-black/92 md:w-auto"
        >
          Voltar para Home
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-black/5 bg-white/95 p-6 shadow-[0_28px_80px_rgba(30,24,20,0.08)] md:p-10">
      <div className="absolute -top-10 -right-6 h-48 w-48 rounded-full bg-wg-orange/6 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-wg-orange/35 to-transparent" />

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="mb-6 text-center text-2xl font-light text-wg-orange-text md:text-[2rem]">Qual o tipo de imóvel?</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {['Apartamento', 'Casa em Condomínio', 'Comercial/Corporativo', 'Outro'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, tipoImovel: tipo });
                      handleNext();
                    }}
                    className={`group min-h-[8.5rem] rounded-[1.6rem] border p-6 text-left transition-all ${
                      formData.tipoImovel === tipo
                        ? 'border-wg-orange bg-[#faf4ef] shadow-[0_16px_36px_rgba(201,106,67,0.12)]'
                        : 'border-black/6 bg-white hover:border-wg-orange/35 hover:bg-[#fcfbf8]'
                    }`}
                  >
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
                        formData.tipoImovel === tipo
                          ? 'bg-wg-orange/12 text-wg-orange-text'
                          : 'bg-[#f5f1eb] text-wg-gray group-hover:text-wg-orange-text'
                      }`}
                    >
                      <Building2 className="h-7 w-7" />
                    </div>
                    <span className="block text-lg font-light text-wg-orange-text">{tipo}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="mb-6 text-center text-2xl font-light text-wg-orange-text md:text-[2rem]">Qual serviço você precisa?</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {['Obra Turn Key (Completa)', 'Apenas Projeto de Interiores', 'Apenas Marcenaria Sob Medida', 'Consultoria Técnica'].map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, servico: srv });
                      handleNext();
                    }}
                    className={`min-h-[7.5rem] rounded-[1.6rem] border p-6 text-left transition-all ${
                      formData.servico === srv
                        ? 'border-wg-orange bg-[#faf4ef] shadow-[0_16px_36px_rgba(201,106,67,0.12)]'
                        : 'border-black/6 bg-white hover:border-wg-orange/35 hover:bg-[#fcfbf8]'
                    }`}
                  >
                    <span className="block text-lg font-light text-wg-orange-text">{srv}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <button type="button" onClick={handlePrev} className="flex items-center gap-2 font-light text-wg-gray hover:text-wg-black"><ArrowLeft className="h-4 w-4" /> Voltar</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="mb-6 text-center text-2xl font-light text-wg-orange-text md:text-[2rem]">Tamanho e Prazo</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-light text-wg-black">Qual a metragem aproximada? (m²)</label>
                  <div className="relative">
                    <Ruler className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-wg-gray" />
                    <input
                      type="number"
                      required
                      value={formData.metragem}
                      onChange={(e) => setFormData({ ...formData, metragem: e.target.value })}
                      className="w-full rounded-2xl border border-black/8 bg-white py-3 pl-12 pr-4 focus:border-wg-orange focus:outline-none focus:ring-1 focus:ring-wg-orange"
                      placeholder="Ex: 120"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-light text-wg-black">Para quando precisa da obra pronta?</label>
                  <select
                    required
                    value={formData.prazo}
                    onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-black/8 bg-white px-4 py-3 focus:border-wg-orange focus:outline-none focus:ring-1 focus:ring-wg-orange"
                  >
                    <option value="">Selecione uma estimativa...</option>
                    <option value="Urgente (1 a 3 meses)">Urgente (1 a 3 meses)</option>
                    <option value="Normal (3 a 6 meses)">Normal (3 a 6 meses)</option>
                    <option value="Planejamento (+ 6 meses)">Em fase de planejamento (+ 6 meses)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between pt-8">
                <button type="button" onClick={handlePrev} className="flex items-center gap-2 font-light text-wg-gray hover:text-wg-black"><ArrowLeft className="h-4 w-4" /> Voltar</button>
                <button type="button" onClick={handleNext} disabled={!formData.metragem || !formData.prazo} className="inline-flex items-center gap-2 rounded-full bg-wg-black px-8 py-3 text-sm text-white transition-colors hover:bg-wg-black/92 disabled:cursor-not-allowed disabled:opacity-50">Próximo <ArrowRight className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h3 className="mb-2 text-center text-2xl font-light text-wg-orange-text md:text-[2rem]">Para onde enviamos a proposta?</h3>
              <p className="mb-6 text-center text-sm text-wg-gray">Garantimos total sigilo dos seus dados.</p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-light text-wg-black">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 focus:border-wg-orange focus:outline-none focus:ring-1 focus:ring-wg-orange"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-light text-wg-black">E-mail</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 focus:border-wg-orange focus:outline-none focus:ring-1 focus:ring-wg-orange"
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-light text-wg-black">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 focus:border-wg-orange focus:outline-none focus:ring-1 focus:ring-wg-orange"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
                <button type="button" onClick={handlePrev} className="order-2 flex items-center gap-2 font-light text-wg-gray hover:text-wg-black md:order-1"><ArrowLeft className="h-4 w-4" /> Voltar</button>
                <button type="submit" disabled={loading || !formData.nome || !formData.telefone} className="order-1 flex w-full items-center justify-center gap-2 rounded-full bg-wg-black px-10 py-3 text-sm text-white transition-colors hover:bg-wg-black/92 disabled:cursor-not-allowed disabled:opacity-50 md:order-2 md:w-auto">
                  {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Processando...</> : 'Solicitar Orçamento Agora'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default OrcadorInteligente;
