// src/pages/ObrasPorPessoaDashboard.tsx
import { useEffect, useState } from "react";
import { listarPessoas, listarObrasPessoa, Pessoa, PessoaObra } from "@/lib/pessoasApi";

const ObrasPorPessoaDashboard = () => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [dados, setDados] = useState<{ [id: string]: PessoaObra[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      const lista = await listarPessoas();
      setPessoas(lista);

      const mapa: any = {};

      for (const p of lista) {
        mapa[p.id] = await listarObrasPessoa(p.id);
      }

      setDados(mapa);
      setLoading(false);
    }

    carregar();
  }, []);

  if (loading) return <div className="p-6 text-[16px] text-gray-600">Carregando...</div>;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <h1 className="text-[18px] sm:text-[24px] font-normal text-[#3B82F6]">
        Obras por Pessoa
      </h1>

      {pessoas.map((pessoa) => (
        <div
          key={pessoa.id}
          className="rounded-xl bg-white shadow-md border border-[#E5E5E5] p-4"
        >
          <h2 className="text-[20px] font-normal text-[#2E2E2E] mb-3">
            {pessoa.nome} — {dados[pessoa.id]?.length || 0} obras
          </h2>

          {dados[pessoa.id]?.length ? (
            <div className="grid md:grid-cols-2 gap-4">
              {dados[pessoa.id].map((obra) => (
                <div key={obra.id} className="p-3 border rounded-xl bg-[#FAFAFA]">
                  <div className="text-[14px] font-medium text-[#2E2E2E]">
                    {obra.obras?.nome}
                  </div>
                  <div className="text-sm text-[#7A7A7A]">
                    {obra.funcao_na_obra || "FunçÍo nÍo informada"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#7A7A7A]">Nenhuma obra vinculada.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ObrasPorPessoaDashboard;

