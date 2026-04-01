// ============================================================
// COMPONENTE: CardsDadosCliente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Cards com dados cadastrais do cliente e informações de contratos
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Heart,
  FileText,
  Calendar,
  ChevronRight,
  Eye
} from "lucide-react";

interface DadosCliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  profissao: string;
  estadoCivil: string;
  avatar?: string;
}

interface Contrato {
  id: string;
  numero: string;
  nucleo: string;
  valor: number;
  dataAssinatura: string;
  status: "ativo" | "finalizado" | "cancelado";
}

interface CardsDadosClienteProps {
  clienteId: string;
}

export default function CardsDadosCliente({ clienteId }: CardsDadosClienteProps) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<DadosCliente | null>(null);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);

  type ContratoRow = {
    id: string;
    numero?: string | null;
    nucleo?: string | null;
    valor_total?: number | null;
    data_assinatura?: string | null;
    created_at?: string | null;
    status?: string | null;
  };

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar dados do cliente
      const { data: pessoaData } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", clienteId)
        .single();

      if (pessoaData) {
        setCliente({
          id: pessoaData.id,
          nome: pessoaData.nome,
          cpfCnpj: pessoaData.cpf || pessoaData.cnpj || "",
          email: pessoaData.email || "",
          telefone: pessoaData.telefone || pessoaData.celular || "",
          endereco: [pessoaData.endereco, pessoaData.numero, pessoaData.bairro, pessoaData.cidade, pessoaData.estado]
            .filter(Boolean)
            .join(", ") || "",
          profissao: pessoaData.profissao || "",
          estadoCivil: pessoaData.estado_civil || "",
          avatar: pessoaData.avatar_url,
        });
      } else {
        setCliente(null);
      }

      // Buscar contratos do cliente
      const { data: contratosData } = await supabase
        .from("contratos")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("created_at", { ascending: false });

      if (contratosData && contratosData.length > 0) {
        setContratos(
          (contratosData as ContratoRow[]).map((c) => {
            const createdAt = c.created_at || new Date().toISOString();
            return {
            id: c.id,
            numero: c.numero || `ARQ-${new Date(createdAt).getFullYear()}-${String(c.id).slice(0, 4).toUpperCase()}`,
            nucleo: c.nucleo || "Arquitetura",
            valor: c.valor_total || 0,
            dataAssinatura: c.data_assinatura || createdAt,
            status: (["ativo", "finalizado", "cancelado"].includes(String(c.status))
              ? (c.status as "ativo" | "finalizado" | "cancelado")
              : "ativo"),
          }})
        );
      } else {
        setContratos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function getIniciais(nome: string): string {
    return nome
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cliente) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-600">Dados do Cliente</h3>
          <p className="text-sm text-gray-400 mt-2">
            Informações do cliente não disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  const valorTotal = contratos.reduce((acc, c) => acc + c.valor, 0);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-0">
            {/* Header do card */}
            <div className="p-4 border-b">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-wg-primary to-wg-primary/70 rounded-full flex items-center justify-center text-white font-normal text-lg flex-shrink-0">
                  {cliente.avatar ? (
                    <img
                      src={cliente.avatar}
                      alt={cliente.nome}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getIniciais(cliente.nome)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-gray-900 truncate">{cliente.nome}</h3>
                  <p className="text-xs text-gray-500">CPF: {cliente.cpfCnpj}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-normal text-wg-primary">
                    {formatarMoeda(valorTotal)}
                  </p>
                  <p className="text-xs text-gray-500">{contratos.length} contrato{contratos.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Dados cadastrais */}
            <div className="p-4 space-y-3">
              <p className="text-xs font-normal text-gray-500 uppercase">Dados Cadastrais</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{cliente.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{cliente.endereco}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{cliente.profissao}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{cliente.estadoCivil}</span>
                </div>
              </div>
            </div>

            {/* Contratos */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs font-normal text-gray-500 uppercase mb-3">Contratos</p>

              <div className="space-y-2">
                {contratos.map((contrato) => (
                  <button
                    key={contrato.id}
                    onClick={() => navigate(`/wgx/contratos/${contrato.id}`)}
                    className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{contrato.numero}</p>
                        <p className="text-xs text-gray-500">{contrato.nucleo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-normal text-gray-900">
                          R$ {contrato.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(contrato.dataAssinatura).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs ${
                          contrato.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : contrato.status === "finalizado"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {contrato.status === "ativo" ? "Ativo" : contrato.status === "finalizado" ? "Finalizado" : "Cancelado"}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t flex items-center justify-between">
        <button
          onClick={() => navigate(`/wgx/perfil`)}
          className="text-sm text-[#F25C26] hover:underline flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Ver cadastro completo
        </button>
      </div>
    </CardContent>
  </Card>
  );
}


