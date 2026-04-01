import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // O Supabase processa automaticamente o token da URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus("success");
          setMessage("Seu email foi confirmado com sucesso!");
        } else {
          // Verifica se há um token de confirmaçÍo na URL
          const type = searchParams.get("type");

          if (type === "signup" || type === "email_confirmation") {
            setStatus("success");
            setMessage(
              "Seu email foi confirmado com sucesso! Você já pode fazer login."
            );
          } else {
            setStatus("error");
            setMessage("Link de confirmaçÍo inválido ou expirado.");
          }
        }
      } catch (err: unknown) {
        console.error("Erro na confirmaçÍo:", err);
        setStatus("error");
        const message =
          err instanceof Error
            ? err.message
            : "Erro ao confirmar email. Tente novamente.";
        setMessage(message);
      }
    };

    // Aguarda um pouco para o Supabase processar o token
    setTimeout(confirmEmail, 1000);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-normal text-gray-900 mb-2">
              Confirmando seu email...
            </h2>
            <p className="text-gray-600">Aguarde um momento</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-normal text-gray-900 mb-2">
              Email Confirmado!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/login">
              <Button className="w-full">Ir para Login</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-normal text-gray-900 mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link to="/login">
                <Button className="w-full">Ir para Login</Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="outline" className="w-full">
                  Criar nova conta
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

