import SEO from '@/components/SEO'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { notificarNovoCadastro } from '@/lib/emailService'
import { motion } from '@/lib/motion-lite'
import { Check, Loader2, Lock, Mail, User, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

// Componente de validação de senha
const PasswordRequirement = ({ met, text }) => (
  <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
    {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    <span>{text}</span>
  </div>
)

const Register = () => {
  const { t } = useTranslation()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Validação de senha em tempo real
  const passwordValidation = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      isStrong:
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password),
    }),
    [password]
  )

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validar senha antes de enviar
    if (!passwordValidation.isStrong) {
      toast({
        variant: 'destructive',
        title: 'Senha fraca',
        description:
          'Sua senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: t('registerPage.toasts.passwordMismatch'),
      })
      return
    }
    setLoading(true)

    const { user, error } = await signUp(email, password, {
      data: {
        nome: nome,
      },
    })

    if (error) {
      // Traduzir erros comuns do Supabase
      let errorMessage = error.message
      if (error.message?.includes('weak_password')) {
        errorMessage =
          'Senha muito fraca. Use pelo menos 8 caracteres com letras maiúsculas, minúsculas e números.'
      } else if (error.message?.includes('already registered')) {
        errorMessage = 'Este email já está cadastrado.'
      }

      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: errorMessage,
      })
      setLoading(false)
      return
    }

    // Enviar notificacao por email para o admin
    try {
      await notificarNovoCadastro(nome, email)
    } catch (err) {
      console.error('Erro ao enviar notificacao:', err)
    }

    setLoading(false)

    toast({
      title: t('registerPage.toasts.successTitle'),
      description: t('registerPage.toasts.successDescription'),
    })
    navigate('/login')
  }

  return (
    <>
      <SEO
        pathname="/register"
        title={t('seo.register.title')}
        description={t('seo.register.description')}
        noindex
      />
      <div className="section-padding bg-wg-gray-light min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg"
        >
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                className="h-16 w-16 object-contain"
                alt={t('registerPage.logoAlt')}
                src="/images/logo-96.webp"
                width="96"
                height="96"
                decoding="async"
              />
            </div>
            <h1 className="text-3xl font-oswald text-wg-black">{t('registerPage.heading')}</h1>
            <p className="mt-2 text-wg-gray">{t('registerPage.subtitle')}</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm"
                  placeholder={t('registerPage.namePlaceholder')}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm"
                  placeholder={t('registerPage.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm ${
                    password.length > 0
                      ? passwordValidation.isStrong
                        ? 'border-green-500'
                        : 'border-wg-orange'
                      : 'border-gray-300'
                  }`}
                  placeholder={t('registerPage.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => setTimeout(() => setShowPasswordRequirements(false), 200)}
                />
              </div>

              {/* Requisitos de senha */}
              {(showPasswordRequirements || password.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-gray-50 rounded-md space-y-1"
                >
                  <p className="text-xs font-medium text-gray-600 mb-2">Requisitos da senha:</p>
                  <PasswordRequirement
                    met={passwordValidation.minLength}
                    text="Mínimo 8 caracteres"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasLowercase}
                    text="Pelo menos uma letra minúscula (a-z)"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasUppercase}
                    text="Pelo menos uma letra maiúscula (A-Z)"
                  />
                  <PasswordRequirement
                    met={passwordValidation.hasNumber}
                    text="Pelo menos um número (0-9)"
                  />
                </motion.div>
              )}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm"
                  placeholder={t('registerPage.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full btn-primary" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t('registerPage.submitting') : t('registerPage.submit')}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-wg-gray">
            {t('registerPage.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-wg-orange hover:text-wg-orange/80">
              {t('registerPage.loginLink')}
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}

export default Register
