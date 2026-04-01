import { ArrowRight, CheckCircle2, Clock, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const beneficios = [
  {
    titulo: "Projeto + Obra + Marcenaria",
    descricao: "Time único, planejamento integrado e controle de qualidade WG do começo ao fim.",
    icon: Sparkles,
  },
  {
    titulo: "Entrega no Prazo",
    descricao: "Cronograma executivo com milestones claros e acompanhamento em tempo real.",
    icon: Clock,
  },
  {
    titulo: "Acabamento Alto PadrÍo",
    descricao: "Curadoria de materiais, marcenaria sob medida e controle rigoroso de execuçÍo.",
    icon: Shield,
  },
];

export default function TurnKeyAltoPadraoPage() {
  const ctaHref = "/solicite-sua-proposta?ref=ads_turnkey";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-16 pb-20 space-y-16">
        <header className="grid lg:grid-cols-2 gap-10 items-stretch min-h-[90vh]">
          <div className="space-y-6 flex flex-col justify-center">
            <p className="uppercase tracking-[0.3em] text-xs text-slate-300">
              Turn Key • Alto PadrÍo
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-white">
              Reforma e marcenaria de alto padrÍo, entregues ponta a ponta pela WG Almeida.
            </h1>
            <p className="text-lg text-slate-200/90">
              Cuidamos de projeto executivo, obra e mobiliário sob medida em um fluxo único.
              Menos risco, mais previsibilidade e um acabamento que sustenta o nível premium
              que seu imóvel merece.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={ctaHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-[#d94e1f] active:bg-[#d94e1f] text-white font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F25C26]"
              >
                Solicitar proposta
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="https://www.instagram.com/grupowgalmeida/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                Ver portfólio
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Atendimento prioritário para obras residenciais na capital e interior de SP.
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl min-h-[55vh] lg:min-h-full bg-black">
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <iframe
                  title="WG Almeida institucional"
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed?listType=user_uploads&list=wgalmeida&autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=wgalmeida&modestbranding=1&playsinline=1"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/60"
              style={{ backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.65) 100%)" }}
            />
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <p className="text-sm text-slate-200/80">Metodologia Turn Key</p>
              <p className="text-xl font-semibold text-white">
                Cronograma, budget, suprimentos e marcenaria na mesma linha do tempo.
              </p>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">
            <section className="grid sm:grid-cols-2 gap-4">
              {beneficios.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#F25C26]">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.titulo}</h3>
                  <p className="text-sm text-slate-200/90">{item.descricao}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Próximo passo</p>
                <h2 className="text-2xl font-semibold text-white">Conte-nos sobre seu projeto</h2>
                <p className="text-sm text-slate-200/90 max-w-2xl">
                  Preencha o formulário em menos de 3 minutos. Respondemos rapidamente com
                  viabilidade, orçamento inicial e sugestÍo de agenda para visita técnica.
                </p>
              </div>
              <Link
                to={ctaHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-[#d94e1f] active:bg-[#d94e1f] text-white font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F25C26]"
              >
                Ir para o formulário
                <ArrowRight className="w-5 h-5" />
              </Link>
            </section>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </div>
  );
}

