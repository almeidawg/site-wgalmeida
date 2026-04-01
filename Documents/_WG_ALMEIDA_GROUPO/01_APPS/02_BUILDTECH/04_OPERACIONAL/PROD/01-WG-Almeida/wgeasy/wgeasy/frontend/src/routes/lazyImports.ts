import { lazy } from "react";

/* ===================== LAZY IMPORTS - DASHBOARD ===================== */
export const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));

/* ===================== LAZY IMPORTS - PESSOAS ===================== */
export const CadastrosPage = lazy(() => import("@/pages/pessoas/CadastrosPage"));
export const ClientesPage = lazy(() => import("@/pages/pessoas/ClientesPage"));
export const ClienteFormPage = lazy(() => import("@/pages/pessoas/ClienteFormPage"));
export const PessoaDetalhePage = lazy(
  () => import("@/pages/pessoas/PessoaDetalhePage")
);
export const ColaboradoresPage = lazy(
  () => import("@/pages/pessoas/ColaboradoresPage")
);
export const ColaboradorFormPage = lazy(
  () => import("@/pages/pessoas/ColaboradorFormPage")
);
export const FornecedoresPage = lazy(() => import("@/pages/pessoas/FornecedoresPage"));
export const FornecedorFormPage = lazy(
  () => import("@/pages/pessoas/FornecedorFormPage")
);
export const EspecificadoresPage = lazy(
  () => import("@/pages/pessoas/EspecificadoresPage")
);
export const EspecificadorFormPage = lazy(
  () => import("@/pages/pessoas/EspecificadorFormPage")
);
export const ImportarPessoasPage = lazy(
  () => import("@/pages/pessoas/ImportarPessoasPage")
);
export const ExportarImportarPessoasPage = lazy(
  () => import("@/pages/pessoas/ExportarImportarPessoasPage")
);

/* ===================== LAZY IMPORTS - OPORTUNIDADES ===================== */
export const OportunidadesKanbanPage = lazy(
  () => import("@/pages/oportunidades/OportunidadesKanbanPage")
);
export const OportunidadeFormPage = lazy(
  () => import("@/pages/oportunidades/OportunidadeFormPage")
);
export const NucleoKanbanPage = lazy(
  () => import("@/pages/oportunidades/NucleoKanbanPage")
);
export const OportunidadesInteligentesDashboard = lazy(
  () => import("@/pages/oportunidades/OportunidadesInteligentesDashboard")
);

/* ===================== LAZY IMPORTS - ANALISE DE PROJETO ===================== */
export const AnaliseProjetoListPage = lazy(
  () => import("@/pages/analise-projeto/AnaliseProjetoListPage")
);
export const AnaliseProjetoEditorPage = lazy(
  () => import("@/pages/analise-projeto/AnaliseProjetoEditorPage")
);

/* ===================== LAZY IMPORTS - EVF (ESTUDO DE VIABILIDADE FINANCEIRA) ===================== */
export const EVFPage = lazy(() => import("@/pages/evf/EVFPage"));
export const EVFEditorPage = lazy(() => import("@/pages/evf/EVFEditorPage"));
export const EVFPublicPage = lazy(() => import("@/pages/evf/EVFPublicPage"));

/* ===================== LAZY IMPORTS - PROPOSTAS ===================== */
export const PropostasPage = lazy(() => import("@/pages/propostas/PropostasPage"));
export const PropostaEmissaoPage = lazy(() => import("@/pages/PropostaEmissaoPage"));
export const PropostaEmissaoPageV2 = lazy(() =>
  import("@/modules/propostas-v2").then((m) => ({
    default: m.PropostaEmissaoPageV2,
  }))
);
export const PropostaEmissaoPageV3 = lazy(() =>
  import("@/modules/propostas-v2").then((m) => ({
    default: m.PropostaEmissaoPageV3,
  }))
);
export const ClientePropostasPage = lazy(
  () => import("@/pages/propostas/ClientePropostasPage")
);
export const PropostaAcaoClientePage = lazy(
  () => import("@/pages/propostas/PropostaAcaoClientePage")
);
export const PropostaContratoTemplateMockupPage = lazy(
  () => import("@/pages/propostas/PropostaContratoTemplateMockupPage")
);
export const PropostaVisualizarPage = lazy(
  () => import("@/pages/propostas/PropostaVisualizarPage")
);
export const AprovacaoMaterialPage = lazy(
  () => import("@/pages/aprovacao/AprovacaoMaterialPage")
);

/* ===================== LAZY IMPORTS - CONTRATOS ===================== */
export const ContratosPage = lazy(() => import("@/pages/contratos/ContratosPage"));
export const ContratosKanbanPage = lazy(
  () => import("@/pages/contratos/ContratosKanbanPage")
);
export const ContratoDetalhePage = lazy(
  () => import("@/pages/contratos/ContratoDetalhePage")
);
export const ContratoFormPage = lazy(
  () => import("@/pages/contratos/ContratoFormPage")
);

/* ===================== LAZY IMPORTS - PRICELIST ===================== */
export const PricelistPage = lazy(() => import("@/pages/pricelist/PricelistPage"));
export const PricelistItemFormPage = lazy(
  () => import("@/pages/pricelist/PricelistItemFormPage")
);
export const ImportarCatalogoIAPage = lazy(
  () => import("@/pages/pricelist/ImportarCatalogoIAPage")
);
export const ImportarCatalogoExcelPage = lazy(
  () => import("@/pages/pricelist/ImportarCatalogoExcelPage")
);
export const ExportarImportarPricelistPage = lazy(
  () => import("@/pages/pricelist/ExportarImportarPricelistPage")
);
export const ImportarImagensPage = lazy(
  () => import("@/pages/pricelist/ImportarImagensPage")
);
export const ImportarLotePage = lazy(
  () => import("@/pages/pricelist/ImportarLotePage")
);
export const GerenciarCategoriasPage = lazy(
  () => import("@/pages/admin/GerenciarCategoriasPage")
);
export const AutomacaoSinapiPage = lazy(
  () => import("@/pages/pricelist/AutomacaoSinapiPage")
);

export const PricelistWorkflowPage = lazy(
  () => import("@/pages/pricelist/PricelistWorkflowPage")
);

/* ===================== LAZY IMPORTS - MEMORIAL DE ACABAMENTOS ===================== */
export const MemorialAcabamentosPage = lazy(
  () => import("@/pages/MemorialAcabamentosPage")
);

/* ===================== LAZY IMPORTS - COMPRAS ===================== */
export const ComprasPage = lazy(() => import("@/pages/compras/ComprasPage"));
export const DashboardComprasPage = lazy(
  () => import("@/pages/compras/DashboardComprasPage")
);
export const ComprasKanbanPage = lazy(
  () => import("@/pages/compras/ComprasKanbanPage")
);
export const PedidoCompraFormPage = lazy(
  () => import("@/pages/compras/PedidoCompraFormPage")
);
export const ComprasDetalhePage = lazy(
  () => import("@/pages/compras/ComprasDetalhePage")
);
export const ImportarProdutoPage = lazy(
  () => import("@/pages/compras/ImportarProdutoPage")
);
export const ListaComprasPage = lazy(() => import("@/pages/compras/ListaComprasPage"));
export const ListaComprasV2Page = lazy(() =>
  import("@/modules/lista-compras").then((m) => ({
    default: m.ListaComprasPage,
  }))
);

/* ===================== LAZY IMPORTS - ASSISTENCIA ===================== */
export const AssistenciaPage = lazy(
  () => import("@/pages/assistencia/AssistenciaPage")
);
export const AssistenciaKanbanPage = lazy(
  () => import("@/pages/assistencia/AssistenciaKanbanPage")
);
export const AssistenciaFormPage = lazy(
  () => import("@/pages/assistencia/AssistenciaFormPage")
);
export const AssistenciaDetalhePage = lazy(
  () => import("@/pages/assistencia/AssistenciaDetalhePage")
);

/* ===================== LAZY IMPORTS - FINANCEIRO ===================== */
export const FinanceiroDashboardNew = lazy(
  () => import("@/pages/financeiro/FinanceiroDashboardNew")
);
export const DashboardFinanceiroPage = lazy(
  () => import("@/pages/financeiro/DashboardFinanceiroPage")
);
export const FluxoCaixaDetalhadoPage = lazy(
  () => import("@/pages/financeiro/FluxoCaixaDetalhadoPage")
);
export const LancamentosPage = lazy(
  () => import("@/pages/financeiro/LancamentosPage")
);

/* ===================== LAZY IMPORTS - FINANCEIRO PESSOAL ===================== */
export const FinanceiroPessoalPage = lazy(() =>
  import("@/modules/financeiro-pessoal").then((m) => ({
    default: m.FinanceiroPessoalPage,
  }))
);
export const ObrasFinanceiroPage = lazy(
  () => import("@/pages/financeiro/ObrasFinanceiroPage")
);
export const SolicitacoesPage = lazy(
  () => import("@/pages/financeiro/SolicitacoesPage")
);
export const ComissionamentoPage = lazy(
  () => import("@/pages/financeiro/ComissionamentoPage")
);
export const ReembolsosPage = lazy(() => import("@/pages/financeiro/ReembolsosPage"));
export const RelatoriosPage = lazy(() => import("@/pages/financeiro/RelatoriosPage"));
export const CobrancasPage = lazy(() => import("@/pages/financeiro/CobrancasPage"));
export const DividasPage = lazy(() => import("@/pages/financeiro/DividasPage"));
export const CategoriasPage = lazy(() => import("@/pages/financeiro/CategoriasPage"));
export const ImportarExtratoPage = lazy(
  () => import("@/pages/financeiro/ImportarExtratoPage")
);
export const ImportarExtratoBTGPage = lazy(
  () => import("@/pages/financeiro/ImportarExtratoBTGPage")
);
export const ImportarExtratoInteligenteV2Page = lazy(
  () => import("@/pages/financeiro/ImportarExtratoInteligenteV2Page")
);
export const ConfigFinanceiroPage = lazy(
  () => import("@/pages/financeiro/ConfigFinanceiroPage")
);

/* ===================== LAZY IMPORTS - OBRAS ===================== */
export const ChecklistObraPage = lazy(
  () => import("@/pages/obras/ChecklistObraPage")
);
export const PlanejamentoFisicoEconomicoPage = lazy(
  () => import("@/pages/obras/PlanejamentoFisicoEconomicoPage")
);
export const DiarioObraDetalhePage = lazy(
  () => import("@/pages/obras/DiarioObraDetalhePage")
);

/* ===================== LAZY IMPORTS - CRONOGRAMA ===================== */
export const CronogramaDashboardPage = lazy(
  () => import("@/pages/cronograma/CronogramaDashboardPage")
);
export const CronogramaProjectsPage = lazy(
  () => import("@/pages/cronograma/CronogramaProjectsPage")
);
export const ProjetoEquipePage = lazy(
  () => import("@/pages/cronograma/ProjetoEquipePage")
);
export const CronogramaKanbanPageNew = lazy(
  () => import("@/pages/cronograma/CronogramaKanbanPage")
);
export const CronogramaTeamsPage = lazy(
  () => import("@/pages/cronograma/CronogramaTeamsPage")
);
export const CronogramaCatalogPage = lazy(
  () => import("@/pages/cronograma/CronogramaCatalogPage")
);
export const GraficosPage = lazy(() => import("@/pages/cronograma/GraficosPage"));
export const ProjectDetailPage = lazy(
  () => import("@/pages/cronograma/ProjectDetailPage")
);
export const ProjetosFinanceirosPage = lazy(
  () => import("@/pages/cronograma/ProjetosFinanceirosPage")
);
export const CronogramaTimelinePage = lazy(
  () => import("@/pages/cronograma/CronogramaTimelinePage")
);
export const SuperCronogramaGanttPage = lazy(
  () => import("@/pages/cronograma/SuperCronogramaGanttPage")
);

/* ===================== LAZY IMPORTS - PLANEJAMENTO / ORCAMENTOS ===================== */
export const PlanejamentoDashboard = lazy(() => import("@/pages/planejamento/index"));
export const NovoPedidoPage = lazy(
  () => import("@/pages/planejamento/NovoPedidoPage")
);
export const OrcamentosPageNew = lazy(
  () => import("@/pages/planejamento/OrcamentosPage")
);
export const AprovacoesPage = lazy(
  () => import("@/pages/planejamento/AprovacoesPage")
);
export const ComposicoesPage = lazy(
  () => import("@/pages/planejamento/ComposicoesPage")
);
export const OrcamentoMateriaisPage = lazy(
  () => import("@/pages/planejamento/OrcamentoMateriaisPage")
);
export const PedidoMateriaisObraPage = lazy(
  () => import("@/pages/planejamento/PedidoMateriaisObraPage")
);
export const PedidoMateriaisObraPage2 = lazy(
  () => import("@/pages/planejamento/PedidoMateriaisObraPage2")
);
export const ConsolidacaoObraPage = lazy(
  () => import("@/pages/planejamento/ConsolidacaoObraPage")
);
export const QuantitativosListPage = lazy(
  () => import("@/pages/quantitativos/QuantitativosListPage")
);
export const QuantitativoFormPage = lazy(
  () => import("@/pages/quantitativos/QuantitativoFormPage")
);
export const QuantitativoEditorPage = lazy(
  () => import("@/pages/quantitativos/QuantitativoEditorPage")
);
export const CalculadoraProjetoPage = lazy(
  () => import("@/pages/orcamentos/CalculadoraProjetoPage")
);
export const NovoOrcamentoPage = lazy(
  () => import("@/pages/orcamentos/NovoOrcamentoPage")
);
export const OrcamentoFormPage = lazy(
  () => import("@/pages/orcamentos/OrcamentosPage")
);
export const OrcamentoItensPage = lazy(
  () => import("@/pages/orcamentos/OrcamentoItensPage")
);
export const OrcamentoDetalhePage = lazy(
  () => import("@/pages/orcamentos/OrcamentoDetalhePage")
);
export const ModelosOrcamentoPage = lazy(
  () => import("@/pages/orcamentos/ModelosOrcamentoPage")
);
export const ConfiguracaoBDIPage = lazy(
  () => import("@/pages/orcamentos/ConfiguracaoBDIPage")
);
export const CurvaABCPage = lazy(
  () => import("@/pages/orcamentos/CurvaABCPage")
);
export const ImportarSINAPIPage = lazy(
  () => import("@/pages/orcamentos/ImportarSINAPIPage")
);

/* ===================== LAZY IMPORTS - USUARIOS ===================== */
export const UsuariosPage = lazy(() => import("@/pages/usuarios/UsuariosPage"));
export const UsuarioFormPage = lazy(() => import("@/pages/usuarios/UsuarioFormPage"));
export const UsuarioDetalhePage = lazy(
  () => import("@/pages/usuarios/UsuarioDetalhePage")
);

/* ===================== LAZY IMPORTS - SISTEMA ===================== */
export const EmpresasPage = lazy(() => import("@/pages/sistema/EmpresasPage"));
export const ContasBancariasPage = lazy(
  () => import("@/pages/sistema/ContasBancariasPage")
);
export const CatalogosPage = lazy(() => import("@/pages/sistema/CatalogosPage"));
export const GestaoMoodboardsPage = lazy(
  () => import("@/pages/moodboards/GestaoMoodboardsPage")
);
export const AreaClienteConfigPage = lazy(
  () => import("@/pages/sistema/AreaClienteConfigPage")
);
export const AreaClienteCadastroPage = lazy(
  () => import("@/pages/sistema/area-cliente/AreaClienteCadastroPage")
);
export const AreaClienteDrivePage = lazy(
  () => import("@/pages/sistema/area-cliente/AreaClienteDrivePage")
);
export const PrecificacaoPage = lazy(() => import("@/pages/sistema/PrecificacaoPage"));
export const ChecklistTemplatesPage = lazy(
  () => import("@/pages/sistema/ChecklistTemplatesPage")
);
export const CadastrosPendentesPage = lazy(
  () => import("@/pages/sistema/CadastrosPendentesPage")
);
export const CentralImportExportPage = lazy(
  () => import("@/pages/sistema/CentralImportExportPage")
);
export const PlantaSistemaPage = lazy(
  () => import("@/pages/sistema/PlantaSistemaPage")
);
export const CentralLinksPage = lazy(() => import("@/pages/sistema/CentralLinksPage"));
export const SaudeDoSistemaPage = lazy(
  () => import("@/pages/sistema/SaudeDoSistemaPage")
);
export const MelhoriasPage = lazy(
  () => import("@/pages/sistema/MelhoriasPage")
);
export const BillingPage = lazy(
  () => import("@/pages/sistema/BillingPage")
);
export const UpsellPage = lazy(
  () => import("@/pages/sistema/UpsellPage")
);
export const LizIAPage = lazy(
  () => import("@/pages/sistema/LizIAPage")
);

/* ===================== LAZY IMPORTS - GESTÃO SAAS ===================== */
export const SaaSDashboardPage = lazy(() => import("@/pages/admin-saas/SaaSDashboardPage"));
export const SaaSLeadsPage = lazy(() => import("@/pages/admin-saas/SaaSLeadsPage"));
export const SaaSTenantConfigPage = lazy(() => import("@/pages/admin-saas/SaaSTenantConfigPage"));
export const SaaSTenantsListPage = lazy(() => import("@/pages/admin-saas/SaaSTenantsListPage"));
export const SaaSLandingPageManager = lazy(() => import("@/pages/admin-saas/SaaSLandingPageManager"));
export const SaaSProductsPage = lazy(() => import("@/pages/admin-saas/SaaSProductsPage"));
export const SaaSBillingPage = lazy(() => import("@/pages/admin-saas/SaaSBillingPage"));
export const SaaSBuilderPage = lazy(() => import("@/pages/admin-saas/SaaSBuilderPage"));



export const WillHubLayout = lazy(() => import("@/pages/sistema/WillHubLayout"));
export const WillHubDashboard = lazy(() => import("@/pages/sistema/WillHubDashboard"));
export const WillHubPage = lazy(() => import("@/pages/sistema/WillHubPage"));
export const TheoPage = lazy(() => import("@/pages/sistema/TheoPage"));
export const WillHubAgendaPage = lazy(() => import("@/pages/sistema/willhub/AgendaPage"));
export const WillHubProjetosPage = lazy(() => import("@/pages/sistema/willhub/ProjetosPage"));
export const WillHubSonhosPage = lazy(() => import("@/pages/sistema/willhub/SonhosPage"));
export const WillHubHumorPage = lazy(() => import("@/pages/sistema/willhub/HumorPage"));
export const WillHubNotasPage = lazy(() => import("@/pages/sistema/willhub/NotasPage"));
export const WillHubMetasPage = lazy(() => import("@/pages/sistema/willhub/MetasPage"));
export const WillHubHabitosPage = lazy(() => import("@/pages/sistema/willhub/HabitosPage"));
export const WillHubDopaminaPage = lazy(() => import("@/pages/sistema/willhub/DopaminaPage"));
export const WillHubSaudePage = lazy(() => import("@/pages/sistema/willhub/SaudePage"));
export const WillHubTerapiaPage = lazy(() => import("@/pages/sistema/willhub/TerapiaPage"));
export const WillHubCursosPage = lazy(() => import("@/pages/sistema/willhub/CursosPage"));
/* ===================== LAZY IMPORTS - TAREFAS/CHECKLIST ===================== */
export const CriacaoChecklistPage = lazy(
  () => import("@/pages/tarefas/CriacaoChecklistPage")
);
/* ===================== LAZY IMPORTS - JURIDICO ===================== */
export const JuridicoDashboardPage = lazy(
  () => import("@/pages/juridico/JuridicoDashboardPage")
);
export const JuridicoPage = lazy(() => import("@/pages/juridico/JuridicoPage"));
export const ModeloContratoFormPage = lazy(
  () => import("@/pages/juridico/ModeloContratoFormPage")
);
export const AssistenciaJuridicaPage = lazy(
  () => import("@/pages/juridico/AssistenciaJuridicaPage")
);
export const FinanceiroJuridicoPage = lazy(
  () => import("@/pages/juridico/FinanceiroJuridicoPage")
);

/* ===================== LAZY IMPORTS - CLIENTE ===================== */
export const ClienteArquivosPage = lazy(
  () => import("@/pages/cliente/ClienteArquivosPage")
);
export const MoodboardClientePage = lazy(
  () => import("@/pages/cliente/MoodboardClientePage")
);
export const PosVendasPage = lazy(() => import("@/pages/cliente/PosVendasPage"));
export const ConfirmacaoDadosPage = lazy(
  () => import("@/pages/cliente/ConfirmacaoDadosPage")
);
export const CronogramaClientePage = lazy(
  () => import("@/pages/cliente/CronogramaClientePage")
);
export const FinanceiroClientePage = lazy(
  () => import("@/pages/cliente/FinanceiroClientePage")
);
export const TermoAceitePage = lazy(
  () => import("@/pages/termo-aceite/TermoAceitePage")
);
export const GarantiaPage = lazy(() => import("@/pages/garantia/GarantiaPage"));
export const FornecedoresObraPage = lazy(
  () => import("@/pages/cliente/FornecedoresObraPage")
);

/* ===================== LAZY IMPORTS - PUBLICO ===================== */
export const CadastroPublicoPage = lazy(
  () => import("@/pages/cadastro-publico/CadastroPublicoPage")
);
export const SolicitarPropostaPage = lazy(
  () => import("@/pages/publico/SolicitarPropostaPage")
);
export const TurnKeyAltoPadraoPage = lazy(
  () => import("@/pages/publico/TurnKeyAltoPadraoPage")
);
export const ApresentacaoSistemaPage = lazy(
  () => import("@/pages/publico/ApresentacaoSistemaPage")
);
export const LandingPageDinamica = lazy(
  () => import("@/pages/publico/LandingPageDinamica")
);

/* ===================== LAZY IMPORTS - AREA DO COLABORADOR ===================== */
export const ColaboradorLayout = lazy(() => import("@/layout/ColaboradorLayout"));
export const ColaboradorOnlyRoute = lazy(() => import("@/auth/ColaboradorOnlyRoute"));
export const MasterOnlyRoute = lazy(() => import("@/auth/MasterOnlyRoute"));
export const ColaboradorDashboardPage = lazy(
  () => import("@/pages/colaborador/ColaboradorDashboardPage")
);
export const ColaboradorProjetosPage = lazy(
  () => import("@/pages/colaborador/ColaboradorProjetosPage")
);
export const ColaboradorFinanceiroPage = lazy(
  () => import("@/pages/colaborador/ColaboradorFinanceiroPage")
);
export const ColaboradorSolicitacoesPage = lazy(
  () => import("@/pages/colaborador/ColaboradorSolicitacoesPage")
);
export const ColaboradorServicosPage = lazy(
  () => import("@/pages/colaborador/ColaboradorServicosPage")
);
export const ColaboradorMateriaisPage = lazy(
  () => import("@/pages/colaborador/ColaboradorMateriaisPage")
);
export const ColaboradorNotificacoesPage = lazy(
  () => import("@/pages/colaborador/ColaboradorNotificacoesPage")
);
export const ColaboradorDiarioObraPage = lazy(
  () => import("@/pages/colaborador/ColaboradorDiarioObraPage")
);
export const ColaboradorPerfilLazyPage = lazy(
  () => import("@/pages/colaborador/ColaboradorPerfilPage")
);
export const NovaSolicitacaoPage = lazy(
  () => import("@/pages/colaborador/NovaSolicitacaoPage")
);
export const ColaboradorObraDetalhePage = lazy(
  () => import("@/pages/colaborador/ColaboradorObraDetalhePage")
);
export const ColaboradorChecklistPage = lazy(
  () => import("@/pages/colaborador/ColaboradorChecklistPage")
);

/* ===================== LAZY IMPORTS - AREA DO ESPECIFICADOR ===================== */
export const EspecificadorLayout = lazy(() => import("@/layout/EspecificadorLayout"));
export const EspecificadorOnlyRoute = lazy(
  () => import("@/auth/EspecificadorOnlyRoute")
);
export const EspecificadorDashboardPage = lazy(
  () => import("@/pages/especificador/EspecificadorDashboardPage")
);
export const EspecificadorContratosPage = lazy(
  () => import("@/pages/especificador/EspecificadorContratosPage")
);
export const EspecificadorComissoesPage = lazy(
  () => import("@/pages/especificador/EspecificadorComissoesPage")
);
export const EspecificadorPagamentosPage = lazy(
  () => import("@/pages/especificador/EspecificadorPagamentosPage")
);
export const EspecificadorCronogramaPage = lazy(
  () => import("@/pages/especificador/EspecificadorCronogramaPage")
);

/* ===================== LAZY IMPORTS - AREA DO FORNECEDOR ===================== */
export const FornecedorLayout = lazy(() => import("@/layout/FornecedorLayout"));
export const FornecedorOnlyRoute = lazy(() => import("@/auth/FornecedorOnlyRoute"));
export const FornecedorDashboardPage = lazy(
  () => import("@/pages/fornecedor/FornecedorDashboardPage")
);
export const FornecedorCotacoesPage = lazy(
  () => import("@/pages/fornecedor/FornecedorCotacoesPage")
);
export const FornecedorServicosPage = lazy(
  () => import("@/pages/fornecedor/FornecedorServicosPage")
);

/* ===================== LAZY IMPORTS - SERVICOS ===================== */
export const ServicosPage = lazy(() =>
  import("@/modules/servicos").then((m) => ({ default: m.ServicosPage }))
);
export const AceitarServicoPage = lazy(() =>
  import("@/modules/servicos").then((m) => ({ default: m.AceitarServicoPage }))
);

/* ===================== LAZY IMPORTS - MARCENARIA ===================== */
export const MarcenariaDashboard = lazy(
  () => import("@/modules/marcenaria/components/dashboard/MarcenariaDashboard")
);
export const MarcenariaContratosPage = lazy(
  () => import("@/modules/marcenaria/components/contrato/ContratosPage")
);
export const MarcenariaImportacaoPage = lazy(
  () => import("@/modules/marcenaria/components/importacao/ImportacaoPage")
);
export const MarcenariaProjetosPage = lazy(
  () => import("@/modules/marcenaria/components/projetos/ProjetosPage")
);
export const MarcenariaExecutivoPage = lazy(
  () => import("@/modules/marcenaria/components/executivo/ProjetoExecutivoPage")
);
export const MarcenariaAprovacoesPage = lazy(
  () => import("@/modules/marcenaria/components/aprovacoes/AprovacoesPage")
);
export const MarcenariaFornecedoresPage = lazy(
  () => import("@/modules/marcenaria/components/fornecedores/FornecedoresPage")
);
export const MarcenariaPedidosPage = lazy(
  () => import("@/modules/marcenaria/components/pedidos/PedidosPage")
);
export const MarcenariaLogisticaPage = lazy(
  () => import("@/modules/marcenaria/components/logistica/LogisticaPage")
);
export const MarcenariaMontagemPage = lazy(
  () => import("@/modules/marcenaria/components/montagem/MontagemPage")
);
export const MarcenariaAssistenciaPage = lazy(
  () => import("@/modules/marcenaria/components/assistencia/AssistenciaPage")
);
export const MarcenariaTermoAceitePage = lazy(
  () => import("@/modules/marcenaria/components/aceite/TermoAceitePage")
);
export const MarcenariaGarantiasPage = lazy(
  () => import("@/modules/marcenaria/components/garantias/GarantiasPage")
);
export const MarcenariaFinanceiroPage = lazy(
  () => import("@/modules/marcenaria/components/financeiro/FinanceiroPage")
);

/* ===================== LAZY IMPORTS - OUTROS ===================== */
export const WGExperienceClientesPage = lazy(
  () => import("@/pages/wg-experience/WGExperienceClientesPage")
);
export const DepositoWGPage = lazy(() => import("@/pages/DepositoWGPage"));
export const WgStorePage = lazy(() => import("@/pages/WgStorePage"));
// NOTA: Usando versao elegante da area do cliente (pages/cliente/)
export const AreaClientePage = lazy(() => import("@/pages/cliente/AreaClientePage"));
export const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
export const SpotifyCallbackPage = lazy(() => import("@/pages/SpotifyCallbackPage"));
export const LogoutPage = lazy(() => import("@/pages/LogoutPage"));

/* ===================== LAZY IMPORTS - ONBOARDING WIZARD ===================== */
export const OnboardingWizard = lazy(() => import("@/pages/onboarding/OnboardingWizard"));
export const ConvitePage = lazy(() => import("@/pages/onboarding/ConvitePage"));

/* ===================== LAZY IMPORTS - RELATÓRIOS ===================== */
export const RelatoriosDashboard = lazy(() => import("@/pages/relatorios/RelatoriosDashboard"));

/* ===================== LAZY IMPORTS - ICCRI ===================== */
export const ICCRIDashboardPage = lazy(() => import("@/pages/iccri/ICCRIDashboardPage"));
export const ICCRICategoriasPage = lazy(() => import("@/pages/iccri/ICCRICategoriasPage"));
export const ICCRIServicosPage = lazy(() => import("@/pages/iccri/ICCRIServicosPage"));
export const ICCRIComposicoesPage = lazy(() => import("@/pages/iccri/ICCRIComposicoesPage"));
export const ICCRIPrecosPage = lazy(() => import("@/pages/iccri/ICCRIPrecosPage"));
export const ICCRITarefasPage = lazy(() => import("@/pages/iccri/ICCRITarefasPage"));
export const ICCRIFluxosPage = lazy(() => import("@/pages/iccri/ICCRIFluxosPage"));

/* ===================== LAZY IMPORTS - EASY REAL STATE ===================== */
export const EasyRealStateDashboard = lazy(() => import("@/pages/easy-real-state/EasyRealStateDashboard"));
export const EasyRealStateMetodologiaPage = lazy(() => import("@/pages/easy-real-state/EasyRealStateMetodologiaPage"));
export const EasyRealStateEVFPage = lazy(() => import("@/pages/easy-real-state/EasyRealStateEVFPage"));
export const EasyRealStateDashboardCalculoPage = lazy(() => import("@/pages/easy-real-state/EasyRealStateDashboardCalculoPage"));

/* ===================== LAZY IMPORTS - TENANT PORTAL ===================== */
export const TenantPortalPage = lazy(() => import("@/pages/tenant-portal/TenantPortalPage"));
