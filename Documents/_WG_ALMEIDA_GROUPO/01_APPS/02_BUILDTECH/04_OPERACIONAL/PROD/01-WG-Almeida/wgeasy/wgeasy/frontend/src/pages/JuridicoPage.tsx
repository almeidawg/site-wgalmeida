// Página principal do módulo Jurídico

import { useEffect, useState } from "react";
import { listarContratos, listarContratosAlertas } from "@/lib/juridicoApi";
import ContratoForm from "@/components/juridico/ContratoForm";
import ContratoAlerts from "@/components/juridico/ContratoAlerts";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function JuridicoPage() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nucleoFiltro, setNucleoFiltro] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [propostas, setPropostas] = useState<Array<{ id: string; titulo: string }>>([]);
  const [alertas, setAlertas] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Buscar todos os contratos (sem paginaçÍo/filtros para exibir todos)
      const result = await listarContratos({ pageSize: 1000 });
      setContratos(result.data || []);
      setLoading(false);
    }
    async function fetchAlertas() {
      const data = await listarContratosAlertas();
      setAlertas(data || []);
    }
    // Simular propostas (substitua por fetch real se necessário)
    setPropostas([
      { id: "1", titulo: "Proposta A" },
      { id: "2", titulo: "Proposta B" },
    ]);
    fetchData();
    fetchAlertas();
  }, []);

  // FunçÍo para criar contrato e integrar com financeiro/cronograma
  async function handleContratoSuccess() {
    // Atualiza lista de contratos e alertas
    const result = await listarContratos({ pageSize: 1000 });
    setContratos(result.data || []);
    const data = await listarContratosAlertas();
    setAlertas(data || []);
    setShowForm(false);
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <h1 className={`${TYPOGRAPHY.pageTitle} mb-4`}>Jurídico - Contratos</h1>

      {/* Alertas de vencimento */}
      <ContratoAlerts alertas={alertas} />

      {/* Filtro por Núcleo */}
      <div className="mb-4 flex flex-wrap gap-2 sm:gap-3 items-center">
        <label htmlFor="nucleoFiltro" className={TYPOGRAPHY.formLabel}>
          Filtrar por Núcleo:
        </label>
        <select
          id="nucleoFiltro"
          title="Filtrar por Núcleo"
          className={`border rounded px-2 py-1 ${TYPOGRAPHY.bodyMedium}`}
          value={nucleoFiltro}
          onChange={(e) => setNucleoFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          {[...new Set(contratos.map((c) => c.nucleo).filter(Boolean))].map(
            (nucleo) => (
              <option key={nucleo} value={nucleo}>
                {nucleo}
              </option>
            )
          )}
        </select>
        <button
          className="ml-4 px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
          onClick={() => setShowForm(true)}
        >
          Novo Contrato
        </button>
      </div>

      {showForm && (
        <ContratoForm
          onSuccess={handleContratoSuccess}
          propostas={propostas}
        />
      )}

      {loading ? (
        <p>Carregando contratos...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Cliente</th>
              <th className="border px-2 py-1">Núcleo</th>
              <th className="border px-2 py-1">Valor</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {contratos
              .filter(
                (contrato) => !nucleoFiltro || contrato.nucleo === nucleoFiltro
              )
              .map((contrato: any) => (
                <tr key={contrato.id}>
                  <td className="border px-2 py-1">{contrato.cliente_nome}</td>
                  <td className="border px-2 py-1">{contrato.nucleo || "-"}</td>
                  <td className="border px-2 py-1">
                    R$ {contrato.valor_total?.toLocaleString("pt-BR")}
                  </td>
                  <td className="border px-2 py-1">{contrato.status}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

