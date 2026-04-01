/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState } from "react";
import { TYPOGRAPHY } from "@/constants/typography";

const itens = [
  {
    descricao: "Abertura de alvenaria com acabamento em cozinha",
    qtd: "2.08",
    unidade: "m2",
    unitario: "R$ 381,57",
    subtotal: "R$ 793,67",
  },
  {
    descricao: "Argamassa polimérica impermeabilizante 5000 fibras",
    qtd: "2",
    unidade: "un",
    unitario: "R$ 189,95",
    subtotal: "R$ 379,90",
  },
  {
    descricao: "Emassamento e pintura (paredes + teto)",
    qtd: "58",
    unidade: "m2",
    unitario: "R$ 8,25",
    subtotal: "R$ 478,50",
  },
  {
    descricao: "Marcenaria sob medida - cozinha linear",
    qtd: "5.5",
    unidade: "m2",
    unitario: "R$ 1.997,04",
    subtotal: "R$ 10.983,72",
  },
];

const etapas = [
  { titulo: "AprovaçÍo do cliente", data: "Hoje", status: "aguardando" },
  { titulo: "EmissÍo de contrato", data: "D+1", status: "previsto" },
  { titulo: "Financeiro e cobrança", data: "D+2", status: "previsto" },
];

export default function PropostaContratoTemplateMockupPage() {
  const [avatarErro, setAvatarErro] = useState(false);
  const avatarUrl = "/clientes/rafael-lacerda.jpg";

  return (
    <div className="min-h-screen bg-[#F6F2EB] text-[#1C1B1A]">
      <style>
        {`:root {
          --wg-ink: #1C1B1A;
          --wg-sand: #F6F2EB;
          --wg-cream: #FFF9F1;
          --wg-orange: #F25C26;
          --wg-teal: #0ABAB5;
          --wg-green: #5E9B94;
          --wg-charcoal: #2B2A28;
        }

        .wg-glow {
          background: radial-gradient(circle at top left, rgba(10, 186, 181, 0.18), transparent 55%),
            radial-gradient(circle at bottom right, rgba(242, 92, 38, 0.15), transparent 55%);
        }
        `}
      </style>

      <div className="wg-glow">
        <header className="mx-auto max-w-6xl px-6 pt-8">
          <div className="flex flex-col gap-5 rounded-3xl border border-[#E7DED2] bg-white/90 p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                    alt="WG"
                    className="h-24 w-auto object-contain"
                  />
                  <p className={TYPOGRAPHY.overline}>WG Easy · Proposta & Contrato</p>
                </div>
                <h1 className={`${TYPOGRAPHY.pageTitle} mt-2 text-[var(--wg-charcoal)]`}>
                  Materiais e aditivos para abertura de alvenaria
                </h1>
                <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
                  Criado em 30/01/2026 · Número: ENG/20260210#032 · Status: rascunho
                </p>
              </div>
              <div className="flex flex-col gap-3" />
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-[#EFE6DA] bg-white p-4">
                <h2 className={`${TYPOGRAPHY.sectionTitle} text-[#F25C26]`}>Cliente & Projeto</h2>
                <div className={`mt-2 grid gap-3 ${TYPOGRAPHY.bodyMedium} text-[#3E372F]`}>
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-[#EFE6DA] text-[#6B6258] flex items-center justify-center text-sm font-semibold">
                      {!avatarErro && (
                        <img
                          src={avatarUrl}
                          alt="Foto do cliente"
                          className="h-full w-full object-cover"
                          onError={() => setAvatarErro(true)}
                        />
                      )}
                      {avatarErro && <span>RL</span>}
                    </div>
                    <div>
                      <p className={TYPOGRAPHY.overline}>Cliente</p>
                      <p className="font-medium">Rafael de Souza Lacerda</p>
                      <p className={`${TYPOGRAPHY.bodySmall} text-[#7C7368]`}>rafael@email.com · (11) 96890-0109</p>
                    </div>
                  </div>
                  <div>
                    <p className={TYPOGRAPHY.overline}>Endereço da obra</p>
                    <p>Rua Monte Verde, 420 · Apto 302 · SÍo Paulo - SP</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full bg-white px-3 py-1 ${TYPOGRAPHY.badgeSmall} text-[#6E655A]`}>
                      Núcleo: Marcenaria
                    </span>
                    <span className={`rounded-full bg-white px-3 py-1 ${TYPOGRAPHY.badgeSmall} text-[#6E655A]`}>
                      Prazo de execuçÍo: 35 dias
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#F0D6C9] bg-[var(--wg-orange)] p-4 text-white text-right">
                <p className={`${TYPOGRAPHY.overline} text-white/80`}>Valor total</p>
                <p className="mt-2 text-3xl font-semibold">R$ 32.480,72</p>
                <p className={`${TYPOGRAPHY.bodySmall} mt-1 text-white/80`}>12 itens incluídos · Validade 10 dias</p>
                <div className={`mt-4 grid gap-2 ${TYPOGRAPHY.bodySmall}`}>
                  <div className="flex items-center justify-between">
                    <span>Entrada 30%</span>
                    <span>R$ 9.744,22</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Saldo 3x</span>
                    <span>R$ 7.578,83</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button className="rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold text-white/90 hover:border-white hover:text-white">
                      Recusar
                    </button>
                    <button className="rounded-full border border-white/60 px-3 py-1.5 text-xs font-semibold text-white/90 hover:border-white hover:text-white">
                      Revisar
                    </button>
                  </div>
                  <button className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#C2451F] shadow-[0_6px_14px_rgba(0,0,0,0.12)] hover:bg-white/95">
                    Aprovar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto mt-6 grid max-w-6xl gap-5 px-6 pb-12">
          <section className="rounded-3xl border border-[#E7DED2] bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className={`${TYPOGRAPHY.sectionTitle} text-[#2B2A28]`}>Itens do orçamento</h2>
              <span className={`${TYPOGRAPHY.caption} text-[#8A8176]`}>Organizado por categoria</span>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#E5E7EB]">
              <div className="grid grid-cols-[2.5fr_0.5fr_0.5fr_0.5fr] bg-white px-4 py-3 text-[9px] sm:text-[10px] font-normal text-[#8A8176] border-b border-[#E5E7EB]">
                <span>DescriçÍo</span>
                <span>Qtd</span>
                <span>Valor unit.</span>
                <span>Subtotal</span>
              </div>
              {itens.map((item) => (
                <div
                  key={item.descricao}
                  className="grid grid-cols-[2.5fr_0.5fr_0.5fr_0.5fr] items-center border-t border-[#F1F5F9] px-4 py-2.5 text-[9px] sm:text-[10px] text-[#3A342D]"
                >
                  <span className="font-medium">{item.descricao}</span>
                  <span>
                    {item.qtd} {item.unidade}
                  </span>
                  <span>{item.unitario}</span>
                  <span className="font-semibold text-[#2B2A28]">{item.subtotal}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E7DED2] bg-white p-5">
            <h3 className={`${TYPOGRAPHY.sectionTitle} text-[#2B2A28]`}>Escopo e entregáveis</h3>
            <ul className="mt-2 space-y-2 text-[9px] sm:text-[10px] text-[#5C5148]">
              <li>• Projeto executivo + detalhamento marcenaria</li>
              <li>• Memorial e especificaçÍo técnica</li>
              <li>• Cronograma macro e plano de instalaçÍo</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-[#E7DED2] bg-white p-5">
            <h3 className={`${TYPOGRAPHY.sectionTitle} text-[#2B2A28]`}>Condições comerciais</h3>
            <ul className="mt-2 space-y-2 text-[9px] sm:text-[10px] text-[#5C5148]">
              <li>• 30% de entrada na assinatura</li>
              <li>• 3 parcelas mensais no boleto</li>
              <li>• Garantia de 5 anos (marcenaria)</li>
            </ul>
          </section>

          <aside className="grid gap-5" />
        </main>
      </div>
    </div>
  );
}

