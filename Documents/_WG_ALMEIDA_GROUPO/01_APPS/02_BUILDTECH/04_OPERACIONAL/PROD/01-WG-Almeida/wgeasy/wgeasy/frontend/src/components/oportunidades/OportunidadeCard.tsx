// ============================================================
// COMPONENTE: OportunidadeCard (padrÍo WG EASY)
// Usado em Kanban, listas, modal, etc.
// ============================================================

import { Edit2, Trash2, FileText, MessageCircle, Mail, ChevronRight, Phone } from "lucide-react";
import Avatar from "@/components/common/Avatar";
import { formatarMoeda, formatarData } from "@/utils/formatadores";
import { CORES_NUCLEOS, type Estagio, type Nucleo } from "@/constants/oportunidades";

export interface OportunidadeClienteUI {
  id: string;
  nome: string;
  razao_social?: string | null;
  email?: string | null;
  telefone?: string | null;
  cargo?: string | null;
  unidade?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
}

export interface OportunidadeUI {
  id: string;
  titulo: string;
  estagio: Estagio;
  valor_estimado?: number | null;
  previsao_fechamento?: string | null;
  origem?: string | null;
  descricao?: string | null;
  observacoes?: string | null;
  cliente?: OportunidadeClienteUI | null;
  nucleos?: Array<{ nucleo: Nucleo; valor: number | null }>;
  // Datas específicas por núcleo
  data_fechamento?: string | null;
  data_inicio_projeto?: string | null;
  prazo_briefing?: string | null;
  prazo_anteprojeto?: string | null;
  prazo_projeto_executivo?: string | null;
  data_liberacao_obra?: string | null;
  data_inicio_obra?: string | null;
  prazo_obra_dias_uteis?: number | null;
  prazo_entrega?: string | null;
  data_medicao?: string | null;
  prazo_executivo?: string | null;
  data_assinatura_executivo?: string | null;
}

interface OportunidadeCardProps {
  oportunidade: OportunidadeUI;
  mode?: "kanban" | "list";
  nucleo?: "arquitetura" | "engenharia" | "marcenaria";
  showValue?: boolean;
  showDateInputs?: boolean;
  showDateBlock?: boolean;
  onFieldChange?: (field: keyof OportunidadeUI, value: string | number | null) => void;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPdf?: () => void;
}

export default function OportunidadeCard({
  oportunidade,
  mode = "kanban",
  nucleo,
  showValue = true,
  showDateInputs = false,
  showDateBlock = false,
  onFieldChange,
  onClick,
  onEdit,
  onDelete,
  onPdf,
}: OportunidadeCardProps) {
  const cliente = oportunidade.cliente;

  const whatsappLink = cliente?.telefone
    ? "https://wa.me/55" + cliente.telefone.replace(/\D/g, "")
    : null;

  const emailLink = cliente?.email ? `mailto:${cliente.email}` : null;
  const nucleoResolvido = (
    nucleo ||
    (oportunidade.nucleos && oportunidade.nucleos[0]
      ? (oportunidade.nucleos[0].nucleo as Nucleo)
      : "")
  )
    .toString()
    .toLowerCase();

  const isKanban = mode === "kanban";

  if (isKanban) {
    return (
      <div
        className="w-full bg-white rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-100 cursor-pointer"
        onClick={onClick}
      >
        {/* Header com Avatar */}
        {cliente && (
          <div className="flex items-center gap-2 p-3 pb-2 border-b border-gray-100">
            <Avatar
              nome={cliente.nome || "Cliente"}
              avatar_url={cliente.avatar_url}
              foto_url={cliente.foto_url}
              avatar={cliente.avatar}
              size={28}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] text-gray-600 font-normal uppercase truncate">
                {cliente.nome}
              </span>
              {cliente.telefone && (
                <div className="flex items-center gap-1">
                  <Phone size={9} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[10px] text-gray-400 truncate">{cliente.telefone}</span>
                </div>
              )}
            </div>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors"
                title="Abrir WhatsApp"
              >
                <MessageCircle size={14} />
              </a>
            )}
          </div>
        )}

        {/* Conteúdo do Card */}
        <div className="p-3">
          <div className="text-[13px] font-normal line-clamp-2 text-[#1A1A1A] mb-2">
            {oportunidade.titulo}
          </div>
          {oportunidade.descricao && (
            <div className="text-[11px] text-gray-500 line-clamp-2 mb-2">
              {oportunidade.descricao}
            </div>
          )}

          {/* Núcleos */}
          {oportunidade.nucleos && oportunidade.nucleos.length > 0 && (
            <div className="flex gap-0.5 mb-2">
              {oportunidade.nucleos.map((n, idx) => {
                const cores = CORES_NUCLEOS[n.nucleo as Nucleo] || {
                  border: "#D0D5DD",
                  text: "#475467",
                  secondary: "#F2F4F7",
                };
                return (
                  <span
                    key={idx}
                    className="text-[8px] font-normal px-1 py-px rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: cores.secondary,
                      color: cores.text,
                      border: `1px solid ${cores.border}`,
                    }}
                  >
                    {n.nucleo}
                  </span>
                );
              })}
            </div>
          )}

          {showDateBlock && nucleoResolvido && (
            <div className="grid grid-cols-1 gap-1 mb-2 text-[11px] text-gray-700">
              {nucleoResolvido === "engenharia" && (
                <>
                  <DateRow
                    label="Data de Fechamento"
                    value={oportunidade.data_fechamento || oportunidade.previsao_fechamento}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_fechamento", value)}
                  />
                  <DateRow
                    label="Data de LiberaçÍo da Obra"
                    value={oportunidade.data_liberacao_obra}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_liberacao_obra", value)}
                  />
                  <DateRow
                    label="Data de Início da Obra"
                    value={oportunidade.data_inicio_obra}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_inicio_obra", value)}
                  />
                  <DateRow
                    label="Prazo de Obra (dias úteis)"
                    value={oportunidade.prazo_obra_dias_uteis?.toString() || ""}
                    input={showDateInputs}
                    inputType="number"
                    onChange={(value) => onFieldChange?.("prazo_obra_dias_uteis", value ? Number(value) : null)}
                  />
                  <DateRow
                    label="Prazo de Entrega"
                    value={oportunidade.prazo_entrega}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("prazo_entrega", value)}
                  />
                </>
              )}
              {nucleoResolvido === "arquitetura" && (
                <>
                  <DateRow
                    label="Data de Fechamento"
                    value={oportunidade.data_fechamento || oportunidade.previsao_fechamento}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_fechamento", value)}
                  />
                  <DateRow
                    label="Data de Início do Projeto"
                    value={oportunidade.data_inicio_projeto}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_inicio_projeto", value)}
                  />
                  <DateRow
                    label="Prazo Briefing / Estudo Preliminar"
                    value={oportunidade.prazo_briefing}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("prazo_briefing", value)}
                  />
                  <DateRow
                    label="Prazo Anteprojeto"
                    value={oportunidade.prazo_anteprojeto}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("prazo_anteprojeto", value)}
                  />
                  <DateRow
                    label="Prazo Projeto Executivo"
                    value={oportunidade.prazo_projeto_executivo}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("prazo_projeto_executivo", value)}
                  />
                </>
              )}
              {nucleoResolvido === "marcenaria" && (
                <>
                  <DateRow
                    label="Data de Fechamento"
                    value={oportunidade.data_fechamento || oportunidade.previsao_fechamento}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_fechamento", value)}
                  />
                  <DateRow
                    label="Data de MediçÍo"
                    value={oportunidade.data_medicao}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_medicao", value)}
                  />
                  <DateRow
                    label="Prazo de Executivo"
                    value={oportunidade.prazo_executivo}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("prazo_executivo", value)}
                  />
                  <DateRow
                    label="Data de Assinatura do Executivo"
                    value={oportunidade.data_assinatura_executivo}
                    input={showDateInputs}
                    onChange={(value) => onFieldChange?.("data_assinatura_executivo", value)}
                  />
                </>
              )}
            </div>
          )}

          {/* Valor, Data e Ações */}
          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {showValue && (() => {
                const valorNucleos =
                  oportunidade.nucleos?.reduce((acc, n) => acc + (n.valor || 0), 0) || 0;
                const valorFinal =
                  oportunidade.valor_estimado ?? (valorNucleos > 0 ? valorNucleos : null);
                return valorFinal != null ? (
                  <span className="font-normal text-[#1A1A1A]">
                    {formatarMoeda(valorFinal)}
                  </span>
                ) : null;
              })()}

              {oportunidade.previsao_fechamento && (
                <span className="text-gray-400 text-xs">
                  📅 {formatarData(oportunidade.previsao_fechamento)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Editar"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit2 size={14} className="text-gray-400" />
                </button>
              )}
              {onDelete && (
                <button
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-[#F25C26] transition cursor-pointer p-3"
      onClick={onClick}
    >
      <div className="pb-2 flex items-start justify-between border-b border-gray-100">
        {/* Avatar + Cliente + Origem */}
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            nome={cliente?.nome || "Cliente"}
            avatar_url={cliente?.avatar_url}
            foto_url={cliente?.foto_url}
            avatar={cliente?.avatar}
            size={32}
          />

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-normal text-gray-800 truncate">
              {cliente?.nome ?? "Cliente não informado"}
            </span>
            {oportunidade.origem && (
              <span className="text-[10px] text-gray-500 truncate">
                {oportunidade.origem}
              </span>
            )}
            {cliente?.telefone && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone size={10} className="text-gray-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-500 truncate">
                  {cliente.telefone}
                </span>
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 text-[9px] font-medium text-green-600 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded-full transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle size={9} />
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AÇÕES */}
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
          )}

          {onPdf && (
            <button
              onClick={onPdf}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
              title="PDF"
            >
              <FileText size={14} />
            </button>
          )}

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              className="p-1.5 rounded-md hover:bg-green-50 text-green-600"
              title="WhatsApp"
            >
              <MessageCircle size={14} />
            </a>
          )}

          {emailLink && (
            <a
              href={emailLink}
              className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
              title="E-mail"
            >
              <Mail size={14} />
            </a>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-red-50 text-red-600"
              title="Excluir"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="pt-2">
        <div className="text-sm font-normal text-[#1A1A1A] mb-1 line-clamp-2">
          {oportunidade.titulo}
        </div>

        {oportunidade.descricao && (
          <div className="text-xs text-gray-500 line-clamp-2 mb-2">
            {oportunidade.descricao}
          </div>
        )}

        {/* Núcleos */}
        {oportunidade.nucleos && oportunidade.nucleos.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {oportunidade.nucleos.map((n, idx) => (
              <span
                key={idx}
                className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200"
              >
                {n.nucleo}
                {n.valor != null && ` • ${formatarMoeda(n.valor)}`}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-500">Estágio</span>
            <span className="text-[11px] font-normal text-gray-800">
              {oportunidade.estagio}
            </span>
          </div>

          {(() => {
            // Calcular valor: usar valor_estimado ou somar núcleos
            const valorNucleos = oportunidade.nucleos?.reduce((acc, n) => acc + (n.valor || 0), 0) || 0;
            const valorFinal = oportunidade.valor_estimado ?? (valorNucleos > 0 ? valorNucleos : null);

            return valorFinal != null ? (
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-gray-500">Valor estimado</span>
                <span className="text-[12px] font-normal text-[#F25C26]">
                  {formatarMoeda(valorFinal)}
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {!isKanban && (
          <div className="flex justify-end mt-2 text-[11px] text-gray-400 items-center gap-1">
            Ver detalhes <ChevronRight size={12} />
          </div>
        )}
      </div>
    </div>
  );
}

function DateRow({
  label,
  value,
  input,
  inputType = "date",
  onChange,
}: {
  label: string;
  value?: string | null;
  input?: boolean;
  inputType?: "date" | "number" | "text";
  onChange?: (value: string) => void;
}) {
  const normalizedValue = value ?? "";
  const inputValue =
    inputType === "date" && typeof normalizedValue === "string"
      ? normalizedValue.slice(0, 10)
      : String(normalizedValue);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-gray-500">{label}</span>
      {input ? (
        <input
          type={inputType}
          value={inputValue}
          onChange={(event) => onChange?.(event.target.value)}
          className="text-[11px] text-gray-800 font-medium border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
        />
      ) : (
        <span className="text-[11px] text-gray-800 font-medium">
          {value ? formatarData(value) : "—"}
        </span>
      )}
    </div>
  );
}


