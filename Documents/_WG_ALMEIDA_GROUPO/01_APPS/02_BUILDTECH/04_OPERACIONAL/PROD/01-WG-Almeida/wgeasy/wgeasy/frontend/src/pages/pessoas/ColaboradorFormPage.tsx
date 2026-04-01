import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PessoaFormCompleto } from "@/components/pessoas/PessoaFormCompleto";
import { criarPessoa, obterPessoa, atualizarPessoa } from "@/lib/pessoasApi";
import type { PessoaInput, Pessoa } from "@/types/pessoas";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useToast } from "@/components/ui/use-toast";

export default function ColaboradorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<Pessoa | null>(null);
  const isEditMode = Boolean(id);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      setLoading(true);
      obterPessoa(id)
        .then((pessoa) => {
          if (pessoa) {
            setInitialData(pessoa);
          } else {
            toast({ title: "Colaborador nÍo encontrado", variant: "destructive" });
            navigate("/pessoas/colaboradores");
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar colaborador:", error);
          toast({ title: "Erro ao carregar dados do colaborador", variant: "destructive" });
          navigate("/pessoas/colaboradores");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  async function handleSubmit(data: PessoaInput) {
    try {
      if (isEditMode && id) {
        await atualizarPessoa(id, data);
        toast({ title: "Colaborador atualizado com sucesso!" });
      } else {
        await criarPessoa(data);
        toast({ title: "Colaborador cadastrado com sucesso!" });
      }
      navigate("/pessoas/colaboradores");
    } catch (error: unknown) {
      console.error("Erro ao salvar colaborador:", error);
      const message = error instanceof Error ? error.message : "";
      toast({
        title: message || "Erro ao salvar colaborador. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className={LAYOUT.pageContainer}>
        <div className="flex items-center justify-center p-6 sm:p-8">
          <div className={TYPOGRAPHY.cardSubtitle}>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={`w-full ${LAYOUT.card} p-4 sm:p-6 md:p-8`}>
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <h1 className={TYPOGRAPHY.pageTitle}>
            {isEditMode ? "Editar Colaborador" : "Novo Colaborador"}
          </h1>
          <p className={TYPOGRAPHY.pageSubtitle}>
            {isEditMode
              ? "Atualize os dados deste cadastro."
              : "Preencha os dados principais deste cadastro."}
          </p>
        </div>
        <div className="flex justify-end mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => navigate("/pessoas/colaboradores")}
            className={`${TYPOGRAPHY.actionTitle} hover:underline`}
          >
            Voltar
          </button>
        </div>
        <div className={LAYOUT.formGrid}>
          <div className={LAYOUT.formFieldFull}>
            <PessoaFormCompleto
              tipo="COLABORADOR"
              onSubmit={handleSubmit}
              onCancel={() => navigate("/pessoas/colaboradores")}
              initialData={initialData || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

