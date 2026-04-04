import React from 'react';
import { motion } from '@/lib/motion-lite';
import { useTranslation } from 'react-i18next';

const CallToAction = () => {
  const { t } = useTranslation();
  return (
    <motion.p
      className='text-md text-white max-w-lg mx-auto'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      {t('cta.message')}
    </motion.p>
  );
};

export default CallToAction;
