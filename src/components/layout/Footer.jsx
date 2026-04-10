import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Linkedin, KeyRound, Pin, Home, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-wg-black text-white">
      <div className="container-custom py-12 md:py-16">
        <div className="border-t border-gray-800 pt-10" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[0.92fr_0.96fr_1.6fr_1.02fr] gap-8 lg:gap-x-5 lg:gap-y-8 items-start">
          <div>
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200">{t('footer.navigation')}</span>
            <nav className="space-y-2">
              <Link to="/" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                {t('nav.home')}
              </Link>
              <Link to="/sobre" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                {t('nav.about')}
              </Link>
              <Link to="/projetos" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                {t('nav.projects')}
              </Link>
              <Link to="/store" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                {t('nav.store')}
              </Link>
              <Link to="/solicite-proposta" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                Solicite Proposta
              </Link>
              <Link to="/faq" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                FAQ
              </Link>
              <Link to="/contato" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          <div className="lg:mr-2">
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200">{t('footer.units')}</span>
            <nav className="space-y-2">
              <Link to="/arquitetura" className="block text-gray-400 hover:text-wg-green transition-colors text-sm">
                {t('nav.architecture')}
              </Link>
              <Link to="/engenharia" className="block text-gray-400 hover:text-wg-blue transition-colors text-sm">
                {t('nav.engineering')}
              </Link>
              <Link to="/marcenaria" className="block text-gray-400 hover:text-wg-brown transition-colors text-sm">
                {t('nav.carpentry')}
              </Link>
              <Link to="/obra-turn-key" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                Obra Turn Key
              </Link>
              <Link to="/arquitetura-corporativa" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                Arquitetura Corporativa
              </Link>
              <Link to="/construtora-alto-padrao-sp" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                Construtora Alto Padrao SP
              </Link>
              <Link to="/reforma-apartamento-itaim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm">
                Reforma Apartamento Itaim
              </Link>
            </nav>
          </div>

          {/* Onde Atuamos - SEO Local */}
          <div className="lg:-ml-10">
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200">{t('footer.regions')}</span>
            <nav className="grid max-w-[29rem] grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
              <Link to="/jardins" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Jardins
              </Link>
              <Link to="/vila-nova-conceicao" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Vila Nova Conceição
              </Link>
              <Link to="/itaim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Itaim Bibi
              </Link>
              <Link to="/brooklin" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Brooklin
              </Link>
              <Link to="/morumbi" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Morumbi
              </Link>
              <Link to="/cidade-jardim" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Cidade Jardim
              </Link>
              <Link to="/alto-de-pinheiros" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Alto de Pinheiros
              </Link>
              <Link to="/moema" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Moema
              </Link>
              <Link to="/campo-belo" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Campo Belo
              </Link>
              <Link to="/higienopolis" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Higienópolis
              </Link>
              <Link to="/pinheiros" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Pinheiros
              </Link>
              <Link to="/perdizes" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Perdizes
              </Link>
              <Link to="/paraiso" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Paraíso
              </Link>
              <Link to="/aclimacao" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Aclimação
              </Link>
              <Link to="/vila-mariana" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Vila Mariana
              </Link>
              <Link to="/mooca" className="block text-gray-400 hover:text-wg-orange transition-colors text-sm leading-snug whitespace-normal">
                Mooca
              </Link>
            </nav>
          </div>

          <div>
            <span className="font-suisse font-light text-lg mb-3 block text-gray-200">{t('footer.contact')}</span>
            <div className="space-y-3">
              <a href="tel:+5511984650002" className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <Phone className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm group-hover:text-wg-orange">+55 (11) 98465-0002</span>
              </a>
              <a href="https://wa.me/5511984650002" target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-gray-400 text-sm group-hover:text-wg-orange">{t('footer.whatsapp')}</span>
              </a>
              <a href="mailto:contato@wgalmeida.com.br" className="flex items-start space-x-3 hover:text-wg-orange transition-colors group">
                <Mail className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm group-hover:text-wg-orange">contato@wgalmeida.com.br</span>
              </a>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-wg-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{t('footer.address')}</span>
              </div>
              {/* Redes Sociais */}
              <div className="flex space-x-4 mt-4 pt-4 border-t border-gray-800">
                <a href="https://www.instagram.com/wgalmeida.arq" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followInstagram')}>
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.facebook.com/wgalmeidaarquitetura" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followFacebook')}>
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/company/wgalmeida" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label={t('footer.followLinkedin')}>
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://br.pinterest.com/wgalmeida" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Seguir no Pinterest">
                  <Pin className="w-5 h-5" />
                </a>
                <a href="https://www.homify.com.br/profissionais/232168/grupo-wg-almeida-arquitetura-engenharia-e-marcenaria-de-alto-padrao" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Ver perfil no Homify">
                  <Home className="w-5 h-5" />
                </a>
                <a href="https://www.houzz.com/user/wgalmeida" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-wg-orange transition-colors" aria-label="Ver perfil no Houzz">
                  <Building2 className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          className="border-t border-gray-800 pt-8 text-center font-suisse font-light"
          style={{ fontFamily: "'Suisse Intl', 'Inter', sans-serif", fontWeight: 300 }}
        >
           <div className="mb-6">
              <a 
                href="https://easy.wgalmeida.com.br" 
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
