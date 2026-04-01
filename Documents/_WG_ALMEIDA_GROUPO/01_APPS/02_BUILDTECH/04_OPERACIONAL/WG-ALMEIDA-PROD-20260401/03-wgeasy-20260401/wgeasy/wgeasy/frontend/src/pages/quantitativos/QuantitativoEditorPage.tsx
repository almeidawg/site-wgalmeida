/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Editor Hierárquico de Quantitativo
// Sistema WG Easy - Grupo WG Almeida
// Estrutura: Projeto → Ambiente → Categoria → Item
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buscarQuantitativoProjetoCompleto,
  atualizarQuantitativoProjeto,
  criarQuantitativoAmbiente,
  atualizarQuantitativoAmbiente,
  deletarQuantitativoAmbiente,
  criarQuantitativoCategoria,
  atualizarQuantitativoCategoria,
  deletarQuantitativoCategoria,
  criarQuantitativoItem,
  atualizarQuantitativoItem,
  deletarQuantitativoItem,
} from "../../services/quantitativosApi";
import { listarItensComFiltros } from "../../lib/pricelistApi";
import type {
  QuantitativoProjetoCompleto,
  QuantitativoAmbiente,
  QuantitativoCategoria,
  QuantitativoItem,
  QuantitativoAmbienteFormData,
  QuantitativoCategoriaFormData,
  QuantitativoItemFormData,
} from "../../types/quantitativos";
import type { PricelistItemCompleto } from "../../types/pricelist";
import {
  calcularValorTotalProjeto,
  calcularValorTotalAmbiente,
  calcularValorTotalCategoria,
  NUCLEO_COLORS,
} from "../../types/quantitativos";
import { formatarMoeda } from "../../lib/utils";
import { UploadProjetoIA } from "@/components/quantitativos/UploadProjetoIA";
import { useToast } from "@/components/ui/use-toast";

export default function QuantitativoEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const [projeto, setProjeto] = useState<QuantitativoProjetoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAmbientes, setExpandedAmbientes] = useState<Set<string>>(new Set());
  const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(new Set());
  const [mostrarPainelIA, setMostrarPainelIA] = useState(false);

  // Modais de criaçÍo/ediçÍo
  const [modalAmbiente, setModalAmbiente] = useState<{
    open: boolean;
    ambiente?: QuantitativoAmbiente;
  }>({ open: false });
  const [modalCategoria, setModalCategoria] = useState<{
    open: boolean;
    categoria?: QuantitativoCategoria;
    ambiente_id: string;
  } | null>(null);
  const [modalItem, setModalItem] = useState<{
    open: boolean;
    item?: QuantitativoItem;
    categoria_id: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      carregarProjeto();
    }
  }, [id]);

  const carregarProjeto = async () => {
    try {
      setLoading(true);
      const data = await buscarQuantitativoProjetoCompleto(id!);
      setProjeto(data);

      // Expandir todos os ambientes por padrÍo
      if (data.ambientes) {
        setExpandedAmbientes(new Set(data.ambientes.map(a => a.id)));
      }
    } catch (error) {
      console.error("Erro ao carregar projeto:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar projeto" });
      navigate("/quantitativos");
    } finally {
      setLoading(false);
    }
  };

  const toggleAmbiente = (ambienteId: string) => {
    const newExpanded = new Set(expandedAmbientes);
    if (newExpanded.has(ambienteId)) {
      newExpanded.delete(ambienteId);
    } else {
      newExpanded.add(ambienteId);
    }
    setExpandedAmbientes(newExpanded);
  };

  const toggleCategoria = (categoriaId: string) => {
    const newExpanded = new Set(expandedCategorias);
    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId);
    } else {
      newExpanded.add(categoriaId);
    }
    setExpandedCategorias(newExpanded);
  };

  const handleDeletarAmbiente = async (ambienteId: string) => {
    if (!confirm("Tem certeza que deseja deletar este ambiente? Todas as categorias e itens serÍo removidos.")) {
      return;
    }
    try {
      await deletarQuantitativoAmbiente(ambienteId);
      await carregarProjeto();
    } catch (error) {
      console.error("Erro ao deletar ambiente:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar ambiente" });
    }
  };

  const handleDeletarCategoria = async (categoriaId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta categoria? Todos os itens serÍo removidos.")) {
      return;
    }
    try {
      await deletarQuantitativoCategoria(categoriaId);
      await carregarProjeto();
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar categoria" });
    }
  };

  const handleDeletarItem = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja deletar este item?")) {
      return;
    }
    try {
      await deletarQuantitativoItem(itemId);
      await carregarProjeto();
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar item" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Carregando projeto...</p>
      </div>
    );
  }

  if (!projeto) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p>Projeto nÍo encontrado</p>
      </div>
    );
  }

  const valorTotal = calcularValorTotalProjeto(projeto);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
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

        {/* Resumo do Projeto */}
        <div
          style={{
            background: `linear-gradient(135deg, ${NUCLEO_COLORS[projeto.nucleo]} 0%, ${NUCLEO_COLORS[projeto.nucleo]}dd 100%)`,
            padding: "24px",
            borderRadius: "12px",
            color: "white",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>
                {projeto.numero}
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {projeto.nome}
              </h1>
              {projeto.descricao && (
                <p style={{ fontSize: "14px", opacity: 0.9 }}>{projeto.descricao}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>
                Valor Total
              </div>
              <div style={{ fontSize: "32px", fontWeight: "700" }}>
                {formatarMoeda(valorTotal)}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>
                Ambientes
              </div>
              <div style={{ fontSize: "24px", fontWeight: "600" }}>
                {projeto.ambientes?.length || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>
                Categorias
              </div>
              <div style={{ fontSize: "24px", fontWeight: "600" }}>
                {projeto.ambientes?.reduce((sum, amb) => sum + (amb.categorias?.length || 0), 0) || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>
                Itens
              </div>
              <div style={{ fontSize: "24px", fontWeight: "600" }}>
                {projeto.ambientes?.reduce(
                  (sum, amb) =>
                    sum +
                    (amb.categorias?.reduce((s, cat) => s + (cat.itens?.length || 0), 0) || 0),
                  0
                ) || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>
                Área Construída
              </div>
              <div style={{ fontSize: "24px", fontWeight: "600" }}>
                {projeto.area_construida ? `${projeto.area_construida} m²` : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Ações Principais */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => setModalAmbiente({ open: true })}
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
          >
            + Adicionar Ambiente
          </button>
          <button
            onClick={() => setMostrarPainelIA((prev) => !prev)}
            style={{
              padding: "12px 24px",
              background: mostrarPainelIA ? "#E5E7EB" : "#4C1D95",
              color: mostrarPainelIA ? "#111827" : "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🤖 Leitura automática (IA)
          </button>
        </div>

        {mostrarPainelIA && (
          <div style={{ marginTop: "20px" }}>
            <UploadProjetoIA
              projetoId={projeto.id}
              nucleoId={projeto.nucleo_id}
              onAnaliseCompleta={async () => {
                await carregarProjeto();
                setMostrarPainelIA(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Árvore Hierárquica */}
      <div style={{ background: "white", borderRadius: "12px", overflow: "hidden" }}>
        {!projeto.ambientes || projeto.ambientes.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
            <p style={{ fontSize: "18px", marginBottom: "8px" }}>
              Nenhum ambiente adicionado
            </p>
            <p style={{ fontSize: "16px" }}>
              Clique em "Adicionar Ambiente" para começar
            </p>
          </div>
        ) : (
          projeto.ambientes.map((ambiente, ambIdx) => (
            <AmbienteNode
              key={ambiente.id}
              ambiente={ambiente}
              isLast={ambIdx === projeto.ambientes!.length - 1}
              isExpanded={expandedAmbientes.has(ambiente.id)}
              onToggle={() => toggleAmbiente(ambiente.id)}
              onEdit={() => setModalAmbiente({ open: true, ambiente })}
              onDelete={() => handleDeletarAmbiente(ambiente.id)}
              onAddCategoria={() =>
                setModalCategoria({ open: true, ambiente_id: ambiente.id })
              }
              expandedCategorias={expandedCategorias}
              onToggleCategoria={toggleCategoria}
              onEditCategoria={(categoria) =>
                setModalCategoria({ open: true, categoria, ambiente_id: ambiente.id })
              }
              onDeleteCategoria={handleDeletarCategoria}
              onAddItem={(categoria_id) =>
                setModalItem({ open: true, categoria_id })
              }
              onEditItem={(item, categoria_id) =>
                setModalItem({ open: true, item, categoria_id })
              }
              onDeleteItem={handleDeletarItem}
            />
          ))
        )}
      </div>

      {/* Modal Ambiente */}
      {modalAmbiente.open && (
        <ModalAmbiente
          projetoId={projeto.id}
          ambiente={modalAmbiente.ambiente}
          onClose={() => setModalAmbiente({ open: false })}
          onSave={() => {
            setModalAmbiente({ open: false });
            carregarProjeto();
          }}
        />
      )}

      {/* Modal Categoria */}
      {modalCategoria && (
        <ModalCategoria
          ambienteId={modalCategoria.ambiente_id}
          categoria={modalCategoria.categoria}
          onClose={() => setModalCategoria(null)}
          onSave={() => {
            setModalCategoria(null);
            carregarProjeto();
          }}
        />
      )}

      {/* Modal Item */}
      {modalItem && (
        <ModalItem
          categoriaId={modalItem.categoria_id}
          item={modalItem.item}
          onClose={() => setModalItem(null)}
          onSave={() => {
            setModalItem(null);
            carregarProjeto();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Componente: Nó de Ambiente
// ============================================================

interface AmbienteNodeProps {
  ambiente: QuantitativoAmbiente;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddCategoria: () => void;
  expandedCategorias: Set<string>;
  onToggleCategoria: (id: string) => void;
  onEditCategoria: (categoria: QuantitativoCategoria) => void;
  onDeleteCategoria: (id: string) => void;
  onAddItem: (categoria_id: string) => void;
  onEditItem: (item: QuantitativoItem, categoria_id: string) => void;
  onDeleteItem: (id: string) => void;
}

function AmbienteNode({
  ambiente,
  isLast,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddCategoria,
  expandedCategorias,
  onToggleCategoria,
  onEditCategoria,
  onDeleteCategoria,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: AmbienteNodeProps) {
  const valorTotal = calcularValorTotalAmbiente(ambiente);

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}>
      {/* Header do Ambiente */}
      <div
        style={{
          padding: "16px 20px",
          background: "#F8F9FA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <span style={{ fontSize: "16px" }}>
            {isExpanded ? "▼" : "▶"}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: "600", color: "#2B4580" }}>
              {ambiente.nome}
            </div>
            {ambiente.descricao && (
              <div style={{ fontSize: "16px", color: "#666", marginTop: "2px" }}>
                {ambiente.descricao}
              </div>
            )}
          </div>
          {ambiente.area_m2 && (
            <div style={{ fontSize: "18px", color: "#666" }}>
              {ambiente.area_m2} m²
            </div>
          )}
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#2B4580", minWidth: "140px", textAlign: "right" }}>
            {formatarMoeda(valorTotal)}
          </div>
        </div>

        {/* Ações */}
        <div
          style={{ display: "flex", gap: "8px", marginLeft: "16px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            style={actionButtonStyle}
            title="Editar Ambiente"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{ ...actionButtonStyle, color: "#EF4444" }}
            title="Deletar Ambiente"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Categorias */}
      {isExpanded && (
        <div style={{ paddingLeft: "40px" }}>
          {/* BotÍo Adicionar Categoria */}
          <div style={{ padding: "12px 20px", background: "#FAFBFC" }}>
            <button
              onClick={onAddCategoria}
              style={{
                padding: "8px 16px",
                background: "#E3F2FD",
                color: "#1976D2",
                border: "1px solid #1976D2",
                borderRadius: "6px",
                fontSize: "18px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              + Adicionar Categoria
            </button>
          </div>

          {/* Lista de Categorias */}
          {ambiente.categorias && ambiente.categorias.length > 0 ? (
            ambiente.categorias.map((categoria, catIdx) => (
              <CategoriaNode
                key={categoria.id}
                categoria={categoria}
                isLast={catIdx === ambiente.categorias!.length - 1}
                isExpanded={expandedCategorias.has(categoria.id)}
                onToggle={() => onToggleCategoria(categoria.id)}
                onEdit={() => onEditCategoria(categoria)}
                onDelete={() => onDeleteCategoria(categoria.id)}
                onAddItem={() => onAddItem(categoria.id)}
                onEditItem={(item) => onEditItem(item, categoria.id)}
                onDeleteItem={onDeleteItem}
              />
            ))
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "16px" }}>
              Nenhuma categoria adicionada
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente: Nó de Categoria
// ============================================================

interface CategoriaNodeProps {
  categoria: QuantitativoCategoria;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onEditItem: (item: QuantitativoItem) => void;
  onDeleteItem: (id: string) => void;
}

function CategoriaNode({
  categoria,
  isLast,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddItem,
  onEditItem,
  onDeleteItem,
}: CategoriaNodeProps) {
  const valorTotal = calcularValorTotalCategoria(categoria);

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid #E5E7EB" }}>
      {/* Header da Categoria */}
      <div
        style={{
          padding: "14px 20px",
          background: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={onToggle}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
          <span style={{ fontSize: "14px" }}>
            {isExpanded ? "▼" : "▶"}
          </span>
          {categoria.cor && (
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                background: categoria.cor,
                border: "1px solid #DDD",
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: "600", color: "#374151" }}>
              {categoria.nome}
            </div>
            {categoria.descricao && (
              <div style={{ fontSize: "16px", color: "#666", marginTop: "2px" }}>
                {categoria.descricao}
              </div>
            )}
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#374151", minWidth: "140px", textAlign: "right" }}>
            {formatarMoeda(valorTotal)}
          </div>
        </div>

        {/* Ações */}
        <div
          style={{ display: "flex", gap: "8px", marginLeft: "16px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onEdit}
            style={actionButtonStyle}
            title="Editar Categoria"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            style={{ ...actionButtonStyle, color: "#EF4444" }}
            title="Deletar Categoria"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Itens */}
      {isExpanded && (
        <div style={{ paddingLeft: "40px", background: "#FAFBFC" }}>
          {/* BotÍo Adicionar Item */}
          <div style={{ padding: "12px 20px" }}>
            <button
              onClick={onAddItem}
              style={{
                padding: "8px 16px",
                background: "#F3E5F5",
                color: "#9C27B0",
                border: "1px solid #9C27B0",
                borderRadius: "6px",
                fontSize: "18px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              + Adicionar Item
            </button>
          </div>

          {/* Tabela de Itens */}
          {categoria.itens && categoria.itens.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#E5E7EB" }}>
                    <th style={tableHeaderStyle}>Item</th>
                    <th style={{ ...tableHeaderStyle, textAlign: "center", width: "100px" }}>
                      Unidade
                    </th>
                    <th style={{ ...tableHeaderStyle, textAlign: "right", width: "100px" }}>
                      Qtd
                    </th>
                    <th style={{ ...tableHeaderStyle, textAlign: "right", width: "120px" }}>
                      Preço Unit.
                    </th>
                    <th style={{ ...tableHeaderStyle, textAlign: "right", width: "140px" }}>
                      Total
                    </th>
                    <th style={{ ...tableHeaderStyle, width: "100px" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {categoria.itens.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                      <td style={tableCellStyle}>
                        <div style={{ fontWeight: "500", color: "#374151" }}>
                          {item.nome}
                        </div>
                        {item.descricao && (
                          <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                            {item.descricao}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "center" }}>
                        {item.unidade}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right" }}>
                        {item.quantidade}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right" }}>
                        {formatarMoeda(item.preco_unitario ?? 0)}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "600" }}>
                        {formatarMoeda(item.preco_total ?? item.quantidade * (item.preco_unitario ?? 0))}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => onEditItem(item)}
                            style={smallActionButtonStyle}
                            title="Editar Item"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            style={{ ...smallActionButtonStyle, color: "#EF4444" }}
                            title="Deletar Item"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#999", fontSize: "16px" }}>
              Nenhum item adicionado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Modais (Placeholders - serÍo implementados a seguir)
// ============================================================

function ModalAmbiente({
  projetoId,
  ambiente,
  onClose,
  onSave,
}: {
  projetoId: string;
  ambiente?: QuantitativoAmbiente;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<QuantitativoAmbienteFormData>>({
    nome: ambiente?.nome || "",
    descricao: ambiente?.descricao || "",
    area_m2: ambiente?.area_m2 || undefined,
    pe_direito: ambiente?.pe_direito || undefined,
    ordem: ambiente?.ordem || 0,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (ambiente) {
        await atualizarQuantitativoAmbiente(ambiente.id, formData as QuantitativoAmbienteFormData);
      } else {
        await criarQuantitativoAmbiente({
          ...formData,
          projeto_id: projetoId,
        } as QuantitativoAmbienteFormData);
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar ambiente:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar ambiente" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent>
        <h2 style={{ fontSize: "20px", fontWeight: "semibold", marginBottom: "20px", color: "#2B4580" }}>
          {ambiente ? "Editar Ambiente" : "Novo Ambiente"}
        </h2>
        <form onSubmit={handleSubmit}>
          <FormField label="Nome" required>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Dormitório 1"
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="DescriçÍo">
            <textarea
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              placeholder="DescriçÍo opcional..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <FormField label="Área (m²)">
              <input
                type="number"
                step="0.01"
                value={formData.area_m2 || ""}
                onChange={(e) =>
                  setFormData({ ...formData, area_m2: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="0.00"
                style={inputStyle}
              />
            </FormField>

            <FormField label="Pé Direito (m)">
              <input
                type="number"
                step="0.01"
                value={formData.pe_direito || ""}
                onChange={(e) =>
                  setFormData({ ...formData, pe_direito: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="0.00"
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? "Salvando..." : ambiente ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

function ModalCategoria({
  ambienteId,
  categoria,
  onClose,
  onSave,
}: {
  ambienteId: string;
  categoria?: QuantitativoCategoria;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<QuantitativoCategoriaFormData>>({
    nome: categoria?.nome || "",
    descricao: categoria?.descricao || "",
    cor: categoria?.cor || "#9C27B0",
    ordem: categoria?.ordem || 0,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (categoria) {
        await atualizarQuantitativoCategoria(categoria.id, formData as QuantitativoCategoriaFormData);
      } else {
        await criarQuantitativoCategoria({
          ...formData,
          ambiente_id: ambienteId,
        } as QuantitativoCategoriaFormData);
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar categoria" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent>
        <h2 style={{ fontSize: "20px", fontWeight: "semibold", marginBottom: "20px", color: "#2B4580" }}>
          {categoria ? "Editar Categoria" : "Nova Categoria"}
        </h2>
        <form onSubmit={handleSubmit}>
          <FormField label="Nome" required>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: PAREDE"
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="DescriçÍo">
            <textarea
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={2}
              placeholder="DescriçÍo opcional..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FormField>

          <FormField label="Cor">
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                style={{ width: "60px", height: "40px", border: "1px solid #D1D5DB", borderRadius: "6px" }}
              />
              <input
                type="text"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </FormField>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? "Salvando..." : categoria ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

function ModalItem({
  categoriaId,
  item,
  onClose,
  onSave,
}: {
  categoriaId: string;
  item?: QuantitativoItem;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Partial<QuantitativoItemFormData>>({
    nome: item?.nome || "",
    descricao: item?.descricao || "",
    unidade: item?.unidade || "UN",
    quantidade: item?.quantidade || 1,
    preco_unitario: item?.preco_unitario || 0,
    ordem: item?.ordem || 0,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Pricelist Search
  const [buscaPricelist, setBuscaPricelist] = useState("");
  const [resultadosPricelist, setResultadosPricelist] = useState<PricelistItemCompleto[]>([]);
  const [buscandoPricelist, setBuscandoPricelist] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  const valorTotal = (formData.quantidade || 0) * (formData.preco_unitario || 0);

  // Buscar no Pricelist
  const buscarPricelist = async (busca: string) => {
    if (!busca || busca.length < 2) {
      setResultadosPricelist([]);
      setMostrarResultados(false);
      return;
    }

    try {
      setBuscandoPricelist(true);
      const resultados = await listarItensComFiltros({
        busca,
        limite: 10,
      });
      setResultadosPricelist(resultados);
      setMostrarResultados(true);
    } catch (error) {
      console.error("Erro ao buscar Pricelist:", error);
      setResultadosPricelist([]);
    } finally {
      setBuscandoPricelist(false);
    }
  };

  // Selecionar item do Pricelist
  const selecionarItemPricelist = (pricelistItem: PricelistItemCompleto) => {
    setFormData({
      ...formData,
      nome: pricelistItem.nome,
      descricao: pricelistItem.descricao || "",
      unidade: pricelistItem.unidade || "UN",
      preco_unitario: pricelistItem.preco_venda || 0,
      pricelist_item_id: pricelistItem.id,
    });
    setBuscaPricelist("");
    setMostrarResultados(false);
    setResultadosPricelist([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const dataToSave = {
        ...formData,
        valor_total: valorTotal,
      };

      if (item) {
        await atualizarQuantitativoItem(item.id, dataToSave as QuantitativoItemFormData);
      } else {
        await criarQuantitativoItem({
          ...dataToSave,
          categoria_id: categoriaId,
        } as QuantitativoItemFormData);
      }
      onSave();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar item" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <ModalContent>
        <h2 style={{ fontSize: "20px", fontWeight: "semibold", marginBottom: "20px", color: "#2B4580" }}>
          {item ? "Editar Item" : "Novo Item"}
        </h2>

        {/* Busca no Pricelist */}
        {!item && (
          <div style={{ marginBottom: "24px", padding: "16px", background: "#F0F9FF", borderRadius: "8px", border: "1px solid #BAE6FD" }}>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#0369A1", marginBottom: "8px" }}>
              🔍 Buscar no Pricelist
            </div>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={buscaPricelist}
                onChange={(e) => {
                  setBuscaPricelist(e.target.value);
                  buscarPricelist(e.target.value);
                }}
                placeholder="Digite para buscar itens no Pricelist..."
                style={{
                  ...inputStyle,
                  paddingRight: buscandoPricelist ? "40px" : "12px",
                }}
              />
              {buscandoPricelist && (
                <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px" }}>
                  ⏳
                </div>
              )}

              {/* Resultados da Busca */}
              {mostrarResultados && resultadosPricelist.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                  }}
                >
                  {resultadosPricelist.map((pricelistItem) => (
                    <div
                      key={pricelistItem.id}
                      onClick={() => selecionarItemPricelist(pricelistItem)}
                      style={{
                        padding: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #E5E7EB",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                        {pricelistItem.codigo} - {pricelistItem.nome}
                      </div>
                      {pricelistItem.descricao && (
                        <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                          {pricelistItem.descricao}
                        </div>
                      )}
                      <div style={{ fontSize: "13px", color: "#2B4580", marginTop: "4px", fontWeight: "500" }}>
                        {pricelistItem.unidade} · {formatarMoeda(pricelistItem.preco_venda || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mostrarResultados && resultadosPricelist.length === 0 && buscaPricelist && !buscandoPricelist && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "white",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    padding: "16px",
                    textAlign: "center",
                    color: "#666",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  Nenhum item encontrado no Pricelist
                </div>
              )}
            </div>
            <div style={{ fontSize: "12px", color: "#0369A1", marginTop: "8px" }}>
              Digite no mínimo 2 caracteres para buscar
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField label="Nome" required>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Pintura Látex"
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="DescriçÍo">
            <textarea
              value={formData.descricao || ""}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={2}
              placeholder="DescriçÍo opcional..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <FormField label="Unidade" required>
              <input
                type="text"
                value={formData.unidade}
                onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                placeholder="UN"
                style={inputStyle}
                required
              />
            </FormField>

            <FormField label="Quantidade" required>
              <input
                type="number"
                step="0.01"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: Number(e.target.value) })}
                style={inputStyle}
                required
              />
            </FormField>

            <FormField label="Preço Unitário" required>
              <input
                type="number"
                step="0.01"
                value={formData.preco_unitario}
                onChange={(e) => setFormData({ ...formData, preco_unitario: Number(e.target.value) })}
                style={inputStyle}
                required
              />
            </FormField>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#F3F4F6",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "18px", fontWeight: "600", color: "#374151" }}>
              Valor Total
            </span>
            <span style={{ fontSize: "20px", fontWeight: "semibold", color: "#2B4580" }}>
              {formatarMoeda(valorTotal)}
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? "Salvando..." : item ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

// ============================================================
// Componentes Auxiliares
// ============================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalContent({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "600px",
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "14px",
          fontWeight: "500",
          color: "#374151",
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>}
      </label>
      {children}
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

const actionButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "16px",
  cursor: "pointer",
  padding: "4px",
};

const smallActionButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: "14px",
  cursor: "pointer",
  padding: "2px",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "linear-gradient(135deg, #5E9B94 0%, #2B4580 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "18px",
  fontWeight: "600",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 24px",
  background: "#F3F4F6",
  color: "#374151",
  border: "none",
  borderRadius: "8px",
  fontSize: "18px",
  fontWeight: "500",
  cursor: "pointer",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "18px",
  color: "#374151",
};

