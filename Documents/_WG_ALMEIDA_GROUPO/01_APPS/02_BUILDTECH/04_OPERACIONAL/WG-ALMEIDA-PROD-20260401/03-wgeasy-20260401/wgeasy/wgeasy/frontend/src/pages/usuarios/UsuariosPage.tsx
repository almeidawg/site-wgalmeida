/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/usuarios/UsuariosPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSwipe } from "@/hooks/useSwipe";
import Avatar from "@/components/common/Avatar";
import {
  listarUsuarios,
  alterarStatusUsuario,
  resetarSenhaUsuario,
  excluirUsuario,
  formatarCPF,
  obterLabelTipoUsuario,
  obterCorTipoUsuario,
  type UsuarioCompleto,
  type TipoUsuario,
} from "@/lib/usuariosApi";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Badge } from "@/components/ui/badge";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  Edit,
  Users,
  UserCog,
  Shield,
  Eye,
  Send,
  Copy,
  Share2,
  Trash2,
  Mail,
  Link,
  Unlink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

export default function UsuariosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Swipe gestures para navegaçÍo
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate(-1),
    threshold: 50,
  });

  const [usuariosBase, setUsuariosBase] = useState<UsuarioCompleto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<TipoUsuario | "TODOS">("TODOS");
  const [filtroAtivo, setFiltroAtivo] = useState<
    "TODOS" | "ATIVOS" | "INATIVOS"
  >("ATIVOS");
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    porTipo: {} as Record<TipoUsuario, number>,
  });

  // Estados para dialog de credenciais
  const [dialogCredenciais, setDialogCredenciais] = useState(false);
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<{
    nome: string;
    login: string;
    email: string;
    senha: string;
  } | null>(null);

  const getLoginInfo = (login?: string | null) => {
    const isEmail = !!login && login.includes("@");
    return {
      fieldLabel: isEmail ? "E-mail (login)" : "CPF (login)",
      shortLabel: isEmail ? "e-mail" : "CPF",
      value: login ? (isEmail ? login : formatarCPF(login)) : "-",
    };
  };

  const loginInfoAtual = getLoginInfo(credenciaisGeradas?.login);

  useEffect(() => {
      carregarUsuarios();
    }, []);

    useEffect(() => {
      aplicarFiltros();
    }, [usuariosBase, filtroTipo, filtroAtivo]);

    function calcularEstatisticas(base: UsuarioCompleto[]) {
      const total = base.length;
      const ativos = base.filter((u) => u.ativo).length;
      const inativos = total - ativos;

      const porTipo: Record<TipoUsuario, number> = {
        MASTER: 0,
        ADMIN: 0,
        COMERCIAL: 0,
        ATENDIMENTO: 0,
        COLABORADOR: 0,
        CLIENTE: 0,
        ESPECIFICADOR: 0,
        FORNECEDOR: 0,
        JURIDICO: 0,
        FINANCEIRO: 0,
      };

      base.forEach((u) => {
        if (u.tipo_usuario in porTipo) {
          porTipo[u.tipo_usuario as TipoUsuario] += 1;
        }
      });

      return { total, ativos, inativos, porTipo };
    }

    function aplicarFiltros() {
      let base = usuariosBase;

      if (filtroTipo !== "TODOS") {
        base = base.filter((u) => u.tipo_usuario === filtroTipo);
      }

      if (filtroAtivo === "ATIVOS") {
        base = base.filter((u) => u.ativo);
      } else if (filtroAtivo === "INATIVOS") {
        base = base.filter((u) => !u.ativo);
      }

      setUsuarios(base);
    }

    async function carregarUsuarios() {
    try {
      setLoading(true);

        const data = await listarUsuarios();
        setUsuariosBase(data);
        setEstatisticas(calcularEstatisticas(data));
        setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAlterarStatus(id: string, ativo: boolean) {
    try {
      await alterarStatusUsuario(id, !ativo);
      toast({
        title: "Sucesso",
        description: ativo
          ? "Usuário desativado com sucesso"
          : "Usuário ativado com sucesso",
      });
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do usuário",
      });
    }
  }

  async function handleResetarSenha(usuario: UsuarioCompleto) {
    if (
      !confirm(
        `Deseja realmente resetar a senha de ${usuario.nome}?\n\nUma nova senha temporaria sera gerada e aplicada imediatamente no sistema.`
      )
    ) {
      return;
    }

    try {
      // Usar nova API com objeto de parametros
      const resultado = await resetarSenhaUsuario({
        usuario_id: usuario.id,
        auth_user_id: usuario.auth_user_id || undefined,
        email: usuario.email || undefined,
      });

      // Armazenar credenciais e abrir dialog
      setCredenciaisGeradas({
        nome: usuario.nome,
        login: usuario.email || usuario.cpf,
        email: usuario.email || "",
        senha: resultado.nova_senha,
      });
      setDialogCredenciais(true);

      if (resultado.sucesso) {
        toast({
          title: "Senha alterada com sucesso!",
          description: "A nova senha ja esta ativa. Compartilhe com o usuario.",
        });
      } else {
        toast({
          title: "Senha gerada",
          description: resultado.mensagem,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao resetar senha",
        variant: "destructive",
      });
    }
  }

  function handleCopiarCredenciais() {
    if (!credenciaisGeradas) return;

    const loginInfo = getLoginInfo(credenciaisGeradas.login);
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const texto = `CREDENCIAIS DE ACESSO — WG Easy

"Foi um desafio construir. O seu Mundo muda quando VOCÊ muda, e nós dissemos que haveria mudanças.
Hoje, elas começam aqui. ${dataAtual}"

Olá, ${credenciaisGeradas.nome},
Seja bem-vindo(a) ao time WG! 💪🚀

A partir de agora, este é o seu acesso ao WG Easy → gestÍo e informaçÍo no mesmo lugar, com mais clareza, agilidade e controle.

No WG Easy, você encontrará:
→ Projetos em andamento (endereços, documentos e informações da obra)
→ Cronogramas e acompanhamento
→ Envio fotográfico direto pelo sistema
→ Área financeira exclusiva, com pagamentos realizados, solicitados e programados
→ SolicitaçÍo de reembolsos
→ Menu Serviços, para solicitar materiais, fretes, retirada de entulho e muito mais

✅ Acesse o sistema: https://easy.wgalmeida.com.br

📩 ${loginInfo.fieldLabel}: ${loginInfo.value}
🔒 Senha: ${credenciaisGeradas.senha}

IMPORTANTE: Salve esta senha ou altere no primeiro acesso.

Bem-vindo(a), começamos a mudar para construir juntos a nossa História.
Bem-vindo(a) ao WG Easy & Grupo WG Almeida`;

    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado!",
      description: "Credenciais copiadas para área de transferência",
    });
  }

  function handleCompartilharWhatsApp() {
    if (!credenciaisGeradas) return;

    const loginInfo = getLoginInfo(credenciaisGeradas.login);
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const texto = `*CREDENCIAIS DE ACESSO — WG Easy*

_"Foi um desafio construir. O seu Mundo muda quando VOCÊ muda, e nós dissemos que haveria mudanças.
Hoje, elas começam aqui. ${dataAtual}"_

Olá, *${credenciaisGeradas.nome}*,
Seja bem-vindo(a) ao time WG! 💪🚀

A partir de agora, este é o seu acesso ao WG Easy → gestÍo e informaçÍo no mesmo lugar, com mais clareza, agilidade e controle.

*No WG Easy, você encontrará:*
→ Projetos em andamento
→ Cronogramas e acompanhamento
→ Envio fotográfico direto pelo sistema
→ Área financeira exclusiva
→ SolicitaçÍo de reembolsos
→ Menu Serviços

✅ *Acesse o sistema:* https://easy.wgalmeida.com.br

📩 *${loginInfo.fieldLabel}:* ${loginInfo.value}
🔒 *Senha:* ${credenciaisGeradas.senha}

*IMPORTANTE:* Salve esta senha ou altere no primeiro acesso.

_Bem-vindo(a), começamos a mudar para construir juntos a nossa História._
*Bem-vindo(a) ao WG Easy & Grupo WG Almeida*`;

    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsApp, "_blank");

    toast({
      title: "WhatsApp aberto!",
      description: "Compartilhe as credenciais com o usuário",
    });
  }

  function handleCompartilharEmail() {
    if (!credenciaisGeradas) return;

    const assunto = "CREDENCIAIS DE ACESSO — WG Easy";
    const loginInfo = getLoginInfo(credenciaisGeradas.login);
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const corpo = `CREDENCIAIS DE ACESSO — WG Easy

"Foi um desafio construir. O seu Mundo muda quando VOCÊ muda, e nós dissemos que haveria mudanças.
Hoje, elas começam aqui. ${dataAtual}"

Olá, ${credenciaisGeradas.nome},
Seja bem-vindo(a) ao time WG!

A partir de agora, este é o seu acesso ao WG Easy → gestÍo e informaçÍo no mesmo lugar, com mais clareza, agilidade e controle.

No WG Easy, você encontrará:
→ Projetos em andamento (endereços, documentos e informações da obra)
→ Cronogramas e acompanhamento
→ Envio fotográfico direto pelo sistema
→ Área financeira exclusiva, com pagamentos realizados, solicitados e programados
→ SolicitaçÍo de reembolsos
→ Menu Serviços, para solicitar materiais, fretes, retirada de entulho e muito mais

Acesse o sistema: https://easy.wgalmeida.com.br

${loginInfo.fieldLabel}: ${loginInfo.value}
Senha: ${credenciaisGeradas.senha}

IMPORTANTE: Salve esta senha ou altere no primeiro acesso.

Bem-vindo(a), começamos a mudar para construir juntos a nossa História.
Bem-vindo(a) ao WG Easy & Grupo WG Almeida`;

    const mailtoUrl = `mailto:${
      credenciaisGeradas.email || ""
    }?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = mailtoUrl;

    toast({
      title: "Cliente de e-mail aberto!",
      description: "Envie as credenciais para o usuário",
    });
  }

  async function handleCompartilharAcesso(usuario: UsuarioCompleto) {
    // Confirmar antes de gerar nova senha e compartilhar
    if (
      !confirm(
        `Deseja compartilhar acesso com ${usuario.nome}?\n\nUma nova senha será gerada automaticamente e incluída na mensagem.`
      )
    ) {
      return;
    }

    try {
      // Gerar nova senha automaticamente
      const resultado = await resetarSenhaUsuario({
        usuario_id: usuario.id,
        auth_user_id: usuario.auth_user_id || undefined,
        email: usuario.email || undefined,
      });

      const novaSenha = resultado.nova_senha;
      const loginInfo = getLoginInfo(usuario.email || usuario.cpf);
      const dataAtual = new Date().toLocaleDateString("pt-BR");

      // Preparar mensagem ÚNICA com todos os dados incluindo a senha
      const mensagemCompleta = `*CREDENCIAIS DE ACESSO — WG Easy*

_"Foi um desafio construir. O seu Mundo muda quando VOCÊ muda, e nós dissemos que haveria mudanças.
Hoje, elas começam aqui. ${dataAtual}"_

Olá, *${usuario.nome}*,
Seja bem-vindo(a) ao time WG! 💪🚀

A partir de agora, este é o seu acesso ao WG Easy → gestÍo e informaçÍo no mesmo lugar, com mais clareza, agilidade e controle.

*No WG Easy, você encontrará:*
→ Projetos em andamento
→ Cronogramas e acompanhamento
→ Envio fotográfico direto pelo sistema
→ Área financeira exclusiva
→ SolicitaçÍo de reembolsos
→ Menu Serviços

✅ *Acesse o sistema:* https://easy.wgalmeida.com.br

📩 *${loginInfo.fieldLabel}:* ${loginInfo.value}
🔒 *Senha:* ${novaSenha}

*IMPORTANTE:* Salve esta senha ou altere no primeiro acesso.

_Bem-vindo(a), começamos a mudar para construir juntos a nossa História._
*Bem-vindo(a) ao WG Easy & Grupo WG Almeida*`;

      // Copiar para área de transferência
      navigator.clipboard.writeText(mensagemCompleta);

      // Abrir WhatsApp diretamente
      const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(
        mensagemCompleta
      )}`;
      window.open(urlWhatsApp, "_blank");

      toast({
        title: "Acesso compartilhado!",
        description: "Nova senha gerada e WhatsApp aberto para envio.",
      });
    } catch (error: any) {
      console.error("Erro ao compartilhar acesso:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar credenciais",
        variant: "destructive",
      });
    }
  }

  async function handleExcluirUsuario(id: string, nome: string) {
    if (
      !confirm(
        `Deseja realmente EXCLUIR o usuario ${nome}?\n\nAVISO: Esta acao nao pode ser desfeita!\nO usuario sera removido permanentemente do sistema E do Supabase Auth.`
      )
    ) {
      return;
    }

    try {
      const resultado = await excluirUsuario(id);

      if (resultado.sucesso) {
        const detalhes = [];
        if (resultado.auth_excluido) detalhes.push("Auth");
        if (resultado.usuario_excluido) detalhes.push("Sistema");

        toast({
          title: "Usuario excluido",
          description: `${nome} removido de: ${detalhes.join(", ")}`,
        });
      } else {
        toast({
          title: "Exclusao parcial",
          description:
            resultado.erros.join("; ") || "Alguns itens nao foram excluidos",
          variant: "destructive",
        });
      }

      carregarUsuarios();
    } catch (error: any) {
      console.error("Erro ao excluir usuario:", error);
      toast({
        title: "Erro ao excluir usuario",
        description: error.message || "Erro ao excluir usuario",
        variant: "destructive",
      });
    }
  }

  function handleEditar(id: string) {
    navigate(`/usuarios/editar/${id}`);
  }

  function handleVerDetalhes(id: string) {
    navigate(`/usuarios/${id}`);
  }

  function handleCriarUsuario() {
    navigate("/usuarios/novo");
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!search) return true;
    const termo = normalizeSearchTerm(search);
    const termoCpf = search.replace(/\D/g, "");
    return (
      normalizeSearchTerm(u.nome).includes(termo) ||
      (!!termoCpf && u.cpf.includes(termoCpf)) ||
      normalizeSearchTerm(u.email || "").includes(termo)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-oswald font-normal text-gray-900">
            GestÍo de Usuários
          </h1>
          <p className="text-[16px] text-gray-600 font-poppins mt-1">
            Gerencie os acessos ao sistema WG Easy
          </p>
        </div>
        <Button
          onClick={handleCriarUsuario}
          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-[14px]"
        >
          <UserPlus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[12px] font-medium text-gray-600">
              Total de Usuários
            </CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-[20px] font-normal">{estatisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[12px] font-medium text-gray-600">
              Ativos
            </CardTitle>
            <UserCheck className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-[20px] font-normal text-green-600">
              {estatisticas.ativos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[12px] font-medium text-gray-600">
              Inativos
            </CardTitle>
            <UserX className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-[20px] font-normal text-red-600">
              {estatisticas.inativos}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[12px] font-medium text-gray-600">
              Administradores
            </CardTitle>
            <Shield className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-[20px] font-normal text-purple-600">
              {estatisticas.porTipo.ADMIN || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filtroTipo}
              onValueChange={(v) => setFiltroTipo(v as TipoUsuario | "TODOS")}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os tipos</SelectItem>
                <SelectItem value="MASTER">Founder & CEO</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="COMERCIAL">Comercial</SelectItem>
                <SelectItem value="ATENDIMENTO">Atendimento</SelectItem>
                <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
                <SelectItem value="ESPECIFICADOR">Especificador</SelectItem>
                <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroAtivo}
              onValueChange={(v) =>
                setFiltroAtivo(v as "TODOS" | "ATIVOS" | "INATIVOS")
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="INATIVOS">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Carregando usuários...</p>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          nome={usuario.nome}
                          avatar_url={usuario.avatar_url}
                          size="md"
                        />
                        <div>
                          <div className="font-medium">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">
                            {usuario.email || "Sem email"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatarCPF(usuario.cpf)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`bg-${obterCorTipoUsuario(
                          usuario.tipo_usuario
                        )}-50 text-${obterCorTipoUsuario(
                          usuario.tipo_usuario
                        )}-700 border-${obterCorTipoUsuario(
                          usuario.tipo_usuario
                        )}-200`}
                      >
                        {obterLabelTipoUsuario(usuario.tipo_usuario)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {usuario.ativo ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 w-fit">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200 w-fit">
                            <UserX className="w-3 h-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                        {usuario.auth_user_id ? (
                          <Badge className="bg-blue-50 text-blue-600 border-blue-200 w-fit text-[10px]">
                            <Link className="w-2.5 h-2.5 mr-1" />
                            Auth OK
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-600 border-amber-200 w-fit text-[10px]">
                            <Unlink className="w-2.5 h-2.5 mr-1" />
                            Sem Auth
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {usuario.ultimo_acesso
                        ? new Date(usuario.ultimo_acesso).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Nunca acessou"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Abrir menu</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white">
                          <DropdownMenuItem
                            onClick={() => handleVerDetalhes(usuario.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditar(usuario.id)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleResetarSenha(usuario)}
                            className="text-blue-600"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleCompartilharAcesso(usuario)}
                            className="text-purple-600"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar Acesso
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              handleAlterarStatus(usuario.id, usuario.ativo)
                            }
                            className={
                              usuario.ativo
                                ? "text-orange-600"
                                : "text-green-600"
                            }
                          >
                            {usuario.ativo ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleExcluirUsuario(usuario.id, usuario.nome)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Credenciais */}
      <Dialog open={dialogCredenciais} onOpenChange={setDialogCredenciais}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Credenciais de Acesso Geradas
            </DialogTitle>
            <DialogDescription>
              Senha temporária gerada com sucesso. Compartilhe as instruções
              abaixo com o usuário.
            </DialogDescription>
          </DialogHeader>

          {credenciaisGeradas && (
            <div className="space-y-4 py-4">
              {/* Dados do Usuário */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Usuário
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    {credenciaisGeradas.nome}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    {loginInfoAtual.fieldLabel}
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {loginInfoAtual.value}
                  </p>
                </div>

                {credenciaisGeradas.email && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {credenciaisGeradas.email}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <label className="text-xs font-medium text-blue-600 uppercase flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Senha Temporária
                  </label>
                  <p className="text-[20px] font-mono font-normal text-blue-600 tracking-wider mt-1">
                    {credenciaisGeradas.senha}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    IMPORTANTE: O usuário deve alterar no primeiro acesso
                  </p>
                </div>
              </div>

              {/* Instruções de Login */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-normal text-blue-900 mb-2 flex items-center gap-2">
                  Instruções de Acesso
                </h4>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Acesse o sistema WG Easy</li>
                  <li>
                    Use o {loginInfoAtual.shortLabel}{" "}
                    <span className="font-mono font-normal">
                      {loginInfoAtual.value}
                    </span>{" "}
                    como login
                  </li>
                  <li>
                    Use a senha temporária{" "}
                    <span className="font-mono font-normal">
                      {credenciaisGeradas.senha}
                    </span>
                  </li>
                  <li>Altere sua senha no primeiro acesso</li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Button
              variant="ghost"
              onClick={handleCopiarCredenciais}
              className="flex-1 gap-2 border border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
            {credenciaisGeradas?.email && (
              <Button
                variant="ghost"
                onClick={handleCompartilharEmail}
                className="flex-1 gap-2 border border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4" />
                E-mail
              </Button>
            )}
            <Button
              variant="default"
              onClick={handleCompartilharWhatsApp}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Send className="w-4 h-4" />
              WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

