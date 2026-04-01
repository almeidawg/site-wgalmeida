// ============================================================
// COMPONENTE: MediçÍo Financeira do Cronograma
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Mail,
  MessageCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Save,
} from "lucide-react";
import {
  calcularMedicaoProjeto,
  listarMedicoesProjeto,
  salvarMedicao,
} from "@/lib/cronogramaApi";
import {
  abrirRelatorioHtml,
  gerarRelatorioPagamentosHtml,
} from "@/lib/cronogramaRelatoriosHtml";
import type {
  MedicaoProjeto,
  ProjetoMedicao,
} from "@/types/cronograma";
import {
  formatarMoeda,
  formatarPercentual,
  formatarData,
  NUCLEO_LABELS,
} from "@/types/cronograma";
import { DateInputBR } from "@/components/ui/DateInputBR";

interface Props {
  projetoId: string;
  projetoTitulo?: string;
}

export default function MedicaoFinanceira({ projetoId, projetoTitulo: _projetoTitulo }: Props) {
  const [medicao, setMedicao] = useState<MedicaoProjeto | null>(null);
  const [historico, setHistorico] = useState<ProjetoMedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [dataCorte, setDataCorte] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [modoVisualizacao, setModoVisualizacao] = useState<
    "individual" | "categoria"
  >("individual");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(
    new Set()
  );

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [medicaoData, historicoData] = await Promise.all([
        calcularMedicaoProjeto(projetoId, dataCorte),
        listarMedicoesProjeto(projetoId),
      ]);
      setMedicao(medicaoData);
      setHistorico(historicoData);
    } catch (error) {
      console.error("Erro ao carregar mediçÍo:", error);
    } finally {
      setLoading(false);
    }
  }, [dataCorte, projetoId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleSalvarMedicao() {
    if (!medicao) return;
    setSalvando(true);
    try {
      const id = await salvarMedicao({
        projeto_id: projetoId,
        data_corte: dataCorte,
      });
      if (id) {
        alert("MediçÍo salva com sucesso!");
        carregarDados();
      } else {
        alert("Erro ao salvar mediçÍo");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar mediçÍo");
    } finally {
      setSalvando(false);
    }
  }

  function toggleCategoria(categoria: string) {
    const novas = new Set(categoriasExpandidas);
    if (novas.has(categoria)) {
      novas.delete(categoria);
    } else {
      novas.add(categoria);
    }
    setCategoriasExpandidas(novas);
  }

  function gerarPDFMedicao() {
    if (!medicao) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup bloqueado. Permita popups para gerar o PDF.");
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>MediçÍo Financeira - ${medicao.projeto_titulo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      color: #333;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #F25C26;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .logo-area h1 {
      color: #F25C26;
      font-size: 22px;
      margin-bottom: 5px;
    }
    .logo-area p {
      color: #666;
      font-size: 10px;
    }
    .doc-info {
      text-align: right;
      font-size: 10px;
      color: #666;
    }
    .doc-info strong {
      display: block;
      font-size: 14px;
      color: #333;
    }
    .info-section {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .info-item label {
      font-weight: bold;
      color: #666;
      font-size: 10px;
      display: block;
    }
    .info-item span {
      color: #333;
      font-size: 12px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .card.destaque {
      border-color: #F25C26;
      background: #fff7ed;
    }
    .card label {
      display: block;
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .card .valor {
      font-size: 18px;
      font-weight: bold;
    }
    .card .valor.azul { color: #3b82f6; }
    .card .valor.verde { color: #10b981; }
    .card .valor.amarelo { color: #f59e0b; }
    .card .valor.roxo { color: #8b5cf6; }
    .card .percentual {
      font-size: 11px;
      color: #666;
    }
    h2 {
      font-size: 14px;
      color: #333;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 10px;
    }
    th {
      background: #f3f4f6;
      padding: 8px 6px;
      text-align: left;
      font-weight: bold;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 8px 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .progress-bar {
      background: #e5e7eb;
      border-radius: 4px;
      height: 6px;
      overflow: hidden;
    }
    .progress-fill {
      background: #F25C26;
      height: 100%;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .assinatura {
      text-align: center;
      padding-top: 40px;
    }
    .assinatura .linha {
      border-top: 1px solid #333;
      padding-top: 5px;
      font-size: 10px;
    }
    @media print {
      body { padding: 10px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>GRUPO WG ALMEIDA</h1>
      <p>Engenharia | Arquitetura | Marcenaria</p>
      <p>CNPJ: 00.000.000/0001-00 | contato@wgalmeida.com.br</p>
    </div>
    <div class="doc-info">
      <strong>MEDIÇÍO FINANCEIRA</strong>
      <p>Data de Corte: ${formatarData(medicao.data_corte)}</p>
      <p>EmissÍo: ${formatarData(new Date().toISOString())}</p>
      ${medicao.numero_medicao ? `<p>MediçÍo Nº: ${medicao.numero_medicao}</p>` : ""}
    </div>
  </div>

  <div class="info-section">
    <div class="info-grid">
      <div class="info-item">
        <label>Projeto</label>
        <span>${medicao.projeto_titulo}</span>
      </div>
      <div class="info-item">
        <label>Contrato</label>
        <span>${medicao.contrato_numero || "-"}</span>
      </div>
      <div class="info-item">
        <label>Cliente</label>
        <span>${medicao.cliente_nome}</span>
      </div>
      <div class="info-item">
        <label>Núcleo</label>
        <span>${NUCLEO_LABELS[medicao.nucleo] || medicao.nucleo}</span>
      </div>
    </div>
  </div>

  <div class="cards">
    <div class="card">
      <label>Valor do Contrato</label>
      <div class="valor azul">${formatarMoeda(medicao.resumo.total_valor_contrato)}</div>
      <div class="percentual">100%</div>
    </div>
    <div class="card destaque">
      <label>Valor Realizado</label>
      <div class="valor verde">${formatarMoeda(medicao.resumo.total_valor_realizado)}</div>
      <div class="percentual">${formatarPercentual(medicao.resumo.percentual_geral)}</div>
    </div>
    <div class="card">
      <label>Custo Profissional</label>
      <div class="valor amarelo">${formatarMoeda(medicao.resumo.total_custo_profissional_realizado)}</div>
      <div class="percentual">A pagar equipe</div>
    </div>
    <div class="card">
      <label>Margem Bruta</label>
      <div class="valor roxo">${formatarMoeda(medicao.resumo.total_margem_bruta)}</div>
      <div class="percentual">${formatarPercentual(
        medicao.resumo.total_valor_realizado > 0
          ? (medicao.resumo.total_margem_bruta / medicao.resumo.total_valor_realizado) * 100
          : 0
      )}</div>
    </div>
  </div>

  <h2>Detalhamento por Item</h2>
  <table>
    <thead>
      <tr>
        <th>Tarefa</th>
        <th class="text-center">Dias</th>
        <th class="text-center">Progresso</th>
        <th class="text-right">Valor Total</th>
        <th class="text-right">Realizado</th>
        <th class="text-right">Profissional</th>
        <th class="text-right">Margem</th>
      </tr>
    </thead>
    <tbody>
      ${medicao.itens
        .map(
          (item) => `
        <tr>
          <td>${item.tarefa_nome}</td>
          <td class="text-center">${item.dias_executados}/${item.dias_totais}</td>
          <td class="text-center">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.progresso}%"></div>
            </div>
            ${item.progresso}%
          </td>
          <td class="text-right">${formatarMoeda(item.valor_total_item)}</td>
          <td class="text-right">${formatarMoeda(item.valor_realizado)}</td>
          <td class="text-right">${formatarMoeda(item.custo_profissional_realizado)}</td>
          <td class="text-right">${formatarMoeda(item.margem_bruta)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
    <tfoot>
      <tr style="font-weight: bold; background: #f3f4f6;">
        <td colspan="3">TOTAIS</td>
        <td class="text-right">${formatarMoeda(medicao.resumo.total_valor_contrato)}</td>
        <td class="text-right">${formatarMoeda(medicao.resumo.total_valor_realizado)}</td>
        <td class="text-right">${formatarMoeda(medicao.resumo.total_custo_profissional_realizado)}</td>
        <td class="text-right">${formatarMoeda(medicao.resumo.total_margem_bruta)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <div class="assinatura">
      <div class="linha">Responsável Técnico</div>
    </div>
    <div class="assinatura">
      <div class="linha">Cliente</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  function enviarPorEmail() {
    if (!medicao) return;
    const assunto = encodeURIComponent(
      `MediçÍo Financeira - ${medicao.projeto_titulo}`
    );
    const corpo = encodeURIComponent(
      `Prezado(a) ${medicao.cliente_nome},\n\n` +
        `Segue a mediçÍo financeira do projeto ${medicao.projeto_titulo}.\n\n` +
        `Data de Corte: ${formatarData(medicao.data_corte)}\n` +
        `Valor do Contrato: ${formatarMoeda(medicao.resumo.total_valor_contrato)}\n` +
        `Valor Realizado: ${formatarMoeda(medicao.resumo.total_valor_realizado)} (${formatarPercentual(medicao.resumo.percentual_geral)})\n` +
        `Valor Pendente: ${formatarMoeda(medicao.resumo.total_valor_pendente)}\n\n` +
        `Atenciosamente,\nGrupo WG Almeida`
    );
    window.open(
      `mailto:${medicao.cliente_email || ""}?subject=${assunto}&body=${corpo}`
    );
  }

  function enviarPorWhatsApp() {
    if (!medicao) return;
    const telefone = medicao.cliente_telefone?.replace(/\D/g, "") || "";
    const mensagem = encodeURIComponent(
      `*MEDIÇÍO FINANCEIRA*\n` +
        `Projeto: ${medicao.projeto_titulo}\n\n` +
        `Data de Corte: ${formatarData(medicao.data_corte)}\n\n` +
        `*RESUMO:*\n` +
        `Valor do Contrato: ${formatarMoeda(medicao.resumo.total_valor_contrato)}\n` +
        `Valor Realizado: ${formatarMoeda(medicao.resumo.total_valor_realizado)}\n` +
        `Progresso: ${formatarPercentual(medicao.resumo.percentual_geral)}\n\n` +
        `_Grupo WG Almeida_`
    );
    window.open(
      `https://wa.me/${telefone.startsWith("55") ? telefone : "55" + telefone}?text=${mensagem}`
    );
  }

  function emitirRelatorioColaboradores() {
    if (!medicao) return;
    const html = gerarRelatorioPagamentosHtml(medicao, "colaborador");
    abrirRelatorioHtml(html);
  }

  function emitirRelatorioFornecedores() {
    if (!medicao) return;
    const html = gerarRelatorioPagamentosHtml(medicao, "fornecedor");
    abrirRelatorioHtml(html);
  }

  function emitirRelatorioCliente() {
    if (!medicao) return;
    const html = gerarRelatorioPagamentosHtml(medicao, "cliente");
    abrirRelatorioHtml(html);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
        <span className="ml-3 text-gray-600">Calculando mediçÍo...</span>
      </div>
    );
  }

  if (!medicao) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>não foi possível calcular a mediçÍo para este projeto.</p>
        <p className="text-sm mt-2">
          Verifique se existem tarefas com valores de contrato vinculados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-normal text-gray-900">MediçÍo Financeira</h2>
          <p className="text-sm text-gray-600">
            {medicao.projeto_titulo} - {medicao.cliente_nome}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Data de corte */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <DateInputBR
              value={dataCorte}
              onChange={setDataCorte}
              placeholder="dd/mm/aaaa"
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            />
          </div>

          {/* BotÍo atualizar */}
          <button
            type="button"
            onClick={carregarDados}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Ações de exportaçÍo */}
          <div className="flex items-center gap-2 border-l pl-3">
            <button
              type="button"
              onClick={gerarPDFMedicao}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1.5 text-sm"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={enviarPorEmail}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 text-sm"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              type="button"
              onClick={enviarPorWhatsApp}
              className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1.5 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={emitirRelatorioColaboradores}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 text-sm"
            >
              Colab.
            </button>
            <button
              type="button"
              onClick={emitirRelatorioFornecedores}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg hover:bg-sky-100 flex items-center gap-1.5 text-sm"
            >
              Fornec.
            </button>
            <button
              type="button"
              onClick={emitirRelatorioCliente}
              className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 flex items-center gap-1.5 text-sm"
            >
              Cliente
            </button>
          </div>

          {/* Salvar mediçÍo */}
          <button
            type="button"
            onClick={handleSalvarMedicao}
            disabled={salvando}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {salvando ? "Salvando..." : "Salvar MediçÍo"}
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Valor Contrato
            </span>
          </div>
          <p className="text-2xl font-normal text-blue-600">
            {formatarMoeda(medicao.resumo.total_valor_contrato)}
          </p>
          <p className="text-xs text-gray-500 mt-1">100% do projeto</p>
        </div>

        <div className="bg-white border-2 border-green-200 rounded-xl p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Valor Realizado
            </span>
          </div>
          <p className="text-2xl font-normal text-green-600">
            {formatarMoeda(medicao.resumo.total_valor_realizado)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatarPercentual(medicao.resumo.percentual_geral)} concluído
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Custo Profissional
            </span>
          </div>
          <p className="text-2xl font-normal text-yellow-600">
            {formatarMoeda(medicao.resumo.total_custo_profissional_realizado)}
          </p>
          <p className="text-xs text-gray-500 mt-1">A pagar à equipe</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-600 uppercase">
              Margem Bruta
            </span>
          </div>
          <p className="text-2xl font-normal text-purple-600">
            {formatarMoeda(medicao.resumo.total_margem_bruta)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatarPercentual(
              medicao.resumo.total_valor_realizado > 0
                ? (medicao.resumo.total_margem_bruta /
                    medicao.resumo.total_valor_realizado) *
                    100
                : 0
            )}{" "}
            de margem
          </p>
        </div>
      </div>

      {/* Toggle de visualizaçÍo */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setModoVisualizacao("individual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            modoVisualizacao === "individual"
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Por Tarefa
        </button>
        <button
          type="button"
          onClick={() => setModoVisualizacao("categoria")}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            modoVisualizacao === "categoria"
              ? "bg-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Por Categoria
        </button>
      </div>

      {/* Tabela de mediçÍo */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {modoVisualizacao === "individual" ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  Tarefa
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">
                  Dias
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">
                  Progresso
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Valor Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Realizado
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Profissional
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Margem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {medicao.itens.map((item) => (
                <tr key={item.tarefa_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.tarefa_nome}
                      </p>
                      {item.categoria && (
                        <p className="text-xs text-gray-500">{item.categoria}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.dias_executados}/{item.dias_totais}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${item.progresso}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {item.progresso}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {formatarMoeda(item.valor_total_item)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {formatarMoeda(item.valor_realizado)}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-600">
                    {formatarMoeda(item.custo_profissional_realizado)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-purple-600">
                    {formatarMoeda(item.margem_bruta)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-normal">
              <tr>
                <td className="px-4 py-3" colSpan={3}>
                  TOTAIS
                </td>
                <td className="px-4 py-3 text-right">
                  {formatarMoeda(medicao.resumo.total_valor_contrato)}
                </td>
                <td className="px-4 py-3 text-right text-green-600">
                  {formatarMoeda(medicao.resumo.total_valor_realizado)}
                </td>
                <td className="px-4 py-3 text-right text-yellow-600">
                  {formatarMoeda(medicao.resumo.total_custo_profissional_realizado)}
                </td>
                <td className="px-4 py-3 text-right text-purple-600">
                  {formatarMoeda(medicao.resumo.total_margem_bruta)}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="divide-y divide-gray-100">
            {medicao.itens_por_categoria.map((cat) => (
              <div key={cat.categoria}>
                <button
                  type="button"
                  onClick={() => toggleCategoria(cat.categoria)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {categoriasExpandidas.has(cat.categoria) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{cat.categoria}</p>
                      <p className="text-xs text-gray-500">
                        {cat.total_tarefas} tarefa(s) |{" "}
                        {formatarPercentual(cat.progresso_medio)} concluído
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-500">Total</p>
                      <p className="font-medium">{formatarMoeda(cat.valor_total)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Realizado</p>
                      <p className="font-medium text-green-600">
                        {formatarMoeda(cat.valor_realizado)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Margem</p>
                      <p className="font-medium text-purple-600">
                        {formatarMoeda(cat.margem_bruta)}
                      </p>
                    </div>
                  </div>
                </button>
                {categoriasExpandidas.has(cat.categoria) && (
                  <div className="bg-gray-50 px-8 py-2">
                    {medicao.itens
                      .filter((i) => (i.categoria || "Sem Categoria") === cat.categoria)
                      .map((item) => (
                        <div
                          key={item.tarefa_id}
                          className="py-2 flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700">{item.tarefa_nome}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500">
                              {item.progresso}%
                            </span>
                            <span className="font-medium text-green-600">
                              {formatarMoeda(item.valor_realizado)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de medições */}
      {historico.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Histórico de Medições</h3>
          <div className="space-y-2">
            {historico.slice(0, 5).map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">MediçÍo #{med.numero_medicao}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    {formatarData(med.data_corte)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-medium">
                    {formatarMoeda(med.valor_realizado)}
                  </span>
                  <span className="text-gray-500">
                    {formatarPercentual(med.percentual_geral)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


