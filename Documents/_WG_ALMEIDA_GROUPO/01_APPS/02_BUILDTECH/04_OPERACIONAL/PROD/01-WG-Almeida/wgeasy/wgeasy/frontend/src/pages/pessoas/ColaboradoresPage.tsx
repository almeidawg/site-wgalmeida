import PessoasList from "@/components/pessoas/PessoasList";

export default function ColaboradoresPage() {
  return (
    <PessoasList
      tipo="COLABORADOR"
      titulo="Colaboradores WG"
      descricao="Time interno e parceiros estratégicos da operaçÍo."
      novoPath="/pessoas/colaboradores/novo"
    />
  );
}

