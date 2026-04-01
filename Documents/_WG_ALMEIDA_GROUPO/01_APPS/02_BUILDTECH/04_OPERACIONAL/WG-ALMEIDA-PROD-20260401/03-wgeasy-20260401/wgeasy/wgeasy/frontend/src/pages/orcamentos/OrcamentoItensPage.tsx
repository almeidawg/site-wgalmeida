/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/OrcamentoItensPage.tsx
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  listarItens,
  criarItem,
  removerItem,
  buscarOrcamento,
  atualizarOrcamento,
  OrcamentoItem,
} from "@/lib/orcamentoApi";
import { calcularOrcamento } from "@/lib/orcamentoCalculo";
import { useParams } from "react-router-dom";

export default function OrcamentoItensPage() {
  const { toast } = useToast();
  const { id } = useParams(); // ID do orçamento
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [orcamento, setOrcamento] = useState<any>(null);
  const [clienteNome, setClienteNome] = useState<string>("");

  const [novo, setNovo] = useState({
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
    grupo: "",
  });

  async function carregar() {
    if (!id) return;
    const dados = await listarItens(id);
    const info = await buscarOrcamento(id);
    setItens(dados);
    setOrcamento(info);
    // Buscar nome do cliente se cliente_id existir
    if (info?.cliente_id) {
      const { data } = await import("@/lib/supabaseClient").then(m => m.supabase)
        .then(supabase => supabase
          .from("pessoas")
          .select("nome")
          .eq("id", info.cliente_id)
          .single()
        );
      if (data?.nome) setClienteNome(data.nome);
    } else {
      setClienteNome("");
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  function handle(e: any) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }

  async function adicionar() {
    if (!novo.descricao || Number(novo.valor_unitario) <= 0) {
      return toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha descriçÍo e valor." });
    }

    await criarItem({
      orcamento_id: id!,
      descricao: novo.descricao,
      quantidade: Number(novo.quantidade),
      valor_unitario: Number(novo.valor_unitario),
      grupo: novo.grupo,
    });

    setNovo({ descricao: "", quantidade: 1, valor_unitario: 0, grupo: "" });
    carregar();
  }

  async function remover(idItem: string) {
    if (!confirm("Remover este item?")) return;
    await removerItem(idItem);
    carregar();
  }

  async function atualizarResumo() {
    const resumo = calcularOrcamento(itens);

    await atualizarOrcamento(id!, {
      valor_total: resumo.totalGeral,
      margem: resumo.margem,
      imposto: resumo.imposto,
    });

    toast({ title: "Sucesso", description: "Orçamento calculado e atualizado!" });
    carregar();
  }

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
          Itens do Orçamento
        </h1>
        {orcamento && (
          <p className="text-sm text-[#4C4C4C]">
            Cliente: {clienteNome || "-"} · Total Atual: R${" "}
            {Number(orcamento.valor_total).toFixed(2)}
          </p>
        )}
      </div>

      {/* Formulário de novo item */}
      <div className="bg-white border border-[#E5E5E5] p-5 rounded-xl shadow space-y-4 max-w-2xl">
        <h2 className="text-[16px] font-normal text-[#2E2E2E]">Adicionar Item</h2>

        <input
          name="descricao"
          value={novo.descricao}
          onChange={handle}
          placeholder="DescriçÍo"
          className="border p-2 rounded w-full"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            name="quantidade"
            value={novo.quantidade}
            onChange={handle}
            placeholder="Qtd."
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            name="valor_unitario"
            value={novo.valor_unitario}
            onChange={handle}
            placeholder="Valor Unit."
            className="border p-2 rounded w-full"
          />
        </div>

        <input
          name="grupo"
          value={novo.grupo}
          onChange={handle}
          placeholder="Grupo (Marcenaria, Obra, Elétrica...)"
          className="border p-2 rounded w-full"
        />

        <button
          onClick={adicionar}
          className="px-4 py-2 text-[14px] bg-primary text-white rounded w-full hover:bg-[#d54b1c]"
        >
          Adicionar Item
        </button>
      </div>

      {/* Tabela de itens */}
      <div className="bg-white border border-[#E5E5E5] p-4 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F3F3F3]">
            <tr>
              <th className="p-2 text-left">DescriçÍo</th>
              <th className="p-2 text-left">Qtd</th>
              <th className="p-2 text-left">Unitário</th>
              <th className="p-2 text-left">Subtotal</th>
              <th className="p-2 text-left">Grupo</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b hover:bg-[#fafafa]">
                <td className="p-2">{i.descricao}</td>
                <td className="p-2">{i.quantidade}</td>
                <td className="p-2">R$ {Number(i.valor_unitario).toFixed(2)}</td>
                <td className="p-2">R$ {Number(i.subtotal).toFixed(2)}</td>
                <td className="p-2">{i.grupo ?? "-"}</td>
                <td className="p-2">
                  <button
                    onClick={() => remover(i.id!)}
                    className="text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}

            {itens.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-3">
                  Nenhum item no orçamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumo e calcular */}
      <button
        onClick={atualizarResumo}
        className="px-4 py-2 text-[14px] bg-[#2E7D32] text-white rounded max-w-xs hover:bg-[#24692a]"
      >
        Calcular Total do Orçamento
      </button>
    </div>
  );
}
