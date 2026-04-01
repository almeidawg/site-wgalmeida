/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

/**
 * Página de Nova SolicitaçÍo de Pagamento do Colaborador
 */
export default function NovaSolicitacaoPage() {
  const navigate = useNavigate();

  return (
    <div className={LAYOUT.formContainer}>
      <Card className={LAYOUT.card}>
        <CardHeader>
          <CardTitle className={TYPOGRAPHY.pageTitle}>Nova Solicitacao de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${TYPOGRAPHY.bodySmall} mb-4 sm:mb-6`}>
            Preencha os dados para solicitar um pagamento.
          </div>
          {/* TODO: Adicionar formulario de solicitacao */}
          <Button variant="outline" onClick={() => navigate(-1)} className={TYPOGRAPHY.bodyMedium}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

