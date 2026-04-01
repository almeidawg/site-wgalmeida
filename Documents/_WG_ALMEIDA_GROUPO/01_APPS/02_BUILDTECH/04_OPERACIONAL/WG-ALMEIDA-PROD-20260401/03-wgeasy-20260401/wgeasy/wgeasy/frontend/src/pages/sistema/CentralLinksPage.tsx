/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/sistema/CentralLinksPage.tsx
// Central de Links - Gerenciar links de cadastro e serviços

import { useState, useEffect, type ReactNode, type MouseEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Plus,
  Copy,
  Send,
  Mail,
  ExternalLink,
  Users,
  CheckCircle,
  Loader2,
  UserPlus,
  Briefcase,
  Building2,
  Wrench,
  Palette,
  Headphones,
  ShoppingBag,
  HardHat,
  Camera,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Settings,
  Pencil,
  RotateCcw,
  Search,
  MapPin,
  Phone,
  FileText,
  Home,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import {
  criarLinkCadastro,
  gerarUrlWhatsApp,
  getLabelTipoCadastro,
  type TipoCadastro,
} from "@/lib/cadastroLinkApi";
import { supabase } from "@/lib/supabaseClient";
import LinksAtivosPanel from "@/components/cadastro-link/LinksAtivosPanel";
import { listarCategorias } from "@/modules/servicos/services/servicosApi";
import type { ServicoCategoria } from "@/modules/servicos/types";
import { cn } from "@/lib/utils";

// URL base do sistema em produçÍo
const PRODUCTION_URL = "https://easy.wgalmeida.com.br";

// FunçÍo para obter a URL base correta
function getBaseUrl(): string {
  if (import.meta.env.PROD) {
    return PRODUCTION_URL;
  }
  return window.location.origin;
}

interface LinkConfig {
  id: string;
  label: string;
  descricao: string;
  icone: ReactNode;
  cor: string;
  tipoCadastro: TipoCadastro;
  subtipo?: string;
  temVideo?: boolean;
  temFoto?: boolean;
  temServicoSolicitado?: boolean;
}

interface CategoriaConfig {
  titulo: string;
  descricao: string;
  icone: ReactNode;
  cor: string;
  links: LinkConfig[];
}

// ConfiguraçÍo das categorias e tipos de links
const CATEGORIAS_LINKS: Record<string, CategoriaConfig> = {
  clientes: {
    titulo: "Clientes",
    descricao: "Links para cadastro e solicitaçÍo de serviços de clientes",
    icone: <Users className="w-5 h-5" />,
    cor: "blue",
    links: [
      {
        id: "cliente_cadastro",
        label: "Cadastro",
        descricao: "Link para cadastro simples de cliente",
        icone: <UserPlus className="w-4 h-4" />,
        cor: "blue",
        tipoCadastro: "CLIENTE" as TipoCadastro,
      },
      {
        id: "cliente_cadastro_servico",
        label: "Cadastro com SolicitaçÍo de Serviço",
        descricao: "Cadastro + vídeo de abertura + solicitaçÍo de serviço com mídia",
        icone: <ClipboardList className="w-4 h-4" />,
        cor: "indigo",
        tipoCadastro: "CLIENTE" as TipoCadastro,
        subtipo: "SOLICITACAO_SERVICO",
        temVideo: true,
        temFoto: true,
        temServicoSolicitado: true,
      },
    ],
  },
  colaboradores: {
    titulo: "Colaboradores",
    descricao: "Links para cadastro de colaboradores por área",
    icone: <Briefcase className="w-5 h-5" />,
    cor: "green",
    links: [
      {
        id: "colaborador_atendimento",
        label: "Atendimento",
        descricao: "Colaboradores da área de atendimento ao cliente",
        icone: <Headphones className="w-4 h-4" />,
        cor: "green",
        tipoCadastro: "COLABORADOR" as TipoCadastro,
        subtipo: "ATENDIMENTO",
      },
      {
        id: "colaborador_comercial",
        label: "Comercial",
        descricao: "Colaboradores da área comercial/vendas",
        icone: <ShoppingBag className="w-4 h-4" />,
        cor: "emerald",
        tipoCadastro: "COLABORADOR" as TipoCadastro,
        subtipo: "COMERCIAL",
      },
      {
        id: "colaborador_operacional",
        label: "Operacional",
        descricao: "Colaboradores da área operacional/obras",
        icone: <HardHat className="w-4 h-4" />,
        cor: "teal",
        tipoCadastro: "COLABORADOR" as TipoCadastro,
        subtipo: "OPERACIONAL",
      },
    ],
  },
  especificadores: {
    titulo: "Especificadores",
    descricao: "Links para cadastro de especificadores/arquitetos",
    icone: <Palette className="w-5 h-5" />,
    cor: "purple",
    links: [
      {
        id: "especificador_cadastro",
        label: "Cadastro",
        descricao: "Cadastro de especificador com tabela de comissionamento",
        icone: <UserPlus className="w-4 h-4" />,
        cor: "purple",
        tipoCadastro: "ESPECIFICADOR" as TipoCadastro,
      },
    ],
  },
  fornecedores: {
    titulo: "Fornecedores",
    descricao: "Links para cadastro de fornecedores",
    icone: <Building2 className="w-5 h-5" />,
    cor: "amber",
    links: [
      {
        id: "fornecedor_comercial",
        label: "Comercial",
        descricao: "Cadastro de fornecedor para área comercial",
        icone: <ShoppingBag className="w-4 h-4" />,
        cor: "amber",
        tipoCadastro: "FORNECEDOR" as TipoCadastro,
        subtipo: "COMERCIAL",
      },
    ],
  },
  servicos: {
    titulo: "Serviços",
    descricao: "Links para solicitaçÍo de serviços específicos",
    icone: <Wrench className="w-5 h-5" />,
    cor: "orange",
    links: [], // Será preenchido dinamicamente com as categorias de serviço
  },
};

export default function CentralLinksPage() {
  const { toast } = useToast();
  const { usuario } = useUsuarioLogado();

  // Estados
  const [categoriasServico, setCategoriasServico] = useState<ServicoCategoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>(["clientes"]);

  // Modal de criaçÍo de link
  const [modalAberto, setModalAberto] = useState(false);
  const [linkSelecionado, setLinkSelecionado] = useState<LinkConfig | null>(null);
  const [criandoLink, setCriandoLink] = useState(false);

  // Opções do link
  const [expiraDias, setExpiraDias] = useState(7);
  const [reutilizavel, setReutilizavel] = useState(false);
  const [usoMaximo, setUsoMaximo] = useState<number | null>(null);
  const [tituloPagina, setTituloPagina] = useState("");
  const [descricaoServico, setDescricaoServico] = useState("");
  const [mensagemLink, setMensagemLink] = useState(""); // Mensagem personalizável para o link

  // Link gerado
  const [linkGerado, setLinkGerado] = useState<{
    url: string;
    token: string;
    tipo: string;
  } | null>(null);

  // Modal de ediçÍo de mensagem padrÍo
  const [modalMensagemAberto, setModalMensagemAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null);

  // Templates de mensagem personalizados (armazenados em localStorage)
  const [templatesPersonalizados, setTemplatesPersonalizados] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("wgeasy_templates_mensagem");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [mensagemEditando, setMensagemEditando] = useState("");

  // Estados para envio de dados do cliente
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesBusca, setClientesBusca] = useState<any[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);
  const [enderecosCliente, setEnderecosCliente] = useState<any[]>([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(false);
  const [modalEnviarDadosAberto, setModalEnviarDadosAberto] = useState(false);
  const [tipoEnvio, setTipoEnvio] = useState<"ficha" | "endereco" | "completo">("ficha");

  // Templates locais para envio de dados de clientes via link (distinto do sistema central em mensagemTemplates.ts)
  const LINK_LINK_TEMPLATES_PADRAO: Record<string, string> = {
    CLIENTE: `Olá!

Você foi convidado a se cadastrar como *Cliente* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
    COLABORADOR: `Olá!

Você foi convidado a se cadastrar como *Colaborador* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
    FORNECEDOR: `Olá!

Você foi convidado a se cadastrar como *Fornecedor* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
    ESPECIFICADOR: `Olá!

Você foi convidado a se cadastrar como *Especificador* no sistema WGEasy do Grupo WG Almeida.

Clique no link abaixo para preencher seu cadastro:
{{LINK}}

Este link expira em 7 dias.

Após o preenchimento, sua solicitaçÍo será analisada e você receberá as credenciais de acesso.`,
    SERVICO: `Olá!

Você recebeu uma solicitaçÍo de serviço de *{{NOME_SERVICO}}* do Grupo WG Almeida.

Clique no link abaixo para visualizar os detalhes e aceitar o serviço:
{{LINK}}

Este link expira em 7 dias.

Após aceitar, entraremos em contato para alinhar os próximos passos.`,
    FICHA_CADASTRAL: `*Ficha Cadastral - {{NOME_CLIENTE}}*

📋 *Dados do Cliente:*
Nome: {{NOME_CLIENTE}}
CPF/CNPJ: {{DOCUMENTO}}
Telefone: {{TELEFONE}}
Email: {{EMAIL}}

Atenciosamente,
Grupo WG Almeida`,
    ENDERECO_OBRA: `*Endereço de Obra - {{NOME_CLIENTE}}*

📍 *Local da Obra:*
{{ENDERECO_COMPLETO}}

{{OBSERVACOES}}

Atenciosamente,
Grupo WG Almeida`,
    DADOS_COMPLETOS: `*Dados Completos - {{NOME_CLIENTE}}*

📋 *Dados do Cliente:*
Nome: {{NOME_CLIENTE}}
CPF/CNPJ: {{DOCUMENTO}}
Telefone: {{TELEFONE}}
Email: {{EMAIL}}

📍 *Endereços de Obra:*
{{LISTA_ENDERECOS}}

Atenciosamente,
Grupo WG Almeida`,
  };

  // FunçÍo para obter template (personalizado ou padrÍo)
  function getTemplate(tipo: string): string {
    return templatesPersonalizados[tipo] || LINK_TEMPLATES_PADRAO[tipo] || LINK_TEMPLATES_PADRAO.CLIENTE;
  }

  // FunçÍo para salvar template personalizado
  function salvarTemplate(tipo: string, template: string) {
    const novosTemplates = { ...templatesPersonalizados, [tipo]: template };
    setTemplatesPersonalizados(novosTemplates);
    localStorage.setItem("wgeasy_templates_mensagem", JSON.stringify(novosTemplates));
    toast({
      title: "Template salvo!",
      description: "A mensagem padrÍo foi atualizada com sucesso.",
    });
  }

  // FunçÍo para restaurar template padrÍo
  function restaurarTemplatePadrao(tipo: string) {
    const novosTemplates = { ...templatesPersonalizados };
    delete novosTemplates[tipo];
    setTemplatesPersonalizados(novosTemplates);
    localStorage.setItem("wgeasy_templates_mensagem", JSON.stringify(novosTemplates));
    setMensagemEditando(LINK_TEMPLATES_PADRAO[tipo] || "");
    toast({
      title: "Template restaurado!",
      description: "A mensagem padrÍo foi restaurada.",
    });
  }

  // Abrir modal de ediçÍo de mensagem
  function handleAbrirModalMensagem(categoriaKey: string, e: MouseEvent) {
    e.stopPropagation();
    const tipoMap: Record<string, string> = {
      clientes: "CLIENTE",
      colaboradores: "COLABORADOR",
      fornecedores: "FORNECEDOR",
      especificadores: "ESPECIFICADOR",
      servicos: "SERVICO",
    };
    const tipo = tipoMap[categoriaKey] || "CLIENTE";
    setCategoriaEditando(tipo);
    setMensagemEditando(getTemplate(tipo));
    setModalMensagemAberto(true);
  }

  // Buscar clientes
  async function buscarClientes(termo: string) {
    if (!termo || termo.length < 2) {
      setClientesBusca([]);
      return;
    }
    try {
      setBuscandoClientes(true);
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, razao_social, cpf_cnpj, telefone, email, tipo")
        .or(`nome.ilike.%${termo}%,razao_social.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%`)
        .in("tipo", ["CLIENTE", "LEAD"])
        .limit(10);

      if (error) throw error;
      setClientesBusca(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setBuscandoClientes(false);
    }
  }

  // Carregar endereços do cliente
  async function carregarEnderecosCliente(clienteId: string) {
    try {
      setCarregandoEnderecos(true);
      const { data, error } = await supabase
        .from("enderecos_obra")
        .select("*")
        .eq("pessoa_id", clienteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEnderecosCliente(data || []);
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
      setEnderecosCliente([]);
    } finally {
      setCarregandoEnderecos(false);
    }
  }

  // Selecionar cliente
  function handleSelecionarCliente(cliente: any) {
    setClienteSelecionado(cliente);
    setClientesBusca([]);
    setBuscaCliente("");
    carregarEnderecosCliente(cliente.id);
  }

  // Gerar mensagem com dados do cliente
  function gerarMensagemDados(tipo: "ficha" | "endereco" | "completo", enderecoSelecionado?: any): string {
    if (!clienteSelecionado) return "";

    const templateKey = tipo === "ficha" ? "FICHA_CADASTRAL" : tipo === "endereco" ? "ENDERECO_OBRA" : "DADOS_COMPLETOS";
    let template = getTemplate(templateKey);

    // Substituir dados do cliente
    const nomeCliente = clienteSelecionado.nome || clienteSelecionado.razao_social || "Cliente";
    template = template.replace(/\{\{NOME_CLIENTE\}\}/g, nomeCliente);
    template = template.replace(/\{\{DOCUMENTO\}\}/g, clienteSelecionado.cpf_cnpj || "NÍo informado");
    template = template.replace(/\{\{TELEFONE\}\}/g, clienteSelecionado.telefone || "NÍo informado");
    template = template.replace(/\{\{EMAIL\}\}/g, clienteSelecionado.email || "NÍo informado");

    // Substituir endereço
    if (enderecoSelecionado) {
      const endCompleto = [
        enderecoSelecionado.logradouro,
        enderecoSelecionado.numero,
        enderecoSelecionado.complemento,
        enderecoSelecionado.bairro,
        enderecoSelecionado.cidade,
        enderecoSelecionado.estado,
        enderecoSelecionado.cep ? `CEP: ${enderecoSelecionado.cep}` : ""
      ].filter(Boolean).join(", ");
      template = template.replace(/\{\{ENDERECO_COMPLETO\}\}/g, endCompleto || "NÍo informado");
      template = template.replace(/\{\{OBSERVACOES\}\}/g, enderecoSelecionado.observacoes ? `📝 Obs: ${enderecoSelecionado.observacoes}` : "");
    }

    // Lista de endereços para dados completos
    if (tipo === "completo" && enderecosCliente.length > 0) {
      const listaEnd = enderecosCliente.map((end, i) => {
        const endCompleto = [
          end.logradouro,
          end.numero,
          end.complemento,
          end.bairro,
          end.cidade,
          end.estado,
          end.cep ? `CEP: ${end.cep}` : ""
        ].filter(Boolean).join(", ");
        return `${i + 1}. ${end.apelido || "Obra"}: ${endCompleto}`;
      }).join("\n");
      template = template.replace(/\{\{LISTA_ENDERECOS\}\}/g, listaEnd);
    } else {
      template = template.replace(/\{\{LISTA_ENDERECOS\}\}/g, "Nenhum endereço cadastrado");
    }

    return template;
  }

  // Copiar mensagem
  function handleCopiarMensagem(mensagem: string) {
    navigator.clipboard.writeText(mensagem);
    toast({
      title: "Copiado!",
      description: "Mensagem copiada para a área de transferência.",
    });
  }

  // Enviar por WhatsApp
  function handleEnviarWhatsApp(mensagem: string, telefone?: string) {
    const url = telefone
      ? `https://wa.me/55${telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  }

  // Carregar categorias de serviço
  useEffect(() => {
    async function carregarCategoriasServico() {
      try {
        setLoadingCategorias(true);
        const categorias = await listarCategorias();
        setCategoriasServico(categorias);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setLoadingCategorias(false);
      }
    }
    carregarCategoriasServico();
  }, []);

  // Toggle seçÍo expandida
  function toggleSection(key: string) {
    setExpandedSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // Abrir modal para criar link
  function handleAbrirModal(linkConfig: LinkConfig) {
    setLinkSelecionado(linkConfig);
    setModalAberto(true);
    // Reset estados
    setExpiraDias(7);
    setReutilizavel(false);
    setUsoMaximo(null);
    setTituloPagina("");
    setDescricaoServico("");
    setLinkGerado(null);
    // Carregar template da mensagem
    const tipoTemplate = linkConfig.subtipo?.startsWith("SERVICO_") ? "SERVICO" : linkConfig.tipoCadastro;
    setMensagemLink(getTemplate(tipoTemplate));
  }

  // Criar link de cadastro
  async function handleCriarLink() {
    if (!usuario || !linkSelecionado) return;

    try {
      setCriandoLink(true);

      // Montar título personalizado baseado no tipo
      let titulo = tituloPagina;
      if (!titulo) {
        titulo = `Cadastro de ${getLabelTipoCadastro(linkSelecionado.tipoCadastro)}`;
        if (linkSelecionado.subtipo && !linkSelecionado.subtipo.startsWith("SERVICO_")) {
          titulo += ` - ${linkSelecionado.label}`;
        }
      }

      // Criar link via API
      const resultado = await criarLinkCadastro({
        tipo: linkSelecionado.tipoCadastro,
        nucleoId: usuario.nucleo_id || undefined,
        reutilizavel,
        usoMaximo: reutilizavel ? usoMaximo : null,
        expiraDias,
        tituloPagina: titulo,
        descricaoLink: linkSelecionado.temServicoSolicitado ? descricaoServico : undefined,
      });

      setLinkGerado({
        url: resultado.url,
        token: resultado.token,
        tipo: linkSelecionado.label,
      });

      toast({
        title: "Link criado com sucesso!",
        description: "O link está pronto para ser compartilhado.",
      });
    } catch (error: any) {
      console.error("Erro ao criar link:", error);
      toast({
        title: "Erro ao criar link",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setCriandoLink(false);
    }
  }

  // Criar link de serviço
  async function handleCriarLinkServico(categoria: ServicoCategoria) {
    if (!usuario) return;

    try {
      setCriandoLink(true);

      // Criar solicitaçÍo de serviço com link
      const { data, error } = await supabase
        .from("solicitacoes_servico")
        .insert({
          tipo_vinculo: "avulso",
          categoria_id: categoria.id,
          titulo: tituloPagina || `SolicitaçÍo de ${categoria.nome}`,
          descricao: descricaoServico || null,
          valor_servico: 0,
          status: "criado",
          criado_por: usuario.id,
          link_expira_em: new Date(Date.now() + expiraDias * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select("id, token_aceite")
        .single();

      if (error) throw error;

      const url = `${getBaseUrl()}/servico/aceitar/${data.token_aceite}`;

      setLinkGerado({
        url,
        token: data.token_aceite,
        tipo: `Serviço: ${categoria.nome}`,
      });

      toast({
        title: "Link de serviço criado!",
        description: "O link para solicitaçÍo de serviço está pronto.",
      });
    } catch (error: any) {
      console.error("Erro ao criar link de serviço:", error);
      toast({
        title: "Erro ao criar link",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setCriandoLink(false);
    }
  }

  // Copiar link
  function handleCopiarLink(url: string) {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  }

  // Compartilhar WhatsApp
  function handleCompartilharWhatsApp() {
    if (!linkGerado || !linkSelecionado) return;

    // Usar a mensagem editada pelo usuário
    const urlProd = linkGerado.url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);
    let mensagem = mensagemLink.replace(/\{\{LINK\}\}/g, urlProd);

    // Se for serviço, substituir nome do serviço
    const isServico = linkSelecionado.subtipo?.startsWith("SERVICO_");
    if (isServico) {
      mensagem = mensagem.replace(/\{\{NOME_SERVICO\}\}/g, linkSelecionado.label);
    }

    const whatsappUrl = gerarUrlWhatsApp(mensagem);
    window.open(whatsappUrl, "_blank");
  }

  // Compartilhar Email
  function handleCompartilharEmail() {
    if (!linkGerado || !linkSelecionado) return;

    // Usar a mensagem editada pelo usuário
    const urlProd = linkGerado.url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);
    let body = mensagemLink.replace(/\{\{LINK\}\}/g, urlProd);

    // Se for serviço, substituir nome do serviço
    const isServico = linkSelecionado.subtipo?.startsWith("SERVICO_");
    if (isServico) {
      body = body.replace(/\{\{NOME_SERVICO\}\}/g, linkSelecionado.label);
    }

    // Remover asteriscos do markdown (nÍo formatam em email)
    body = body.replace(/\*/g, "");

    // Definir assunto baseado no tipo
    let assunto: string;
    if (isServico) {
      assunto = `SolicitaçÍo de Serviço: ${linkSelecionado.label} - WG Almeida`;
    } else {
      assunto = `Convite para Cadastro - WG Almeida`;
    }

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }

  // Classes de cores
  const corClasses: Record<string, { card: string; icon: string; header: string; border: string }> = {
    blue: {
      card: "border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      header: "text-blue-700",
      border: "border-blue-300",
    },
    indigo: {
      card: "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-50",
      icon: "bg-indigo-100 text-indigo-600",
      header: "text-indigo-700",
      border: "border-indigo-300",
    },
    green: {
      card: "border-green-200 bg-green-50/50 hover:border-green-300 hover:bg-green-50",
      icon: "bg-green-100 text-green-600",
      header: "text-green-700",
      border: "border-green-300",
    },
    emerald: {
      card: "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      header: "text-emerald-700",
      border: "border-emerald-300",
    },
    teal: {
      card: "border-teal-200 bg-teal-50/50 hover:border-teal-300 hover:bg-teal-50",
      icon: "bg-teal-100 text-teal-600",
      header: "text-teal-700",
      border: "border-teal-300",
    },
    purple: {
      card: "border-purple-200 bg-purple-50/50 hover:border-purple-300 hover:bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
      header: "text-purple-700",
      border: "border-purple-300",
    },
    amber: {
      card: "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      header: "text-amber-700",
      border: "border-amber-300",
    },
    orange: {
      card: "border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50",
      icon: "bg-orange-100 text-orange-600",
      header: "text-orange-700",
      border: "border-orange-300",
    },
  };

  // Renderizar card de link
  function renderLinkCard(link: LinkConfig) {
    const colors = corClasses[link.cor] || corClasses.blue;

    return (
      <div
        key={link.id}
        className={cn(
          "p-4 rounded-lg border-2 cursor-pointer transition-all",
          colors.card
        )}
        onClick={() => handleAbrirModal(link)}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", colors.icon)}>
            {link.icone}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[13px] font-normal text-gray-900">{link.label}</h4>
              {link.temVideo && (
                <Badge variant="outline" className="text-[12px] gap-1">
                  <Camera className="w-3 h-3" />
                  Vídeo
                </Badge>
              )}
              {link.temFoto && (
                <Badge variant="outline" className="text-[12px] gap-1">
                  <Camera className="w-3 h-3" />
                  Foto
                </Badge>
              )}
            </div>
            <p className="text-[12px] text-gray-500 mt-1">{link.descricao}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  // Renderizar seçÍo de categoria
  function renderCategoriaSection(key: string, config: CategoriaConfig) {
    const colors = corClasses[config.cor] || corClasses.blue;
    const isExpanded = expandedSections.includes(key);
    const itemCount = key === "servicos" ? categoriasServico.length : config.links.length;

    return (
      <div key={key} className={cn("border-2 rounded-lg overflow-hidden transition-all", colors.border)}>
        {/* Header */}
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-3 p-4 text-left transition-colors",
            isExpanded ? "bg-white" : "bg-gray-50/50 hover:bg-white"
          )}
          onClick={() => toggleSection(key)}
        >
          <div className={cn("p-2 rounded-lg", colors.icon)}>
            {config.icone}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-[13px] font-normal", colors.header)}>
              {config.titulo}
            </h3>
            <p className="text-[12px] text-gray-500">{config.descricao}</p>
          </div>
          <Badge variant="secondary">
            {itemCount} {itemCount !== 1 ? "tipos" : "tipo"}
          </Badge>
          <button
            type="button"
            onClick={(e) => handleAbrirModalMensagem(key, e)}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            title="Editar mensagem padrÍo"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 pt-0 border-t">
            {key === "servicos" ? (
              // Categorias de serviço dinâmicas
              loadingCategorias ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  <span className="ml-2 text-gray-500">Carregando categorias...</span>
                </div>
              ) : categoriasServico.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma categoria de serviço cadastrada</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => window.open("/sistema/servicos", "_blank")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Serviços
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                  {categoriasServico.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50/50 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all"
                      onClick={() => {
                        setLinkSelecionado({
                          id: `servico_${cat.id}`,
                          label: cat.nome,
                          descricao: cat.descricao || `SolicitaçÍo de ${cat.nome}`,
                          icone: <Wrench className="w-4 h-4" />,
                          cor: "orange",
                          tipoCadastro: "CLIENTE",
                          subtipo: `SERVICO_${cat.codigo}`,
                        });
                        setModalAberto(true);
                        setLinkGerado(null);
                        setExpiraDias(7);
                        setReutilizavel(false);
                        setUsoMaximo(null);
                        setTituloPagina("");
                        setDescricaoServico("");
                        setMensagemLink(getTemplate("SERVICO")); // Carregar template de serviço
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${cat.cor || "#f97316"}20`, color: cat.cor || "#f97316" }}
                        >
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-normal text-gray-900">{cat.nome}</h4>
                          <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">
                            {cat.descricao || `Link para solicitaçÍo de ${cat.nome}`}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Links de cadastro normais
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                {config.links.map((link) => renderLinkCard(link))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900 flex items-center gap-3">
            <Link2 className="w-8 h-8 text-orange-600" />
            Central de Links
          </h1>
          <p className="text-[12px] text-gray-600 font-poppins mt-1">
            Gere e gerencie links de cadastro para clientes, colaboradores, parceiros e serviços
          </p>
        </div>
      </div>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-light flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-600" />
            Criar Link
          </CardTitle>
          <CardDescription className="text-[12px]">
            Selecione o tipo de link que deseja criar. Clique na categoria para expandir as opções.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(CATEGORIAS_LINKS).map(([key, config]) =>
            renderCategoriaSection(key, config)
          )}
        </CardContent>
      </Card>

      {/* SeçÍo: Enviar Dados do Cliente */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[20px] font-light flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Enviar Dados do Cliente
              </CardTitle>
              <CardDescription className="text-[12px]">
                Busque um cliente cadastrado e envie seus dados ou endereços de obra por WhatsApp
              </CardDescription>
            </div>
            {/* Botões para editar templates */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px]"
                title="Editar template de Ficha Cadastral"
                onClick={() => {
                  setCategoriaEditando("FICHA_CADASTRAL");
                  setMensagemEditando(getTemplate("FICHA_CADASTRAL"));
                  setModalMensagemAberto(true);
                }}
              >
                <Pencil className="w-3 h-3" />
                Ficha
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px]"
                title="Editar template de Endereço de Obra"
                onClick={() => {
                  setCategoriaEditando("ENDERECO_OBRA");
                  setMensagemEditando(getTemplate("ENDERECO_OBRA"));
                  setModalMensagemAberto(true);
                }}
              >
                <Pencil className="w-3 h-3" />
                Endereço
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-[12px]"
                title="Editar template de Dados Completos"
                onClick={() => {
                  setCategoriaEditando("DADOS_COMPLETOS");
                  setMensagemEditando(getTemplate("DADOS_COMPLETOS"));
                  setModalMensagemAberto(true);
                }}
              >
                <Pencil className="w-3 h-3" />
                Completo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca de cliente */}
          <div className="space-y-2">
            <Label>Buscar Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Digite nome, razÍo social ou CPF/CNPJ..."
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                  buscarClientes(e.target.value);
                }}
                className="pl-10"
              />
              {buscandoClientes && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Lista de resultados da busca */}
            {clientesBusca.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {clientesBusca.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelecionarCliente(cliente)}
                  >
                    <div className="text-[12px] font-normal text-gray-900">
                      {cliente.nome || cliente.razao_social}
                    </div>
                    <div className="text-[12px] text-gray-500 flex items-center gap-2">
                      {cliente.cpf_cnpj && <span>{cliente.cpf_cnpj}</span>}
                      {cliente.telefone && (
                        <>
                          <span>•</span>
                          <span>{cliente.telefone}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cliente selecionado */}
          {clienteSelecionado && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <h4 className="text-[13px] font-normal text-green-800">
                      {clienteSelecionado.nome || clienteSelecionado.razao_social}
                    </h4>
                  </div>
                  <div className="text-[12px] text-green-600 mt-1 space-y-0.5">
                    {clienteSelecionado.cpf_cnpj && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {clienteSelecionado.cpf_cnpj}
                      </div>
                    )}
                    {clienteSelecionado.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {clienteSelecionado.telefone}
                      </div>
                    )}
                    {clienteSelecionado.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {clienteSelecionado.email}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClienteSelecionado(null);
                    setEnderecosCliente([]);
                  }}
                >
                  Trocar
                </Button>
              </div>

              {/* Ações de envio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => {
                    const msg = gerarMensagemDados("ficha");
                    handleCopiarMensagem(msg);
                  }}
                >
                  <Copy className="w-4 h-4" />
                  Copiar Ficha
                </Button>
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const msg = gerarMensagemDados("ficha");
                    handleEnviarWhatsApp(msg, clienteSelecionado.telefone);
                  }}
                >
                  <Send className="w-4 h-4" />
                  WhatsApp Ficha
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setTipoEnvio("completo");
                    setModalEnviarDadosAberto(true);
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Dados Completos
                </Button>
              </div>

              {/* Endereços de obra */}
              <div className="border-t border-green-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-[13px] font-normal text-green-800">Endereços de Obra</span>
                  {carregandoEnderecos && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>

                {enderecosCliente.length === 0 ? (
                  <p className="text-[12px] text-green-600">Nenhum endereço de obra cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {enderecosCliente.map((endereco) => (
                      <div
                        key={endereco.id}
                        className="p-3 bg-white rounded-lg border border-green-100"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-gray-400" />
                              <span className="text-[12px] font-normal text-gray-900">
                                {endereco.apelido || "Obra"}
                              </span>
                            </div>
                            <p className="text-[12px] text-gray-600 mt-1">
                              {[
                                endereco.logradouro,
                                endereco.numero,
                                endereco.bairro,
                                endereco.cidade,
                                endereco.estado
                              ].filter(Boolean).join(", ")}
                            </p>
                            {endereco.cep && (
                              <p className="text-[12px] text-gray-500">CEP: {endereco.cep}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Copiar endereço"
                              onClick={() => {
                                const msg = gerarMensagemDados("endereco", endereco);
                                handleCopiarMensagem(msg);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Enviar por WhatsApp"
                              onClick={() => {
                                const msg = gerarMensagemDados("endereco", endereco);
                                handleEnviarWhatsApp(msg, clienteSelecionado.telefone);
                              }}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dica quando nÍo tem cliente selecionado */}
          {!clienteSelecionado && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[12px] text-gray-500">
                Busque um cliente para enviar ficha cadastral ou endereços de obra
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* PAINEL: Links Ativos */}
      {/* ============================================================ */}
      <LinksAtivosPanel />

      {/* Modal de CriaçÍo de Link */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-light flex items-center gap-2">
              {linkSelecionado?.icone}
              {linkGerado ? "Link Gerado" : `Criar Link: ${linkSelecionado?.label}`}
            </DialogTitle>
            <DialogDescription>
              {linkGerado
                ? "Seu link está pronto para ser compartilhado"
                : linkSelecionado?.descricao}
            </DialogDescription>
          </DialogHeader>

          {!linkGerado ? (
            <div className="space-y-4 py-4">
              {/* Título personalizado */}
              <div className="space-y-2">
                <Label>Título da Página (opcional)</Label>
                <Input
                  placeholder={`Cadastro de ${getLabelTipoCadastro(linkSelecionado?.tipoCadastro || "CLIENTE")}`}
                  value={tituloPagina}
                  onChange={(e) => setTituloPagina(e.target.value)}
                />
                <p className="text-[12px] text-gray-500">
                  Título exibido na página de cadastro. Deixe em branco para usar o padrÍo.
                </p>
              </div>

              {/* Campo de descriçÍo para serviços */}
              {(linkSelecionado?.temServicoSolicitado || linkSelecionado?.subtipo?.startsWith("SERVICO_")) && (
                <div className="space-y-2">
                  <Label>DescriçÍo do Serviço</Label>
                  <Textarea
                    placeholder="Descreva detalhes do serviço solicitado..."
                    value={descricaoServico}
                    onChange={(e) => setDescricaoServico(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Informações especiais para links com mídia */}
              {linkSelecionado?.temVideo && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Camera className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-normal text-indigo-700">Suporte a Vídeo</p>
                      <p className="text-[12px] text-indigo-600">
                        O formulário permitirá upload de vídeo de abertura e cadastro
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {linkSelecionado?.temFoto && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-normal text-blue-700">Suporte a Fotos</p>
                      <p className="text-[12px] text-blue-600">
                        O cliente poderá enviar fotos do local/serviço solicitado
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validade */}
              <div className="space-y-2">
                <Label>Validade do Link</Label>
                <Select
                  value={String(expiraDias)}
                  onValueChange={(v) => setExpiraDias(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mensagem para WhatsApp/Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Mensagem de Envio</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[12px] gap-1"
                    onClick={() => {
                      const tipoTemplate = linkSelecionado?.subtipo?.startsWith("SERVICO_") ? "SERVICO" : linkSelecionado?.tipoCadastro || "CLIENTE";
                      setMensagemLink(LINK_TEMPLATES_PADRAO[tipoTemplate] || LINK_TEMPLATES_PADRAO.CLIENTE);
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar
                  </Button>
                </div>
                <Textarea
                  value={mensagemLink}
                  onChange={(e) => setMensagemLink(e.target.value)}
                  rows={6}
                  className="font-mono text-[12px]"
                  placeholder="Mensagem que será enviada junto com o link..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-gray-500">
                    Use <code className="bg-gray-100 px-1 rounded">{"{{LINK}}"}</code> para incluir o link gerado
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[12px]"
                    onClick={() => {
                      const tipoTemplate = linkSelecionado?.subtipo?.startsWith("SERVICO_") ? "SERVICO" : linkSelecionado?.tipoCadastro || "CLIENTE";
                      salvarTemplate(tipoTemplate, mensagemLink);
                    }}
                  >
                    Salvar como PadrÍo
                  </Button>
                </div>
              </div>

              {/* Link Reutilizável */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Link Reutilizável</Label>
                    <p className="text-[12px] text-gray-500">
                      Permite múltiplos cadastros com o mesmo link
                    </p>
                  </div>
                  <Switch
                    checked={reutilizavel}
                    onCheckedChange={setReutilizavel}
                  />
                </div>

                {reutilizavel && (
                  <div className="space-y-2">
                    <Label>Limite de Usos (opcional)</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Sem limite"
                      value={usoMaximo || ""}
                      onChange={(e) =>
                        setUsoMaximo(e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </div>
                )}
              </div>

              {/* BotÍo Criar */}
              <Button
                onClick={() => {
                  if (linkSelecionado?.subtipo?.startsWith("SERVICO_")) {
                    const cat = categoriasServico.find(
                      (c) => `SERVICO_${c.codigo}` === linkSelecionado.subtipo
                    );
                    if (cat) handleCriarLinkServico(cat);
                  } else {
                    handleCriarLink();
                  }
                }}
                disabled={criandoLink}
                className="w-full bg-orange-600 hover:bg-orange-700 h-12"
              >
                {criandoLink ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Link...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5 mr-2" />
                    Gerar Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Link gerado */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-[12px] font-normal text-green-700">Link criado com sucesso!</span>
                </div>
                <Badge className="mb-2">{linkGerado.tipo}</Badge>
              </div>

              {/* URL para copiar */}
              <div className="bg-gray-50 rounded-lg p-3">
                <Label className="text-[12px] text-gray-500 uppercase mb-2 block">Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={linkGerado.url}
                    readOnly
                    className="font-mono text-[12px]"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopiarLink(linkGerado.url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Botões de compartilhamento */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCompartilharWhatsApp}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCompartilharEmail}
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => window.open(linkGerado.url, "_blank")}
                className="w-full gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir Link
              </Button>
            </div>
          )}

          <DialogFooter>
            {linkGerado ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLinkGerado(null);
                  }}
                  className="flex-1"
                >
                  Criar Outro
                </Button>
                <Button
                  onClick={() => setModalAberto(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de EdiçÍo de Mensagem PadrÍo */}
      <Dialog open={modalMensagemAberto} onOpenChange={setModalMensagemAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-light flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-600" />
              Editar Mensagem PadrÍo
            </DialogTitle>
            <DialogDescription>
              Personalize a mensagem que será enviada por WhatsApp ou E-mail para{" "}
              {categoriaEditando === "CLIENTE" && "Clientes"}
              {categoriaEditando === "COLABORADOR" && "Colaboradores"}
              {categoriaEditando === "FORNECEDOR" && "Fornecedores"}
              {categoriaEditando === "ESPECIFICADOR" && "Especificadores"}
              {categoriaEditando === "SERVICO" && "Serviços"}
              {categoriaEditando === "FICHA_CADASTRAL" && "Ficha Cadastral"}
              {categoriaEditando === "ENDERECO_OBRA" && "Endereço de Obra"}
              {categoriaEditando === "DADOS_COMPLETOS" && "Dados Completos"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dicas de variáveis */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[12px] font-normal text-blue-700 mb-2">Variáveis disponíveis:</p>
              <ul className="text-[12px] text-blue-600 space-y-1">
                {/* Variáveis para links de cadastro */}
                {["CLIENTE", "COLABORADOR", "FORNECEDOR", "ESPECIFICADOR", "SERVICO"].includes(categoriaEditando || "") && (
                  <li><code className="bg-blue-100 px-1 rounded">{"{{LINK}}"}</code> - URL do link de cadastro</li>
                )}
                {categoriaEditando === "SERVICO" && (
                  <li><code className="bg-blue-100 px-1 rounded">{"{{NOME_SERVICO}}"}</code> - Nome do serviço</li>
                )}
                {/* Variáveis para envio de dados do cliente */}
                {["FICHA_CADASTRAL", "ENDERECO_OBRA", "DADOS_COMPLETOS"].includes(categoriaEditando || "") && (
                  <>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{NOME_CLIENTE}}"}</code> - Nome do cliente</li>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{DOCUMENTO}}"}</code> - CPF/CNPJ</li>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{TELEFONE}}"}</code> - Telefone</li>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{EMAIL}}"}</code> - E-mail</li>
                  </>
                )}
                {categoriaEditando === "ENDERECO_OBRA" && (
                  <>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{ENDERECO_COMPLETO}}"}</code> - Endereço formatado</li>
                    <li><code className="bg-blue-100 px-1 rounded">{"{{OBSERVACOES}}"}</code> - Observações do endereço</li>
                  </>
                )}
                {categoriaEditando === "DADOS_COMPLETOS" && (
                  <li><code className="bg-blue-100 px-1 rounded">{"{{LISTA_ENDERECOS}}"}</code> - Lista de endereços</li>
                )}
              </ul>
              <p className="text-[12px] text-blue-500 mt-2">
                Use <code className="bg-blue-100 px-1 rounded">*texto*</code> para negrito no WhatsApp
              </p>
            </div>

            {/* Textarea para ediçÍo */}
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={mensagemEditando}
                onChange={(e) => setMensagemEditando(e.target.value)}
                rows={10}
                className="font-mono text-[12px]"
                placeholder="Digite a mensagem..."
              />
            </div>

            {/* Indicador de template personalizado */}
            {categoriaEditando && templatesPersonalizados[categoriaEditando] && (
              <div className="flex items-center gap-2 text-[12px] text-amber-600">
                <Badge variant="outline" className="border-amber-300 text-amber-600">
                  Personalizado
                </Badge>
                <span>Este template foi personalizado</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => categoriaEditando && restaurarTemplatePadrao(categoriaEditando)}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar PadrÍo
            </Button>
            <div className="flex gap-2 flex-1 justify-end">
              <Button
                variant="outline"
                onClick={() => setModalMensagemAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (categoriaEditando) {
                    salvarTemplate(categoriaEditando, mensagemEditando);
                    setModalMensagemAberto(false);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Envio de Dados Completos */}
      <Dialog open={modalEnviarDadosAberto} onOpenChange={setModalEnviarDadosAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-light flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Dados Completos do Cliente
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de enviar por WhatsApp ou copiar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview da mensagem */}
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-[12px] text-gray-500 uppercase mb-2 block">Preview</Label>
              <pre className="whitespace-pre-wrap text-[12px] text-gray-800 font-sans">
                {clienteSelecionado ? gerarMensagemDados("completo") : ""}
              </pre>
            </div>

            {/* Botões de açÍo */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const msg = gerarMensagemDados("completo");
                  handleCopiarMensagem(msg);
                }}
              >
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const msg = gerarMensagemDados("completo");
                  handleEnviarWhatsApp(msg, clienteSelecionado?.telefone);
                  setModalEnviarDadosAberto(false);
                }}
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEnviarDadosAberto(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



