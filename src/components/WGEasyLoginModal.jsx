import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { X, Mail, Lock, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { PRODUCT_URLS } from '@/data/company';

const WG_EASY_URL = PRODUCT_URLS.wgeasy;

const WGEasyLoginModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Redirecionar para WG Easy com o email preenchido
      // O usuário completará o login no sistema WG Easy
      const url = `${WG_EASY_URL}/login?email=${encodeURIComponent(email)}`;
      window.open(url, '_blank');
      onClose();
    } catch (err) {
      setError(t('wgEasyModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAccess = () => {
    window.open(WG_EASY_URL, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[101]"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-wg-orange to-wg-orange/80 p-6 text-white relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-light">WG Easy</h2>
                    <p className="text-white/80 text-sm">{t('wgEasyModal.subtitle')}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-6 text-center">
                  {t('wgEasyModal.description')}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
                    <input
                      type="email"
                      placeholder={t('wgEasyModal.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-orange focus:border-transparent transition-all"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-wg-orange hover:bg-wg-orange/90 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('wgEasyModal.loading')}
                      </>
                    ) : (
                      <>
                        {t('wgEasyModal.submit')}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleDirectAccess}
                    className="w-full text-center text-sm text-gray-600 hover:text-wg-orange transition-colors"
                  >
                    {t('wgEasyModal.directAccess')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WGEasyLoginModal;
