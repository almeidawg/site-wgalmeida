// src/pages/RHDashboardPage.tsx
import { useEffect, useState } from "react";
import { Users, AlertCircle } from "lucide-react";
import { listarPessoas, Pessoa } from "@/lib/pessoasApi";

const RHDashboardPage = () => {
  const [colaboradores, setColaboradores] = useState<Pessoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setErro(null);
        const todos = await listarPessoas({ tipo: "COLABORADOR", ativo: true });
        setColaboradores(todos || []);
      } catch (err) {
        console.error("[RH] Erro ao carregar colaboradores:", err);
        setErro("Erro ao carregar colaboradores. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  const total = colaboradores.length;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <h1 className="text-[24px] font-light uppercase tracking-[0.3em] text-[#2E2E2E]">
        RH — Colaboradores
      </h1>

      {erro && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-[12px]">{erro}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{total}</span>
            <span className="text-[12px] text-gray-500">Colaboradores</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[12px] font-normal uppercase tracking-[0.2em] text-[#4C4C4C]">
          Lista de colaboradores
        </h2>
        {colaboradores.length === 0 ? (
          <p className="text-[12px] text-[#7A7A7A]">
            Nenhum colaborador cadastrado ainda.
          </p>
        ) : (
          <ul className="space-y-2 text-[12px] text-[#4C4C4C]">
            {colaboradores.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-[#F0F0F0] px-3 py-2"
              >
                <span>{c.nome}</span>
                <span className="text-[12px] text-[#7A7A7A]">
                  {c.email ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RHDashboardPage;
