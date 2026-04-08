import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';

const Success = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        pathname="/success"
        title={`${t('seo.success.title')} - Grupo WG Almeida`}
        description={t('seo.success.description')}
        noindex
      />

      <div className="section-padding flex items-center justify-center bg-wg-gray-light">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-white p-8 md:p-16 rounded-2xl shadow-xl max-w-2xl mx-auto"
          >
            <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
            <h1 className="text-3xl md:text-5xl font-oswald font-light text-wg-black mb-4">
              {t('successPage.title')}
            </h1>
            <p className="text-lg text-wg-gray font-roboto leading-relaxed mb-8">
              {t('successPage.subtitle')}
            </p>
            <Link to="/store">
              <Button className="btn-primary text-lg px-8 py-4">
                {t('successPage.cta')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Success;
