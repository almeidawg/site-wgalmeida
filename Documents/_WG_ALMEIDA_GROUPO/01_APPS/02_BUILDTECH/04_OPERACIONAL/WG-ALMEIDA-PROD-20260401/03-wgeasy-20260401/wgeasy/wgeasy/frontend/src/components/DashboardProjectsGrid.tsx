import { FC, useMemo } from "react";
import { motion, type Variants } from "framer-motion";

type TipoItem = "projeto" | "obra" | "orcamento";

type StatusItem =
  | "em_andamento"
  | "concluido"
  | "aguardando_aprovacao"
  | "em_analise"
  | "atrasado";

interface DashboardItem {
  id: string;
  tipo: TipoItem;
  titulo: string;
  cliente: string;
  unidade: "Arquitetura" | "Engenharia" | "Marcenaria";
  valor?: number; // em reais
  status: StatusItem;
  prazo?: string; // ex: "Mar/2026"
  progresso?: number; // 0–100
}

interface DashboardProjectsGridProps {
  itens?: DashboardItem[];
}

const defaultMockItems: DashboardItem[] = [
  {
    id: "1",
    tipo: "projeto",
    titulo: "Residencial Alto de Pinheiros",
    cliente: "Família Ribeiro",
    unidade: "Arquitetura",
    valor: 120000,
    status: "em_andamento",
    prazo: "Mar/2026",
    progresso: 45,
  },
  {
    id: "2",
    tipo: "obra",
    titulo: "Apartamento Itaim Bibi",
    cliente: "JoÍo e Marina",
    unidade: "Engenharia",
    valor: 380000,
    status: "em_andamento",
    prazo: "Dez/2025",
    progresso: 62,
  },
  {
    id: "3",
    tipo: "orcamento",
    titulo: "Cobertura Vila Nova ConceiçÍo",
    cliente: "Grupo SQS",
    unidade: "Arquitetura",
    valor: 780000,
    status: "aguardando_aprovacao",
    prazo: "Proposta até: 10/12",
    progresso: 15,
  },
  {
    id: "4",
    tipo: "obra",
    titulo: "Escritório Brooklin",
    cliente: "TechPrime",
    unidade: "Engenharia",
    valor: 520000,
    status: "atrasado",
    prazo: "Nov/2025",
    progresso: 30,
  },
  {
    id: "5",
    tipo: "projeto",
    titulo: "Casa Fazenda Boa Vista",
    cliente: "Família Campos",
    unidade: "Arquitetura",
    valor: 210000,
    status: "em_analise",
    prazo: "Jan/2026",
    progresso: 10,
  },
  {
    id: "6",
    tipo: "orcamento",
    titulo: "Marcenaria Cozinha Gourmet",
    cliente: "Carla Menezes",
    unidade: "Marcenaria",
    valor: 98000,
    status: "aguardando_aprovacao",
    prazo: "Proposta até: 05/12",
    progresso: 20,
  },
  {
    id: "7",
    tipo: "obra",
    titulo: "Loja Conceito Jardins",
    cliente: "Marca LUX",
    unidade: "Marcenaria",
    valor: 640000,
    status: "em_andamento",
    prazo: "Fev/2026",
    progresso: 40,
  },
  {
    id: "8",
    tipo: "projeto",
    titulo: "Clínica Vila Olímpia",
    cliente: "Saúde+",
    unidade: "Arquitetura",
    valor: 165000,
    status: "concluido",
    prazo: "Out/2025",
    progresso: 100,
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 220,
      damping: 24,
    },
  },
};

const statusLabel: Record<StatusItem, string> = {
  em_andamento: "Em andamento",
  concluido: "Concluído",
  aguardando_aprovacao: "Aguardando aprovaçÍo",
  em_analise: "Em análise",
  atrasado: "Em atençÍo (atraso)",
};

const statusColorClasses: Record<StatusItem, string> = {
  em_andamento: "bg-[#E6F3FF] text-[#2B4580] border border-[#C9D9F5]",
  concluido: "bg-[#E6F7F2] text-[#1F7A4D] border border-[#B8E5D1]",
  aguardando_aprovacao:
    "bg-[#FFF5E6] text-[#8A4B0F] border border-[#F9DFB8]",
  em_analise: "bg-[#F3F3F3] text-[#4C4C4C] border border-[#E0E0E0]",
  atrasado: "bg-[#FDECEC] text-[#B3261E] border border-[#F3C0BC]",
};

const tipoLabel: Record<TipoItem, string> = {
  projeto: "Projeto",
  obra: "Obra",
  orcamento: "Orçamento",
};

const tipoDotColor: Record<TipoItem, string> = {
  projeto: "bg-[#5E9B94]", // Verde Mineral – Arquitetura
  obra: "bg-[#2B4580]", // Azul Técnico – Engenharia
  orcamento: "bg-primary", // Laranja WG – AçÍo / Proposta
};

const unidadeTagColor: Record<
  DashboardItem["unidade"],
  string
> = {
  Arquitetura: "bg-[#E8F3F1] text-[#5E9B94]",
  Engenharia: "bg-[#E6ECF7] text-[#2B4580]",
  Marcenaria: "bg-[#F4EBE4] text-[#8B5E3C]",
};

const formatCurrency = (valor?: number) => {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
};

export const DashboardProjectsGrid: FC<DashboardProjectsGridProps> = ({
  itens,
}) => {
  const data = useMemo(() => itens ?? defaultMockItems, [itens]);

  return (
    <section className="w-full">
      {/* Cabeçalho da seçÍo */}
      <header className="mb-6 flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="font-oswald text-2xl tracking-[0.18em] uppercase text-[#2E2E2E]">
            VisÍo Geral – Pipeline WG
          </h2>
          <p className="mt-1 text-sm font-roboto text-[#7A7A7A]">
            Projetos, obras e orçamentos em andamento no ecossistema Grupo WG
            Almeida.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-roboto text-[#4C4C4C]">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#5E9B94]" />
            Arquitetura
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#2B4580]" />
            Engenharia
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F4EBE4] px-3 py-1 shadow-sm text-[#8B5E3C]">
            <span className="h-2 w-2 rounded-full bg-[#8B5E3C]" />
            Marcenaria
          </span>
        </div>
      </header>

      {/* Grid 4 colunas responsivo */}
      <motion.div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          xl:grid-cols-4
          gap-6
        "
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {data.map((item) => (
          <motion.article
            key={item.id}
            variants={cardVariants}
            whileHover={{
              y: -4,
              boxShadow:
                "0 18px 45px rgba(0, 0, 0, 0.06)",
            }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="
              group
              relative
              rounded-2xl
              bg-white
              border
              border-[#E4E4E4]
              px-4
              pt-4
              pb-3
              flex
              flex-col
              gap-3
              overflow-hidden
            "
          >
            {/* Linha superior: tipo + status */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`
                    h-7 rounded-full px-3 text-[11px] font-medium 
                    inline-flex items-center gap-1.5
                    ${statusColorClasses[item.status]}
                  `}
                >
                  <span
                    className={`
                      h-1.5 w-1.5 rounded-full 
                      ${
                        item.status === "concluido"
                          ? "bg-[#1F7A4D]"
                          : item.status === "atrasado"
                          ? "bg-[#B3261E]"
                          : "bg-primary"
                      }
                    `}
                  />
                  {statusLabel[item.status]}
                </span>
              </div>

              <span
                className={`
                  inline-flex items-center gap-1.5 rounded-full 
                  px-2.5 py-1 text-[11px] font-medium
                  ${unidadeTagColor[item.unidade]}
                `}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    tipoDotColor[item.tipo]
                  }`}
                />
                {item.unidade}
              </span>
            </div>

            {/* Título + Cliente */}
            <div>
              <h3 className="font-poppins text-[15px] font-normal text-[#2E2E2E]">
                {item.titulo}
              </h3>
              <p className="mt-1 text-xs font-roboto text-[#7A7A7A]">
                {tipoLabel[item.tipo]} · {item.cliente}
              </p>
            </div>

            {/* Valor + Prazo */}
            <div className="mt-1 flex items-center justify-between text-xs font-roboto">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#7A7A7A]">
                  Valor estimado
                </span>
                <span className="text-sm font-medium text-[#2E2E2E]">
                  {formatCurrency(item.valor)}
                </span>
              </div>
              {item.prazo && (
                <div className="flex flex-col items-end">
                  <span className="text-[11px] text-[#7A7A7A]">Prazo</span>
                  <span className="text-sm font-medium text-[#2E2E2E]">
                    {item.prazo}
                  </span>
                </div>
              )}
            </div>

            {/* Barra de Progresso */}
            {typeof item.progresso === "number" && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-[11px] font-roboto text-[#7A7A7A]">
                  <span>
                    Progresso{" "}
                    {item.tipo === "orcamento"
                      ? "da negociaçÍo"
                      : "da etapa"}
                  </span>
                  <span className="font-medium text-[#4C4C4C]">
                    {item.progresso}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F3F3F3] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progresso}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Rodapé sutil com CTA */}
            <div className="mt-3 flex items-center justify-between text-[11px] font-roboto text-[#7A7A7A]">
              <span className="italic font-playfair">
                Histórias que se tornam espaços.
              </span>
              <button
                type="button"
                className="
                  inline-flex items-center gap-1
                  text-[11px]
                  font-medium
                  text-[#F25C26]
                  group-hover:underline
                "
              >
                Ver detalhes
                <span className="translate-y-[0.5px] text-xs">↗</span>
              </button>
            </div>

            {/* Linha decorativa WG (topo, laranja leve) */}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#F25C26] via-transparent to-[#F25C26] opacity-60" />
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
};

