import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { profile, error } = await signIn(email, password);

    if (error) {
      setLoading(false);
      return; // Toast is handled in the context
    }

    if (profile) {
      if (profile.role === 'admin') {
        toast({
          title: t('loginPage.toasts.adminSuccessTitle'),
          description: t('loginPage.toasts.adminSuccessDescription'),
        });
        // Redirect to external admin panel
        window.location.href = 'https://easy.wgalmeida.com.br';
      } else {
        toast({
          title: t('loginPage.toasts.successTitle'),
          description: t('loginPage.toasts.successDescription'),
        });
        navigate(from, { replace: true });
      }
    } else {
      // This case should ideally not be reached if signIn is robust
      toast({
        variant: 'destructive',
        title: t('loginPage.toasts.unexpectedErrorTitle'),
        description: t('loginPage.toasts.unexpectedErrorDescription'),
      });
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('seo.login.title')}</title>
        <meta name="description" content={t('seo.login.description')} />
      </Helmet>
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
                  className="h-16 w-auto object-contain"
                  alt={t('loginPage.logoAlt')}
                  src="/images/logo.png"
                />
            </div>
            <h1 className="text-3xl font-oswald font-bold text-wg-black">{t('loginPage.heading')}</h1>
            <p className="mt-2 text-wg-gray">{t('loginPage.subtitle')}</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm"
                  placeholder={t('loginPage.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative mt-4">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-wg-orange focus:border-wg-orange focus:z-10 sm:text-sm"
                  placeholder={t('loginPage.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full btn-primary" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t('loginPage.submitting') : t('loginPage.submit')}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-wg-gray">
            {t('loginPage.noAccount')}{' '}
            <Link to="/register" className="font-medium text-wg-orange hover:text-wg-orange/80">
              {t('loginPage.createAccount')}
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
