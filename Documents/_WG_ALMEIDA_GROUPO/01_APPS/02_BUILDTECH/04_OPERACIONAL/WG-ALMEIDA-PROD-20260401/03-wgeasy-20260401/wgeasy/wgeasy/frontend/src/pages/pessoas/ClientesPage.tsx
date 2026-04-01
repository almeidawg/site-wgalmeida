import PessoasList from "@/components/pessoas/PessoasList";

export default function ClientesPage() {
  return (
    <PessoasList
      tipo="CLIENTE"
      titulo="Clientes WG"
      descricao="GestÍo unificada de clientes do Grupo WG Almeida."
      novoPath="/pessoas/clientes/novo"
    />
  );
}

