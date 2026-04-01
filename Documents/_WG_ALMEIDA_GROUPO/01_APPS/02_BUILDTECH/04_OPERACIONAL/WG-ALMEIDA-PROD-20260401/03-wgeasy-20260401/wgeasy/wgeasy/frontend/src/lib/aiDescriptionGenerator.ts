/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// AI Description Generator - Gerador de Descrições com IA
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type { TipoPricelist } from "@/types/pricelist";

/**
 * Gerar descriçÍo didática para um item do pricelist
 */
export async function gerarDescricaoIA(
  nome: string,
  tipo: TipoPricelist,
  categoria?: string
): Promise<string> {
  // Simular delay de API
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Templates base por tipo
  const templates: Record<TipoPricelist, string> = {
    mao_obra: gerarDescricaoMaoObra(nome, categoria),
    material: gerarDescricaoMaterial(nome, categoria),
    servico: gerarDescricaoServico(nome, categoria),
    produto: gerarDescricaoMaterial(nome, categoria), // Produtos usam mesma lógica de materiais
  };

  return templates[tipo] || `${nome} - Item do tipo ${tipo}`;
}

/**
 * Gerar descriçÍo para MÍo de Obra
 */
function gerarDescricaoMaoObra(nome: string, categoria?: string): string {
  const nomeLower = nome.toLowerCase();

  // Projetos Arquitetônicos
  if (
    nomeLower.includes("projeto") ||
    nomeLower.includes("arquitetônico") ||
    nomeLower.includes("arquitetonico")
  ) {
    return `Serviço profissional de elaboraçÍo de ${nome.toLowerCase()}. Inclui levantamento de necessidades, desenvolvimento de plantas técnicas, especificações e documentaçÍo completa conforme normas técnicas e legislaçÍo vigente.`;
  }

  // Visitas e Vistorias
  if (nomeLower.includes("visita") || nomeLower.includes("vistoria")) {
    return `Serviço de ${nome.toLowerCase()} realizado por profissional habilitado. Inclui deslocamento, análise técnica no local, registro fotográfico, medições necessárias e elaboraçÍo de relatório técnico detalhado.`;
  }

  // Instalações
  if (nomeLower.includes("instalaçÍo") || nomeLower.includes("instalacao")) {
    return `Serviço de ${nome.toLowerCase()} executado por profissional qualificado. Inclui preparaçÍo do local, montagem, testes funcionais e limpeza final. Garantia de execuçÍo conforme especificações técnicas.`;
  }

  // Pinturas
  if (nomeLower.includes("pintura")) {
    return `Serviço de ${nome.toLowerCase()} executado por pintor profissional. Inclui preparaçÍo da superfície (lixamento, correçÍo de imperfeições), aplicaçÍo de primers quando necessário e acabamento final com número adequado de demÍos.`;
  }

  // Alvenaria
  if (
    nomeLower.includes("alvenaria") ||
    nomeLower.includes("pedreiro") ||
    nomeLower.includes("construçÍo") ||
    nomeLower.includes("construcao")
  ) {
    return `MÍo de obra especializada em ${nome.toLowerCase()}. ExecuçÍo de serviços de construçÍo civil incluindo preparo de massas, assentamento, nivelamento, prumo e acabamentos básicos. Profissional com experiência comprovada.`;
  }

  // Elétrica
  if (nomeLower.includes("elétrica") || nomeLower.includes("eletrica") || nomeLower.includes("eletricista")) {
    return `Serviço de ${nome.toLowerCase()} realizado por eletricista certificado. Inclui instalaçÍo de pontos, passagem de fiaçÍo, conexões, testes de continuidade e isolamento. ExecuçÍo conforme NBR 5410.`;
  }

  // Hidráulica
  if (
    nomeLower.includes("hidráulica") ||
    nomeLower.includes("hidraulica") ||
    nomeLower.includes("encanador") ||
    nomeLower.includes("tubulaçÍo") ||
    nomeLower.includes("tubulacao")
  ) {
    return `Serviço de ${nome.toLowerCase()} executado por profissional especializado. Inclui corte, conexÍo, soldagem (quando aplicável), vedaçÍo e testes de pressÍo e estanqueidade. Garantia contra vazamentos.`;
  }

  // Marcenaria
  if (nomeLower.includes("marcenaria") || nomeLower.includes("marceneiro") || nomeLower.includes("móveis") || nomeLower.includes("moveis")) {
    return `Serviço especializado de ${nome.toLowerCase()}. Inclui corte, montagem, acabamento e ajustes finais. ExecuçÍo com ferramentas profissionais e atençÍo aos detalhes de nivelamento e prumo.`;
  }

  // Genérico
  return `MÍo de obra qualificada para ${nome.toLowerCase()}. Serviço executado por profissional com experiência na área, seguindo as melhores práticas e normas técnicas aplicáveis. Inclui ferramentas básicas e limpeza do local.`;
}

/**
 * Gerar descriçÍo para Material
 */
function gerarDescricaoMaterial(nome: string, categoria?: string): string {
  const nomeLower = nome.toLowerCase();

  // Tintas
  if (nomeLower.includes("tinta")) {
    const tipo = nomeLower.includes("acrílica") || nomeLower.includes("acrilica")
      ? "acrílica"
      : nomeLower.includes("látex") || nomeLower.includes("latex")
      ? "látex"
      : nomeLower.includes("esmalte")
      ? "esmalte sintético"
      : "de alta qualidade";

    return `Tinta ${tipo} para aplicaçÍo em superfícies ${nomeLower.includes("parede") ? "de alvenaria" : "diversas"}. Produto de ${nomeLower.includes("premium") || nomeLower.includes("profissional") ? "linha profissional" : "boa qualidade"} com alto poder de cobertura, secagem rápida e acabamento durável. Rendimento médio conforme especificações do fabricante.`;
  }

  // Cimento e Argamassa
  if (nomeLower.includes("cimento") || nomeLower.includes("argamassa")) {
    return `Material para construçÍo civil de qualidade certificada. ${nome} próprio para uso em obras residenciais e comerciais. Armazenar em local seco e protegido. Seguir instruções de preparo e aplicaçÍo do fabricante.`;
  }

  // Blocos e Tijolos
  if (nomeLower.includes("bloco") || nomeLower.includes("tijolo")) {
    return `${nome} para construçÍo de alvenaria. Dimensões padronizadas conforme normas técnicas. Material resistente, com boa capacidade de isolamento térmico e acústico. Verificar integridade antes da aplicaçÍo.`;
  }

  // Tubos e Conexões
  if (
    nomeLower.includes("tubo") ||
    nomeLower.includes("conexÍo") ||
    nomeLower.includes("conexao") ||
    nomeLower.includes("registro")
  ) {
    const material = nomeLower.includes("pvc")
      ? "PVC"
      : nomeLower.includes("cobre")
      ? "cobre"
      : nomeLower.includes("ppr")
      ? "PPR"
      : "material de qualidade";

    return `${nome} fabricado em ${material} para instalações hidrossanitárias. Produto certificado, resistente à pressÍo e corrosÍo. Garantia de estanqueidade quando instalado corretamente. Seguir especificações técnicas do fabricante.`;
  }

  // Materiais Elétricos
  if (
    nomeLower.includes("fio") ||
    nomeLower.includes("cabo") ||
    nomeLower.includes("disjuntor") ||
    nomeLower.includes("tomada") ||
    nomeLower.includes("interruptor")
  ) {
    return `Material elétrico certificado pelo INMETRO. ${nome} adequado para instalações elétricas residenciais e comerciais. Seguir as especificações da NBR 5410. InstalaçÍo deve ser realizada por profissional habilitado.`;
  }

  // Ferragens e Metais
  if (
    nomeLower.includes("ferro") ||
    nomeLower.includes("aço") ||
    nomeLower.includes("aco") ||
    nomeLower.includes("vergalhÍo") ||
    nomeLower.includes("vergalhao")
  ) {
    return `Material metálico de qualidade controlada para construçÍo civil. ${nome} com certificaçÍo de resistência conforme normas técnicas. Armazenar protegido de umidade para evitar oxidaçÍo prematura.`;
  }

  // Pisos e Revestimentos
  if (
    nomeLower.includes("piso") ||
    nomeLower.includes("porcelanato") ||
    nomeLower.includes("cerâmica") ||
    nomeLower.includes("ceramica") ||
    nomeLower.includes("azulejo")
  ) {
    return `Revestimento cerâmico de qualidade para pisos e/ou paredes. ${nome} com acabamento durável e fácil manutençÍo. Verificar classificaçÍo de uso (PEI) e aplicaçÍo recomendada. Requerer assentamento profissional para melhor resultado.`;
  }

  // Madeiras
  if (nomeLower.includes("madeira") || nomeLower.includes("compensado") || nomeLower.includes("mdf")) {
    return `Material em madeira ou derivados para construçÍo e marcenaria. ${nome} com tratamento adequado e dimensões precisas. Armazenar em local seco e ventilado. Verificar qualidade antes da aplicaçÍo.`;
  }

  // Genérico
  return `${nome} - Material de construçÍo de qualidade certificada. Produto selecionado para garantir durabilidade e bom desempenho na aplicaçÍo. Seguir recomendações do fabricante quanto a armazenamento, manuseio e instalaçÍo.`;
}

/**
 * Gerar descriçÍo para Serviço
 */
function gerarDescricaoServico(nome: string, categoria?: string): string {
  const nomeLower = nome.toLowerCase();

  // Consultoria e Assessoria
  if (nomeLower.includes("consultoria") || nomeLower.includes("assessoria")) {
    return `Serviço de ${nome.toLowerCase()} especializado. Atendimento por profissional qualificado com análise detalhada, orientações técnicas e elaboraçÍo de relatório ou parecer quando aplicável. Suporte durante todo o processo.`;
  }

  // Gerenciamento
  if (nomeLower.includes("gerenciamento") || nomeLower.includes("gestÍo") || nomeLower.includes("gestao")) {
    return `${nome} profissional com acompanhamento sistemático. Inclui planejamento, coordenaçÍo de equipes, controle de cronograma e custos, relatórios periódicos e garantia de conformidade com especificações do projeto.`;
  }

  // ManutençÍo
  if (nomeLower.includes("manutençÍo") || nomeLower.includes("manutencao")) {
    return `Serviço de ${nome.toLowerCase()} preventiva e/ou corretiva. ExecuçÍo por equipe técnica qualificada, com diagnóstico preciso, uso de ferramentas apropriadas e teste de funcionamento após intervençÍo.`;
  }

  // Limpeza
  if (nomeLower.includes("limpeza")) {
    return `Serviço profissional de ${nome.toLowerCase()}. ExecuçÍo com produtos adequados, equipamentos de proteçÍo individual e técnicas apropriadas para cada tipo de superfície. Garantia de resultado satisfatório.`;
  }

  // Transporte e Logística
  if (
    nomeLower.includes("transporte") ||
    nomeLower.includes("frete") ||
    nomeLower.includes("entrega") ||
    nomeLower.includes("mobilizaçÍo") ||
    nomeLower.includes("mobilizacao")
  ) {
    return `${nome} com segurança e pontualidade. Serviço realizado com veículo adequado, cuidados no manuseio de materiais e equipamentos. Cobertura de seguro quando aplicável.`;
  }

  // Genérico
  return `${nome} - Serviço profissional executado com qualidade e comprometimento. Atendimento por equipe qualificada, uso de ferramentas e equipamentos adequados. Garantia de satisfaçÍo do cliente.`;
}

/**
 * Validar se o texto gerado é apropriado
 */
export function validarDescricaoGerada(descricao: string): boolean {
  return (
    descricao.length >= 50 &&
    descricao.length <= 1000 &&
    !descricao.includes("undefined") &&
    !descricao.includes("null")
  );
}


