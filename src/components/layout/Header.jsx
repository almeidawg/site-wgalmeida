import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart as ShoppingCartIcon, User, LogOut, Ruler, Building2, Hammer, Sparkles, Users, ExternalLink, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ShoppingCart from '@/components/ShoppingCart';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnitsMenuOpen, setUnitsMenuOpen] = useState(false);
  const [isMobileUnitsOpen, setMobileUnitsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems } = useCart();
  const { t } = useTranslation();

  const WG_EASY_URL = 'https://easy.wgalmeida.com.br';
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUnitsMenuOpen(false);
    setMobileUnitsOpen(false);
  }, [location]);

  const navItems = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.about'), path: '/sobre' },
    { label: t('nav.brand'), path: '/a-marca' },
    { label: t('nav.projects'), path: '/projetos' },
    { label: t('nav.process'), path: '/processo' },
    { label: t('nav.blog'), path: '/blog' },
    { label: 'FAQ', path: '/faq' },
    { label: t('nav.store'), path: '/store' },
    { label: t('nav.contact'), path: '/contato' },
  ];

  const unitsItems = [
    {
      label: t('nav.architecture'),
      path: '/arquitetura',
      icon: Ruler,
      description: t('header.units.architecture'),
      borderHoverClass: 'hover:border-wg-green',
      iconClass: 'text-wg-green',
    },
    {
      label: t('nav.engineering'),
      path: '/engenharia',
      icon: Building2,
      description: t('header.units.engineering'),
      borderHoverClass: 'hover:border-wg-blue',
      iconClass: 'text-wg-blue',
    },
    {
      label: t('nav.carpentry'),
      path: '/marcenaria',
      icon: Hammer,
      description: t('header.units.carpentry'),
      borderHoverClass: 'hover:border-wg-brown',
      iconClass: 'text-wg-brown',
    },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-20">
            <div className="flex-1 lg:flex-none">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  className="h-12 w-auto object-contain"
                  alt="Logo Grupo WG Almeida"
                  src="https://horizons-cdn.hostinger.com/ecd6def3-e7f7-499d-a5da-01e5a1244126/0747e40fd2207f6e57c1ba9ed62854ad.png"
                  width="183"
                  height="48"
                />
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center flex-1 space-x-6">
              {navItems.slice(0, 3).map((item) => (
                 <Link
                    key={item.label}
                    to={item.path}
                    className={`text-wg-gray hover:text-wg-orange transition-colors font-poppins font-medium ${
                      location.pathname === item.path ? 'text-wg-orange' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
              ))}

              {/* Mega Menu Trigger */}
              <div className="relative" onMouseEnter={() => setUnitsMenuOpen(true)} onMouseLeave={() => setUnitsMenuOpen(false)}>
                <button className="flex items-center space-x-1 text-wg-gray hover:text-wg-orange transition-colors font-poppins font-medium">
                  <span>{t('header.unitsLabel')}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isUnitsMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-screen max-w-3xl"
                    >
                      <div className="bg-white shadow-lg rounded-lg overflow-hidden grid grid-cols-3 gap-4 p-6 border border-gray-100">
                        {unitsItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className={`group block p-4 rounded-lg hover:bg-gray-50 transition-colors border-l-4 border-transparent ${subItem.borderHoverClass}`}
                          >
                            <div className="flex items-center mb-2">
                              <subItem.icon className={`w-6 h-6 mr-3 ${subItem.iconClass}`} />
                              <span className="font-poppins font-semibold text-wg-black group-hover:text-wg-orange">{subItem.label}</span>
                            </div>
                            <p className="text-sm text-wg-gray">{subItem.description}</p>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navItems.slice(3).map((item) => (
                 <Link
                    key={item.label}
                    to={item.path}
                    className={`text-wg-gray hover:text-wg-orange transition-colors font-poppins font-medium ${
                      location.pathname === item.path ? 'text-wg-orange' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-2 md:gap-3 flex-1 lg:flex-none">
              {/* Seletor de Idioma */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>

              {/* Carrinho */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={t('header.cartAria')}
                className="relative flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm hover:border-wg-orange hover:shadow-md transition-all"
              >
                <ShoppingCartIcon className="h-5 w-5 text-wg-black" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-wg-orange text-white text-xs font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Botão WG Easy - Acesso direto ao sistema */}
              <a
                href={WG_EASY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-wg-orange text-white rounded-full font-medium text-sm hover:bg-wg-orange/90 hover:shadow-md transition-all"
              >
                <Monitor className="h-4 w-4" />
                <span>{t('header.wgEasy')}</span>
              </a>

              <button
                className="lg:hidden text-wg-black"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t"
            >
              <nav className="container-custom py-4 space-y-2">
                {[...navItems.slice(0,3), {label: 'Unidades', dropdown: unitsItems}, ...navItems.slice(3)].map((item, index) => (
                  <div key={index}>
                    {item.dropdown ? (
                      <>
                        <button
                          onClick={() => setMobileUnitsOpen((prev) => !prev)}
                          className="w-full text-left px-4 py-3 text-wg-gray hover:text-wg-orange transition-colors font-poppins flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isMobileUnitsOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isMobileUnitsOpen && (
                          <div className="pl-4 space-y-1 bg-gray-50 rounded-md mx-4">
                            {item.dropdown.map((subItem) => (
                              <Link
                                key={subItem.label}
                                to={subItem.path}
                                className="block px-4 py-2 text-wg-gray hover:text-wg-orange transition-colors text-sm"
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        className={`block px-4 py-3 text-wg-gray hover:text-wg-orange transition-colors font-poppins ${
                          location.pathname === item.path ? 'text-wg-orange' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
                <div className="px-4 pt-4 space-y-3">
                  {/* Seletor de Idioma Mobile */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className="text-sm text-wg-gray">{t('header.languageLabel')}</span>
                    <LanguageSelector variant="compact" />
                  </div>
                  <a
                    href={WG_EASY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-wg-orange text-white rounded-lg font-medium hover:bg-wg-orange/90 transition-all"
                  >
                    <Monitor className="h-5 w-5" />
                    <span>{t('header.wgEasyAccess')}</span>
                  </a>
                  <Link to="/contato" className="block">
                    <Button className="btn-primary w-full">{t('header.ctaSpecialist')}</Button>
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </>
  );
};

export default Header;
