import React, { useState } from "react";
import { importarItemPorLink, criarItemImportado } from "@/lib/comprasApi";
import { useToast } from "@/components/ui/use-toast";

export default function ComprasImportarPage() {
  const [url, setUrl] = useState("");
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function importar() {
    setError(null);
    if (!url) {
      setError("Cole um link antes de importar.");
      return;
    }

    try {
      // valida URL simples
      new URL(url);
    } catch {
      setError("URL inválida.");
      return;
    }

    setLoading(true);
    try {
      const produto = await importarItemPorLink(url);
      if (!produto) {
        setError("Nenhum dado retornado da importaçÍo.");
        setDados(null);
      } else {
        setDados(produto);
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao importar o produto.");
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    if (!dados) return;
    setError(null);
    setSaving(true);
    try {
      await criarItemImportado(dados);
      toast({ title: "Sucesso", description: "Item importado e salvo!" });
      setDados(null);
      setUrl("");
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar o item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <h1 className="text-2xl font-normal">Importar Produto por Link</h1>

      <div className="flex gap-3">
        <input
          className="border p-2 rounded w-full"
          placeholder="Cole o link do produto..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && importar()}
          aria-label="URL do produto"
        />
        <button
          onClick={importar}
          className="px-4 py-2 text-lg bg-primary text-white rounded disabled:opacity-50"
          disabled={loading || !url}
        >
          {loading ? "Importando..." : "Importar"}
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {dados && (
        <div className="mt-6 p-4 border rounded bg-white shadow space-y-3">
          <img
            src={dados.imagem_url || "/placeholder.png"}
            alt={dados.titulo || "Imagem do produto"}
            className="h-40 object-cover rounded"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
            }}
          />
          <h2 className="font-normal">{dados.titulo || "Sem título"}</h2>
          <p>Preço: R$ {dados.preco ?? "N/A"}</p>

          <div className="flex gap-3">
            <button
              onClick={salvar}
              className="px-4 py-2 text-lg bg-green-600 text-white rounded disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar Item"}
            </button>
            <button
              onClick={() => setDados(null)}
              className="px-4 py-2 text-lg bg-gray-200 text-gray-800 rounded"
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

