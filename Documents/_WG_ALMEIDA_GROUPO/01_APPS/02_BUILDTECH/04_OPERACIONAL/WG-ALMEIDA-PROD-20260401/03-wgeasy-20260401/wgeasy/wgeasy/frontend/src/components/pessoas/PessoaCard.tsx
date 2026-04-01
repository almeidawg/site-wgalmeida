import { Pencil, Trash2, Mail, FileText, MessageCircle, FileCheck, Calendar, Phone, CheckCircle, Circle, Link2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { Pessoa } from "@/types/pessoas";
import Avatar from "@/components/common/Avatar";

interface PessoaCardProps {
  pessoa: Pessoa & { data_vinculo?: string | null };
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPdf?: () => void;
  onVerPropostas?: () => void;
  onLinkAtualizacao?: () => void;
  // Modo de selecao
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  corModulo?: string;
}

export default function PessoaCard({
  pessoa,
  onClick,
  onEdit,
  onDelete,
  onPdf,
  onVerPropostas,
  onLinkAtualizacao,
  selectionMode = false,
  isSelected = false,
  onSelect,
  corModulo = "#F25C26",
}: PessoaCardProps) {
  // Links condicionais
  const telefoneNumeros = pessoa.telefone?.replace(/\D/g, "");
  // Se o telefone ja comeca com 55 (Brasil) ou outro codigo de pais, nao adiciona 55
  const whatsappLink = telefoneNumeros
    ? `https://wa.me/${telefoneNumeros.startsWith("55") ? telefoneNumeros : `55${telefoneNumeros}`}`
    : null;
  const emailLink = pessoa.email ? `mailto:${pessoa.email}` : null;

  // Helpers para determinar disponibilidade
  const temTelefone = !!telefoneNumeros;
  const temEmail = !!pessoa.email;

  // Label para data baseado no tipo
  const getLabelData = () => {
    switch (pessoa.tipo) {
      case "CLIENTE":
        return "Cliente desde";
      case "COLABORADOR":
        return "Colaborador desde";
      case "FORNECEDOR":
        return "Fornecedor desde";
      case "PRESTADOR":
        return "Prestador desde";
      default:
        return "Desde";
    }
  };

  // Handler para clique no card considerando modo de seleçÍo
  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(!isSelected);
    } else if (onClick) {
      onClick();
    }
  };

  const tipoTag = (() => {
    if (pessoa.tipo === "COLABORADOR") {
      return { label: "Colaborador", bg: "#2B458020", color: "#2B4580" };
    }
    if (pessoa.tipo === "FORNECEDOR") {
      return { label: "Fornecedor", bg: "#8B5E3C20", color: "#8B5E3C" };
    }
    return null;
  })();

  return (
    <div
      className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isSelected ? "ring-2 bg-opacity-50" : ""
      } ${!pessoa.ativo ? "opacity-60" : ""}`}
      style={isSelected ? ({ "--tw-ring-color": corModulo, backgroundColor: `${corModulo}10` } as CSSProperties) : {}}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {/* Info Principal */}
        <div className="flex items-start gap-4">
          {/* Checkbox de selecao */}
          {selectionMode && (
            <div
              className="shrink-0 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(!isSelected);
              }}
            >
              {isSelected ? (
                <CheckCircle className="w-6 h-6" style={{ color: corModulo }} />
              ) : (
                <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
              )}
            </div>
          )}

          {/* Avatar - Sempre circular conforme padrÍo do sistema */}
          <Avatar
            nome={pessoa.nome}
            avatar_url={pessoa.avatar_url}
            foto_url={pessoa.foto_url}
            size="lg"
            className="flex-shrink-0"
          />

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3
                className="text-[13px] font-normal text-gray-900 group-hover:transition-colors"
                  style={{ "--hover-color": corModulo } as CSSProperties}
              >
                {pessoa.nome}
              </h3>
              {pessoa.categoria && pessoa.tipo === "FORNECEDOR" && (
                <span
                  className="text-[12px] font-normal px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${corModulo}20`, color: corModulo }}
                >
                  {pessoa.categoria}
                </span>
              )}
              {!pessoa.ativo && (
                <span className="text-[12px] font-normal px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                  Inativo
                </span>
              )}
              {tipoTag && (
                <span
                  className="text-[12px] font-normal px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: tipoTag.bg, color: tipoTag.color }}
                >
                  {tipoTag.label}
                </span>
              )}
            </div>

            <p className="text-[12px] text-gray-600 mb-2">
              {pessoa.cargo && <span className="text-gray-900">{pessoa.cargo}</span>}
              {pessoa.cargo && pessoa.unidade && <span className="text-gray-400"> - </span>}
              {pessoa.unidade && <span className="text-gray-400">{pessoa.unidade}</span>}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-gray-400">
              {pessoa.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {pessoa.email}
                </span>
              )}
              {pessoa.telefone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {pessoa.telefone}
                </span>
              )}
              {pessoa.data_vinculo && (
                <span className="flex items-center gap-1" style={{ color: corModulo }}>
                  <Calendar className="w-3.5 h-3.5" />
                  {getLabelData()} {new Date(pessoa.data_vinculo).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acoes */}
        <div
          className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {pessoa.tipo === "CLIENTE" && onVerPropostas && (
            <button
              onClick={onVerPropostas}
              className="p-2 text-gray-400 rounded-lg transition-all"
              style={{ "--hover-bg": `${corModulo}10`, "--hover-color": corModulo } as CSSProperties}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${corModulo}10`; e.currentTarget.style.color = corModulo; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; e.currentTarget.style.color = ""; }}
              title="Ver Propostas"
            >
              <FileCheck className="w-5 h-5" />
            </button>
          )}

          {(pessoa.tipo === "COLABORADOR" || pessoa.tipo === "FORNECEDOR") && onLinkAtualizacao && (
            <button
              onClick={onLinkAtualizacao}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Enviar link de atualizaçÍo cadastral"
            >
              <Link2 className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
            title="Editar"
          >
            <Pencil className="w-5 h-5" />
          </button>

          <button
            onClick={onPdf}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Gerar PDF"
          >
            <FileText className="w-5 h-5" />
          </button>

          {temTelefone ? (
            <a
              href={whatsappLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
              title={`WhatsApp: ${pessoa.telefone}`}
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          ) : (
            <span className="p-2 text-gray-300 cursor-not-allowed" title="Sem telefone cadastrado">
              <MessageCircle className="w-5 h-5" />
            </span>
          )}

          {temEmail ? (
            <a
              href={emailLink!}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              title={`Email: ${pessoa.email}`}
            >
              <Mail className="w-5 h-5" />
            </a>
          ) : (
            <span className="p-2 text-gray-300 cursor-not-allowed" title="Sem email cadastrado">
              <Mail className="w-5 h-5" />
            </span>
          )}

          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Excluir"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

