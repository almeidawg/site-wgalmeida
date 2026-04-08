import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart as ShoppingCartIcon, Ruler, Building2, Hammer, Globe, Monitor } from 'lucide-react';
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
  const [activeUnitsPanel, setActiveUnitsPanel] = useState(0);
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
      image: '/images/banners/ARQ.webp',
      description: t('header.units.architecture'),
      tagline: 'Projetos, interiores e espaços com leitura autoral.',
      borderHoverClass: 'hover:border-wg-green',
      iconClass: 'text-wg-green',
      hoverTextClass: 'group-hover:text-wg-green',
      accent: 'var(--wg-green)',
      accentSoft: 'rgba(94, 155, 148, 0.18)',
    },
    {
      label: t('nav.engineering'),
      path: '/engenharia',
      icon: Building2,
      image: '/images/banners/ENGENHARIA.webp',
      description: t('header.units.engineering'),
      tagline: 'Execução, planejamento e rigor técnico de obra.',
      borderHoverClass: 'hover:border-wg-blue',
      iconClass: 'text-wg-blue',
      hoverTextClass: 'group-hover:text-wg-blue',
      accent: 'var(--wg-blue)',
      accentSoft: 'rgba(43, 69, 128, 0.18)',
    },
    {
      label: t('nav.carpentry'),
      path: '/marcenaria',
      icon: Hammer,
      image: '/images/banners/MARCENARIA.webp',
      description: t('header.units.carpentry'),
      tagline: 'Mobiliário sob medida, precisão e acabamento fino.',
      borderHoverClass: 'hover:border-wg-brown',
      iconClass: 'text-wg-brown',
      hoverTextClass: 'group-hover:text-wg-brown',
      accent: 'var(--wg-brown)',
      accentSoft: 'rgba(139, 94, 60, 0.18)',
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
                  src="/images/logo-192.webp"
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
                    className={`text-wg-gray hover:text-wg-black transition-colors font-suisse font-light ${
                      location.pathname === item.path ? 'text-wg-black' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
              ))}

              {/* Mega Menu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setUnitsMenuOpen(true)}
                onMouseLeave={() => setUnitsMenuOpen(false)}
              >
                <button className="flex items-center space-x-1 text-wg-gray hover:text-wg-black transition-colors font-suisse font-light">
                  <span>{t('header.unitsLabel')}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                  {isUnitsMenuOpen && (
                    <div
                      className="absolute top-full left-1/2 z-[90] mt-3 w-[min(92vw,60rem)] -translate-x-1/2"
                    >
                      <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-white/96 p-3 shadow-[0_24px_80px_rgba(23,23,23,0.14)] backdrop-blur-xl">
                        <div className="flex h-[26rem] gap-3">
                          {unitsItems.map((subItem, index) => {
                            const isActive = activeUnitsPanel === index;
                            const Wrapper = subItem.external ? 'a' : Link;
                            return (
                              <Wrapper
                                key={subItem.label}
                                {...(subItem.external ? { href: subItem.path } : { to: subItem.path })}
                                className="group relative min-w-0 overflow-hidden rounded-[1.55rem] transition-[flex] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                                style={{
                                  flex: isActive ? 2.15 : 0.92,
                                  backgroundColor: '#0f0f10',
                                  boxShadow: isActive
                                    ? '0 18px 48px rgba(20,20,20,0.16)'
                                    : '0 10px 24px rgba(20,20,20,0.08)',
                                }}
                                onMouseEnter={() => setActiveUnitsPanel(index)}
                                onFocus={() => setActiveUnitsPanel(index)}
                              >
                                <div
                                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                                  style={{ backgroundImage: `url(${subItem.image})` }}
                                />
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: isActive
                                      ? `linear-gradient(180deg, rgba(16,16,17,0.10) 0%, rgba(16,16,17,0.34) 34%, rgba(16,16,17,0.88) 100%), radial-gradient(circle at top left, ${subItem.accentSoft} 0%, transparent 34%)`
                                      : 'linear-gradient(180deg, rgba(16,16,17,0.18) 0%, rgba(16,16,17,0.55) 55%, rgba(16,16,17,0.88) 100%)',
                                  }}
                                />
                                <div
                                  className="absolute left-0 top-0 h-full w-[3px]"
                                  style={{ backgroundColor: subItem.accent, opacity: isActive ? 1 : 0.6 }}
                                />

                                {!isActive && (
                                  <div className="absolute inset-0 z-10 flex items-end justify-center pb-8">
                                    <div className="flex select-none flex-col items-center gap-3 [writing-mode:vertical-rl] [transform:rotate(180deg)]">
                                      <span
                                        className="text-[10px] uppercase tracking-[0.32em] text-white/55"
                                      >
                                        0{index + 1}
                                      </span>
                                      <span
                                        className="font-playfair text-[1.18rem] tracking-[-0.03em] text-white"
                                      >
                                        {subItem.label}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div
                                  className={`absolute inset-x-0 bottom-0 z-20 flex h-full flex-col justify-end p-6 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-4'}`}
                                >
                                  <div className="mb-5 flex items-center gap-3">
                                    <span
                                      className="font-playfair text-[3.25rem] italic leading-none tracking-[-0.08em]"
                                      style={{ color: subItem.accent }}
                                    >
                                      0{index + 1}
                                    </span>
                                    <div className="h-px w-12" style={{ backgroundColor: subItem.accent }} />
                                    <span className="text-[10px] uppercase tracking-[0.28em] text-white/52">
                                      Núcleo
                                    </span>
                                  </div>

                                  <div className="mb-3 flex items-center gap-3">
                                    <subItem.icon className="h-5 w-5 text-white/88" />
                                    <span className="font-suisse text-[1.05rem] font-light tracking-[0.02em] text-white">
                                      {subItem.label}
                                    </span>
                                  </div>

                                  <p className="max-w-[25rem] font-playfair text-[1.7rem] font-light leading-[1.02] tracking-[-0.04em] text-white">
                                    {subItem.tagline}
                                  </p>

                                  <p className="mt-3 max-w-[24rem] text-[0.92rem] leading-[1.75] text-white/72">
                                    {subItem.description}
                                  </p>

                                  <div className="mt-6 inline-flex w-fit items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/86 backdrop-blur-sm">
                                    Explorar unidade
                                  </div>
                                </div>
                              </Wrapper>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                
              </div>

              {navItems.slice(3).map((item) => (
                 <Link
                    key={item.label}
                    to={item.path}
                    className={`text-wg-gray hover:text-wg-black transition-colors font-suisse font-light ${
                      location.pathname === item.path ? 'text-wg-black' : ''
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
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-wg-black text-white text-xs font-light">
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
                <Globe className="h-4 w-4 text-wg-gray" />
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
                {[...navItems.slice(0,3), {label: t('header.unitsLabel'), dropdown: unitsItems}, ...navItems.slice(3)].map((item, index) => (
                  <div key={index}>
                    {item.dropdown ? (
                      <div className="pl-4 space-y-1">
                        {item.dropdown.map((subItem) => {
                          const className = "block px-4 py-2 text-wg-gray hover:text-wg-black transition-colors text-sm font-suisse font-light";
                          return subItem.external ? (
                            <a key={subItem.label} href={subItem.path} className={className}>
                              {subItem.label}
                            </a>
                          ) : (
                            <Link key={subItem.label} to={subItem.path} className={className}>
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`block px-4 py-3 text-wg-gray hover:text-wg-black transition-colors font-suisse font-light ${
                          location.pathname === item.path ? 'text-wg-black' : ''
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
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-wg-orange text-wg-orange rounded-lg font-light hover:bg-wg-orange/10 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Área de Gestão</span>
                  </a>
                  <a
                    href={WG_EASY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-wg-orange text-white rounded-lg font-light hover:bg-wg-brown transition-all"
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










