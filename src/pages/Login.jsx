import SEO from '@/components/SEO'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { motion } from '@/lib/motion-lite'
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

const Login = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { profile, error } = await signIn(email, password)

    if (error) {
      setLoading(false)
      return
    }

    if (profile) {
      if (profile.role === 'admin') {
        toast({
          title: t('loginPage.toasts.adminSuccessTitle'),
          description: t('loginPage.toasts.adminSuccessDescription'),
        })
        navigate('/admin', { replace: true })
      } else {
        toast({
          title: t('loginPage.toasts.successTitle'),
          description: t('loginPage.toasts.successDescription'),
        })
        navigate(from, { replace: true })
      }
    } else {
      toast({
        variant: 'destructive',
        title: t('loginPage.toasts.unexpectedErrorTitle'),
        description: t('loginPage.toasts.unexpectedErrorDescription'),
      })
      setLoading(false)
    }
  }

  return (
    <>
      <SEO
        pathname="/login"
        title={t('seo.login.title')}
        description={t('seo.login.description')}
        noindex
      />

      {/* Fundo escuro premium */}
      <div className="min-h-screen bg-wg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Faixa laranja no topo */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-wg-orange" />

        {/* Textura sutil · grade discreta */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-sm"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/logo-96.webp"
              alt={t('loginPage.logoAlt')}
              width="72"
              height="72"
              decoding="async"
              className="h-[72px] w-[72px] object-contain"
            />
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="font-oswald text-[2.25rem] text-white tracking-[0.15em] uppercase leading-none">
              Área Interna
            </h1>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="block h-px w-10 bg-wg-orange/60" />
              <span className="text-[10px] font-spartan tracking-[0.22em] uppercase text-gray-500">
                Grupo WG Almeida
              </span>
              <span className="block h-px w-10 bg-wg-orange/60" />
            </div>
          </div>

          {/* Card do formulário */}
          <div className="bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Barra de acento no topo do card */}
            <div className="h-1 bg-gradient-to-r from-wg-orange to-wg-orange-dark" />

            <div className="px-8 py-8">
              <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
                {/* E-mail */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="wg-email-field"
                    name="wg-email"
                    type="email"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wg-orange/40 focus:border-wg-orange transition-colors"
                  />
                </div>

                {/* Senha */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="wg-password-field"
                    name="wg-password"
                    type="password"
                    autoComplete="off"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wg-orange/40 focus:border-wg-orange transition-colors"
                  />
                </div>

                {/* Botão entrar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-wg-orange hover:bg-wg-orange-dark text-white font-oswald text-sm tracking-[0.1em] uppercase rounded-xl transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-gray-600">
            <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
            <span>Acesso restrito a colaboradores autorizados</span>
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default Login
