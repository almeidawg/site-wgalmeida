// ============================================================
// PÁGINA: CriaçÍo de Proposta (com FormWizard)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { FormWizard, type WizardStep } from "@/components/FormWizard";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

const STEPS: WizardStep[] = [
  {
    id: "cliente",
    title: "Dados do Cliente",
    description: "Informações básicas do cliente",
    fields: [
      {
        name: "cliente_nome",
        label: "Nome do Cliente",
        type: "text",
        required: true,
      },
      {
        name: "cliente_email",
        label: "Email",
        type: "email",
        required: true,
      },
      {
        name: "cliente_telefone",
        label: "Telefone",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "proposta",
    title: "Informações Proposta",
    description: "Dados da proposta comercial",
    fields: [
      {
        name: "titulo",
        label: "Título da Proposta",
        type: "text",
        required: true,
      },
      {
        name: "nucleus",
        label: "Núcleo",
        type: "select",
        required: true,
        options: [
          { label: "Arquitetura", value: "arquitetura" },
          { label: "Engenharia", value: "engenharia" },
          { label: "Marcenaria", value: "marcenaria" },
        ],
      },
    ],
  },
  {
    id: "valores",
    title: "Valores",
    description: "Valores e condições de pagamento",
    fields: [
      {
        name: "valor_total",
        label: "Valor Total (R$)",
        type: "number",
        required: true,
      },
      {
        name: "condicoes_pagamento",
        label: "Condições de Pagamento",
        type: "select",
        required: true,
        options: [
          { label: "À Vista", value: "a_vista" },
          { label: "30 dias", value: "30_dias" },
          { label: "60 dias", value: "60_dias" },
          { label: "Parcelado", value: "parcelado" },
        ],
      },
    ],
  },
  {
    id: "revisao",
    title: "RevisÍo",
    description: "Confirme as informações",
    fields: [
      {
        name: "confirmar",
        label: "Confirmo que as informações estÍo corretas",
        type: "checkbox",
        required: true,
      },
    ],
  },
];

export default function PropostaCriacaoPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(data: Record<string, unknown>) {
    try {
      // Aqui iria a lógica de salvar a proposta
      if (import.meta.env.DEV) console.log("Proposta criada:", data);
      toast({ title: "Sucesso", description: "Proposta criada com sucesso!" });
      navigate("/propostas");
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar proposta" });
    }
  }

  return (
    <div className={`min-h-screen bg-[#F8F8F8] ${LAYOUT.pageContainer} py-4 sm:py-6`}>
      <div className={LAYOUT.pageHeaderSpacing}>
        <h1 className={TYPOGRAPHY.pageTitle}>
          Criar Proposta
        </h1>
        <p className={`${TYPOGRAPHY.pageSubtitle} mt-1 sm:mt-2`}>
          Preencha os dados para gerar uma nova proposta comercial
        </p>
      </div>

      {/* FormWizard Component */}
      <FormWizard steps={STEPS} onSubmit={handleSubmit} />
    </div>
  );
}
