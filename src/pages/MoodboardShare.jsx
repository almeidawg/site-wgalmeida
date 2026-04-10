import SEO from '@/components/SEO';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, CheckCircle2, Copy, Image as ImageIcon, Palette, Share2 } from 'lucide-react';
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

  if (!shareData?.transformedUrl) {
    return (
      <>
        <SEO
          pathname="/moodboard/share"
          title="Compartilhamento Moodboard | WG Almeida"
          description="Confira uma prévia compartilhada de transformação de ambiente criada pela WG Almeida."
          noindex
        />
        <section className="min-h-screen bg-[#F7F3EE] hero-under-header flex items-center">
          <div className="container-custom max-w-3xl text-center py-24">
            <h1 className="text-4xl md:text-5xl font-light text-wg-black mb-6">
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
                className="inline-flex items-center gap-3 rounded-full border border-[#D7D0C7] px-7 py-3 text-wg-black font-light"
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

      <section className="hero-under-header min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,159,11,0.12),_transparent_42%),linear-gradient(180deg,#F7F3EE_0%,#FFFDF9_44%,#F4F1EA_100%)]">
        <div className="container-custom py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[28px] border border-[#E5DED4] bg-white shadow-[0_26px_70px_rgba(26,26,26,0.10)]"
            >
              <div className="flex items-center justify-between border-b border-[#ECE7DF] px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#7A746B]">
                    Transformação compartilhada
                  </p>
                  <h1 className="mt-2 text-[30px] md:text-[38px] leading-tight font-light text-wg-black">
                    {shareData.imageName}
                  </h1>
                </div>
                <span className="rounded-full border border-[#E4DBCF] px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[#7A746B]">
                  WG AI Moodboard
                </span>
              </div>

              <div className="p-4 md:p-6">
                <div className="overflow-hidden rounded-[24px] bg-[#F5F0E9]">
                  <img
                    src={shareData.transformedUrl}
                    alt={`Transformação de ambiente ${shareData.imageName}`}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] border border-[#ECE4D8] bg-[#FAF8F3] p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A746B]">Paleta aplicada</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {(shareData.availableColors || []).slice(0, 6).map((color) => (
                        <span key={color} className="flex flex-col items-center gap-2">
                          <span className="h-10 w-10 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
                          <span className="text-[11px] text-[#5B5B5B]">{color}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#ECE4D8] bg-[#FAF8F3] p-5">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A746B]">Elementos trabalhados</p>
                    <div className="mt-4 space-y-3">
                      {colorEntries.length > 0 ? colorEntries.map(([element, color]) => (
                        <div key={element} className="flex items-center justify-between rounded-full bg-white px-4 py-2">
                          <span className="text-sm text-wg-black capitalize">{element.replace(/-/g, ' ')}</span>
                          <span className="inline-flex items-center gap-2 text-sm text-[#5B5B5B]">
                            <span className="h-4 w-4 rounded-full border border-[#D7D0C7]" style={{ backgroundColor: color }} />
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
              <div className="rounded-[28px] border border-[#E5DED4] bg-[#1F1E1C] p-7 text-white shadow-[0_22px_58px_rgba(26,26,26,0.16)]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/60">Próximo passo</p>
                <h2 className="mt-3 text-[30px] leading-tight font-light">
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

              <div className="rounded-[24px] border border-[#E5DED4] bg-white p-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A746B]">O que esta landing resolve</p>
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

              <div className="rounded-[24px] border border-[#E5DED4] bg-white p-6">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-wg-orange" />
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A746B]">
                    Compartilhamento e continuidade
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C5] px-5 py-3 text-sm text-wg-black"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Link copiado' : 'Copiar landing'}
                  </button>
                  <Link
                    to="/moodboard"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C5] px-5 py-3 text-sm text-wg-black"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Criar nova versão
                  </Link>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Confira esta transformação de ambiente da WG Almeida:\n${currentUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D8D0C5] px-5 py-3 text-sm text-wg-black"
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
