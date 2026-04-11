import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart as ShoppingCartIcon, Ruler, Building2, Hammer, Globe, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { withBasePath } from '@/utils/assetPaths';

const ShoppingCart = lazy(() => import('@/components/ShoppingCart'));

const SCROLL_THRESHOLD = 72;
const HEADER_LOGO_SRC = withBasePath('/images/logo-192.webp');

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
          setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
          ticking = false;
        });
      }
    };
    handleScroll();
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
      image: withBasePath('/images/banners/ARQ.webp'),
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
      image: withBasePath('/images/banners/ENGENHARIA.webp'),
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
      image: withBasePath('/images/banners/MARCENARIA.webp'),
      description: t('header.units.carpentry'),
      tagline: 'Mobiliário sob medida, precisão e acabamento fino.',
      borderHoverClass: 'hover:border-wg-brown',
      iconClass: 'text-wg-brown',
      hoverTextClass: 'group-hover:text-wg-brown',
      accent: 'var(--wg-brown)',
      accentSoft: 'rgba(139, 94, 60, 0.18)',
    },
  ], [t]);

const navLinkClass = isScrolled
    ? 'px-3 py-1.5 rounded-full text-sm text-wg-gray hover:text-wg-black hover:bg-black/[0.05]'
    : 'px-3 py-2 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/[0.08] backdrop-blur-sm';

  const activeNavLinkClass = isScrolled
    ? 'bg-black/[0.05] text-wg-black'
    : 'bg-white/[0.12] text-white';

const iconButtonClass = isScrolled
    ? 'w-9 h-9 border-black/[0.08] bg-white/70 backdrop-blur-xl hover:bg-white hover:border-black/[0.14] shadow-[0_10px_26px_rgba(12,12,12,0.08)]'
    : 'w-10 h-10 border-white/20 bg-white/[0.08] backdrop-blur-xl hover:bg-white/[0.16] hover:border-white/30 shadow-[0_14px_34px_rgba(10,10,10,0.16)]';

  const iconColorClass = isScrolled ? 'text-wg-black' : 'text-white';

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[80] bg-transparent transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className={`container-custom pt-3 md:pt-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`}>
          <div
            className={`flex items-center justify-between rounded-[28px] px-3 md:px-5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScrolled
                ? 'border border-black/[0.06] bg-white/60 backdrop-blur-2xl shadow-[0_18px_45px_rgba(12,12,12,0.08)]'
                : 'border border-white/10 bg-transparent backdrop-blur-0 shadow-none'
            }`}
            style={{ height: isScrolled ? '3.25rem' : 'var(--header-height)' }}
          >
            {/* Logo — some ao rolar */}
            <div
              className={`flex-1 lg:flex-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${
                isScrolled
                  ? 'w-0 opacity-0 pointer-events-none flex-none'
                  : 'w-auto opacity-100'
              }`}
            >
              <Link to="/" className="flex items-center space-x-3">
                <img
                  className="h-12 w-12 object-contain"
                  alt="Logo Grupo WG Almeida"
                  src={HEADER_LOGO_SRC}
                  width="96"
                  height="96"
                  decoding="async"
                  fetchpriority="low"
                />
              </Link>
            </div>

            {/* Nav desktop */}
            <nav className={`hidden lg:flex items-center justify-center flex-1 transition-all duration-500 ${
              isScrolled ? 'gap-0.5' : 'space-x-6'
            }`}>
              {navItems.slice(0, 3).map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`transition-all duration-300 font-suisse font-light ${navLinkClass} ${
                    location.pathname === item.path ? activeNavLinkClass : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mega Menu */}
              <div
                className="relative"
                onMouseEnter={() => setUnitsMenuOpen(true)}
                onMouseLeave={() => setUnitsMenuOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 transition-all duration-300 font-suisse font-light ${navLinkClass}`}
                >
                  <span>{t('header.unitsLabel')}</span>
                  <ChevronDown className={`transition-all duration-300 ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>

                {isUnitsMenuOpen && (
                  <div className="absolute top-full left-1/2 z-[90] mt-3 w-[min(92vw,60rem)] -translate-x-1/2">
                    <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white/[0.96] p-3 shadow-[0_24px_80px_rgba(23,23,23,0.14)] backdrop-blur-xl">
                      <div className="grid h-[26rem] grid-cols-3 gap-3">
                        {unitsItems.map((subItem, index) => {
                          const Wrapper = subItem.external ? 'a' : Link;
                          return (
                            <Wrapper
                              key={subItem.label}
                              {...(subItem.external ? { href: subItem.path } : { to: subItem.path })}
                              className="group relative min-w-0 overflow-hidden rounded-[1.55rem] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
                              style={{
                                backgroundColor: '#0f0f10',
                                boxShadow: '0 14px 34px rgba(20,20,20,0.12)',
                              }}
                            >
                              <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                                style={{ backgroundImage: `url(${subItem.image})` }}
                              />
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(180deg, rgba(16,16,17,0.10) 0%, rgba(16,16,17,0.34) 34%, rgba(16,16,17,0.88) 100%), radial-gradient(circle at top left, ${subItem.accentSoft} 0%, transparent 34%)`,
                                }}
                              />
                              <div
                                className="absolute left-0 top-0 h-full w-[3px]"
                                style={{ backgroundColor: subItem.accent, opacity: 0.9 }}
                              />

                              <div
                                className="absolute inset-x-0 bottom-0 z-20 flex h-full flex-col justify-end p-6"
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

                                <div className="mt-6 inline-flex w-fit items-center rounded-full border border-white/[0.14] bg-white/[0.08] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/[0.86] backdrop-blur-sm">
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
                  className={`transition-all duration-300 font-suisse font-light ${navLinkClass} ${
                    location.pathname === item.path ? activeNavLinkClass : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Ações à direita */}
            <div className={`flex items-center justify-end gap-2 md:gap-3 transition-all duration-500 ${
              isScrolled ? 'flex-none' : 'flex-1 lg:flex-none'
            }`}>
              <div className="hidden md:block">
                <LanguageSelector />
              </div>

              {/* Carrinho */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={t('header.cartAria')}
                className={`relative flex items-center justify-center rounded-full border transition-all ${iconButtonClass}`}
              >
                <ShoppingCartIcon className={`${iconColorClass} transition-all ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
                {totalItems > 0 && (
                  <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-light ${
                    isScrolled ? 'bg-wg-black text-white' : 'bg-white text-wg-black'
                  }`}>
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Gestão */}
              <Link
                to={MANAGEMENT_URL}
                aria-label="Acessar área de gestão"
                title="Acessar área de gestão"
                className={`hidden md:flex items-center justify-center rounded-full border transition-all ${iconButtonClass}`}
              >
                <Globe className={`${iconColorClass} transition-all ${isScrolled ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
              </Link>

              {/* WG Easy */}
              <a
                href={WG_EASY_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('header.wgEasyAccess')}
                title={t('header.wgEasyAccess')}
                className={`hidden md:flex items-center justify-center rounded-full border transition-all ${iconButtonClass}`}
              >
                <Monitor className={`${iconColorClass} transition-all ${isScrolled ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </a>

              <button
                className={`lg:hidden transition-colors ${isScrolled ? 'text-wg-black' : 'text-white'}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="relative z-[90] animate-slideDown border-t border-white/[0.12] bg-[rgba(12,16,22,0.76)] backdrop-blur-2xl lg:hidden">
            <nav className="container-custom py-4 space-y-2">
              {[...navItems.slice(0,3), {label: t('header.unitsLabel'), dropdown: unitsItems}, ...navItems.slice(3)].map((item, index) => (
                <div key={index}>
                  {item.dropdown ? (
                    <div className="pl-4 space-y-1">
                      {item.dropdown.map((subItem) => {
                        const className = "block px-4 py-2 text-white/70 hover:text-white transition-colors text-sm font-suisse font-light";
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
                      className={`block px-4 py-3 transition-colors font-suisse font-light ${
                        location.pathname === item.path ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <div className="px-4 pt-4 space-y-3">
                <div className="flex items-center justify-center gap-2 py-2">
                  <span className="text-sm text-white/70">{t('header.languageLabel')}</span>
                  <LanguageSelector variant="compact" />
                </div>
                <Link
                  to={MANAGEMENT_URL}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-white/[0.18] text-white rounded-lg font-light hover:bg-white/10 transition-all"
                >
                  <Globe className="h-4 w-4" />
                  <span>Área de Gestão</span>
                </Link>
                <a
                  href={WG_EASY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-wg-black rounded-lg font-light hover:bg-white/90 transition-all"
                >
                  <Monitor className="h-5 w-5 text-wg-black" />
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

