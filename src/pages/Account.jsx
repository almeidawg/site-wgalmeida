import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from '@/lib/motion-lite';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  ShoppingBag,
  User,
  FileText,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Ruler,
  Hammer,
  ArrowRight,
  ExternalLink,
  FolderOpen,
  DollarSign,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Monitor
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation, Trans } from 'react-i18next';
import { COMPANY, PRODUCT_URLS } from '@/data/company';

const Account = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados para dados reais
  const [pessoa, setPessoa] = useState(null);
  const [contratos, setContratos] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buscar dados do cliente no Supabase
  useEffect(() => {
    const fetchDadosCliente = async () => {
      if (!user?.email) return;

      try {
        // Buscar pessoa pelo email
        const { data: pessoaData, error: pessoaError } = await supabase
          .from('pessoas')
          .select('*')
          .eq('email', user.email)
          .single();

        if (pessoaData) {
          setPessoa(pessoaData);

          // Buscar contratos do cliente
          const { data: contratosData } = await supabase
            .from('contratos')
            .select('*')
            .eq('cliente_id', pessoaData.id)
            .order('created_at', { ascending: false });

          if (contratosData) {
            setContratos(contratosData);
          }

          // Buscar oportunidades do cliente
          const { data: oportunidadesData } = await supabase
            .from('oportunidades')
            .select('*')
            .eq('cliente_id', pessoaData.id)
            .order('created_at', { ascending: false });

          if (oportunidadesData) {
            setOportunidades(oportunidadesData);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDadosCliente();
  }, [user?.email]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: t('accountPage.toasts.loggedOut'),
    });
  };

  const handleNotImplemented = () => {
    toast({
      title: t('accountPage.toasts.notReadyTitle'),
      description: t('accountPage.toasts.notReadyDescription'),
    });
  };

  // Obter primeiro nome
  const primeiroNome = pessoa?.nome
    ? pessoa.nome.split(' ')[0]
    : profile?.nome
      ? profile.nome.split(' ')[0]
      : t('accountPage.defaultName');

  // Obter iniciais para avatar
  const getIniciais = () => {
    const nome = pessoa?.nome || profile?.nome;
    if (!nome) return user?.email?.charAt(0).toUpperCase() || 'C';
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Extrair núcleos contratados dos contratos
  const getNucleosContratados = () => {
    const nucleos = new Set();
    contratos.forEach(contrato => {
      if (contrato.nucleos_contratados) {
        if (Array.isArray(contrato.nucleos_contratados)) {
          contrato.nucleos_contratados.forEach(n => nucleos.add(n));
        } else if (typeof contrato.nucleos_contratados === 'string') {
          contrato.nucleos_contratados.split(',').forEach(n => nucleos.add(n.trim()));
        }
      }
      // Também verificar campos individuais
      if (contrato.nucleo_arquitetura) nucleos.add('Arquitetura');
      if (contrato.nucleo_engenharia) nucleos.add('Engenharia');
      if (contrato.nucleo_marcenaria) nucleos.add('Marcenaria');
    });
    return Array.from(nucleos);
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    if (!value) return t('accountPage.notAvailable');
    return new Intl.NumberFormat(i18n.language || 'pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (date) => {
    if (!date) return t('accountPage.notAvailable');
    return new Date(date).toLocaleDateString(i18n.language || 'pt-BR');
  };

  // Obter status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'ativo': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: t('accountPage.status.active') },
      'em_andamento': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock, label: t('accountPage.status.inProgress') },
      'pendente': { bg: 'bg-wg-orange/10', text: 'text-wg-orange-dark', icon: AlertCircle, label: t('accountPage.status.pending') },
      'concluido': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: t('accountPage.status.completed') },
      'finalizado': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: t('accountPage.status.finished') },
    };
    const statusKey = status?.toLowerCase();
    const config = statusConfig[statusKey] || statusConfig['pendente'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label || status || t('accountPage.status.pending')}
      </span>
    );
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wg-orange mb-4"></div>
          <p className="text-wg-gray">{t('accountPage.loading')}</p>
        </div>
      </div>
    );
  }

  // Dados dos núcleos
  const nucleosInfo = [
    {
      key: 'Arquitetura',
      slug: 'arquitetura',
      icon: Ruler,
      color: 'text-wg-green',
      bgColor: 'bg-wg-green/10',
      label: t('accountPage.nucleos.architecture.label'),
      description: t('accountPage.nucleos.architecture.description'),
    },
    {
      key: 'Engenharia',
      slug: 'engenharia',
      icon: Building2,
      color: 'text-wg-blue',
      bgColor: 'bg-wg-blue/10',
      label: t('accountPage.nucleos.engineering.label'),
      description: t('accountPage.nucleos.engineering.description'),
    },
    {
      key: 'Marcenaria',
      slug: 'marcenaria',
      icon: Hammer,
      color: 'text-wg-brown',
      bgColor: 'bg-wg-brown/10',
      label: t('accountPage.nucleos.carpentry.label'),
      description: t('accountPage.nucleos.carpentry.description'),
    },
  ];

  const nucleosContratados = getNucleosContratados();
  const temContratos = contratos.length > 0;
  const getNucleoLabel = (nucleoKey) => {
    const found = nucleosInfo.find((nucleo) => nucleo.key === nucleoKey);
    return found?.label || nucleoKey;
  };

  // Cards de acesso
  const cards = [
    {
      title: t('accountPage.cards.contracts.title'),
      description: temContratos
        ? t('accountPage.cards.contracts.descriptionWithCount', { count: contratos.length })
        : t('accountPage.cards.contracts.descriptionEmpty'),
      icon: FileText,
      color: 'bg-blue-100',
      iconColor: 'text-blue-600',
      action: () => pessoa?.id
        ? window.open(`${PRODUCT_URLS.wgeasy}/area-cliente?cliente=${pessoa.id}`, '_blank')
        : handleNotImplemented(),
    },
    {
      title: t('accountPage.cards.requestQuote.title'),
      description: t('accountPage.cards.requestQuote.description'),
      icon: ClipboardList,
      color: 'bg-green-100',
      iconColor: 'text-green-600',
      action: () => navigate('/solicite-proposta'),
    },
    {
      title: t('accountPage.cards.files.title'),
      description: t('accountPage.cards.files.description'),
      icon: FolderOpen,
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
      action: () => pessoa?.id
        ? window.open(`${PRODUCT_URLS.wgeasy}/area-cliente?cliente=${pessoa.id}`, '_blank')
        : handleNotImplemented(),
    },
    {
      title: t('accountPage.cards.contact.title'),
      description: t('accountPage.cards.contact.description'),
      icon: MessageSquare,
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
      action: () => navigate('/contato'),
    },
  ];

  return (
    <>
      <SEO
        pathname="/account"
        title={t('seo.account.title')}
        description={t('seo.account.description')}
        noindex
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header Premium com Gradiente */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-wg-black via-wg-black/95 to-wg-black/90 text-white overflow-hidden"
        >
          {/* Elementos decorativos */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-wg-orange rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-wg-orange/50 rounded-full blur-2xl" />
          </div>

          <div className="container-custom py-12 md:py-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Avatar className="h-28 w-28 border-4 border-wg-orange/30 shadow-2xl ring-4 ring-wg-orange/10">
                  <AvatarImage src={pessoa?.avatar_url || profile?.avatar_url} alt="Avatar" />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-wg-orange to-wg-orange/80 text-white">
                    {getIniciais()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Saudação */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex-1 text-center md:text-left"
              >
                <span className="text-wg-orange font-medium tracking-[0.2em] uppercase text-xs mb-2 block">
                  {t('accountPage.hero.kicker')}
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-inter font-light tracking-tight">
                  {t('accountPage.hero.greeting', { name: primeiroNome })}
                </h1>
                <p className="text-white/60 text-lg mt-2 font-light">
                  {t('accountPage.hero.subtitle')}
                </p>
                {temContratos && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {nucleosContratados.map(nucleo => (
                      <span
                        key={nucleo}
                        className="px-3 py-1.5 bg-wg-orange/20 border border-wg-orange/30 rounded-full text-sm font-medium text-wg-orange"
                      >
                        {getNucleoLabel(nucleo)}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Botão WG Easy - Estilo consistente com Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col gap-3"
              >
                <a
                  href={PRODUCT_URLS.wgeasy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-wg-orange text-white rounded-full font-medium text-sm hover:bg-wg-orange/90 hover:shadow-lg hover:shadow-wg-orange/25 transition-all"
                >
                  <Monitor className="h-4 w-4" />
                  <span>{t('accountPage.hero.wgEasy')}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
                {pessoa?.id && (
                  <a
                    href={`${PRODUCT_URLS.wgeasy}/area-cliente?cliente=${pessoa.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm hover:bg-white/20 transition-all"
                  >
                    <span>{t('accountPage.hero.customerPortal')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="container-custom py-10 space-y-10">
          {/* Cards de Acesso Rápido */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-wg-orange/50 to-transparent" />
              <h2 className="text-2xl font-inter font-light text-wg-black tracking-tight">
                {t('accountPage.quickAccess.title')}
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-wg-orange/50 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={card.action}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border border-gray-100"
                >
                  <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <h3 className="font-medium text-wg-black mb-1 group-hover:text-wg-orange transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-wg-gray leading-relaxed">{card.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm text-wg-orange opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium">{t('accountPage.quickAccess.access')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Seção de Contratos (se houver) */}
          {temContratos && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-wg-orange rounded-full" />
                  <h2 className="text-2xl font-inter font-light text-wg-black tracking-tight">
                    <Trans i18nKey="accountPage.contracts.title">
                      Meus <span className="font-medium">Contratos</span>
                    </Trans>
                  </h2>
                </div>
                {pessoa?.id && (
                  <a
                    href={`${PRODUCT_URLS.wgeasy}/area-cliente?cliente=${pessoa.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wg-orange hover:underline text-sm flex items-center gap-1"
                  >
                    {t('accountPage.contracts.viewAll')} <ArrowRight className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contratos.slice(0, 3).map((contrato, index) => (
                  <motion.div
                    key={contrato.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-wg-black">
                          {contrato.nome || contrato.titulo || t('accountPage.contracts.contractLabel', { number: contrato.numero || index + 1 })}
                        </h3>
                        <p className="text-sm text-wg-gray mt-1">
                          {contrato.endereco_obra || contrato.descricao || t('accountPage.contracts.inProgress')}
                        </p>
                      </div>
                      {getStatusBadge(contrato.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      {contrato.valor_total && (
                        <div className="flex items-center justify-between">
                          <span className="text-wg-gray">{t('accountPage.contracts.value')}</span>
                          <span className="font-medium text-wg-black">
                            {formatCurrency(contrato.valor_total)}
                          </span>
                        </div>
                      )}
                      {contrato.data_inicio && (
                        <div className="flex items-center justify-between">
                          <span className="text-wg-gray">{t('accountPage.contracts.start')}</span>
                          <span className="font-medium text-wg-black">
                            {formatDate(contrato.data_inicio)}
                          </span>
                        </div>
                      )}
                      {contrato.nucleos_contratados && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(Array.isArray(contrato.nucleos_contratados)
                            ? contrato.nucleos_contratados
                            : [contrato.nucleos_contratados]
                          ).map(nucleo => {
                            const info = nucleosInfo.find((item) => item.key === nucleo);
                            return info ? (
                              <span
                                key={nucleo}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${info.bgColor} ${info.color}`}
                              >
                                <info.icon className="w-3 h-3" />
                                {info.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Informações da Conta + Núcleos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Informações da Conta */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-inter font-medium text-wg-black mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-wg-orange/10 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-wg-orange" />
                  </div>
                  {t('accountPage.accountInfo.title')}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-wg-gray" />
                    <div>
                      <p className="text-xs text-wg-gray">{t('accountPage.accountInfo.name')}</p>
                      <p className="font-medium text-wg-black">{pessoa?.nome || profile?.nome}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-wg-gray" />
                    <div>
                      <p className="text-xs text-wg-gray">{t('accountPage.accountInfo.email')}</p>
                      <p className="font-medium text-wg-black text-sm">{user.email}</p>
                    </div>
                  </div>

                  {pessoa?.telefone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-wg-gray" />
                      <div>
                        <p className="text-xs text-wg-gray">{t('accountPage.accountInfo.phone')}</p>
                        <p className="font-medium text-wg-black">{pessoa.telefone}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleNotImplemented}
                    className="w-full text-center text-sm text-wg-orange hover:underline mt-2"
                  >
                    {t('accountPage.accountInfo.edit')}
                  </button>
                </div>

                <div className="border-t border-gray-100 mt-6 pt-6">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('accountPage.accountInfo.logout')}
                  </Button>
                </div>
              </div>
            </motion.section>

            {/* Nossos Núcleos */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-inter font-medium text-wg-black mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-wg-green/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-wg-green" />
                  </div>
                  {temContratos
                    ? t('accountPage.nucleos.sectionTitleActive')
                    : t('accountPage.nucleos.sectionTitle')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {nucleosInfo.map((info, index) => {
                    const isContratado = nucleosContratados.includes(info.key);
                    const Icon = info.icon;

                    return (
                      <Link
                        key={info.key}
                        to={`/${info.slug}`}
                        className={`group p-4 rounded-xl border transition-all ${
                          isContratado
                            ? 'border-wg-orange/30 bg-wg-orange/5 hover:shadow-md'
                            : 'border-gray-100 hover:border-wg-orange/30 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-12 h-12 ${info.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className={`w-6 h-6 ${info.color}`} />
                          </div>
                          {isContratado && (
                            <CheckCircle2 className="w-5 h-5 text-wg-orange" />
                          )}
                        </div>
                        <h3 className="font-semibold text-wg-black mb-1 group-hover:text-wg-orange transition-colors">
                          {info.label}
                        </h3>
                        <p className="text-sm text-wg-gray">{info.description}</p>
                        {isContratado && (
                          <span className="inline-block mt-2 text-xs text-wg-orange font-medium">
                            {t('accountPage.nucleos.hired')}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-3 text-sm text-wg-orange opacity-0 group-hover:opacity-100 transition-opacity">
                          {t('accountPage.nucleos.learnMore')} <ArrowRight className="w-4 h-4" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="mt-6 p-4 bg-gradient-to-r from-wg-orange/10 to-wg-orange/5 rounded-xl">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="font-semibold text-wg-black">
                        {temContratos
                          ? t('accountPage.cta.titleExisting')
                          : t('accountPage.cta.titleNew')}
                      </h3>
                      <p className="text-sm text-wg-gray">{t('accountPage.cta.subtitle')}</p>
                    </div>
                    <Link to="/solicite-proposta">
                      <Button className="btn-primary">
                        {t('accountPage.cta.button')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Contato Rápido */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gradient-to-br from-wg-black to-wg-black/95 rounded-2xl p-8 shadow-lg overflow-hidden relative">
              {/* Elemento decorativo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-wg-orange/10 rounded-full blur-3xl" />

              <h2 className="text-xl font-inter font-light text-white mb-2 relative z-10">
                <Trans i18nKey="accountPage.support.title">
                  Precisa de <span className="font-medium text-wg-orange">Ajuda</span>?
                </Trans>
              </h2>
              <p className="text-white/60 text-sm mb-6 relative z-10">
                {t('accountPage.support.subtitle')}
              </p>
              <div className="flex flex-wrap gap-3 relative z-10">
                <a
                  href="https://wa.me/5511984650002"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 hover:shadow-lg transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('accountPage.support.whatsapp')}</span>
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-full hover:bg-white/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('accountPage.support.email')}</span>
                </a>
                <Link
                  to="/contato"
                  className="flex items-center gap-2 px-5 py-3 bg-wg-orange text-white rounded-full hover:bg-wg-orange/90 hover:shadow-lg transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('accountPage.support.form')}</span>
                </Link>
                {pessoa?.id && (
                  <a
                    href={`${PRODUCT_URLS.wgeasy}/area-cliente?cliente=${pessoa.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-white text-wg-black rounded-full hover:shadow-lg transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="font-medium text-sm">{t('accountPage.support.portal')}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </>
  );
};

export default Account;
