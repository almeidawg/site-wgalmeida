import { useState } from "react";
import {
  ObraEtapaCompleta,
  STATUS_LABELS,
  STATUS_COLORS,
  formatarData,
  calcularDiasAtraso,
  calcularDiasRestantes,
} from "@/types/etapas";
import {
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  PenTool,
} from "lucide-react";
import EtapaProgress from "./EtapaProgress";

type Props = {
  etapa: ObraEtapaCompleta;
  onClick?: () => void;
  expandivel?: boolean;
};

export default function EtapaCard({ etapa, onClick, expandivel = false }: Props) {
  const [expandido, setExpandido] = useState(false);

  const diasAtraso = calcularDiasAtraso(etapa);
  const diasRestantes = calcularDiasRestantes(etapa);
  const cor = STATUS_COLORS[etapa.status];

  const handleClick = () => {
    if (expandivel) {
      setExpandido(!expandido);
    }
    onClick?.();
  };

  return (
    <div
      className="etapa-card bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-normal text-gray-900 text-lg">
                {etapa.titulo}
              </h3>
              <span
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: cor }}
              >
                {STATUS_LABELS[etapa.status]}
              </span>
            </div>

            {etapa.descricao && (
              <p className="text-sm text-gray-600 mb-3">{etapa.descricao}</p>
            )}

            {/* Progress Bar */}
            <EtapaProgress etapa={etapa} showStatus={false} />
          </div>

          {expandivel && (
            <button
              className="ml-4 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setExpandido(!expandido);
              }}
            >
              {expandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Responsável */}
        {etapa.responsavel_nome && (
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Responsável</p>
              <p className="text-sm font-medium text-gray-900">
                {etapa.responsavel_nome}
              </p>
              {etapa.responsavel_cargo && (
                <p className="text-xs text-gray-500">{etapa.responsavel_cargo}</p>
              )}
            </div>
          </div>
        )}

        {/* Data Início */}
        {etapa.data_inicio_prevista && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Início Previsto</p>
              <p className="text-sm font-medium text-gray-900">
                {formatarData(etapa.data_inicio_prevista)}
              </p>
              {etapa.data_inicio_real && (
                <p className="text-xs text-green-600">
                  Real: {formatarData(etapa.data_inicio_real)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data Fim */}
        {etapa.data_fim_prevista && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">ConclusÍo Prevista</p>
              <p className="text-sm font-medium text-gray-900">
                {formatarData(etapa.data_fim_prevista)}
              </p>
              {etapa.data_fim_real && (
                <p className="text-xs text-green-600">
                  Real: {formatarData(etapa.data_fim_real)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Prazo/Atraso */}
        {diasAtraso > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <div>
              <p className="text-xs text-gray-500">Atraso</p>
              <p className="text-sm font-normal text-red-600">
                {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}
              </p>
            </div>
          </div>
        )}

        {diasAtraso === 0 && diasRestantes > 0 && (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Restam</p>
              <p className="text-sm font-medium text-blue-600">
                {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="px-4 pb-4 flex items-center gap-4 text-sm">
        {/* Checklist */}
        {etapa.total_checklist > 0 && (
          <div className="flex items-center gap-1">
            <CheckCircle
              size={16}
              className={
                etapa.checklist_concluidos === etapa.total_checklist
                  ? "text-green-500"
                  : "text-gray-400"
              }
            />
            <span className="text-gray-600">
              {etapa.checklist_concluidos}/{etapa.total_checklist} itens
            </span>
          </div>
        )}

        {/* Evidências */}
        {etapa.total_evidencias > 0 && (
          <div className="flex items-center gap-1">
            <Image size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {etapa.total_evidencias}{" "}
              {etapa.total_evidencias === 1 ? "foto" : "fotos"}
            </span>
          </div>
        )}

        {/* Assinaturas */}
        {etapa.total_assinaturas > 0 && (
          <div className="flex items-center gap-1">
            <PenTool size={16} className="text-gray-400" />
            <span className="text-gray-600">
              {etapa.total_assinaturas}{" "}
              {etapa.total_assinaturas === 1 ? "assinatura" : "assinaturas"}
            </span>
          </div>
        )}

        {/* Alertas */}
        {etapa.alertas_pendentes > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-600 font-medium">
              {etapa.alertas_pendentes}{" "}
              {etapa.alertas_pendentes === 1 ? "alerta" : "alertas"}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo Expandido */}
      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-100 mt-2 pt-4">
          {/* Subetapas */}
          {etapa.subetapas && etapa.subetapas.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-normal text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} />
                Subetapas ({etapa.subetapas.length})
              </h4>
              <div className="space-y-2">
                {etapa.subetapas.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {sub.titulo}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: STATUS_COLORS[sub.status] }}
                      >
                        {STATUS_LABELS[sub.status]}
                      </span>
                    </div>
                    <EtapaProgress
                      etapa={sub}
                      showStatus={false}
                      showPercentage={true}
                      height={4}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {etapa.observacoes && (
            <div className="mb-4">
              <h4 className="text-sm font-normal text-gray-700 mb-2">
                Observações
              </h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {etapa.observacoes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

