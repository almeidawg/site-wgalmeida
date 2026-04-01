import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { defaultDriveLink } from "./data";

export default function AreaClienteDrivePage() {
  const [driveLink, setDriveLink] = useState(defaultDriveLink);
  const [copied, setCopied] = useState(false);

  const linkInfo = useMemo(
    () => [
      "O link é renderizado em um iframe seguro da WG, mantendo a navegaçÍo e as credenciais ocultas.",
      "Compartilhe apenas com clientes que já tenham concordado com os termos.",
      "Atualize o link a qualquer momento e gravamos o histórico do último envio.",
    ],
    []
  );

  const handleCopy = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(driveLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-10">
      <header className="rounded-3xl bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#0f172a] text-white p-8 shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <p className="text-[12px] uppercase tracking-[0.4em] text-white/60">Área do Cliente · Drive</p>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight">
              Defina o link compartilhado no Google Drive.
            </h1>
            <p className="text-[12px] text-white/80 max-w-3xl">
              Todo o conteúdo entregue ao cliente é hospedado dentro da experiência WG para manter a identidade visual e os controles de segurança.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md min-w-[260px] text-right">
            <p className="text-[12px] uppercase tracking-[0.3em] text-white/70">Última atualizaçÍo</p>
            <p className="text-[18px] font-light">Há 18 minutos</p>
            <p className="text-[12px] text-white/80">Link verificado automaticamente.</p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-light text-gray-900">Compartilhamento do Drive</h2>
              <p className="text-[12px] text-gray-500">Informe o link mestre que será renderizado dentro da Área do Cliente.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-[14px] text-gray-700">
              Testar link
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="text"
              value={driveLink}
              onChange={(event) => setDriveLink(event.target.value)}
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-[12px] focus:border-[#F25C26] focus:outline-none focus:ring-2 focus:ring-[#F25C26]/50"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary hover:bg-[#d94d1a] px-4 py-3 text-[12px] font-normal uppercase tracking-[0.3em] text-white transition"
            >
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
          {linkInfo.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-1" />
              <p className="text-[12px] text-gray-600">{item}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 space-y-2">
          <p className="text-[12px] uppercase tracking-[0.3em] text-gray-400">Histórico de compartilhamento</p>
          <p className="text-[12px] text-gray-700">
            Últimas três atualizações do link:
            <span className="block text-[12px] text-gray-500">10/12 · 09/12 · 06/12</span>
          </p>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] font-normal text-[#F25C26] inline-flex items-center gap-1"
          >
            Abrir Google Drive <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>
    </div>
  );
}

