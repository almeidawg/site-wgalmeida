import type { Anexo } from "@/pages/engenharia/ObraAnexos";
import "@/styles/anexos-modal.css";

type Props = {
  anexo: Anexo;
  onClose: () => void;
};

function ehImagem(anexo: Anexo) {
  if (anexo.mime_type?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp)$/i.test(anexo.nome_arquivo);
}

function ehPdf(anexo: Anexo) {
  if (anexo.mime_type?.includes("pdf")) return true;
  return /\.pdf$/i.test(anexo.nome_arquivo);
}

export default function AnexoPreviewModal({ anexo, onClose }: Props) {
  const image = ehImagem(anexo);
  const pdf = ehPdf(anexo);

  return (
    <div className="anexo-modal-backdrop" onClick={onClose}>
      <div
        className="anexo-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="anexo-modal-header">
          <div className="anexo-modal-title">
            <h3>{anexo.nome_arquivo}</h3>
            <span>{anexo.categoria}</span>
          </div>
          <button onClick={onClose} className="anexo-modal-close">
            ✕
          </button>
        </div>

        <div className="anexo-modal-body">
          {image && (
            <img
              src={anexo.url_publica}
              alt={anexo.nome_arquivo}
              className="anexo-modal-img"
            />
          )}

          {!image && pdf && (
            <iframe
              src={anexo.url_publica}
              className="anexo-modal-frame"
              title={anexo.nome_arquivo}
            />
          )}

          {!image && !pdf && (
            <div className="anexo-modal-generic">
              <p>Pré-visualizaçÍo não disponível para este tipo de arquivo.</p>
              <a
                href={anexo.url_publica}
                target="_blank"
                rel="noreferrer"
                className="anexo-modal-download"
              >
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


