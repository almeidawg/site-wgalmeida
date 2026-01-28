import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Send, MessageCircle, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage';
import { useTranslation } from 'react-i18next';

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  // Formatar telefone (apenas números brasileiros)
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    const limitedNumbers = numbers.slice(0, 11);
    if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('contacts').insert([
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      },
    ]);

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('contactPage.toast.errorTitle'),
        description: t('contactPage.toast.errorDescription'),
      });
    } else {
      toast({
        title: t('contactPage.toast.successTitle'),
        description: t('contactPage.toast.successDescription'),
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511984650002', '_blank');
  };

  return (
    <>
      <SEO
        title={t('seo.contact.title')}
        description={t('seo.contact.description')}
        keywords={t('seo.contact.keywords')}
        url="https://wgalmeida.com.br/contato"
      />

      {/* Hero elegante */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('contactPage.hero.imageAlt')}
            src="/images/banners/FALECONOSCO.webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/60 to-wg-black/80"></div>
        </motion.div>

        <div className="relative z-10 container-custom text-center text-white px-4">
          {/* Linha decorativa */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-wg-orange" />
            <div className="w-2 h-2 bg-wg-orange rounded-full" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-wg-orange" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-wg-orange font-medium tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            {t('contactPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-inter font-light mb-6 tracking-tight"
          >
            {t('contactPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl font-light max-w-3xl mx-auto opacity-90"
          >
            {t('contactPage.hero.subtitle')}
          </motion.p>
        </div>
      </section>

      <section className="section-padding bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Linha decorativa */}
              <motion.div
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="h-px w-12 bg-gradient-to-r from-wg-orange to-transparent" />
                <div className="w-2 h-2 bg-wg-orange rounded-full" />
              </motion.div>

              <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-sm mb-4 block">
                {t('contactPage.info.kicker')}
              </span>

              <h2 className="text-3xl md:text-4xl font-inter font-light text-wg-black mb-6 tracking-tight">
                {t('contactPage.info.title')}
              </h2>
              <p className="text-lg text-wg-gray leading-relaxed mb-10">
                {t('contactPage.info.subtitle')}
              </p>

              <div className="space-y-6 mb-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex items-start gap-4 p-4 bg-wg-gray-light rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-wg-orange/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-wg-black">{t('contactPage.info.phoneLabel')}</p>
                    <a href="tel:+5511991792291" className="text-wg-gray hover:text-wg-orange transition-colors">+55 11 99179-2291</a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex items-start gap-4 p-4 bg-wg-gray-light rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-wg-orange/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-wg-black">{t('contactPage.info.emailLabel')}</p>
                    <p className="text-wg-gray">contato@wgalmeida.com.br</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-start gap-4 p-4 bg-wg-gray-light rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-wg-orange/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-wg-black">{t('contactPage.info.addressLabel')}</p>
                    <p className="text-wg-gray">{t('contactPage.info.addressValue')}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-start gap-4 p-4 bg-wg-gray-light rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-wg-orange/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="font-inter font-semibold text-wg-black">{t('contactPage.info.hoursLabel')}</p>
                    <p className="text-wg-gray">{t('contactPage.info.hoursValue')}</p>
                  </div>
                </motion.div>
              </div>

              <Button onClick={handleWhatsApp} className="btn-primary w-full md:w-auto group">
                <MessageCircle className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                {t('contactPage.info.whatsappCta')}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="space-y-4">
                  <div>
                    <label className="block text-wg-black font-poppins font-semibold mb-2">
                      {t('contactPage.form.name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/20 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-wg-black font-poppins font-semibold mb-2">
                      {t('contactPage.form.email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/20 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-wg-black font-poppins font-semibold mb-2">
                      {t('contactPage.form.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      placeholder={t('contactPage.form.phonePlaceholder')}
                      maxLength={15}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/20 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-wg-black font-poppins font-semibold mb-2">
                      {t('contactPage.form.subject')}
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/20 outline-none transition-all"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-wg-black font-poppins font-semibold mb-2">
                      {t('contactPage.form.message')}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/20 outline-none transition-all resize-none"
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 w-5 h-5" />
                    )}
                    {loading ? t('contactPage.form.sending') : t('contactPage.form.submit')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
