import {
  ObraEtapaCompleta,
  STATUS_LABELS,
  STATUS_COLORS,
  formatarData,
  calcularDiasAtraso,
} from "@/types/etapas";
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Clock,
  Lock,
  XCircle,
} from "lucide-react";

type Props = {
  etapas: ObraEtapaCompleta[];
  onEtapaClick?: (etapa: ObraEtapaCompleta) => void;
};

export default function EtapaTimeline({ etapas, onEtapaClick }: Props) {
  // Ordenar etapas por ordem
  const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

  function getIconeStatus(etapa: ObraEtapaCompleta) {
    const cor = STATUS_COLORS[etapa.status];

    switch (etapa.status) {
      case "concluida":
        return <CheckCircle size={24} style={{ color: cor }} />;
      case "em_andamento":
        return <Clock size={24} style={{ color: cor }} />;
      case "atrasada":
        return <AlertCircle size={24} style={{ color: cor }} />;
      case "bloqueada":
        return <Lock size={24} style={{ color: cor }} />;
      case "cancelada":
        return <XCircle size={24} style={{ color: cor }} />;
      default:
        return <Circle size={24} style={{ color: cor }} />;
    }
  }

  return (
    <div className="etapa-timeline">
      {etapasOrdenadas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma etapa cadastrada</p>
        </div>
      )}

      <div className="relative">
        {etapasOrdenadas.map((etapa, index) => {
          const isUltima = index === etapasOrdenadas.length - 1;
          const diasAtraso = calcularDiasAtraso(etapa);
          const cor = STATUS_COLORS[etapa.status];

          return (
            <div key={etapa.id} className="relative pb-8">
              {/* Linha conectora */}
              {!isUltima && (
                <div
                  className="absolute left-3 top-8 w-0.5 h-full bg-gray-300"
                  style={{
                    backgroundColor:
                      etapa.status === "concluida" ? cor : "#D1D5DB",
                  }}
                />
              )}

              {/* Item da timeline */}
              <div
                className="relative flex items-start gap-4 cursor-pointer group"
                onClick={() => onEtapaClick?.(etapa)}
              >
                {/* Ícone */}
                <div className="flex-shrink-0 relative z-10 bg-white">
                  {getIconeStatus(etapa)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm group-hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-normal text-gray-900 text-lg">
                        {etapa.titulo}
                      </h3>
                      {etapa.descricao && (
                        <p className="text-sm text-gray-600 mt-1">
                          {etapa.descricao}
                        </p>
                      )}
                    </div>

                    <span
                      className="ml-4 px-3 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap"
                      style={{ backgroundColor: cor }}
                    >
                      {STATUS_LABELS[etapa.status]}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    {/* Responsável */}
                    {etapa.responsavel_nome && (
                      <div>
                        <p className="text-xs text-gray-500">Responsável</p>
                        <p className="text-sm font-medium text-gray-900">
                          {etapa.responsavel_nome}
                        </p>
                      </div>
                    )}

                    {/* Data Início */}
                    {etapa.data_inicio_prevista && (
                      <div>
                        <p className="text-xs text-gray-500">Início</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatarData(etapa.data_inicio_prevista)}
                        </p>
                      </div>
                    )}

                    {/* Data Fim */}
                    {etapa.data_fim_prevista && (
                      <div>
                        <p className="text-xs text-gray-500">ConclusÍo</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatarData(etapa.data_fim_prevista)}
                        </p>
                      </div>
                    )}

                    {/* Progresso */}
                    <div>
                      <p className="text-xs text-gray-500">Progresso</p>
                      <p className="text-sm font-normal" style={{ color: cor }}>
                        {etapa.percentual_concluido}%
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${etapa.percentual_concluido}%`,
                          backgroundColor: cor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Alertas/Avisos */}
                  {diasAtraso > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-red-600">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">
                        Atrasada em {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}
                      </span>
                    </div>
                  )}

                  {etapa.alertas_pendentes > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-orange-600">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">
                        {etapa.alertas_pendentes}{" "}
                        {etapa.alertas_pendentes === 1 ? "alerta pendente" : "alertas pendentes"}
                      </span>
                    </div>
                  )}

                  {/* Estatísticas */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                    {etapa.total_checklist > 0 && (
                      <span>
                        ✓ {etapa.checklist_concluidos}/{etapa.total_checklist} checklist
                      </span>
                    )}
                    {etapa.total_evidencias > 0 && (
                      <span>📷 {etapa.total_evidencias} fotos</span>
                    )}
                    {etapa.total_assinaturas > 0 && (
                      <span>✍️ {etapa.total_assinaturas} assinaturas</span>
                    )}
                  </div>

                  {/* Subetapas (resumo) */}
                  {etapa.subetapas && etapa.subetapas.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">
                        {etapa.subetapas.length}{" "}
                        {etapa.subetapas.length === 1 ? "subetapa" : "subetapas"}
                      </p>
                      <div className="flex gap-1">
                        {etapa.subetapas.slice(0, 5).map((sub) => (
                          <div
                            key={sub.id}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: STATUS_COLORS[sub.status],
                            }}
                            title={`${sub.titulo} - ${STATUS_LABELS[sub.status]}`}
                          />
                        ))}
                        {etapa.subetapas.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{etapa.subetapas.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

