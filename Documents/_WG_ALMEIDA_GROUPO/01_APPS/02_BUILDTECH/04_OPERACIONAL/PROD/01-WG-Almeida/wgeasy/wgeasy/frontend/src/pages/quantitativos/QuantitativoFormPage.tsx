/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Formulário de Quantitativo de Projeto
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  criarQuantitativoProjeto,
  buscarQuantitativoProjeto,
  atualizarQuantitativoProjeto,
} from "../../services/quantitativosApi";
import { listarPessoas, obterPessoa } from "../../lib/pessoasApi";
import { supabase } from "../../lib/supabaseClient";
import type {
  QuantitativoProjetoFormData,
  NucleoQuantitativo,
  StatusQuantitativo,
} from "../../types/quantitativos";
import { validarProjetoFormData } from "../../types/quantitativos";
import type { Ambiente } from "../../lib/ambientesApi";
import { useToast } from "@/components/ui/use-toast";

// Schema de validaçÍo
const projetoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente é obrigatório"),
  nucleo: z.enum(["arquitetura", "engenharia", "marcenaria"], {
    required_error: "Núcleo é obrigatório",
  }),
  nucleo_id: z.string().optional(),
  nome: z.string().min(1, "Nome do projeto é obrigatório"),
  descricao: z.string().optional(),
  area_construida: z.number().min(0).optional(),
  area_total: z.number().min(0).optional(),
  endereco_obra: z.string().optional(),
  status: z
    .enum(["em_elaboracao", "aprovado", "revisao", "arquivado"])
    .default("em_elaboracao"),
  observacoes: z.string().optional(),
  proposta_id: z.string().optional(),
  contrato_id: z.string().optional(),
});

type ProjetoFormData = z.input<typeof projetoSchema>;

export default function QuantitativoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [propostasCliente, setPropostasCliente] = useState<any[]>([]);
  const [ambientesDisponiveis, setAmbientesDisponiveis] = useState<Ambiente[]>([]);
  const [loadingAmbientes, setLoadingAmbientes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoSchema),
    defaultValues: {
      status: "em_elaboracao",
    },
  });

  // Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      carregarProjeto(id);
    }
  }, [id, isEditing]);

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
  }, []);

  // Prefill endereço da obra e carregar propostas/ambientes quando selecionar cliente
  const clienteIdSelecionado = watch("cliente_id");
  useEffect(() => {
    if (!clienteIdSelecionado) {
      setPropostasCliente([]);
      setAmbientesDisponiveis([]);
      return;
    }
    (async () => {
      try {
        setLoadingAmbientes(true);

        // 1. Buscar dados do cliente para endereço
        const pessoa = await obterPessoa(clienteIdSelecionado);
        if (pessoa) {
          // Monta endereço da obra (prioriza campos de obra; fallback para endereço principal)
          const partes = [
            pessoa.obra_logradouro || pessoa.logradouro,
            pessoa.obra_numero || pessoa.numero,
            pessoa.obra_complemento || pessoa.complemento,
            pessoa.obra_bairro || pessoa.bairro,
            pessoa.obra_cidade || pessoa.cidade,
            pessoa.obra_estado || pessoa.estado,
            pessoa.obra_cep || pessoa.cep,
          ]
            .filter(Boolean)
            .join(", ");

          if (partes.trim().length > 0) {
            setValue("endereco_obra", partes);
          }
        }

        // 2. Buscar propostas do cliente (aprovadas ou enviadas)
        const { data: propostas, error: errorPropostas } = await supabase
          .from("propostas")
          .select("id, numero, titulo, nucleo, status, valor_total")
          .eq("cliente_id", clienteIdSelecionado)
          .in("status", ["aprovada", "enviada", "rascunho"])
          .order("criado_em", { ascending: false });

        if (errorPropostas) {
          console.error("Erro ao buscar propostas:", errorPropostas);
        } else {
          setPropostasCliente(propostas || []);

          // 3. Buscar ambientes das propostas do cliente
          if (propostas && propostas.length > 0) {
            const propostaIds = propostas.map((p: any) => p.id);
            const { data: ambientes, error: errorAmbientes } = await supabase
              .from("propostas_ambientes")
              .select("*")
              .in("proposta_id", propostaIds)
              .order("ordem", { ascending: true });

            if (!errorAmbientes && ambientes) {
              setAmbientesDisponiveis(ambientes);
            }
          } else {
            setAmbientesDisponiveis([]);
          }
        }
      } catch (err) {
        console.warn("NÍo foi possível carregar dados do cliente", err);
      } finally {
        setLoadingAmbientes(false);
      }
    })();
  }, [clienteIdSelecionado, setValue]);

  const carregarProjeto = async (projetoId: string) => {
    try {
      setLoading(true);
      const projeto = await buscarQuantitativoProjeto(projetoId);
      reset({
        cliente_id: projeto.cliente_id,
        nucleo: projeto.nucleo,
        nucleo_id: projeto.nucleo_id || undefined,
        nome: projeto.nome,
        descricao: projeto.descricao || undefined,
        area_construida: projeto.area_construida ?? undefined,
        area_total: projeto.area_total ?? undefined,
        endereco_obra: projeto.endereco_obra || undefined,
        status: projeto.status,
        observacoes: projeto.observacoes || undefined,
        proposta_id: projeto.proposta_id || undefined,
        contrato_id: projeto.contrato_id || undefined,
      });
    } catch (error) {
      console.error("Erro ao carregar projeto:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar projeto" });
    } finally {
      setLoading(false);
    }
  };

  const carregarClientes = async () => {
    try {
      // Tabela pessoas usa tipo em UPPERCASE ("CLIENTE")
      const clientesData = await listarPessoas({ tipo: "CLIENTE" as any, ativo: true });
      setClientes(clientesData);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao buscar clientes. Verifique o console para mais detalhes." });
    }
  };

  const onSubmit = async (data: ProjetoFormData) => {
    try {
      setLoading(true);

      const formData: QuantitativoProjetoFormData = {
        ...data,
        nucleo: data.nucleo as NucleoQuantitativo,
        status: data.status as StatusQuantitativo,
      };

      // Bloqueio amigável: sem usuário autenticado, Supabase RLS vai falhar
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        toast({ variant: "destructive", title: "SessÍo expirada", description: "Faça login novamente para criar/atualizar o quantitativo." });
        setLoading(false);
        return;
      }

      if (isEditing && id) {
        await atualizarQuantitativoProjeto(id, formData);
        toast({ title: "Sucesso", description: "Quantitativo atualizado com sucesso!" });
      } else {
        await criarQuantitativoProjeto(formData);
        toast({ title: "Sucesso", description: "Quantitativo criado com sucesso!" });
      }

      navigate("/quantitativos");
    } catch (error) {
      console.error("Erro ao salvar quantitativo:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar quantitativo" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <button
          onClick={() => navigate("/quantitativos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#5E9B94",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Voltar para Quantitativos
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
          {isEditing ? "Editar Quantitativo" : "Novo Quantitativo"}
        </h1>
        <p style={{ color: "#666", fontSize: "16px" }}>
          {isEditing
            ? "Atualize os dados do projeto"
            : "Preencha os dados do novo projeto"}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          style={{
            background: "white",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* SeçÍo: Dados Básicos */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#2B4580",
                paddingBottom: "12px",
                borderBottom: "2px solid #E5E7EB",
              }}
            >
              Dados Basicos
            </h3>

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Cliente */}
              <FormField
                label="Cliente"
                required
                error={errors.cliente_id?.message}
              >
                <select
                  {...register("cliente_id")}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Endereço da Obra (movido para cá) */}
              <FormField label="Endereço da Obra" error={errors.endereco_obra?.message}>
                <input
                  type="text"
                  {...register("endereco_obra")}
                  placeholder="Endereço completo da obra..."
                  style={inputStyle}
                  disabled={loading}
                />
              </FormField>

              {/* Nome do Projeto */}
              <FormField label="Nome do Projeto" required error={errors.nome?.message}>
                <input
                  type="text"
                  {...register("nome")}
                  placeholder="Ex: Residência Eliane"
                  style={inputStyle}
                  disabled={loading}
                />
              </FormField>

              {/* Núcleo */}
              <FormField label="Núcleo" required error={errors.nucleo?.message}>
                <select
                  {...register("nucleo")}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">Selecione o núcleo</option>
                  <option value="arquitetura">Arquitetura</option>
                  <option value="engenharia">Engenharia</option>
                  <option value="marcenaria">Marcenaria</option>
                </select>
              </FormField>

              {/* DescriçÍo */}
              <FormField label="DescriçÍo" error={errors.descricao?.message}>
                <textarea
                  {...register("descricao")}
                  rows={3}
                  placeholder="DescriçÍo do projeto..."
                  style={{ ...inputStyle, resize: "vertical" }}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* SeçÍo: Ambientes das Propostas (aparece quando cliente é selecionado) */}
          {clienteIdSelecionado && (
            <div style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  marginBottom: "20px",
                  color: "#5E9B94",
                  paddingBottom: "12px",
                  borderBottom: "2px solid #E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                Ambientes das Propostas
                {loadingAmbientes && (
                  <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "400" }}>
                    Carregando...
                  </span>
                )}
              </h3>

              {!loadingAmbientes && propostasCliente.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    background: "#FEF3C7",
                    borderRadius: "8px",
                    color: "#92400E",
                    fontSize: "16px",
                  }}
                >
                  Este cliente nao possui propostas cadastradas. Os ambientes serao criados manualmente no quantitativo.
                </div>
              )}

              {!loadingAmbientes && propostasCliente.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Lista de propostas */}
                  <div
                    style={{
                      padding: "16px",
                      background: "#F0FDF4",
                      borderRadius: "8px",
                      border: "1px solid #BBF7D0",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#166534", marginBottom: "12px", fontWeight: "500" }}>
                      ✓ {propostasCliente.length} proposta(s) encontrada(s)
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {propostasCliente.map((proposta: any) => (
                        <span
                          key={proposta.id}
                          style={{
                            padding: "6px 12px",
                            background: "white",
                            borderRadius: "6px",
                            fontSize: "12px",
                            border: "1px solid #D1FAE5",
                            color: "#065F46",
                          }}
                        >
                          {proposta.numero || proposta.titulo} ({proposta.status})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Lista de ambientes disponíveis */}
                  {ambientesDisponiveis.length > 0 && (
                    <div
                      style={{
                        background: "#F8FAFC",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#EFF6FF",
                          borderBottom: "1px solid #DBEAFE",
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#1E40AF",
                        }}
                      >
                        📏 {ambientesDisponiveis.length} ambiente(s) com metragens calculadas
                      </div>
                      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                          <thead>
                            <tr style={{ background: "#F1F5F9" }}>
                              <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: "500", color: "#475569" }}>
                                Ambiente
                              </th>
                              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "500", color: "#475569" }}>
                                Área Piso (m²)
                              </th>
                              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "500", color: "#475569" }}>
                                Área Parede (m²)
                              </th>
                              <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: "500", color: "#475569" }}>
                                Perímetro (m)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ambientesDisponiveis.map((ambiente: Ambiente) => (
                              <tr key={ambiente.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                                <td style={{ padding: "10px 16px", color: "#1E293B" }}>{ambiente.nome}</td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#059669", fontWeight: "500" }}>
                                  {ambiente.area_piso?.toFixed(2) || "0.00"}
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#2563EB", fontWeight: "500" }}>
                                  {ambiente.area_parede?.toFixed(2) || "0.00"}
                                </td>
                                <td style={{ padding: "10px 16px", textAlign: "right", color: "#7C3AED", fontWeight: "500" }}>
                                  {ambiente.perimetro?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            ))}
                            {/* Totais */}
                            <tr style={{ background: "#EFF6FF", fontWeight: "600" }}>
                              <td style={{ padding: "10px 16px", color: "#1E40AF" }}>TOTAL</td>
                              <td style={{ padding: "10px 16px", textAlign: "right", color: "#059669" }}>
                                {ambientesDisponiveis.reduce((acc, amb) => acc + (amb.area_piso || 0), 0).toFixed(2)}
                              </td>
                              <td style={{ padding: "10px 16px", textAlign: "right", color: "#2563EB" }}>
                                {ambientesDisponiveis.reduce((acc, amb) => acc + (amb.area_parede || 0), 0).toFixed(2)}
                              </td>
                              <td style={{ padding: "10px 16px", textAlign: "right", color: "#7C3AED" }}>
                                {ambientesDisponiveis.reduce((acc, amb) => acc + (amb.perimetro || 0), 0).toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div
                        style={{
                          padding: "12px 16px",
                          background: "#ECFDF5",
                          borderTop: "1px solid #D1FAE5",
                          fontSize: "12px",
                          color: "#065F46",
                        }}
                      >
                        💡 Estes ambientes serÍo importados automaticamente ao criar o quantitativo
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SeçÍo: Dados do Projeto */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#2B4580",
                paddingBottom: "12px",
                borderBottom: "2px solid #E5E7EB",
              }}
            >
              Dados do Projeto
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Área Construída */}
              <FormField
                label="Área Construída (m²)"
                error={errors.area_construida?.message}
              >
                <input
                  type="number"
                  step="0.01"
                  {...register("area_construida", { valueAsNumber: true })}
                  placeholder="0.00"
                  style={inputStyle}
                  disabled={loading}
                />
              </FormField>

              {/* Área Total */}
              <FormField label="Área Total (m²)" error={errors.area_total?.message}>
                <input
                  type="number"
                  step="0.01"
                  {...register("area_total", { valueAsNumber: true })}
                  placeholder="0.00"
                  style={inputStyle}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* SeçÍo: Metadados */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#2B4580",
                paddingBottom: "12px",
                borderBottom: "2px solid #E5E7EB",
              }}
            >
              Status e Observacoes
            </h3>

            <div style={{ display: "grid", gap: "20px" }}>
              {/* Status */}
              <FormField label="Status" required error={errors.status?.message}>
                <select
                  {...register("status")}
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="em_elaboracao">Em ElaboraçÍo</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="revisao">Em RevisÍo</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </FormField>

              {/* Observações */}
              <FormField label="Observações" error={errors.observacoes?.message}>
                <textarea
                  {...register("observacoes")}
                  rows={4}
                  placeholder="Observações gerais sobre o projeto..."
                  style={{ ...inputStyle, resize: "vertical" }}
                  disabled={loading}
                />
              </FormField>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate("/quantitativos")}
              style={{
                padding: "12px 24px",
                background: "#F3F4F6",
                color: "#374151",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "500",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #5E9B94 0%, #2B4580 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: "pointer",
              }}
              disabled={loading}
            >
              {loading
                ? "Salvando..."
                : isEditing
                ? "Atualizar Quantitativo"
                : "Criar Quantitativo"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Componente: Campo de Formulário
// ============================================================

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "18px",
          fontWeight: "500",
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ display: "block", marginTop: "6px", fontSize: "13px", color: "#EF4444" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Estilos
// ============================================================

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "6px",
  fontSize: "18px",
  fontFamily: "inherit",
};

