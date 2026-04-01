// ============================================================
// UTILITÁRIOS DO MÓDULO JURÍDICO
// Sistema WG Easy - Grupo WG Almeida
// Processamento de variáveis e geraçÍo de contratos
// ============================================================

import { supabaseRaw as supabase } from "@/lib/supabaseClient";

/* ==================== TIPOS ==================== */

export type DadosContrato = {
  empresa: EmpresaData | null;
  pessoa: PessoaData | null;
  contrato: ContratoData | null;
  parcelas: ParcelaData[];
  memorial: MemorialData | null;
};

type EmpresaData = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  endereco_completo: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
};

type PessoaData = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  rg?: string;
  email?: string;
  telefone?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo_pessoa: "fisica" | "juridica";
  // Endereço da obra
  obra_logradouro?: string;
  obra_numero?: string;
  obra_complemento?: string;
  obra_bairro?: string;
  obra_cidade?: string;
  obra_estado?: string;
  obra_cep?: string;
};

type ContratoData = {
  id: string;
  numero: string;
  valor_total: number;
  valor_mao_obra?: number;
  valor_materiais?: number;
  prazo_entrega_dias?: number;
  prorrogacao_dias?: number;
  data_inicio?: string;
  data_termino?: string;
};

type ParcelaData = {
  numero: number;
  descricao: string;
  valor: number;
  data_vencimento: string;
  forma_pagamento?: string;
};

type MemorialData = {
  texto_clausula_objeto?: string;
};

/* ==================== FUNÇÕES DE FORMATAÇÍO ==================== */

/**
 * Formata valor monetário para exibiçÍo
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Converte valor numérico para extenso
 */
export function valorPorExtenso(valor: number): string {
  const unidades = [
    "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
    "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"
  ];

  const dezenas = [
    "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"
  ];

  const centenas = [
    "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"
  ];

  function extenso(n: number): string {
    if (n === 0) return "zero";
    if (n === 100) return "cem";

    if (n < 20) return unidades[n];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return dezenas[d] + (u > 0 ? " e " + unidades[u] : "");
    }
    if (n < 1000) {
      const c = Math.floor(n / 100);
      const resto = n % 100;
      return centenas[c] + (resto > 0 ? " e " + extenso(resto) : "");
    }
    if (n < 1000000) {
      const mil = Math.floor(n / 1000);
      const resto = n % 1000;
      const milTexto = mil === 1 ? "mil" : extenso(mil) + " mil";
      return milTexto + (resto > 0 ? (resto < 100 ? " e " : " ") + extenso(resto) : "");
    }
    if (n < 1000000000) {
      const milhao = Math.floor(n / 1000000);
      const resto = n % 1000000;
      const milhaoTexto = milhao === 1 ? "um milhÍo" : extenso(milhao) + " milhões";
      return milhaoTexto + (resto > 0 ? (resto < 1000 ? " e " : " ") + extenso(resto) : "");
    }

    return n.toString();
  }

  const parteInteira = Math.floor(valor);
  const centavos = Math.round((valor - parteInteira) * 100);

  let resultado = extenso(parteInteira);
  resultado += parteInteira === 1 ? " real" : " reais";

  if (centavos > 0) {
    resultado += " e " + extenso(centavos);
    resultado += centavos === 1 ? " centavo" : " centavos";
  }

  return resultado;
}

/**
 * Formata data para exibiçÍo
 */
export function formatarData(data: string | Date): string {
  const d = typeof data === "string" ? parseDataLocal(data) : data;
  return d.toLocaleDateString("pt-BR");
}

/**
 * Formata data por extenso
 */
export function dataPorExtenso(data: string | Date): string {
  const d = typeof data === "string" ? parseDataLocal(data) : data;

  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const ano = d.getFullYear();

  return `${dia} de ${mes} de ${ano}`;
}

function parseDataLocal(valor: string): Date {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, "");
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, "");
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/**
 * Formata telefone
 */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

/**
 * Formata CEP
 */
export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, "");
  return numeros.replace(/(\d{5})(\d{3})/, "$1-$2");
}

/* ==================== PROCESSAMENTO DE VARIÁVEIS ==================== */

/**
 * Processa todas as variáveis de um template de contrato
 */
export function processarVariaveis(template: string, dados: DadosContrato): string {
  let resultado = template;

  // Variáveis da EMPRESA
  if (dados.empresa) {
    const emp = dados.empresa;
    resultado = resultado.replace(/\{\{empresa\.razao_social\}\}/g, emp.razao_social || "");
    resultado = resultado.replace(/\{\{empresa\.nome_fantasia\}\}/g, emp.nome_fantasia || "");
    resultado = resultado.replace(/\{\{empresa\.cnpj\}\}/g, formatarCNPJ(emp.cnpj || ""));
    resultado = resultado.replace(/\{\{empresa\.endereco_completo\}\}/g, emp.endereco_completo || "");
    resultado = resultado.replace(/\{\{empresa\.inscricao_estadual\}\}/g, emp.inscricao_estadual || "");
    resultado = resultado.replace(/\{\{empresa\.inscricao_municipal\}\}/g, emp.inscricao_municipal || "");
    resultado = resultado.replace(/\{\{empresa\.banco\}\}/g, emp.banco || "");
    resultado = resultado.replace(/\{\{empresa\.agencia\}\}/g, emp.agencia || "");
    resultado = resultado.replace(/\{\{empresa\.conta\}\}/g, emp.conta || "");
    resultado = resultado.replace(/\{\{empresa\.chave_pix\}\}/g, emp.chave_pix || "");
  }

  // Variáveis da PESSOA (formato pessoa.campo)
  if (dados.pessoa) {
    const p = dados.pessoa;
    resultado = resultado.replace(/\{\{pessoa\.nome\}\}/g, p.nome || "");

    // CPF ou CNPJ formatado conforme tipo
    const docFormatado = p.tipo_pessoa === "juridica"
      ? formatarCNPJ(p.cpf_cnpj || "")
      : formatarCPF(p.cpf_cnpj || "");
    resultado = resultado.replace(/\{\{pessoa\.cpf_cnpj\}\}/g, docFormatado);

    resultado = resultado.replace(/\{\{pessoa\.rg\}\}/g, p.rg || "");
    resultado = resultado.replace(/\{\{pessoa\.email\}\}/g, p.email || "");
    resultado = resultado.replace(/\{\{pessoa\.telefone\}\}/g, formatarTelefone(p.telefone || ""));
    resultado = resultado.replace(/\{\{pessoa\.logradouro\}\}/g, p.logradouro || "");
    resultado = resultado.replace(/\{\{pessoa\.numero\}\}/g, p.numero || "S/N");
    resultado = resultado.replace(/\{\{pessoa\.complemento\}\}/g, p.complemento || "");
    resultado = resultado.replace(/\{\{pessoa\.bairro\}\}/g, p.bairro || "");
    resultado = resultado.replace(/\{\{pessoa\.cidade\}\}/g, p.cidade || "");
    resultado = resultado.replace(/\{\{pessoa\.estado\}\}/g, p.estado || "");
    resultado = resultado.replace(/\{\{pessoa\.cep\}\}/g, formatarCEP(p.cep || ""));

    // Variáveis do CONTRATANTE (formato alternativo contratante_campo)
    resultado = resultado.replace(/\{\{contratante_nome\}\}/g, p.nome || "");
    resultado = resultado.replace(/\{\{contratante_rg\}\}/g, p.rg || "");
    resultado = resultado.replace(/\{\{contratante_cpf\}\}/g, formatarCPF(p.cpf_cnpj || ""));
    resultado = resultado.replace(/\{\{contratante_cnpj\}\}/g, formatarCNPJ(p.cpf_cnpj || ""));
    resultado = resultado.replace(/\{\{contratante_cpf_cnpj\}\}/g, docFormatado);
    resultado = resultado.replace(/\{\{contratante_email\}\}/g, p.email || "");
    resultado = resultado.replace(/\{\{contratante_telefone\}\}/g, formatarTelefone(p.telefone || ""));

    // Endereço completo do contratante
    const enderecoCompleto = [
      p.logradouro,
      p.numero ? `nº ${p.numero}` : null,
      p.complemento,
      p.bairro,
      p.cidade,
      p.estado,
      p.cep ? `CEP ${formatarCEP(p.cep)}` : null,
    ].filter(Boolean).join(", ");
    resultado = resultado.replace(/\{\{contratante_endereco\}\}/g, enderecoCompleto || "");
    resultado = resultado.replace(/\{\{contratante_logradouro\}\}/g, p.logradouro || "");
    resultado = resultado.replace(/\{\{contratante_numero\}\}/g, p.numero || "S/N");
    resultado = resultado.replace(/\{\{contratante_complemento\}\}/g, p.complemento || "");
    resultado = resultado.replace(/\{\{contratante_bairro\}\}/g, p.bairro || "");
    resultado = resultado.replace(/\{\{contratante_cidade\}\}/g, p.cidade || "");
    resultado = resultado.replace(/\{\{contratante_estado\}\}/g, p.estado || "");
    resultado = resultado.replace(/\{\{contratante_cep\}\}/g, formatarCEP(p.cep || ""));

    // Variáveis do LOCAL DA OBRA
    const obraEnderecoCompleto = [
      p.obra_logradouro,
      p.obra_numero ? `nº ${p.obra_numero}` : null,
      p.obra_complemento,
      p.obra_bairro,
      p.obra_cidade,
      p.obra_estado,
      p.obra_cep ? `CEP ${formatarCEP(p.obra_cep)}` : null,
    ].filter(Boolean).join(", ");
    resultado = resultado.replace(/\{\{obra_endereco\}\}/g, obraEnderecoCompleto || "[Endereço da obra não informado]");
    resultado = resultado.replace(/\{\{obra_logradouro\}\}/g, p.obra_logradouro || "");
    resultado = resultado.replace(/\{\{obra_numero\}\}/g, p.obra_numero || "S/N");
    resultado = resultado.replace(/\{\{obra_complemento\}\}/g, p.obra_complemento || "");
    resultado = resultado.replace(/\{\{obra_bairro\}\}/g, p.obra_bairro || "");
    resultado = resultado.replace(/\{\{obra_cidade\}\}/g, p.obra_cidade || "");
    resultado = resultado.replace(/\{\{obra_estado\}\}/g, p.obra_estado || "");
    resultado = resultado.replace(/\{\{obra_cep\}\}/g, formatarCEP(p.obra_cep || ""));
  }

  // Variáveis do CONTRATO
  if (dados.contrato) {
    const c = dados.contrato;
    // Formato com prefixo: {{contrato.campo}}
    resultado = resultado.replace(/\{\{contrato\.numero\}\}/g, c.numero || "");
    resultado = resultado.replace(/\{\{contrato\.valor_total\}\}/g, formatarMoeda(c.valor_total || 0));
    resultado = resultado.replace(/\{\{contrato\.valor_extenso\}\}/g, valorPorExtenso(c.valor_total || 0));
    resultado = resultado.replace(/\{\{contrato\.prazo_execucao\}\}/g, String(c.prazo_entrega_dias || 0));
    resultado = resultado.replace(/\{\{contrato\.prorrogacao\}\}/g, String(c.prorrogacao_dias || 0));

    // Formato sem prefixo: {{campo}} (alternativo usado em alguns templates)
    resultado = resultado.replace(/\{\{numero_contrato\}\}/g, c.numero || "");
    resultado = resultado.replace(/\{\{valor_total\}\}/g, formatarMoeda(c.valor_total || 0));
    resultado = resultado.replace(/\{\{valor_extenso\}\}/g, valorPorExtenso(c.valor_total || 0));
    resultado = resultado.replace(/\{\{valor_mao_obra\}\}/g, formatarMoeda(c.valor_mao_obra || 0));
    resultado = resultado.replace(/\{\{valor_materiais\}\}/g, formatarMoeda(c.valor_materiais || 0));
    resultado = resultado.replace(/\{\{prazo_execucao\}\}/g, String(c.prazo_entrega_dias || 0));
    resultado = resultado.replace(/\{\{prazo_entrega\}\}/g, String(c.prazo_entrega_dias || 0));
    resultado = resultado.replace(/\{\{prorrogacao\}\}/g, String(c.prorrogacao_dias || 0));

    if (c.data_inicio) {
      resultado = resultado.replace(/\{\{contrato\.data_inicio\}\}/g, formatarData(c.data_inicio));
      resultado = resultado.replace(/\{\{data_inicio\}\}/g, formatarData(c.data_inicio));
    }
    if (c.data_termino) {
      resultado = resultado.replace(/\{\{contrato\.data_termino\}\}/g, formatarData(c.data_termino));
      resultado = resultado.replace(/\{\{data_termino\}\}/g, formatarData(c.data_termino));
    }
  }

  // Variáveis do SISTEMA
  resultado = resultado.replace(/\{\{sistema\.data_atual\}\}/g, formatarData(new Date()));
  resultado = resultado.replace(/\{\{sistema\.data_extenso\}\}/g, dataPorExtenso(new Date()));
  // Formato sem prefixo
  resultado = resultado.replace(/\{\{data_atual\}\}/g, formatarData(new Date()));
  resultado = resultado.replace(/\{\{data_extenso\}\}/g, dataPorExtenso(new Date()));
  resultado = resultado.replace(/\{\{data_emissao\}\}/g, formatarData(new Date()));
  resultado = resultado.replace(/\{\{data_contrato\}\}/g, dataPorExtenso(new Date()));

  // MEMORIAL EXECUTIVO / DESCRIÇÍO DOS SERVIÇOS
  if (dados.memorial?.texto_clausula_objeto) {
    resultado = resultado.replace(/\{\{memorial_executivo\}\}/g, dados.memorial.texto_clausula_objeto);
    resultado = resultado.replace(/\{\{obra_descricao\}\}/g, dados.memorial.texto_clausula_objeto);
  } else {
    resultado = resultado.replace(/\{\{memorial_executivo\}\}/g, "[Memorial Executivo não definido]");
    resultado = resultado.replace(/\{\{obra_descricao\}\}/g, "[DescriçÍo dos serviços não definida - cadastre o Memorial Executivo]");
  }

  // TABELA DE PARCELAS
  if (dados.parcelas.length > 0) {
    const tabelaParcelas = gerarTabelaParcelas(dados.parcelas);
    resultado = resultado.replace(/\{\{tabela_parcelas\}\}/g, tabelaParcelas);
  } else {
    resultado = resultado.replace(/\{\{tabela_parcelas\}\}/g, "[Parcelas não definidas]");
  }

  return resultado;
}

/**
 * Gera tabela HTML de parcelas
 */
export function gerarTabelaParcelas(parcelas: ParcelaData[]): string {
  if (parcelas.length === 0) return "";

  let html = `
    <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Parcela</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">DescriçÍo</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Valor</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Vencimento</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Forma</th>
        </tr>
      </thead>
      <tbody>
  `;

  parcelas.forEach((p) => {
    html += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${p.numero}ª</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${p.descricao}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoeda(p.valor)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${formatarData(p.data_vencimento)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.forma_pagamento || "-"}</td>
        </tr>
    `;
  });

  const total = parcelas.reduce((acc, p) => acc + p.valor, 0);

  html += `
        <tr style="background-color: #f5f5f5; font-weight: bold;">
          <td colspan="2" style="border: 1px solid #ddd; padding: 8px;">TOTAL</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatarMoeda(total)}</td>
          <td colspan="2" style="border: 1px solid #ddd; padding: 8px;"></td>
        </tr>
      </tbody>
    </table>
  `;

  return html;
}

/* ==================== VALIDAÇÍO ==================== */

/**
 * Valida se todos os dados obrigatórios estÍo preenchidos
 * Aceita array de strings ou array de objetos com campo 'nome'
 */
export function validarDadosContrato(dados: DadosContrato, variaveisObrigatorias: unknown): string[] {
  const erros: string[] = [];

  // Se não há variáveis obrigatórias, retornar sem erros
  if (!variaveisObrigatorias || !Array.isArray(variaveisObrigatorias)) {
    return erros;
  }

  variaveisObrigatorias.forEach((item) => {
    // Extrair o nome da variável (pode ser string ou objeto com 'nome')
    let variavel: string;
    if (typeof item === "string") {
      variavel = item;
    } else if (item && typeof item === "object" && "nome" in item) {
      variavel = String((item as any).nome);
    } else {
      // Item inválido, ignorar
      return;
    }

    // Verificar se tem o formato "categoria.campo"
    if (!variavel.includes(".")) {
      return;
    }

    const [categoria, campo] = variavel.split(".");

    switch (categoria) {
      case "pessoa":
        if (!dados.pessoa) {
          erros.push(`Dados do contratante não informados (${variavel})`);
        } else if (!(dados.pessoa as any)[campo]) {
          erros.push(`Campo obrigatório não preenchido: ${variavel}`);
        }
        break;

      case "empresa":
        if (!dados.empresa) {
          erros.push(`Dados da empresa não informados (${variavel})`);
        } else if (!(dados.empresa as any)[campo]) {
          erros.push(`Campo obrigatório não preenchido: ${variavel}`);
        }
        break;

      case "contrato":
        if (!dados.contrato) {
          erros.push(`Dados do contrato não informados (${variavel})`);
        } else if (!(dados.contrato as any)[campo]) {
          erros.push(`Campo obrigatório não preenchido: ${variavel}`);
        }
        break;
    }
  });

  return erros;
}

/* ==================== BUSCA DE DADOS ==================== */

/**
 * Busca todos os dados necessários para gerar o contrato
 */
export async function buscarDadosContrato(
  contratoId: string,
  empresaId?: string
): Promise<DadosContrato> {
  const resultado: DadosContrato = {
    empresa: null,
    pessoa: null,
    contrato: null,
    parcelas: [],
    memorial: null,
  };

  try {
    // Buscar contrato - usa cliente_id como FK para pessoas
    const { data: contrato } = await supabase
      .from("contratos")
      .select("*, pessoa:cliente_id(*)")
      .eq("id", contratoId)
      .single();

    if (contrato) {
      resultado.contrato = {
        id: contrato.id,
        numero: contrato.numero,
        valor_total: contrato.valor_total,
        valor_mao_obra: contrato.valor_mao_obra,
        valor_materiais: contrato.valor_materiais,
        prazo_entrega_dias: contrato.prazo_entrega_dias,
        prorrogacao_dias: contrato.prorrogacao_dias || 30,
        data_inicio: contrato.data_inicio,
        data_termino: contrato.data_termino,
      };

      if (contrato.pessoa) {
        // A tabela pessoas usa 'cpf' e 'rg', não 'cpf_cnpj'
        // Também pode ter 'cnpj' se for pessoa jurídica
        const p = contrato.pessoa;
        resultado.pessoa = {
          id: p.id,
          nome: p.nome,
          // Prioriza cpf, depois cnpj, depois cpf_cnpj (fallback)
          cpf_cnpj: p.cpf || p.cnpj || p.cpf_cnpj || "",
          rg: p.rg || "",
          email: p.email || "",
          telefone: p.telefone || "",
          logradouro: p.logradouro || "",
          numero: p.numero || "",
          complemento: p.complemento || "",
          bairro: p.bairro || "",
          cidade: p.cidade || "",
          estado: p.estado || "",
          cep: p.cep || "",
          // Tipo pode ser 'tipo' ou 'tipo_pessoa'
          tipo_pessoa: p.tipo_pessoa || (p.tipo === "CLIENTE" ? "fisica" : "fisica"),
          // Endereço da obra
          obra_logradouro: p.obra_logradouro || "",
          obra_numero: p.obra_numero || "",
          obra_complemento: p.obra_complemento || "",
          obra_bairro: p.obra_bairro || "",
          obra_cidade: p.obra_cidade || "",
          obra_estado: p.obra_estado || "",
          obra_cep: p.obra_cep || "",
        };
      }

      // Também buscar dados do cliente direto do contrato (se existirem)
      // O formulário de contrato salva cliente_cpf, cliente_rg, etc.
      const c = contrato as any;
      if (c.cliente_cpf || c.cliente_rg || c.cliente_endereco) {
        if (!resultado.pessoa) {
          resultado.pessoa = {
            id: "",
            nome: c.cliente_nome || "",
            cpf_cnpj: c.cliente_cpf || "",
            rg: c.cliente_rg || "",
            email: c.cliente_email || "",
            telefone: c.cliente_telefone || "",
            logradouro: c.cliente_endereco || "",
            numero: "",
            complemento: "",
            bairro: c.cliente_bairro || "",
            cidade: c.cliente_cidade || "",
            estado: c.cliente_estado || "",
            cep: c.cliente_cep || "",
            tipo_pessoa: "fisica",
            obra_logradouro: "",
            obra_numero: "",
            obra_complemento: "",
            obra_bairro: "",
            obra_cidade: "",
            obra_estado: "",
            obra_cep: "",
          };
        } else {
          // Complementar dados faltantes com dados do contrato
          if (!resultado.pessoa.cpf_cnpj && c.cliente_cpf) {
            resultado.pessoa.cpf_cnpj = c.cliente_cpf;
          }
          if (!resultado.pessoa.rg && c.cliente_rg) {
            resultado.pessoa.rg = c.cliente_rg;
          }
          if (!resultado.pessoa.logradouro && c.cliente_endereco) {
            resultado.pessoa.logradouro = c.cliente_endereco;
          }
          if (!resultado.pessoa.bairro && c.cliente_bairro) {
            resultado.pessoa.bairro = c.cliente_bairro;
          }
          if (!resultado.pessoa.cidade && c.cliente_cidade) {
            resultado.pessoa.cidade = c.cliente_cidade;
          }
          if (!resultado.pessoa.estado && c.cliente_estado) {
            resultado.pessoa.estado = c.cliente_estado;
          }
          if (!resultado.pessoa.cep && c.cliente_cep) {
            resultado.pessoa.cep = c.cliente_cep;
          }
        }
      }
    }

    // Buscar empresa
    if (empresaId) {
      const { data: empresa } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId)
        .single();

      if (empresa) {
        resultado.empresa = {
          id: empresa.id,
          razao_social: empresa.razao_social,
          nome_fantasia: empresa.nome_fantasia,
          cnpj: empresa.cnpj,
          endereco_completo: `${empresa.logradouro || ""}, ${empresa.numero || "S/N"}, ${empresa.bairro || ""}, ${empresa.cidade || ""}/${empresa.estado || ""}, CEP ${empresa.cep || ""}`,
          inscricao_estadual: empresa.inscricao_estadual,
          inscricao_municipal: empresa.inscricao_municipal,
          banco: empresa.banco,
          agencia: empresa.agencia,
          conta: empresa.conta,
          chave_pix: empresa.chave_pix,
        };
      }
    }

    // Buscar parcelas (financeiro)
    const { data: parcelas } = await supabase
      .from("financeiro_lancamentos")
      .select("*")
      .eq("contrato_id", contratoId)
      .eq("tipo", "entrada")
      .order("vencimento");

    if (parcelas) {
      resultado.parcelas = parcelas.map((p, i) => ({
        numero: i + 1,
        descricao: p.descricao,
        valor: p.valor_total,
        data_vencimento: p.vencimento,
        forma_pagamento: p.forma_pagamento,
      }));
    }

    // Buscar memorial executivo
    const { data: memorial } = await supabase
      .from("juridico_memorial_executivo")
      .select("texto_clausula_objeto")
      .eq("contrato_id", contratoId)
      .single();

    if (memorial) {
      resultado.memorial = memorial;
    }
  } catch (error) {
    console.error("Erro ao buscar dados do contrato:", error);
  }

  return resultado;
}

/* ==================== BUSCAR MODELO POR NÚCLEO ==================== */

export type ModeloContratoResumo = {
  id: string;
  codigo: string;
  nome: string;
  nucleo: string;
  versao: number;
  versao_texto: string;
  empresa_id: string | null;
  empresa_nome?: string;
};

/**
 * Busca modelos de contrato publicados para um núcleo específico
 * Normaliza o núcleo para minúsculas para garantir correspondência
 */
export async function buscarModelosPorNucleo(
  nucleo: string
): Promise<ModeloContratoResumo[]> {
  try {
    // Normalizar para minúsculas (banco tem valores em lowercase)
    const nucleoNormalizado = nucleo.toLowerCase();

    const { data, error } = await supabase
      .from("juridico_modelos_contrato")
      .select(`
        id,
        codigo,
        nome,
        nucleo,
        versao,
        versao_texto,
        empresa_id
      `)
      .eq("nucleo", nucleoNormalizado)
      .eq("status", "publicado")
      .eq("ativo", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar modelos:", error);
      return [];
    }

    // Se precisar do nome da empresa, buscar separadamente
    const modelos = (data || []).map((m: any) => ({
      id: m.id,
      codigo: m.codigo,
      nome: m.nome,
      nucleo: m.nucleo,
      versao: m.versao,
      versao_texto: m.versao_texto,
      empresa_id: m.empresa_id,
      empresa_nome: undefined as string | undefined,
    }));

    // Buscar nomes das empresas se houver empresa_id
    const empresaIds = modelos.map(m => m.empresa_id).filter(Boolean);
    if (empresaIds.length > 0) {
      const { data: empresas } = await supabase
        .from("empresas")
        .select("id, nome_fantasia")
        .in("id", empresaIds);

      if (empresas) {
        const empresasMap = new Map(empresas.map((e: any) => [e.id, e.nome_fantasia]));
        modelos.forEach(m => {
          if (m.empresa_id) {
            m.empresa_nome = empresasMap.get(m.empresa_id);
          }
        });
      }
    }

    return modelos;
  } catch (error) {
    console.error("Erro ao buscar modelos por núcleo:", error);
    return [];
  }
}

/**
 * Busca o modelo padrÍo (mais recente) para um núcleo
 */
export async function buscarModeloPadraoPorNucleo(
  nucleo: string
): Promise<ModeloContratoResumo | null> {
  const modelos = await buscarModelosPorNucleo(nucleo);
  return modelos.length > 0 ? modelos[0] : null;
}

/* ==================== GERAÇÍO DE CONTRATO ==================== */

/**
 * Gera o contrato final a partir do modelo e dados
 */
export async function gerarContratoFinal(
  modeloId: string,
  contratoId: string
): Promise<{ sucesso: boolean; html?: string; erros?: string[] }> {
  try {
    // Buscar modelo
    const { data: modelo, error: modeloError } = await supabase
      .from("juridico_modelos_contrato")
      .select("*")
      .eq("id", modeloId)
      .single();

    if (modeloError || !modelo) {
      return { sucesso: false, erros: ["Modelo não encontrado"] };
    }

    if (modelo.status !== "publicado") {
      return { sucesso: false, erros: ["Somente modelos publicados podem ser usados"] };
    }

    // Buscar dados
    const dados = await buscarDadosContrato(contratoId, modelo.empresa_id);

    // Validar campos obrigatórios
    const erros = validarDadosContrato(dados, modelo.variaveis_obrigatorias || []);
    if (erros.length > 0) {
      return { sucesso: false, erros };
    }

    // Processar variáveis
    const html = processarVariaveis(modelo.conteudo_html, dados);

    // Salvar snapshot no contrato
    await supabase
      .from("contratos")
      .update({
        modelo_juridico_id: modeloId,
        versao_modelo: modelo.versao,
        conteudo_gerado: html,
        snapshot_modelo: {
          modelo_id: modelo.id,
          codigo: modelo.codigo,
          nome: modelo.nome,
          versao: modelo.versao,
          data_geracao: new Date().toISOString(),
        },
      })
      .eq("id", contratoId);

    // Registrar auditoria
    await supabase.from("juridico_auditoria").insert([
      {
        entidade: "contratos",
        entidade_id: contratoId,
        acao: "gerar_contrato",
        dados_depois: {
          modelo_id: modeloId,
          versao: modelo.versao,
        },
      },
    ]);

    return { sucesso: true, html };
  } catch (error: any) {
    console.error("Erro ao gerar contrato:", error);
    return { sucesso: false, erros: [error.message] };
  }
}


