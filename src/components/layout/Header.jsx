import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart as ShoppingCartIcon, Ruler, Building2, Hammer, Monitor, Globe } from 'lucide-react';
// Removido Framer Motion para reduzir bundle e melhorar TBT
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';

const ShoppingCart = lazy(() => import('@/components/ShoppingCart'));

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUnitsMenuOpen, setUnitsMenuOpen] = useState(false);
  const [isMobileUnitsOpen, setMobileUnitsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems } = useCart();
  const { t } = useTranslation();

  const WG_EASY_URL = 'https://easy.wgalmeida.com.br';
  const MANAGEMENT_URL = '/admin';
  const location = useLocation();

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUnitsMenuOpen(false);
    setMobileUnitsOpen(false);
  }, [location]);

  const navItems = useMemo(() => [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.about'), path: '/sobre' },
    { label: t('nav.brand'), path: '/a-marca' },
    { label: t('nav.projects'), path: '/projetos' },
    { label: t('nav.process'), path: '/processo' },
    { label: t('nav.blog'), path: '/blog' },
    { label: 'FAQ', path: '/faq' },
    { label: t('nav.store'), path: '/store' },
    { label: t('nav.contact'), path: '/contato' },
  ], [t]);

  const unitsItems = useMemo(() => [
    {
      label: t('nav.architecture'),
      path: '/arquitetura',
      icon: Ruler,
      description: t('header.units.architecture'),
      borderHoverClass: 'hover:border-wg-green',
      iconClass: 'text-wg-green',
      hoverTextClass: 'group-hover:text-wg-green',
    },
    {
      label: t('nav.engineering'),
      path: '/engenharia',
      icon: Building2,
      description: t('header.units.engineering'),
      borderHoverClass: 'hover:border-wg-blue',
      iconClass: 'text-wg-blue',
      hoverTextClass: 'group-hover:text-wg-blue',
    },
    {
      label: t('nav.carpentry'),
      path: '/marcenaria',
      icon: Hammer,
      description: t('header.units.carpentry'),
      borderHoverClass: 'hover:border-wg-brown',
      iconClass: 'text-wg-brown',
      hoverTextClass: 'group-hover:text-wg-brown',
    },
  ], [t]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[80] relative transition-all duration-300 bg-white ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between" style={{ height: 'var(--header-height)' }}>
            <div className="flex-1 lg:flex-none">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  className="h-12 w-12 object-contain"
                  alt="Logo Grupo WG Almeida"
                  src="/images/logo.png?v=2"
                  width="96"
                  height="96"
                  decoding="async"
                  fetchPriority="low"
                />
              </Link>
            </div>

            <nav className="hidden lg:flex items-center justify-center flex-1 space-x-6">
              {navItems.slice(0, 3).map((item) => (
                 <Link
                    key={item.label}
                    to={item.path}
                    className={`text-wg-gray hover:text-wg-orange transition-colors font-poppins font-normal ${
                      location.pathname === item.path ? 'text-wg-orange' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
              ))}

              {/* Mega Menu Trigger */}
              <div className="relative" onMouseEnter={() => setUnitsMenuOpen(true)} onMouseLeave={() => setUnitsMenuOpen(false)}>
                <button className="flex items-center space-x-1 text-wg-gray hover:text-wg-orange transition-colors font-poppins font-normal">
                  <span>{t('header.unitsLabel')}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                  {isUnitsMenuOpen && (
                    <div
                      className="absolute top-full left-0 z-[90] mt-0 w-[min(90vw,48rem)]"
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
                              <span className={`font-poppins font-semibold text-wg-black ${subItem.hoverTextClass}`}>{subItem.label}</span>
                            </div>
                            <p className="text-sm text-wg-gray">{subItem.description}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                
              </div>

              {navItems.slice(3).map((item) => (
                 <Link
                    key={item.label}
                    to={item.path}
                    className={`text-wg-gray hover:text-wg-orange transition-colors font-poppins font-normal ${
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

              {/* Botão Acesso à Gestão */}
              <a
                href={MANAGEMENT_URL}
                aria-label="Acessar área de gestão"
                title="Acessar área de gestão"
                className="hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm hover:border-wg-orange hover:shadow-md transition-all"
              >
                <Globe className="h-4 w-4 text-wg-orange" />
              </a>

              {/* Botão WG Easy - Acesso direto ao sistema */}
              <a
                href={WG_EASY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('header.wgEasyAccess')}
                title={t('header.wgEasyAccess')}
                className="hidden md:flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full shadow-sm hover:border-wg-orange hover:shadow-md transition-all"
              >
                <Monitor className="h-5 w-5 text-wg-black" />
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

        {/* Neon divider between white header and hero/content */}
        <div className="wg-neon-divider" aria-hidden="true" />

        
          {isMobileMenuOpen && (
            <div
              
              
              
              className="lg:hidden bg-white border-t animate-slideDown z-[90] relative"
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
                    href={MANAGEMENT_URL}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-wg-orange text-wg-orange rounded-lg font-semibold hover:bg-wg-orange/10 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Área de Gestão</span>
                  </a>
                  <a
                    href={WG_EASY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-wg-orange text-white rounded-lg font-semibold hover:bg-wg-brown transition-all"
                  >
                    <Monitor className="h-5 w-5 text-white" />
                    <span>{t('header.wgEasyAccess')}</span>
                  </a>
                  <Link to="/contato" className="block">
                    <Button className="btn-primary w-full">{t('header.ctaSpecialist')}</Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        
      </header>
      {isCartOpen && (
        <Suspense fallback={null}>
          <ShoppingCart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
        </Suspense>
      )}
    </>
  );
};

export default Header;










