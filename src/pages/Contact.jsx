import ResponsiveWebpImage from '@/components/ResponsiveWebpImage'
import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/customSupabaseClient'
import { notificarNovoContato } from '@/lib/emailService'
import { motion } from '@/lib/motion-lite'
import { Clock, Loader2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

// Animações elegantes
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
}

const Contact = () => {
  const { toast } = useToast()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  // Formatar telefone (apenas números brasileiros)
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '')
    const limitedNumbers = numbers.slice(0, 11)
    if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    }
    return limitedNumbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  }

  const isValidEmail = (email) => /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isValidEmail(formData.email)) {
        throw new Error('Insira um e-mail válido (ex: nome@email.com)')
      }

      // Salvar no Supabase
      const { error } = await supabase.from('contacts').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          utm_source: searchParams.get('utm_source') || null,
          utm_medium: searchParams.get('utm_medium') || null,
          utm_campaign: searchParams.get('utm_campaign') || null,
          origem: searchParams.get('utm_source')
            ? `site-${searchParams.get('utm_source')}`
            : 'site',
        },
      ])

      if (error) throw error

      // Enviar notificação por email para william@wgalmeida.com.br
      await notificarNovoContato(
        formData.name,
        formData.email,
        formData.phone,
        formData.subject,
        formData.message
      )

      toast({
        title: t('contactPage.toast.successTitle'),
        description: t('contactPage.toast.successDescription'),
      })
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('contactPage.toast.errorTitle'),
        description: t('contactPage.toast.errorDescription'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    window.open('https://wa.me/5511984650002', '_blank')
  }

  return (
    <>
      <SEO
        pathname="/contato"
        title={t('seo.contact.title')}
        description={t('seo.contact.description')}
        keywords={t('seo.contact.keywords')}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contato | Grupo WG Almeida',
          url: 'https://wgalmeida.com.br/contato',
          mainEntity: {
            '@type': 'Organization',
            name: 'Grupo WG Almeida',
            telephone: '+5511984650002',
            email: 'contato@wgalmeida.com.br',
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: '+5511984650002',
              contactType: 'customer service',
              availableLanguage: 'Portuguese',
              areaServed: 'BR',
            },
          },
        }}
      />

      {/* Hero elegante */}
      <section className="wg-page-hero wg-page-hero--store hero-under-header">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <ResponsiveWebpImage
            className="w-full h-full object-cover"
            alt={t('contactPage.hero.imageAlt')}
            src="/images/banners/FALECONOSCO.webp"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wg-black/40 via-wg-black/50 to-wg-black/70"></div>
        </motion.div>

        <div className="container-custom">
          <div className="wg-page-hero-content px-4 pt-8 md:pt-10">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="wg-page-hero-kicker text-wg-orange"
          >
            {t('contactPage.hero.kicker')}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="wg-page-hero-title"
          >
            {t('contactPage.hero.title')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="wg-page-hero-subtitle max-w-3xl"
          >
            {t('contactPage.hero.subtitle')}
          </motion.p>
          </div>
        </div>
      </section>

      <section className="section-padding-tight-top bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-wg-green rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <motion.div
                className="mb-8 flex items-center gap-4"
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="h-px w-12 bg-gradient-to-r from-wg-orange to-transparent" />
                <div className="h-2 w-2 rounded-full bg-wg-orange" />
              </motion.div>

              <span className="mb-4 block text-sm uppercase tracking-[0.2em] text-wg-orange">
                {t('contactPage.info.kicker')}
              </span>

              <h2 className="mb-5 text-3xl font-inter font-light tracking-tight text-wg-black md:text-[2.35rem]">
                {t('contactPage.info.title')}
              </h2>
              <p className="mb-8 max-w-[34rem] text-[17px] leading-[1.8] text-wg-gray">
                {t('contactPage.info.subtitle')}
              </p>

              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="flex items-start gap-4 rounded-2xl border border-black/5 bg-[#f7f6f3] p-5 transition-all hover:border-black/10 hover:shadow-[0_14px_34px_rgba(20,20,20,0.05)]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-wg-orange/10">
                    <Phone className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="mb-1 text-base font-inter font-light text-wg-black">{t('contactPage.info.phoneLabel')}</p>
                    <a
                      href="https://wa.me/5511984650002"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] leading-relaxed text-wg-gray transition-colors hover:text-wg-orange"
                    >
                      +55 (11) 98465-0002
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex items-start gap-4 rounded-2xl border border-black/5 bg-[#f7f6f3] p-5 transition-all hover:border-black/10 hover:shadow-[0_14px_34px_rgba(20,20,20,0.05)]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-wg-orange/10">
                    <Mail className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="mb-1 text-base font-inter font-light text-wg-black">{t('contactPage.info.emailLabel')}</p>
                    <p className="text-[15px] leading-relaxed text-wg-gray">contato@wgalmeida.com.br</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex items-start gap-4 rounded-2xl border border-black/5 bg-[#f7f6f3] p-5 transition-all hover:border-black/10 hover:shadow-[0_14px_34px_rgba(20,20,20,0.05)]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-wg-orange/10">
                    <MapPin className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="mb-1 text-base font-inter font-light text-wg-black">{t('contactPage.info.addressLabel')}</p>
                    <p className="text-[15px] leading-relaxed text-wg-gray">{t('contactPage.info.addressValue')}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-start gap-4 rounded-2xl border border-black/5 bg-[#f7f6f3] p-5 transition-all hover:border-black/10 hover:shadow-[0_14px_34px_rgba(20,20,20,0.05)]"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-wg-orange/10">
                    <Clock className="w-5 h-5 text-wg-orange" />
                  </div>
                  <div>
                    <p className="mb-1 text-base font-inter font-light text-wg-black">{t('contactPage.info.hoursLabel')}</p>
                    <p className="text-[15px] leading-relaxed text-wg-gray">{t('contactPage.info.hoursValue')}</p>
                  </div>
                </motion.div>
              </div>

              <Button onClick={handleWhatsApp} className="wg-btn-pill-primary w-full group sm:w-auto">
                <MessageCircle className="mr-2 w-5 h-5 transition-transform group-hover:scale-110" />
                {t('contactPage.info.whatsappCta')}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <form
                onSubmit={handleSubmit}
                className="flex flex-col rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_18px_50px_rgba(20,20,20,0.05)] md:p-7"
              >
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-light text-wg-black/88">
                        {t('contactPage.form.name')}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-[15px] outline-none transition-all focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/15"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-light text-wg-black/88">
                        {t('contactPage.form.email')}
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-[15px] outline-none transition-all focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/15"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-light text-wg-black/88">
                        {t('contactPage.form.phone')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: formatPhone(e.target.value) })
                        }
                        placeholder={t('contactPage.form.phonePlaceholder')}
                        maxLength={15}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-[15px] outline-none transition-all focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/15"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-light text-wg-black/88">
                        {t('contactPage.form.subject')}
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-[15px] outline-none transition-all focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/15"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-light text-wg-black/88">
                      {t('contactPage.form.message')}
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="min-h-[156px] w-full resize-none rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-[15px] outline-none transition-all focus:border-wg-orange focus:ring-2 focus:ring-wg-orange/15"
                      disabled={loading}
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="wg-btn-pill-primary w-full" disabled={loading}>
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 w-5 h-5" />
                      )}
                      {loading ? t('contactPage.form.sending') : t('contactPage.form.submit')}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact

