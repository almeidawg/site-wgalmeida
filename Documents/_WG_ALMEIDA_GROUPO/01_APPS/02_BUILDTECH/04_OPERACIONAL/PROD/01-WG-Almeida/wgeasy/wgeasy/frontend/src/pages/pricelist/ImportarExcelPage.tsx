import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { importarExcelPricelist, gerarTemplateExcel } from '@/lib/importarExcelPricelist';

export default function ImportarExcelPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    sucesso: number;
    erros: number;
    total: number;
    mensagens: string[];
  } | null>(null);

  function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      setArquivo(files[0]);
      setResultado(null);
    }
  }

  async function handleImportar() {
    if (!arquivo) {
      toast({ title: "AtençÍo", description: "Selecione um arquivo Excel" });
      return;
    }

    setLoading(true);
    try {
      const result = await importarExcelPricelist(arquivo);
      setResultado(result);

      if (result.sucesso > 0) {
        setTimeout(() => {
          if (confirm(`${result.sucesso} itens importados com sucesso! Ir para o Price List?`)) {
            navigate('/pricelist');
          }
        }, 1000);
      }
    } catch (error: unknown) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro ao importar", description: mensagemErro, variant: "destructive" });
      console.error('Erro na importaçÍo:', error);
    }
    setLoading(false);
  }

  async function handleBaixarTemplate() {
    const blob = await gerarTemplateExcel();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-pricelist.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-normal text-[#2E2E2E]">
          Importar Price List via Excel
        </h1>
        <p className="text-sm text-[#4C4C4C]">
          Importe múltiplos itens de uma vez usando um arquivo Excel
        </p>
      </div>

      {/* INSTRUÇÕES */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-normal text-blue-900 mb-3">📋 Instruções</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Baixe o template Excel clicando no botÍo abaixo</li>
          <li>Preencha o arquivo com seus dados</li>
          <li>Selecione o arquivo preenchido e clique em "Importar"</li>
        </ol>

        <div className="mt-4">
          <h3 className="font-normal text-blue-900 mb-2">Campos do Excel:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li><strong>codigo</strong>: (opcional) Será gerado automaticamente se vazio</li>
            <li><strong>descricao</strong>: (opcional) Será gerada automaticamente se vazia</li>
            <li><strong>tipo</strong>: (obrigatório) "material" ou "mao_obra"</li>
            <li><strong>unidade</strong>: (obrigatório) Ex: UN, M², KG, etc.</li>
            <li><strong>preco</strong>: (obrigatório) Preço base do item</li>
            <li><strong>marca</strong>: (opcional) Marca do produto</li>
            <li><strong>fornecedor</strong>: (opcional) Nome do fornecedor</li>
            <li><strong>estoque_minimo</strong>: (opcional) Estoque mínimo</li>
            <li><strong>estoque_atual</strong>: (opcional) Estoque atual</li>
          </ul>
        </div>
      </div>

      {/* TEMPLATE */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
        <h2 className="text-lg font-normal text-[#2E2E2E] mb-4">
          1. Baixar Template
        </h2>
        <button
          onClick={handleBaixarTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Baixar Template Excel
        </button>
      </div>

      {/* UPLOAD */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
        <h2 className="text-lg font-normal text-[#2E2E2E] mb-4">
          2. Selecionar Arquivo
        </h2>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArquivoSelecionado}
              className="block w-full text-sm text-[#4C4C4C] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-normal file:bg-primary file:text-white hover:file:bg-[#d54b1c] cursor-pointer"
            />
          </div>

          {arquivo && (
            <div className="bg-[#F3F3F3] p-3 rounded">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-[#2E2E2E]">
                  <strong>Arquivo selecionado:</strong> {arquivo.name}
                </span>
                <span className="text-xs text-[#4C4C4C]">
                  ({(arquivo.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleImportar}
            disabled={!arquivo || loading}
            className="px-6 py-3 bg-primary text-white rounded hover:bg-[#d54b1c] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Importando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Importar Arquivo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULTADO */}
      {resultado && (
        <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
          <h2 className="text-lg font-normal text-[#2E2E2E] mb-4">
            Resultado da ImportaçÍo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="text-sm text-blue-700 mb-1">Total de Linhas</div>
              <div className="text-2xl font-normal text-blue-900">{resultado.total}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <div className="text-sm text-green-700 mb-1">Importados com Sucesso</div>
              <div className="text-2xl font-normal text-green-900">{resultado.sucesso}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="text-sm text-red-700 mb-1">Erros</div>
              <div className="text-2xl font-normal text-red-900">{resultado.erros}</div>
            </div>
          </div>

          <div className="bg-[#F3F3F3] rounded p-4">
            <h3 className="font-normal text-[#2E2E2E] mb-2">Detalhes:</h3>
            <div className="space-y-1 text-sm font-mono">
              {resultado.mensagens.map((msg, idx) => (
                <div key={idx} className="text-[#4C4C4C]">{msg}</div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/pricelist')}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-[#d54b1c]"
            >
              Ir para Price List
            </button>
            <button
              onClick={() => {
                setArquivo(null);
                setResultado(null);
              }}
              className="px-4 py-2 bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
            >
              Nova ImportaçÍo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

