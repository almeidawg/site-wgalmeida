import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, KeyRound, Pin, Home, Building2, HardHat, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COMPANY, PRODUCT_URLS } from '@/data/company';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-wg-black text-white">
      <div className="container-custom py-12 md:py-16">
        <div className="border-t border-gray-800 pt-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[0.92fr_0.96fr_1.6fr_1.02fr] gap-8 lg:gap-x-5 lg:gap-y-8 items-start">
          <div>
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200" style={{ fontWeight: 300 }}>{t('footer.navigation')}</span>
            <nav className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.home')}
              </Link>
              <Link to="/sobre" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.about')}
              </Link>
              <Link to="/projetos" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.projects')}
              </Link>
              <Link to="/store" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.store')}
              </Link>
              <Link to="/solicite-proposta" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                Solicite Proposta
              </Link>
              <Link to="/faq" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                FAQ
              </Link>
              <Link to="/contato" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          <div className="lg:mr-2">
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200" style={{ fontWeight: 300 }}>{t('footer.units')}</span>
            <nav className="space-y-2">
              <Link to="/arquitetura" className="block text-gray-400 hover:text-wg-green transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.architecture')}
              </Link>
              <Link to="/engenharia" className="block text-gray-400 hover:text-wg-blue transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.engineering')}
              </Link>
              <Link to="/marcenaria" className="block text-gray-400 hover:text-wg-brown transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                {t('nav.carpentry')}
              </Link>
              <Link to="/obra-turn-key" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                Obra Turn Key
              </Link>
              <Link to="/arquitetura-corporativa" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                Arquitetura Corporativa
              </Link>
              <Link to="/construtora-alto-padrao-sp" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                Construtora Alto Padrão SP
              </Link>
              <Link to="/reforma-apartamento-itaim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm font-light" style={{ fontWeight: 300 }}>
                Reforma Apartamento Itaim
              </Link>
            </nav>
          </div>

          {/* Onde Atuamos - SEO Local */}
          <div className="lg:-ml-10">
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200" style={{ fontWeight: 300 }}>{t('footer.regions')}</span>
            <nav className="grid max-w-[29rem] grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              <Link to="/jardins" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Jardins
              </Link>
              <Link to="/vila-nova-conceicao" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Vila Nova Conceição
              </Link>
              <Link to="/itaim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Itaim Bibi
              </Link>
              <Link to="/brooklin" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Brooklin
              </Link>
              <Link to="/morumbi" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Morumbi
              </Link>
              <Link to="/cidade-jardim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Cidade Jardim
              </Link>
              <Link to="/alto-de-pinheiros" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Alto de Pinheiros
              </Link>
              <Link to="/moema" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Moema
              </Link>
              <Link to="/campo-belo" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Campo Belo
              </Link>
              <Link to="/higienopolis" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Higienópolis
              </Link>
              <Link to="/pinheiros" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Pinheiros
              </Link>
              <Link to="/perdizes" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Perdizes
              </Link>
              <Link to="/paraiso" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Paraíso
              </Link>
              <Link to="/aclimacao" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Aclimação
              </Link>
              <Link to="/vila-mariana" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Vila Mariana
              </Link>
              <Link to="/mooca" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal font-light" style={{ fontWeight: 300 }}>
                Mooca
              </Link>
            </nav>
          </div>

          <div>
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200" style={{ fontWeight: 300 }}>{t('footer.contact')}</span>
            <div className="space-y-3">
              <a href={`tel:${COMPANY.phoneRaw}`} className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <Phone className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm font-light group-hover:text-wg-orange" style={{ fontWeight: 300 }}>{COMPANY.phone}</span>
              </a>
              <a href={COMPANY.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-gray-400 text-sm font-light group-hover:text-wg-orange" style={{ fontWeight: 300 }}>{t('footer.whatsapp')}</span>
              </a>
              <a href={`mailto:${COMPANY.email}`} className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <Mail className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm font-light group-hover:text-wg-orange" style={{ fontWeight: 300 }}>{COMPANY.email}</span>
              </a>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm font-light" style={{ fontWeight: 300 }}>{t('footer.address')}</span>
              </div>
              {/* Redes Sociais */}
              <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-800">
                <a href={COMPANY.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followInstagram')}>
                  <Instagram className="w-5 h-5" />
                </a>
                <a href={COMPANY.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followFacebook')}>
                  <Facebook className="w-5 h-5" />
                </a>
                <a href={COMPANY.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followLinkedin')}>
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href={COMPANY.pinterest} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Seguir no Pinterest">
                  <Pin className="w-5 h-5" />
                </a>
                <a href={COMPANY.homify} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Ver perfil no Homify">
                  <Home className="w-5 h-5" />
                </a>
                <a href={COMPANY.houzz} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Ver perfil no Houzz">
                  <Building2 className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Ferramentas Digitais */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <span className="font-suisse font-light text-sm mb-4 block text-center text-gray-400 uppercase tracking-widest" style={{ fontWeight: 300 }}>Ferramentas Digitais</span>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href={PRODUCT_URLS.obraeasy}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-wg-orange transition-colors text-sm font-light group"
              style={{ fontWeight: 300 }}
            >
              <HardHat size={14} className="group-hover:text-wg-orange" />
              <span>ObraEasy — Gestão de obras inteligente</span>
            </a>
            <a
              href={PRODUCT_URLS.wgeasy}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-wg-orange transition-colors text-sm font-light group"
              style={{ fontWeight: 300 }}
            >
              <Cpu size={14} className="group-hover:text-wg-orange" />
              <span>WGEasy — ERP para escritórios de projetos</span>
            </a>
            <a
              href={`${PRODUCT_URLS.obraeasy}/login`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-wg-orange transition-colors text-sm font-light group"
              style={{ fontWeight: 300 }}
            >
              <KeyRound size={14} className="group-hover:text-wg-orange" />
              <span>Painel do Cliente — Acompanhe sua obra em tempo real</span>
            </a>
          </div>
        </div>

        <div
          className="border-t border-gray-800 pt-8 text-center font-suisse font-light"
          style={{ fontFamily: "'Suisse Intl', 'Inter', sans-serif", fontWeight: 300 }}
        >
           <div className="mb-6">
              <a
                href={PRODUCT_URLS.wgeasy}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gray-300 hover:text-gray-300 transition-colors text-xs font-suisse font-light tracking-[0.01em]"
                style={{ fontFamily: "'Suisse Intl', 'Inter', sans-serif", fontWeight: 300 }}
              >
                  <KeyRound size={14} />
                  <span
                    className="font-suisse font-light tracking-[0.01em]"
                    style={{ fontFamily: "'Suisse Intl', 'Inter', sans-serif", fontWeight: 300 }}
                  >
                    {t('footer.wgEasyAccess')}
                  </span>
              </a>
           </div>
          <p
            className="text-gray-300 text-sm font-suisse font-light tracking-[0.01em]"
            style={{ fontFamily: "'Suisse Intl', 'Inter', sans-serif", fontWeight: 300 }}
          >
            © {new Date().getFullYear()} Grupo WG Almeida. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
