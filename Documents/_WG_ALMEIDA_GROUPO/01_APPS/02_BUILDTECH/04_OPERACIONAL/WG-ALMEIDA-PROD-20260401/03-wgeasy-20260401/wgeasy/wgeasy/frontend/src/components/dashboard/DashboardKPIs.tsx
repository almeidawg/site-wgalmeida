import { motion } from "framer-motion";

interface Props {
  loading: boolean;
  data: ProjetoDashboard[] | null;
}

interface ProjetoDashboard {
  status?: string | null;
  tipo?: string | null;
}

export function DashboardKPIs({ loading, data }: Props) {
  const totalProjetos = data?.length ?? 0;
  const ativos = data?.filter((d) => d.status === "ativo").length ?? 0;
  const andamento = data?.filter((d) => d.status === "andamento").length ?? 0;
  const orcamentos = data?.filter((d) => d.tipo === "orcamento").length ?? 0;

  const itens = [
    { label: "Projetos Ativos", valor: ativos },
    { label: "Em ExecuçÍo", valor: andamento },
    { label: "Orçamentos", valor: orcamentos },
    { label: "Total no Pipeline", valor: totalProjetos },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {itens.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-6 bg-white border border-[#E4E4E4] rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          <p className="text-[#6A6A6A] text-sm tracking-wider uppercase font-light">
            {item.label}
          </p>
          <p className="text-3xl font-oswald text-[#2E2E2E]">
            {loading ? "…" : item.valor}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

