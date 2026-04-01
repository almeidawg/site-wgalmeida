import { useNavigate } from "react-router-dom";
import { PessoaForm } from "@/components/pessoas/PessoaForm";
import type { PessoaInput } from "@/types/pessoas";
import { criarPessoa } from "@/lib/pessoasApi";

export default function NovoClientePage() {
  const navigate = useNavigate();

  async function handleSubmit(data: PessoaInput) {
    await criarPessoa({
      ...data,
      tipo: "CLIENTE",
    });
    navigate("/clientes");
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mt-4">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal tracking-wide text-gray-800">
            Novo Cliente
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            Preencha os dados principais deste cadastro.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="text-[14px] text-[#F25C26] hover:underline"
        >
          Voltar
        </button>
      </div>

      <PessoaForm
        tipo="CLIENTE"
        onSubmit={handleSubmit}
        onCancel={() => navigate("/clientes")}
      />
    </div>
  );
}
