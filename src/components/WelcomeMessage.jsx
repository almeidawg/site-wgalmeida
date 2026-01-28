import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const WelcomeMessage = () => {
  const { t } = useTranslation();
  return (
    <motion.p
      className='text-xl md:text-2xl text-white max-w-2xl mx-auto'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {t('welcomeMessage')}
    </motion.p>
  );
};

export default WelcomeMessage;
