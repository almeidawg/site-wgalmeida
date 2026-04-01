// ==========================================
// DEPÓSITO WG
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function DepositoWGPage() {
  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.pageHeaderSpacing}>
        <h1 className={TYPOGRAPHY.pageTitle}>
          Depósito WG
        </h1>
        <p className={TYPOGRAPHY.pageSubtitle}>
          Controle de estoque e movimentaçÍo do depósito
        </p>
      </div>

      <div className={LAYOUT.card}>
        <div className="text-center py-8 sm:py-12">
          <div className="text-4xl sm:text-6xl mb-4">📦</div>
          <h2 className={TYPOGRAPHY.sectionTitle}>
            Módulo Depósito WG
          </h2>
          <p className={`${TYPOGRAPHY.sectionSubtitle} mt-2`}>
            Em desenvolvimento - GestÍo de estoque e movimentações
          </p>
        </div>
      </div>
    </div>
  );
}

