import { Route, Navigate } from "react-router-dom";
import { ClienteOnlyRoute } from "@/auth/ClienteProtectedRoute";
import ClienteLayout from "@/layout/ClienteLayout";
import {
  AreaClientePage,
  ClienteArquivosPage,
  ConfirmacaoDadosPage,
  CronogramaClientePage,
  FinanceiroClientePage,
  AssistenciaPage,
  TermoAceitePage,
  GarantiaPage,
  FornecedoresObraPage,
  MoodboardClientePage,
  PosVendasPage,
} from "./lazyImports";

/**
 * Rotas do cliente (WGxperience) — requer autenticaçÍo de cliente.
 */
export const clienteRoutes = (
  <>
    {/* ÁREA DO CLIENTE - PROTEGIDA (requer autenticaçÍo de cliente) */}
    <Route
      path="/area-cliente"
      element={
        <ClienteOnlyRoute>
          <AreaClientePage />
        </ClienteOnlyRoute>
      }
    />
    <Route
      path="/area-cliente/:clienteId"
      element={
        <ClienteOnlyRoute>
          <AreaClientePage />
        </ClienteOnlyRoute>
      }
    />
    <Route
      path="/area-cliente/arquivos"
      element={
        <ClienteOnlyRoute>
          <ClienteArquivosPage />
        </ClienteOnlyRoute>
      }
    />

    {/* PÁGINA DE CONFIRMAÇÍO DE DADOS - SEM LAYOUT (tela própria) */}
    <Route
      path="/wgx/confirmar-dados"
      element={
        <ClienteOnlyRoute>
          <ConfirmacaoDadosPage />
        </ClienteOnlyRoute>
      }
    />

    {/* ÁREA WGxperience - EXCLUSIVA PARA CLIENTES (sem sidebar) */}
    <Route
      path="/wgx"
      element={
        <ClienteOnlyRoute>
          <ClienteLayout />
        </ClienteOnlyRoute>
      }
    >
      <Route index element={<AreaClientePage />} />
      <Route path="cronograma" element={<CronogramaClientePage />} />
      <Route path="financeiro" element={<FinanceiroClientePage />} />
      <Route path="arquivos" element={<ClienteArquivosPage />} />
      <Route path="assistencia" element={<AssistenciaPage />} />
      <Route path="termos" element={<TermoAceitePage />} />
      <Route path="garantia" element={<GarantiaPage />} />
      <Route path="fornecedores" element={<FornecedoresObraPage />} />
      <Route path="moodboard" element={<MoodboardClientePage />} />
      <Route path="moodboard/:id" element={<MoodboardClientePage />} />
      <Route path="pos-vendas" element={<PosVendasPage />} />
      <Route
        path="keep"
        element={<Navigate replace to="/criacao-checklist" />}
      />
    </Route>
  </>
);

