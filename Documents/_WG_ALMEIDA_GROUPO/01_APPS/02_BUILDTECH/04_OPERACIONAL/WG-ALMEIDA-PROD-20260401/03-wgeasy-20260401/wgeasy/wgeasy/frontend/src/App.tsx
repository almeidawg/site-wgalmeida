import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import MainLayout from "@/layout/MainLayout";
import NotFoundPage from "@/pages/NotFoundPage";
import ClienteProtectedRoute from "@/auth/ClienteProtectedRoute";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
/* ===================== ROUTE GROUPS ===================== */
import { publicRoutes } from "@/routes/publicRoutes";
import { clienteRoutes } from "@/routes/clienteRoutes";
import {
  colaboradorRoutes,
  especificadorRoutes,
  fornecedorRoutes,
} from "@/routes/roleRoutes";
import { protectedRoutes } from "@/routes/protectedRoutes";

/* ===================== LOADING COMPONENT ===================== */
const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 text-[#F25C26] animate-spin" />
      <p className="text-sm text-gray-500">Carregando...</p>
    </div>
  </div>
);

/* =============================================================== */
/* ========================= COMPONENTE APP ======================== */
/* =============================================================== */

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ROTAS PÚBLICAS (login, signup, landing pages, tokens) */}
            {publicRoutes}

            {/* ÁREA DO CLIENTE (WGxperience) */}
            {clienteRoutes}

            {/* ÁREAS POR PAPEL (colaborador, especificador, fornecedor) */}
            {colaboradorRoutes}
            {especificadorRoutes}
            {fornecedorRoutes}

            {/* ROTAS PROTEGIDAS (admin/interno — MainLayout) */}
            <Route
              path="/"
              element={
                <ClienteProtectedRoute>
                  <MainLayout />
                </ClienteProtectedRoute>
              }
            >
              {protectedRoutes}
            </Route>

            {/* ROTA GLOBAL 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
