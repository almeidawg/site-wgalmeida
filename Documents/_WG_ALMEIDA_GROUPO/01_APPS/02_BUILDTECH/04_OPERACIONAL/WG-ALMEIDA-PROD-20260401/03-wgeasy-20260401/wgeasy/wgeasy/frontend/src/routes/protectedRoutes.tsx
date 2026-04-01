import { Route, Navigate, useParams } from "react-router-dom";
import {
  // Dashboard
  DashboardPage,
  // Pessoas
  CadastrosPage,
  ClientesPage,
  ClienteFormPage,
  PessoaDetalhePage,
  ColaboradoresPage,
  ColaboradorFormPage,
  FornecedoresPage,
  FornecedorFormPage,
  EspecificadoresPage,
  EspecificadorFormPage,
  ImportarPessoasPage,
  ExportarImportarPessoasPage,
  // Oportunidades
  OportunidadesKanbanPage,
  OportunidadeFormPage,
  NucleoKanbanPage,
  OportunidadesInteligentesDashboard,
  // Análise de Projeto
  AnaliseProjetoListPage,
  AnaliseProjetoEditorPage,
  // EVF
  EVFPage,
  EVFEditorPage,
  // Propostas
  PropostasPage,
  PropostaEmissaoPage,
  PropostaEmissaoPageV2,
  PropostaEmissaoPageV3,
  ClientePropostasPage,
  PropostaContratoTemplateMockupPage,
  PropostaVisualizarPage,
  // Contratos
  ContratosPage,
  ContratosKanbanPage,
  ContratoDetalhePage,
  ContratoFormPage,
  // Financeiro
  FinanceiroDashboardNew,
  DashboardFinanceiroPage,
  FluxoCaixaDetalhadoPage,
  LancamentosPage,
  FinanceiroPessoalPage,
  ObrasFinanceiroPage,
  SolicitacoesPage,
  ComissionamentoPage,
  ReembolsosPage,
  RelatoriosPage,
  CobrancasPage,
  DividasPage,
  CategoriasPage,
  ImportarExtratoPage,
  ImportarExtratoBTGPage,
  ImportarExtratoInteligenteV2Page,
  ConfigFinanceiroPage,
  // Cronograma
  CronogramaDashboardPage,
  CronogramaProjectsPage,
  ProjetoEquipePage,
  CronogramaKanbanPageNew,
  CronogramaTeamsPage,
  CronogramaCatalogPage,
  GraficosPage,
  ProjectDetailPage,
  ProjetosFinanceirosPage,
  CronogramaTimelinePage,
  SuperCronogramaGanttPage,
  // Obras
  ChecklistObraPage,
  PlanejamentoFisicoEconomicoPage,
  DiarioObraDetalhePage,
  // Planejamento / Orçamentos
  PlanejamentoDashboard,
  NovoPedidoPage,
  OrcamentosPageNew,
  AprovacoesPage,
  ComposicoesPage,
  OrcamentoMateriaisPage,
  PedidoMateriaisObraPage,
  PedidoMateriaisObraPage2,
  ConsolidacaoObraPage,
  QuantitativosListPage,
  QuantitativoFormPage,
  QuantitativoEditorPage,
  CalculadoraProjetoPage,
  NovoOrcamentoPage,
  OrcamentoFormPage,
  OrcamentoItensPage,
  OrcamentoDetalhePage,
  ModelosOrcamentoPage,
  ConfiguracaoBDIPage,
  CurvaABCPage,
  ImportarSINAPIPage,
  // Compras
  ComprasPage,
  DashboardComprasPage,
  ComprasKanbanPage,
  PedidoCompraFormPage,
  ComprasDetalhePage,
  ImportarProdutoPage,
  ListaComprasPage,
  ListaComprasV2Page,
  // Serviços
  ServicosPage,
  // Assistência
  AssistenciaPage,
  AssistenciaKanbanPage,
  AssistenciaFormPage,
  AssistenciaDetalhePage,
  // Usuários
  UsuariosPage,
  UsuarioFormPage,
  UsuarioDetalhePage,
  // Jurídico
  JuridicoDashboardPage,
  JuridicoPage,
  ModeloContratoFormPage,
  AssistenciaJuridicaPage,
  FinanceiroJuridicoPage,
  // Sistema
  EmpresasPage,
  ContasBancariasPage,
  CatalogosPage,
  GestaoMoodboardsPage,
  AreaClienteConfigPage,
  AreaClienteCadastroPage,
  AreaClienteDrivePage,
  PrecificacaoPage,
  ChecklistTemplatesPage,
  CadastrosPendentesPage,
  CentralImportExportPage,
  PlantaSistemaPage,
  CentralLinksPage,
  SaudeDoSistemaPage,
  MelhoriasPage,
  BillingPage,
  LizIAPage,
  RelatoriosDashboard,
  WillHubLayout,
  WillHubDashboard,
  WillHubPage,
  TheoPage,
  WillHubAgendaPage,
  WillHubProjetosPage,
  WillHubSonhosPage,
  WillHubHumorPage,
  WillHubNotasPage,
  WillHubMetasPage,
  WillHubHabitosPage,
  WillHubDopaminaPage,
  WillHubSaudePage,
  WillHubTerapiaPage,
  WillHubCursosPage,
  CriacaoChecklistPage,
  // Pricelist
  PricelistPage,
  PricelistItemFormPage,
  ImportarCatalogoIAPage,
  ImportarCatalogoExcelPage,
  ExportarImportarPricelistPage,
  ImportarImagensPage,
  ImportarLotePage,
  GerenciarCategoriasPage,
  AutomacaoSinapiPage,
  PricelistWorkflowPage,
  MemorialAcabamentosPage,
  // Marcenaria
  MarcenariaDashboard,
  MarcenariaContratosPage,
  MarcenariaImportacaoPage,
  MarcenariaProjetosPage,
  MarcenariaExecutivoPage,
  MarcenariaAprovacoesPage,
  MarcenariaFornecedoresPage,
  MarcenariaPedidosPage,
  MarcenariaLogisticaPage,
  MarcenariaMontagemPage,
  MarcenariaAssistenciaPage,
  MarcenariaTermoAceitePage,
  MarcenariaGarantiasPage,
  MarcenariaFinanceiroPage,
  // Portal Cliente / Outros
  AreaClientePage,
  ClienteArquivosPage,
  CronogramaClientePage,
  FinanceiroClientePage,
  PosVendasPage,
  MoodboardClientePage,
  WGExperienceClientesPage,
  DepositoWGPage,
  WgStorePage,
  OnboardingPage,
  TermoAceitePage,
  GarantiaPage,
  LogoutPage,
  UpsellPage,
  // GESTÃO SAAS
  SaaSDashboardPage,
  SaaSLeadsPage,
  SaaSTenantConfigPage,
  SaaSTenantsListPage,
  SaaSLandingPageManager,
  SaaSProductsPage,
  SaaSBillingPage,
  SaaSBuilderPage,
  MasterOnlyRoute,
  // ICCRI
  ICCRIDashboardPage,
  ICCRICategoriasPage,
  ICCRIServicosPage,
  ICCRIComposicoesPage,
  ICCRIPrecosPage,
  ICCRITarefasPage,
  ICCRIFluxosPage,
  // EASY REAL STATE
  EasyRealStateDashboard,
  EasyRealStateMetodologiaPage,
  EasyRealStateEVFPage,
  EasyRealStateDashboardCalculoPage,
} from "./lazyImports";

function RedirectColaboradorDiarioToObra() {
  const { clienteId } = useParams<{ clienteId?: string }>();
  if (clienteId) {
    return <Navigate to={`/colaborador/diariodeobra/${clienteId}`} replace={true} />;
  }
  return <Navigate to="/colaborador/diariodeobra" replace={true} />;
}

/**
 * Rotas protegidas (dentro do MainLayout, com ClienteProtectedRoute).
 * Renderizadas como children do <Route path="/">.
 */
export const protectedRoutes = (
  <>
    <Route index element={<DashboardPage />} />
    <Route path="/dashboard" element={<Navigate to="/" replace />} />
    <Route path="/dashboard/executivo" element={<DashboardPage />} />

    {/* REDIRECTS PARA ROTAS ANTIGAS */}
    <Route path="/projects" element={<Navigate to="/cronograma/projects" replace />} />
    <Route path="/projects/novo" element={<Navigate to="/cronograma/projects" replace />} />

    {/* PESSOAS */}
    <Route path="/pessoas" element={<Navigate to="/pessoas/cadastros" replace />} />
    <Route path="/pessoas/cadastros" element={<CadastrosPage />} />
    <Route path="/pessoas/clientes" element={<ClientesPage />} />
    <Route path="/pessoas/clientes/novo" element={<ClienteFormPage />} />
    <Route path="/pessoas/clientes/editar/:id" element={<ClienteFormPage />} />
    <Route path="/pessoas/clientes/:id" element={<PessoaDetalhePage />} />
    <Route path="/pessoas/colaboradores" element={<ColaboradoresPage />} />
    <Route path="/pessoas/colaboradores/novo" element={<ColaboradorFormPage />} />
    <Route path="/pessoas/colaboradores/editar/:id" element={<ColaboradorFormPage />} />
    <Route path="/pessoas/colaboradores/:id" element={<PessoaDetalhePage />} />
    <Route path="/pessoas/fornecedores" element={<FornecedoresPage />} />
    <Route path="/pessoas/fornecedores/novo" element={<FornecedorFormPage />} />
    <Route path="/pessoas/fornecedores/editar/:id" element={<FornecedorFormPage />} />
    <Route path="/pessoas/fornecedores/:id" element={<PessoaDetalhePage />} />
    <Route path="/pessoas/especificadores" element={<EspecificadoresPage />} />
    <Route path="/pessoas/especificadores/novo" element={<EspecificadorFormPage />} />
    <Route path="/pessoas/especificadores/editar/:id" element={<EspecificadorFormPage />} />
    <Route path="/pessoas/especificadores/:id" element={<PessoaDetalhePage />} />
    <Route path="/pessoas/importar" element={<ImportarPessoasPage />} />
    <Route path="/pessoas/exportar-importar" element={<ExportarImportarPessoasPage />} />

    {/* OPORTUNIDADES */}
    <Route path="/oportunidades" element={<OportunidadesKanbanPage />} />
    <Route path="/oportunidades/novo" element={<OportunidadeFormPage />} />
    <Route path="/oportunidades/editar/:id" element={<OportunidadeFormPage />} />
    <Route path="/oportunidades/kanban/:nucleo" element={<NucleoKanbanPage />} />
    <Route path="/oportunidades/inteligentes" element={<OportunidadesInteligentesDashboard />} />

    {/* NÚCLEOS */}
    <Route path="/arquitetura/kanban" element={<Navigate replace to="/oportunidades/kanban/arquitetura" />} />
    <Route path="/arquitetura" element={<Navigate replace to="/oportunidades/kanban/arquitetura" />} />
    <Route path="/engenharia/kanban" element={<Navigate replace to="/oportunidades/kanban/engenharia" />} />
    <Route path="/engenharia" element={<Navigate replace to="/oportunidades/kanban/engenharia" />} />

    {/* MARCENARIA - MÓDULO COMPLETO */}
    <Route path="/marcenaria" element={<NucleoKanbanPage />} />
    <Route path="/marcenaria/dashboard" element={<MarcenariaDashboard />} />
    <Route path="/marcenaria/contratos" element={<MarcenariaContratosPage />} />
    <Route path="/marcenaria/contratos/novo" element={<MarcenariaContratosPage />} />
    <Route path="/marcenaria/projetos" element={<MarcenariaProjetosPage />} />
    <Route path="/marcenaria/projetos/novo" element={<MarcenariaProjetosPage />} />
    <Route path="/marcenaria/projetos/:id" element={<MarcenariaProjetosPage />} />
    <Route path="/marcenaria/importar" element={<MarcenariaImportacaoPage />} />
    <Route path="/marcenaria/kanban" element={<NucleoKanbanPage />} />
    <Route path="/marcenaria/executivo" element={<MarcenariaExecutivoPage />} />
    <Route path="/marcenaria/projeto-executivo" element={<MarcenariaExecutivoPage />} />
    <Route path="/marcenaria/aprovacoes" element={<MarcenariaAprovacoesPage />} />
    <Route path="/marcenaria/pedidos" element={<MarcenariaPedidosPage />} />
    <Route path="/marcenaria/fornecedores" element={<MarcenariaFornecedoresPage />} />
    <Route path="/marcenaria/logistica" element={<MarcenariaLogisticaPage />} />
    <Route path="/marcenaria/montagem" element={<MarcenariaMontagemPage />} />
    <Route path="/marcenaria/assistencia" element={<MarcenariaAssistenciaPage />} />
    <Route path="/marcenaria/aceite" element={<MarcenariaTermoAceitePage />} />
    <Route path="/marcenaria/garantias" element={<MarcenariaGarantiasPage />} />
    <Route path="/marcenaria/financeiro" element={<MarcenariaFinanceiroPage />} />

    {/* ANÁLISE DE PROJETO */}
    <Route path="/analise-projeto" element={<AnaliseProjetoListPage />} />
    <Route path="/analise-projeto/nova" element={<AnaliseProjetoEditorPage />} />
    <Route path="/analise-projeto/:id" element={<AnaliseProjetoEditorPage />} />

    {/* EVF - ESTUDO DE VIABILIDADE FINANCEIRA */}
    <Route path="/evf" element={<EVFPage />} />
    <Route path="/evf/novo" element={<EVFEditorPage />} />
    <Route path="/evf/:id" element={<EVFEditorPage />} />

    {/* COMERCIAL - Redirects para compatibilidade */}
    <Route path="/comercial/propostas" element={<Navigate replace to="/propostas" />} />

    {/* PROPOSTAS - Versão V3 Nova Estrutura (Cliente + Analise + Nucleos) */}
    <Route path="/propostas" element={<PropostasPage />} />
    <Route path="/propostas/nova" element={<PropostaEmissaoPageV3 />} />
    <Route path="/propostas/template-mockup" element={<PropostaContratoTemplateMockupPage />} />
    <Route path="/propostas/:id/visualizar" element={<PropostaVisualizarPage />} />
    <Route path="/propostas/:id/editar" element={<PropostaEmissaoPageV3 />} />
    <Route path="/propostas/cliente/:clienteId" element={<ClientePropostasPage />} />
    {/* PROPOSTAS V2 - Layout 3 Colunas (compatibilidade) */}
    <Route path="/propostas/v2/nova" element={<PropostaEmissaoPageV2 />} />
    <Route path="/propostas/v2/:id/editar" element={<PropostaEmissaoPageV2 />} />
    {/* PROPOSTAS V1 - Versão antiga (mantida para compatibilidade) */}
    <Route path="/propostas/v1/nova" element={<PropostaEmissaoPage />} />
    <Route path="/propostas/v1/:id/editar" element={<PropostaEmissaoPage />} />

    {/* CONTRATOS */}
    <Route path="/contratos" element={<ContratosKanbanPage />} />
    <Route path="/contratos/lista" element={<ContratosPage />} />
    <Route path="/contratos/novo" element={<ContratoFormPage />} />
    <Route path="/contratos/editar/:id" element={<ContratoFormPage />} />
    <Route path="/contratos/:id" element={<ContratoDetalhePage />} />

    {/* FINANCEIRO */}
    <Route path="/financeiro" element={<FinanceiroDashboardNew />} />
    <Route path="/financeiro/dashboard-avancado" element={<DashboardFinanceiroPage />} />
    <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixaDetalhadoPage />} />
    <Route path="/financeiro/lancamentos" element={<LancamentosPage />} />
    <Route path="/financeiro/obras" element={<ObrasFinanceiroPage />} />
    <Route path="/financeiro/solicitacoes" element={<SolicitacoesPage />} />
    <Route path="/financeiro/comissionamento" element={<ComissionamentoPage />} />
    <Route path="/financeiro/reembolsos" element={<ReembolsosPage />} />
    <Route path="/financeiro/relatorios" element={<RelatoriosPage />} />
    <Route path="/financeiro/cobrancas" element={<CobrancasPage />} />
    <Route path="/financeiro/dividas" element={<DividasPage />} />
    <Route path="/financeiro/categorias" element={<CategoriasPage />} />
    <Route path="/financeiro/importar-extrato" element={<ImportarExtratoPage />} />
    <Route path="/financeiro/importar-btg" element={<ImportarExtratoBTGPage />} />
    <Route path="/financeiro/importar-inteligente" element={<ImportarExtratoInteligenteV2Page />} />
    <Route path="/financeiro/config" element={<ConfigFinanceiroPage />} />
    <Route path="/financeiro/plano-contas" element={<ConfigFinanceiroPage />} />

    {/* MEU FINANCEIRO - Redireciona para WillHub */}
    <Route path="/meu-financeiro" element={<Navigate replace to="/sistema/william-hub/financeiro" />} />

    {/* CRONOGRAMA */}
    <Route path="/cronograma" element={<CronogramaDashboardPage />} />
    <Route path="/cronograma/projects" element={<CronogramaProjectsPage />} />
    <Route path="/cronograma/projects/:id" element={<ProjectDetailPage />} />
    <Route path="/cronograma/projects/:id/equipe" element={<ProjetoEquipePage />} />
    <Route path="/cronograma/teams" element={<CronogramaTeamsPage />} />
    <Route path="/cronograma/catalog" element={<CronogramaCatalogPage />} />
    <Route path="/cronograma/graficos" element={<GraficosPage />} />
    <Route path="/cronograma/kanban" element={<CronogramaKanbanPageNew />} />
    <Route path="/cronograma/financeiro" element={<ProjetosFinanceirosPage />} />
    <Route path="/cronograma/projeto/:id/timeline" element={<CronogramaTimelinePage />} />
    <Route path="/cronograma/projeto/:projetoId/gantt" element={<SuperCronogramaGanttPage />} />

    {/* LISTA DE COMPRAS V2 (por projeto) */}
    <Route path="/projetos/:projetoId/lista-compras" element={<ListaComprasV2Page />} />
    <Route path="/cronograma/projects/:projetoId/lista-compras" element={<ListaComprasV2Page />} />

    {/* OBRAS - CHECKLIST, PLANEJAMENTO E DIARIO */}
    <Route path="/obras/:obraId/checklist" element={<ChecklistObraPage />} />
    <Route path="/obras/:obraId/planejamento" element={<PlanejamentoFisicoEconomicoPage />} />
    <Route path="/obras/diario/:id" element={<DiarioObraDetalhePage />} />

    {/* DIÁRIO DE OBRA - COLABORADOR */}
    <Route path="/colaborador/diario" element={<Navigate to="/colaborador/diariodeobra" replace={true} />} />
    <Route path="/colaborador/diario/:clienteId" element={<RedirectColaboradorDiarioToObra />} />
    <Route path="/cronograma/projects/:obraId/checklist" element={<ChecklistObraPage />} />
    <Route path="/cronograma/projects/:obraId/planejamento" element={<PlanejamentoFisicoEconomicoPage />} />

    {/* PLANEJAMENTO / ORÇAMENTOS */}
    <Route path="/planejamento" element={<PlanejamentoDashboard />} />
    <Route path="/planejamento/novo" element={<NovoPedidoPage />} />
    <Route path="/quantitativos" element={<QuantitativosListPage />} />
    <Route path="/quantitativos/novo" element={<QuantitativoFormPage />} />
    <Route path="/quantitativos/editar/:id" element={<QuantitativoFormPage />} />
    <Route path="/quantitativos/:id/editor" element={<QuantitativoEditorPage />} />
    <Route path="/planejamento/orcamentos" element={<OrcamentosPageNew />} />
    <Route path="/planejamento/orcamentos/modelos" element={<ModelosOrcamentoPage />} />
    <Route path="/planejamento/composicoes" element={<ComposicoesPage />} />
    <Route path="/planejamento/orcamentos/composicoes" element={<ComposicoesPage />} />
    <Route path="/planejamento/orcamentos/materiais" element={<OrcamentoMateriaisPage />} />
    <Route path="/planejamento/pedido-materiais" element={<PedidoMateriaisObraPage />} />
    <Route path="/planejamento/pedido-materiais-2" element={<PedidoMateriaisObraPage2 />} />
    <Route path="/planejamento/consolidacao" element={<ConsolidacaoObraPage />} />
    <Route path="/planejamento/orcamentos/novo" element={<NovoOrcamentoPage />} />
    <Route path="/planejamento/orcamentos/:id" element={<OrcamentoDetalhePage />} />
    <Route path="/planejamento/orcamentos/:id/itens" element={<OrcamentoItensPage />} />
    <Route path="/planejamento/aprovacoes" element={<AprovacoesPage />} />
    {/* aliases/atalhos */}
    <Route path="/orcamentos" element={<OrcamentosPageNew />} />
    <Route path="/orcamentos/calculadora" element={<CalculadoraProjetoPage />} />
    <Route path="/orcamentos/novo" element={<NovoOrcamentoPage />} />
    <Route path="/orcamentos/editar/:id" element={<NovoOrcamentoPage />} />
    <Route path="/orcamentos/:id" element={<OrcamentoDetalhePage />} />
    <Route path="/orcamentos/:id/itens" element={<OrcamentoItensPage />} />
    <Route path="/orcamentos/formulario" element={<OrcamentoFormPage />} />
    <Route path="/orcamentos/formulario/:id" element={<OrcamentoFormPage />} />
    {/* BDI, CURVA ABC E SINAPI */}
    <Route path="/orcamentos/bdi" element={<ConfiguracaoBDIPage />} />
    <Route path="/orcamentos/curva-abc" element={<CurvaABCPage />} />
    <Route path="/orcamentos/sinapi" element={<ImportarSINAPIPage />} />
    <Route path="/planejamento/bdi" element={<ConfiguracaoBDIPage />} />
    <Route path="/planejamento/curva-abc" element={<CurvaABCPage />} />
    <Route path="/planejamento/sinapi" element={<ImportarSINAPIPage />} />

    {/* COMPRAS */}
    <Route path="/compras" element={<ComprasPage />} />
    <Route path="/compras/dashboard" element={<DashboardComprasPage />} />
    <Route path="/compras/kanban" element={<ComprasKanbanPage />} />
    <Route path="/compras/lista" element={<ListaComprasPage />} />
    <Route path="/compras/novo" element={<PedidoCompraFormPage />} />
    <Route path="/compras/editar/:id" element={<PedidoCompraFormPage />} />
    <Route path="/compras/importar" element={<ImportarProdutoPage />} />
    <Route path="/compras/:id" element={<ComprasDetalhePage />} />

    {/* SERVIÇOS */}
    <Route path="/servicos" element={<ServicosPage />} />

    {/* ASSISTÊNCIA */}
    <Route path="/assistencia" element={<AssistenciaPage />} />
    <Route path="/assistencia/kanban" element={<AssistenciaKanbanPage />} />
    <Route path="/assistencia/nova" element={<AssistenciaFormPage />} />
    <Route path="/assistencia/editar/:id" element={<AssistenciaFormPage />} />
    <Route path="/assistencia/:id" element={<AssistenciaDetalhePage />} />

    {/* USUÁRIOS */}
    <Route path="/usuarios" element={<UsuariosPage />} />
    <Route path="/usuarios/novo" element={<UsuarioFormPage />} />
    <Route path="/usuarios/editar/:id" element={<UsuarioFormPage />} />
    <Route path="/usuarios/:id" element={<UsuarioDetalhePage />} />

    {/* JURÍDICO */}
    <Route path="/juridico" element={<JuridicoDashboardPage />} />
    <Route path="/juridico/assistencia" element={<AssistenciaJuridicaPage />} />
    <Route path="/juridico/financeiro" element={<FinanceiroJuridicoPage />} />
    <Route path="/juridico/empresas" element={<EmpresasPage />} />
    <Route path="/juridico/modelos" element={<JuridicoPage />} />
    <Route path="/juridico/novo" element={<ModeloContratoFormPage />} />
    <Route path="/juridico/editar/:id" element={<ModeloContratoFormPage />} />
    <Route path="/juridico/perfil" element={<JuridicoDashboardPage />} />
    <Route path="/juridico/variaveis" element={<JuridicoDashboardPage />} />
    <Route path="/juridico/auditoria" element={<JuridicoDashboardPage />} />

    {/* SISTEMA */}
    <Route path="/empresas" element={<EmpresasPage />} />
    <Route path="/modelos-contrato" element={<Navigate replace to="/juridico/modelos" />} />
    <Route path="/contas-bancarias" element={<ContasBancariasPage />} />
    <Route path="/sistema/area-cliente" element={<AreaClienteConfigPage />} />
    <Route path="/sistema/area-cliente/clientes" element={<AreaClienteCadastroPage />} />
    <Route path="/sistema/area-cliente/drive" element={<AreaClienteDrivePage />} />
    <Route path="/sistema/precificacao" element={<PrecificacaoPage />} />
    <Route path="/sistema/checklists" element={<ChecklistTemplatesPage />} />
    {/* TAREFAS/CHECKLIST INTERNO */}
    <Route path="/criacao-checklist" element={<CriacaoChecklistPage />} />
    <Route path="/checklist" element={<Navigate replace to="/criacao-checklist" />} />
    <Route path="/tarefas" element={<Navigate replace to="/criacao-checklist" />} />
    <Route path="/notas" element={<Navigate replace to="/criacao-checklist" />} />
    <Route path="/keep" element={<Navigate replace to="/criacao-checklist" />} />
    <Route path="/sistema/cadastros-pendentes" element={<CadastrosPendentesPage />} />
    <Route path="/sistema/importar-exportar" element={<CentralImportExportPage />} />
    <Route path="/sistema/financeiro/categorias" element={<Navigate replace to="/financeiro/categorias" />} />
    <Route path="/sistema/planta" element={<PlantaSistemaPage />} />
    <Route path="/sistema/central-links" element={<CentralLinksPage />} />
    <Route path="/sistema/saude" element={<SaudeDoSistemaPage />} />
    <Route path="/sistema/melhorias" element={<MelhoriasPage />} />
    <Route path="/sistema/billing" element={<BillingPage />} />
    <Route path="/liz" element={<LizIAPage />} />
    <Route path="/relatorios" element={<RelatoriosDashboard />} />
    {/* WILLHUB - Hub pessoal com sub-rotas */}
    <Route path="/sistema/william-hub" element={<WillHubLayout />}>
      <Route index element={<WillHubDashboard />} />
      <Route path="financeiro" element={<FinanceiroPessoalPage />} />
      <Route path="agenda" element={<WillHubAgendaPage />} />
      <Route path="projetos" element={<WillHubProjetosPage />} />
      <Route path="theo" element={<TheoPage />} />
      <Route path="metas" element={<WillHubMetasPage />} />
      <Route path="sonhos" element={<WillHubSonhosPage />} />
      <Route path="humor" element={<WillHubHumorPage />} />
      <Route path="notas" element={<WillHubNotasPage />} />
      <Route path="habitos" element={<WillHubHabitosPage />} />
      <Route path="dopamina" element={<WillHubDopaminaPage />} />
      <Route path="saude" element={<WillHubSaudePage />} />
      <Route path="terapia" element={<WillHubTerapiaPage />} />
      <Route path="cursos" element={<WillHubCursosPage />} />
      <Route path="legacy" element={<WillHubPage />} />
    </Route>
    {/* Redirect antigo /sistema/theo para nova rota dentro do WillHub */}
    <Route path="/sistema/theo" element={<Navigate replace to="/sistema/william-hub/theo" />} />
    <Route path="/sistema/catalogos" element={<CatalogosPage />} />
    <Route path="/moodboards/gestao" element={<GestaoMoodboardsPage />} />

    {/* PRICELIST */}
    <Route path="/pricelist" element={<Navigate replace to="/pricelist/categorias" />} />
    <Route path="/pricelist/lista" element={<PricelistPage />} />
    <Route path="/pricelist/novo" element={<PricelistItemFormPage />} />
    <Route path="/pricelist/editar/:id" element={<PricelistItemFormPage />} />
    <Route path="/pricelist/:id" element={<PricelistItemFormPage />} />
    <Route path="/pricelist/categorias" element={<GerenciarCategoriasPage />} />
    <Route path="/pricelist/subcategorias" element={<Navigate replace to="/pricelist/categorias" />} />
    <Route path="/pricelist/gerenciar-categorias" element={<Navigate replace to="/pricelist/categorias" />} />
    <Route path="/pricelist/importar" element={<Navigate replace to="/pricelist/exportar-importar" />} />
    <Route path="/pricelist/importar-catalogo" element={<ImportarCatalogoIAPage />} />
    <Route path="/pricelist/importar-catalogo-excel" element={<ImportarCatalogoExcelPage />} />
    <Route path="/pricelist/importar-imagens" element={<ImportarImagensPage />} />
    <Route path="/pricelist/automacao-sinapi" element={<AutomacaoSinapiPage />} />
    <Route path="/pricelist/importar-lote" element={<ImportarLotePage />} />
    <Route path="/pricelist/exportar-importar" element={<ExportarImportarPricelistPage />} />
    <Route path="/pricelist/workflow" element={<PricelistWorkflowPage />} />

    {/* PORTAL DO CLIENTE - PREVIEW ADMIN (dentro do MainLayout) */}
    <Route path="/portal-cliente" element={<AreaClientePage />} />
    <Route path="/portal-cliente/arquivos" element={<ClienteArquivosPage />} />
    <Route path="/portal-cliente/cronograma" element={<CronogramaClientePage />} />
    <Route path="/portal-cliente/financeiro" element={<FinanceiroClientePage />} />
    <Route path="/portal-cliente/pos-vendas" element={<PosVendasPage />} />
    <Route path="/portal-cliente/moodboard" element={<MoodboardClientePage />} />
    <Route path="/portal-cliente/moodboard/:id" element={<MoodboardClientePage />} />

    {/* OUTROS */}
    <Route path="/wg-experience/clientes" element={<WGExperienceClientesPage />} />
    <Route path="/deposito" element={<DepositoWGPage />} />
    <Route path="/wg-store" element={<WgStorePage />} />
    <Route path="/memorial-acabamentos" element={<MemorialAcabamentosPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/termo-aceite" element={<TermoAceitePage />} />
    <Route path="/garantia" element={<GarantiaPage />} />
    <Route path="/upsell" element={<UpsellPage />} />
    <Route path="/logout" element={<LogoutPage />} />

    {/* GESTÃO SAAS (O Cérebro) */}
    <Route element={<MasterOnlyRoute />}>
      <Route path="/admin-saas" element={<SaaSDashboardPage />} />
      <Route path="/admin-saas/leads" element={<SaaSLeadsPage />} />
      <Route path="/admin-saas/clientes" element={<SaaSTenantsListPage />} />
      <Route path="/admin-saas/clientes/:tenantId" element={<SaaSTenantConfigPage />} />
      <Route path="/admin-saas/produtos" element={<SaaSProductsPage />} />
      <Route path="/admin-saas/landing-pages" element={<SaaSLandingPageManager />} />
      <Route path="/admin-saas/billing" element={<SaaSBillingPage />} />
      <Route path="/admin-saas/builder" element={<SaaSBuilderPage />} />
    </Route>

    {/* EASY REAL STATE — Motor de Inteligência Imobiliária */}
    <Route path="/sistema/iccri" element={<ICCRIDashboardPage />} />
    <Route path="/sistema/iccri/categorias" element={<ICCRICategoriasPage />} />
    <Route path="/sistema/iccri/servicos" element={<ICCRIServicosPage />} />
    <Route path="/sistema/iccri/composicoes" element={<ICCRIComposicoesPage />} />
    <Route path="/sistema/iccri/precos" element={<ICCRIPrecosPage />} />
    <Route path="/sistema/iccri/tarefas" element={<ICCRITarefasPage />} />
    <Route path="/sistema/iccri/fluxos" element={<ICCRIFluxosPage />} />
    <Route path="/sistema/easy-real-state" element={<EasyRealStateDashboard />} />
    <Route path="/sistema/easy-real-state/metodologia" element={<EasyRealStateMetodologiaPage />} />
    <Route path="/sistema/easy-real-state/evf" element={<EasyRealStateEVFPage />} />
    <Route path="/sistema/easy-real-state/dashboard-calculo" element={<EasyRealStateDashboardCalculoPage />} />
  </>
);
