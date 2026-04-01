// ============================================================
// PAGINA: Seus Fornecedores - Area do Cliente
// Sistema WG Easy - Grupo WG Almeida
// Lista fornecedores vinculados ao projeto do cliente
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Package,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listarFornecedoresDoCliente,
  formatarWhatsAppLink,
  formatarEmailLink,
  FornecedorBasico,
} from "@/lib/clienteFornecedoresApi";

// Cores WG
const WG_ORANGE = "#F25C26";

export default function FornecedoresObraPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorBasico[]>([]);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const lista = await listarFornecedoresDoCliente();
      setFornecedores(lista);
      if (lista.length === 0) {
        setError("Nenhum fornecedor vinculado ao seu projeto ainda.");
      }
    } catch (err: any) {
      console.error("[FornecedoresObraPage] Erro:", err);
      setError(err.message || "Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Estado de loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: WG_ORANGE }} />
          <p className="text-gray-500">Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h2 className="text-lg font-normal mb-2">Ops!</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={carregarDados} style={{ backgroundColor: WG_ORANGE }}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado vazio (sem erro, mas lista vazia)
  if (fornecedores.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
              <Wrench className="w-6 h-6" style={{ color: WG_ORANGE }} />
              Seus Fornecedores
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Contate os fornecedores vinculados ao seu projeto
            </p>
          </header>

          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Nenhum fornecedor cadastrado
              </h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                Os fornecedores que participarem da sua obra aparecerÍo aqui
                com nome, responsável e contatos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2">
              <Wrench className="w-7 h-7" style={{ color: WG_ORANGE }} />
              Seus Fornecedores
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Contate os fornecedores vinculados ao seu projeto
            </p>
          </div>
        </header>

        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="border-b bg-gray-50/70">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                <span className="text-lg">Lista de fornecedores</span>
              </CardTitle>
              <Badge variant="outline" className="text-gray-600">
                {fornecedores.length} fornecedor(es)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {fornecedores.map((fornecedor) => (
                <div
                  key={fornecedor.fornecedor_id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-normal text-gray-900">
                          {fornecedor.fornecedor_nome}
                        </h3>
                        {fornecedor.fornecedor_empresa && (
                          <Badge variant="secondary" className="text-gray-700">
                            {fornecedor.fornecedor_empresa}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-600">
                          {fornecedor.origem === "servico"
                            ? "Serviço contratado"
                            : "Equipe do projeto"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Responsável: {fornecedor.responsavel || "não informado"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {fornecedor.fornecedor_email && (
                          <a
                            href={formatarEmailLink(fornecedor.fornecedor_email) || undefined}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Mail className="w-4 h-4" />
                            {fornecedor.fornecedor_email}
                          </a>
                        )}
                        {fornecedor.fornecedor_telefone && (
                          <a
                            href={formatarWhatsAppLink(fornecedor.fornecedor_telefone) || undefined}
                            className="flex items-center gap-1 text-green-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Phone className="w-4 h-4" />
                            {fornecedor.fornecedor_telefone}
                          </a>
                        )}
                        {!fornecedor.fornecedor_email && !fornecedor.fornecedor_telefone && (
                          <span className="text-gray-400 flex items-center gap-1">
                            <HelpCircle className="w-4 h-4" />
                            Contato não informado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-4 h-4" />
                      Dados sincronizados do cronograma
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


