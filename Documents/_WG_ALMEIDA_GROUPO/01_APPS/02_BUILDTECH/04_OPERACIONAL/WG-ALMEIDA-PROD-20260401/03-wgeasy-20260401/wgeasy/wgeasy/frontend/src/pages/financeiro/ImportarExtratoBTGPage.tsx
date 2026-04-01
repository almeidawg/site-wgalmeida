/**
 * PÁGINA DE IMPORTAÇÍO - EXTRATO BTG PACTUAL
 * WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA
 */

import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabaseRaw as supabase } from '@/lib/supabaseClient';

// Dados de importaçÍo inline (gerados a partir do PDF)
const DADOS_IMPORTACAO = {
  conta: {
    banco: "BTG Pactual",
    codigo_banco: "208",
    agencia: "50",
    conta: "005689346",
    razao_social: "WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA",
    cnpj: "43716324000133",
    nucleo: "engenharia"
  },
  centros_custo: {
    "MO DIRETA/PEDREIRO": "MÍo de Obra - Pedreiro",
    "MO DIRETA/ELETRICA": "MÍo de Obra - Elétrica",
    "MO DIRETA/HIDRAULICA": "MÍo de Obra - Hidráulica",
    "MO DIRETA/GESSO": "MÍo de Obra - Gesso/Drywall",
    "MO DIRETA/PINTURA": "MÍo de Obra - Pintura",
    "MO DIRETA/AJUDANTE": "MÍo de Obra - Ajudante",
    "MO DIRETA/FAZ TUDO": "MÍo de Obra - Faz Tudo",
    "MO DIRETA": "MÍo de Obra Direta",
    "MATERIAIS/CONSTRUCAO": "Materiais - ConstruçÍo",
    "SERVICOS": "Serviços",
    "ADMINISTRATIVO/TELEFONIA": "Administrativo - Telefonia",
    "DESPESA/ALIMENTACAO": "Despesas - AlimentaçÍo",
    "RECEITA/CLIENTE": "Receita - Cliente",
    "INTERCOMPANY": "Intercompany",
    "PENDENTE": "Pendente ClassificaçÍo"
  } as Record<string, string>
};

// Interface do lançamento
interface LancamentoImportado {
  id: number;
  data: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  favorecido: string;
  descricao_original: string;
  centro_custo: string;
  cliente_obra: string;
  status: "PRONTO" | "PENDENTE_VINCULO";
}

// Cache de pessoas
const pessoasCache = new Map<string, string | null>();

export default function ImportarExtratoBTGPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [sucesso, setSucesso] = useState<number>(0);
  const [falhas, setFalhas] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [importando, setImportando] = useState(false);
  const [jsonData, setJsonData] = useState<string>('');

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  async function getOrCreatePessoa(nome: string): Promise<string | null> {
    if (!nome || nome === "PENDENTE") return null;

    if (pessoasCache.has(nome)) {
      return pessoasCache.get(nome) || null;
    }

    const { data: pessoaExistente } = await supabase
      .from("pessoas")
      .select("id")
      .ilike("nome", nome)
      .single();

    if (pessoaExistente) {
      pessoasCache.set(nome, pessoaExistente.id);
      return pessoaExistente.id;
    }

    // Determinar tipo
    let tipoPessoa = "fornecedor";
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes("wickbold") || nomeLower.includes("lacerda") || nomeLower.includes("kiellander")) {
      tipoPessoa = "cliente";
    }

    const { data: novaPessoa, error } = await supabase
      .from("pessoas")
      .insert({ nome, tipo: tipoPessoa, ativo: true })
      .select("id")
      .single();

    if (error) {
      addLog(`Aviso: NÍo foi possível criar pessoa ${nome}`);
      pessoasCache.set(nome, null);
      return null;
    }

    pessoasCache.set(nome, novaPessoa.id);
    return novaPessoa.id;
  }

  async function importarLancamento(lancamento: LancamentoImportado): Promise<boolean> {
    try {
      const pessoaId = await getOrCreatePessoa(lancamento.favorecido);
      const subcategoria = DADOS_IMPORTACAO.centros_custo[lancamento.centro_custo] || lancamento.centro_custo;

      const { error } = await supabase
        .from("financeiro_lancamentos")
        .insert({
          descricao: lancamento.descricao_original,
          valor_total: lancamento.valor,
          tipo: lancamento.tipo === "ENTRADA" ? "entrada" : "saida",
          status: "pago",
          data_competencia: lancamento.data,
          data_pagamento: lancamento.data,
          pessoa_id: pessoaId,
          forma_pagamento: "pix",
          nucleo: DADOS_IMPORTACAO.conta.nucleo,
          subcategoria: subcategoria,
          observacoes: lancamento.status === "PENDENTE_VINCULO"
            ? `Importado BTG - PENDENTE VALIDAÇÍO - ${lancamento.cliente_obra}`
            : `Importado BTG - ${lancamento.cliente_obra}`,
        });

      if (error) {
        addLog(`Erro #${lancamento.id}: ${error.message}`);
        return false;
      }

      return true;
    } catch (err) {
      addLog(`ExceçÍo #${lancamento.id}: ${String(err)}`);
      return false;
    }
  }

  async function executarImportacao() {
    if (!jsonData.trim()) {
      toast({ title: "Cole os dados JSON no campo de texto" });
      return;
    }

    let dados;
    try {
      dados = JSON.parse(jsonData);
    } catch {
      toast({ title: "JSON inválido. Verifique o formato." });
      return;
    }

    const lancamentos: LancamentoImportado[] = dados.lancamentos || dados;

    if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
      toast({ title: "Nenhum lançamento encontrado no JSON" });
      return;
    }

    setImportando(true);
    setTotal(lancamentos.length);
    setProgress(0);
    setSucesso(0);
    setFalhas(0);
    setLogs([]);

    addLog(`Iniciando importaçÍo de ${lancamentos.length} lançamentos...`);

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < lancamentos.length; i++) {
      const lanc = lancamentos[i];
      const resultado = await importarLancamento(lanc);

      if (resultado) {
        ok++;
        setSucesso(ok);
      } else {
        fail++;
        setFalhas(fail);
      }

      setProgress(i + 1);

      if ((i + 1) % 10 === 0) {
        addLog(`Progresso: ${i + 1}/${lancamentos.length} (${ok} sucesso, ${fail} falhas)`);
      }
    }

    addLog(`ImportaçÍo concluída: ${ok} sucesso, ${fail} falhas`);
    setStatus(`Concluído: ${ok} sucesso, ${fail} falhas de ${lancamentos.length} total`);
    setImportando(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight mb-4">Importar Extrato BTG Pactual</h1>
      <p className="text-[12px] text-gray-600 mb-4">
        WG ALMEIDA REFORMAS ESPECIALIZADAS LTDA
      </p>

      <div className="mb-4">
        <label className="block text-[12px] text-gray-700 mb-2">
          Cole o JSON dos lançamentos:
        </label>
        <textarea
          className="w-full h-64 p-3 border rounded font-mono text-[12px]"
          placeholder='{"lancamentos": [...]}'
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          disabled={importando}
        />
      </div>

      <button
        onClick={executarImportacao}
        disabled={importando}
        className="px-6 py-3 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 text-[14px]"
      >
        {importando ? 'Importando...' : 'Iniciar ImportaçÍo'}
      </button>

      {total > 0 && (
        <div className="mt-6">
          <div className="flex justify-between mb-2 text-[12px] text-gray-600">
            <span>Progresso: {progress}/{total}</span>
            <span>Sucesso: {sucesso} | Falhas: {falhas}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${(progress / total) * 100}%` }}
            />
          </div>
          {status && <p className="mt-2 text-[12px] text-gray-700">{status}</p>}
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[14px] font-light mb-2">Log de ImportaçÍo:</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-[12px] h-64 overflow-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

