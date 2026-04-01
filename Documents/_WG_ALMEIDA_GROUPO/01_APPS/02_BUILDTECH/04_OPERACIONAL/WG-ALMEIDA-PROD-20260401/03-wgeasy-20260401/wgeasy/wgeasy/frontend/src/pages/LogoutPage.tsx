import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function realizarLogout() {
      try {
        // CRÍTICO: Chamar signOut do Supabase para invalidar a sessÍo no servidor
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      } finally {
        // Limpar tokens e storage local
        localStorage.clear();
        sessionStorage.clear();

        // Redirecionar para a página inicial após logout
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    }

    realizarLogout();
  }, [navigate]);

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.card}>
        <div className="text-center py-6 sm:py-8">
          <div className="text-4xl sm:text-6xl mb-4">👋</div>
          <h1 className={TYPOGRAPHY.pageTitle}>
            Até logo!
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-2`}>
            Você está sendo desconectado...
          </p>
        </div>
      </div>
    </div>
  );
}

