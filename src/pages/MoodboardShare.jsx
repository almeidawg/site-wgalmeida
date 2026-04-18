import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, CheckCircle2, Copy, Image as ImageIcon, Palette, Printer, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { decodeMoodboardSharePayload } from '@/utils/moodboardShare';

const WHATSAPP_URL = 'https://wa.me/5511984650002';

const MoodboardShare = () => {
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const shareData = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return decodeMoodboardSharePayload(params.get('data'));
  }, [location.search]);

  const colorEntries = Object.entries(shareData?.elementColors || {}).filter(([, value]) => Boolean(value));
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://wgalmeida.com.br/moodboard/share';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (shareData?.kind === 'style-guide') {
    const whatsappText = encodeURIComponent(
      `Olá, quero avançar com este guia de estilo WG Almeida: ${currentUrl}`
    );

    return (
      <>
        <SEO
          pathname="/moodboard/share"
          title={`Guia de estilo | ${shareData.clientName || 'WG Almeida'}`}
          description="Guia de estilo publico com direcao visual, paleta, ambientes e materiais curados pela WG Almeida."
          og={{
            image: shareData.cover?.imageUrl,
            title: `Guia de estilo | ${shareData.clientName || 'WG Almeida'}`,
            description: 'Documento visual publico com direcao estetica, materiais e proximos passos.',
          }}
          twitter={{
            image: shareData.cover?.imageUrl,
            title: `Guia de estilo | ${shareData.clientName || 'WG Almeida'}`,
            description: 'Documento visual publico com direcao estetica, materiais e proximos passos.',
          }}
          noindex
        />

        <section className="hero-under-header min-h-screen bg-[linear-gradient(180deg,#F3F5F7_0%,#FBFBFA_46%,#F4F1EC_100%)]">
          <div className="container-custom py-10 md:py-14">
            <div className="overflow-hidden rounded-[34px] border border-black/6 bg-[#181A1D] text-white shadow-[0_35px_90px_rgba(23,24,25,0.16)]">
              <div className="relative min-h-[520px] overflow-hidden px-6 py-8 md:px-10 md:py-10">
                {shareData.cover?.imageUrl ? (
                  <img
                    src={shareData.cover.imageUrl}
                    alt={shareData.cover.caption || shareData.styleTitle}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(10,10,11,0.92)_0%,rgba(10,10,11,0.72)_42%,rgba(10,10,11,0.22)_100%)]" />

                <div className="relative z-10 flex h-full min-h-[440px] flex-col justify-between">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72">
                      WG Almeida
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72">
                      Guia de estilo publico
                    </span>
                  </div>

                  <div className="max-w-4xl">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-wg-orange">Direcao visual personalizada</p>
                    <h1 className="mt-4 font-playfair text-4xl font-light leading-[0.98] md:text-5xl">
                      {shareData.clientName || 'Cliente WG Almeida'}
                    </h1>
                    <p className="mt-5 text-xl font-light text-white/82 md:text-2xl">
                      {shareData.styleTitle || 'Direcao estetica definida'}
                    </p>
                    {shareData.styleDescription ? (
                      <p className="mt-5 max-w-2xl text-[15px] leading-8 text-white/72">
                        {shareData.styleDescription}
                      </p>
                    ) : null}

                    {!!shareData.colorPalette?.length && (
                      <div className="mt-8 flex flex-wrap gap-3">
                        {shareData.colorPalette.slice(0, 5).map((color) => (
                          <div key={color} className="text-center">
                            <div
                              className="h-14 w-14 rounded-2xl border border-white/35 shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                              style={{ backgroundColor: color }}
                            />
                            <span className="mt-2 block text-[10px] uppercase tracking-[0.15em] text-white/68">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-xl">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-white/52">Leitura da curadoria</p>
                      <p className="mt-2 text-sm leading-7 text-white/72">
                        Este material organiza imagem, paleta, atmosfera, acabamentos e referencias de ambiente para reduzir indecisao e alinhar os proximos passos do projeto.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={`${WHATSAPP_URL}?text=${whatsappText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-wg-orange px-5 py-3 text-sm text-white"
                      >
                        Avancar com a WG
                        <ArrowRight className="h-4 w-4" />
                      </a>
                      <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 rounded-full border border-white/16 px-5 py-3 text-sm text-white"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 bg-[#FAFBFB] px-6 py-8 text-[#1d1d1b] md:px-10 md:py-10">
                {!!shareData.environments?.length && (
                  <div>
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">Ambientes-chave</p>
                        <h2 className="mt-2 font-playfair text-[2rem] font-light">Leituras espaciais</h2>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {shareData.environments.map((environment) => (
                        <article key={environment.id} className="overflow-hidden rounded-[26px] border border-black/6 bg-white shadow-[0_16px_45px_rgba(24,23,22,0.06)]">
                          {environment.imageUrl ? (
                            <img src={environment.imageUrl} alt={environment.title} className="h-56 w-full object-cover" />
                          ) : null}
                          <div className="space-y-3 p-5">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">{environment.caption || 'Ambiente'}</p>
                            <h3 className="text-xl font-light">{environment.title}</h3>
                            <p className="text-sm leading-7 text-[#59544d]">{environment.description}</p>
                            <p className="rounded-2xl bg-[#F3F5F7] px-4 py-3 text-sm leading-7 text-[#3e3a34]">
                              {environment.rationale}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {!!shareData.materials?.length && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">Materiais e acabamentos</p>
                    <h2 className="mt-2 font-playfair text-[2rem] font-light">Camadas para formar a experiencia</h2>
                    <div className="mt-5 grid gap-5">
                      {shareData.materials.map((material) => (
                        <article key={material.id} className="rounded-[28px] border border-black/6 bg-white p-5 shadow-[0_16px_45px_rgba(24,23,22,0.05)]">
                          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">{material.title}</p>
                              <p className="mt-3 text-sm leading-7 text-[#59544d]">{material.description}</p>
                              <p className="mt-4 rounded-2xl bg-[#171A1D] px-4 py-4 text-sm leading-7 text-white/82">
                                {material.rationale}
                              </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {material.images?.slice(0, 4).map((image, index) => (
                                <div key={`${material.id}-${index}`} className="overflow-hidden rounded-[22px] bg-[#F3F5F7]">
                                  <img src={image.imageUrl} alt={image.caption || material.title} className="h-40 w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                  <div className="rounded-[28px] border border-black/6 bg-white p-6 shadow-[0_16px_45px_rgba(24,23,22,0.05)]">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">Compartilhar</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm text-wg-black"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? 'Link copiado' : 'Copiar link'}
                      </button>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Confira este guia de estilo WG Almeida:\n${currentUrl}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm text-wg-black"
                      >
                        <Share2 className="h-4 w-4" />
                        Recompartilhar
                      </a>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-black/6 bg-[#181A1D] p-6 text-white shadow-[0_16px_45px_rgba(24,23,22,0.08)]">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Proximo passo</p>
                    <h2 className="mt-3 font-playfair text-[2rem] font-light">Transformar inspiracao em decisao real</h2>
                    <p className="mt-4 text-sm leading-7 text-white/72">
                      O guia ja organiza direcao visual, atmosfera e materiais. A etapa seguinte e transformar essa leitura em briefing, especificacao, proposta e execucao.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={`${WHATSAPP_URL}?text=${whatsappText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-wg-orange px-5 py-3 text-sm text-white"
                      >
                        Falar com a WG
                        <ArrowRight className="h-4 w-4" />
                      </a>
                      <Link
                        to="/solicite-proposta"
                        className="inline-flex items-center gap-2 rounded-full border border-white/16 px-5 py-3 text-sm text-white"
                      >
                        Solicitar proposta
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!shareData?.transformedUrl) {
    return (
      <>
        <SEO
          pathname="/moodboard/share"
          title="Compartilhamento Moodboard | WG Almeida"
          description="Confira uma prévia compartilhada de transformação de ambiente criada pela WG Almeida."
          noindex
        />
        <section className="hero-under-header flex min-h-screen items-center bg-[#F3F5F7]">
          <div className="container-custom max-w-3xl text-center py-24">
            <h1 className="mb-6 text-4xl font-light tracking-tight text-wg-black md:text-5xl">
              Link de moodboard inválido ou expirado
            </h1>
            <p className="text-lg text-[#5B5B5B] leading-relaxed mb-10">
              Gere uma nova transformação para compartilhar uma experiência completa, com imagem, paleta e acesso rápido para proposta.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/moodboard"
                className="inline-flex items-center gap-3 rounded-full bg-wg-black px-7 py-3 text-white font-light"
              >
                Criar novo moodboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/solicite-proposta"
                className="inline-flex items-center gap-3 rounded-full border border-black/10 px-7 py-3 text-wg-black font-light"
              >
                Solicitar proposta
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        pathname="/moodboard/share"
        title={`Transformação de ambiente | ${shareData.imageName} | WG Almeida`}
        description="Confira uma transformação de ambiente com IA criada pela WG Almeida e avance para briefing, material executivo e contratação."
        og={{
          image: shareData.transformedUrl,
          title: `Transformação de ambiente | ${shareData.imageName} | WG Almeida`,
          description: 'Prévia compartilhada com landing personalizada para briefing e contratação.',
        }}
        twitter={{
          image: shareData.transformedUrl,
          title: `Transformação de ambiente | ${shareData.imageName} | WG Almeida`,
          description: 'Prévia compartilhada com landing personalizada para briefing e contratação.',
        }}
        noindex
      />

      <section className="hero-under-header min-h-screen bg-[radial-gradient(circle_at_top,_rgba(242,92,38,0.08),_transparent_42%),linear-gradient(180deg,#F3F5F7_0%,#FBFBFA_44%,#F2EFEA_100%)]">
        <div className="container-custom py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[28px] border border-black/6 bg-white shadow-[0_26px_70px_rgba(26,26,26,0.10)]"
            >
              <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-wg-gray">
                    Transformação compartilhada
                  </p>
                  <h1 className="mt-2 text-[30px] font-light leading-tight tracking-tight text-wg-black md:text-[36px]">
                    {shareData.imageName}
                  </h1>
                </div>
                <span className="rounded-full border border-black/8 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-wg-gray">
                  WG AI Moodboard
                </span>
              </div>

              <div className="p-4 md:p-6">
                <div className="overflow-hidden rounded-[24px] bg-[#F1F3F5]">
                  <img
                    src={shareData.transformedUrl}
                    alt={`Transformação de ambiente ${shareData.imageName}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] border border-black/6 bg-[#FAFBFB] p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">Paleta aplicada</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {(shareData.availableColors || []).slice(0, 6).map((color) => (
                        <span key={color} className="flex flex-col items-center gap-2">
                          <span className="h-10 w-10 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                          <span className="text-[11px] text-[#5B5B5B]">{color}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-black/6 bg-[#FAFBFB] p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">Elementos trabalhados</p>
                    <div className="mt-4 space-y-3">
                      {colorEntries.length > 0 ? colorEntries.map(([element, color]) => (
                        <div key={element} className="flex items-center justify-between rounded-full bg-white px-4 py-2">
                          <span className="text-sm text-wg-black capitalize">{element.replace(/-/g, ' ')}</span>
                          <span className="inline-flex items-center gap-2 text-sm text-[#5B5B5B]">
                            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                            {color}
                          </span>
                        </div>
                      )) : (
                        <p className="text-sm text-[#5B5B5B] leading-relaxed">
                          Esta versão compartilhada foi gerada para avaliação visual e segue pronta para briefing técnico e refinamento executivo.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="space-y-5"
            >
              <div className="rounded-[28px] border border-black/6 bg-[#1A1D21] p-7 text-white shadow-[0_22px_58px_rgba(26,26,26,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Próximo passo</p>
                <h2 className="mt-3 text-[28px] font-light leading-tight tracking-tight">
                  Transforme esta prévia em material executivo e contratação
                </h2>
                <p className="mt-4 text-[15px] leading-[1.7] text-white/74">
                  A imagem compartilhada é a porta de entrada. A etapa seguinte inclui briefing, definição de escopo, direcionamento de materiais e proposta com equipe WG Almeida.
                </p>

                <div className="mt-6 space-y-3">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Olá, quero avançar com esta transformação de ambiente: ${currentUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-wg-orange px-6 py-3 text-white font-light"
                  >
                    Avançar pelo WhatsApp
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    to="/solicite-proposta"
                    className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-white/16 px-6 py-3 text-white font-light"
                  >
                    Solicitar proposta
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] border border-black/6 bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">O que esta landing resolve</p>
                <div className="mt-5 space-y-4">
                  {[
                    'Substitui o link cru do Cloudinary por uma apresentação de marca.',
                    'Mantém CTA direta para briefing, proposta e contratação.',
                    'Preserva a imagem transformada para compartilhamento e referência futura.',
                  ].map((item) => (
                    <div key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-wg-orange" />
                      <p className="text-[15px] leading-[1.6] text-[#4F4A43]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-black/6 bg-white p-6">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-wg-orange" />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-wg-gray">
                    Compartilhamento e continuidade
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm text-wg-black"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Link copiado' : 'Copiar landing'}
                  </button>
                  <Link
                    to="/moodboard"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm text-wg-black"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Criar nova versão
                  </Link>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Confira esta transformação de ambiente da WG Almeida:\n${currentUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm text-wg-black"
                  >
                    <Share2 className="h-4 w-4" />
                    Recompartilhar
                  </a>
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </>
  );
};

export default MoodboardShare;
