/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/lib/usuariosApi.ts
// API para gestÍo de usuários do sistema
// Login via CPF com geraçÍo automática de senha

import { supabase } from "./supabaseClient";

const limparNumeros = (valor?: string | null) => (valor ?? "").replace(/[^0-9]/g, "");

// ============================================================
// TIPOS
// ============================================================

export type TipoUsuario =
  | "MASTER"
  | "ADMIN"
  | "COMERCIAL"
  | "ATENDIMENTO"
  | "COLABORADOR"
  | "CLIENTE"
  | "ESPECIFICADOR"
  | "FORNECEDOR"
  | "JURIDICO"
  | "FINANCEIRO";

export interface Usuario {
  id: string;
  auth_user_id: string | null;
  pessoa_id: string;
  cpf: string;
  tipo_usuario: TipoUsuario;
  ativo: boolean;
  primeiro_acesso: boolean;
  nucleo_id: string | null;

  // Permissões do cliente
  cliente_pode_ver_valores: boolean;
  cliente_pode_ver_cronograma: boolean;
  cliente_pode_ver_documentos: boolean;
  cliente_pode_ver_proposta: boolean;
  cliente_pode_ver_contratos: boolean;
  cliente_pode_fazer_upload: boolean;
  cliente_pode_comentar: boolean;

  // Dados de contato
  telefone_whatsapp: string | null;
  email_contato: string | null;

  // Auditoria
  criado_em: string;
  atualizado_em: string;
  ultimo_acesso: string | null;
}

export interface UsuarioCompleto extends Usuario {
  // Dados da pessoa
  nome: string;
  email: string | null;
  telefone: string | null;
  tipo_pessoa: string;
  cargo: string | null;
  empresa: string | null;
  avatar_url: string | null;
}

export interface CriarUsuarioInput {
  cpf: string;
  tipo_usuario?: TipoUsuario;
  nucleo_id?: string | null;
}

export interface CriarUsuarioResponse {
  usuario_id: string;
  senha_temporaria: string;
  mensagem: string;
}

export interface PermissoesCliente {
  cliente_pode_ver_valores?: boolean;
  cliente_pode_ver_cronograma?: boolean;
  cliente_pode_ver_documentos?: boolean;
  cliente_pode_ver_proposta?: boolean;
  cliente_pode_ver_contratos?: boolean;
  cliente_pode_fazer_upload?: boolean;
  cliente_pode_comentar?: boolean;
}

// ============================================================
// FUNÇÕES DA API
// ============================================================

/**
 * Lista todos os usuários
 */
export async function listarUsuarios(params?: {
  tipo?: TipoUsuario;
  ativo?: boolean;
  search?: string;
}): Promise<UsuarioCompleto[]> {
  let query = supabase.from("vw_usuarios_completo").select("*");

  if (params?.tipo) {
    query = query.eq("tipo_usuario", params.tipo);
  }

  if (typeof params?.ativo === "boolean") {
    query = query.eq("ativo", params.ativo);
  }

  if (params?.search && params.search.trim()) {
    const term = `%${params.search.trim()}%`;
    query = query.or(`nome.ilike.${term},cpf.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await query.order("criado_em", {
    ascending: false,
  });

  if (error) {
    console.error("Erro ao listar usuários:", error);
    throw error;
  }

  return data || [];
}

/**
 * Busca usuário por ID
 */
export async function buscarUsuarioPorId(id: string): Promise<UsuarioCompleto | null> {
  const { data, error } = await supabase
    .from("vw_usuarios_completo")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }

  return data;
}

/**
 * Busca usuário por CPF (para login)
 */
export async function buscarUsuarioPorCPF(cpf?: string | null): Promise<UsuarioCompleto | null> {
  if (!cpf) {
    return null;
  }

  // Limpar CPF (remover pontos e traços)
  const cpfLimpo = limparNumeros(cpf);

  const { data, error } = await supabase.rpc("buscar_usuario_por_cpf", {
    p_cpf: cpfLimpo,
  });

  if (error) {
    console.error("Erro ao buscar usuário por CPF:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * Cria novo usuário a partir de uma pessoa existente
 * IMPORTANTE: Usa Edge Function para criar usuário JÁ CONFIRMADO no Auth
 * Senha é gerada baseada nos dados: 3 dígitos CPF + 3 letras Nome + 3 dígitos Telefone
 */
export async function criarUsuario(
  input: CriarUsuarioInput & { email?: string; pessoa_id?: string; nome?: string; telefone?: string }
): Promise<CriarUsuarioResponse> {
  if (!input.cpf) {
    throw new Error("CPF obrigatorio para criar usuario");
  }

  // Se tem email, usar a Edge Function que cria usuário já confirmado
  if (input.email && input.pessoa_id) {
    // Gerar senha personalizada baseada nos dados do usuário
    const senha = gerarSenhaPersonalizada(input.cpf, input.nome, input.telefone);
    const emailLimpo = input.email.trim().toLowerCase();

    try {
      // Usar Edge Function para criar usuário já confirmado
      const { data, error } = await supabase.functions.invoke("criar-usuario-admin", {
        body: {
          email: emailLimpo,
          senha: senha,
          pessoa_id: input.pessoa_id,
          tipo_usuario: input.tipo_usuario || "CLIENTE",
          cpf: input.cpf,
          nome: input.nome,
          telefone: input.telefone,
        },
      });

      if (error) {
        console.error("Erro ao chamar Edge Function:", error);
        throw new Error(error.message || "Erro ao criar usuário");
      }

      if (!data.sucesso) {
        throw new Error(data.erro || "Erro ao criar usuário");
      }

      // Se o email já existia no Auth
      if (data.ja_existia) {
        return {
          usuario_id: data.usuario_id,
          senha_temporaria: "Use 'Esqueci minha senha' para recuperar",
          mensagem: data.mensagem || "Email já existia. Use recuperaçÍo de senha.",
        };
      }

      return {
        usuario_id: data.usuario_id || data.auth_user_id,
        senha_temporaria: senha,
        mensagem: "Usuário criado com sucesso! Pode logar imediatamente.",
      };

    } catch (edgeFunctionError: any) {
      console.error("Edge Function falhou, tentando fallback...", edgeFunctionError);

      // Fallback: tentar criar via signUp (pode requerer confirmaçÍo de email)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            tipo_usuario: input.tipo_usuario || "CLIENTE",
            pessoa_id: input.pessoa_id,
          },
        },
      });

      if (authError) {
        console.error("Erro ao criar usuário no Auth:", authError);
        throw new Error(authError.message || "Erro ao criar usuário no Auth");
      }

      if (!authData.user) {
        throw new Error("Erro ao criar usuário: nenhum usuário retornado");
      }

      // Criar registro na tabela usuarios
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .insert({
          auth_user_id: authData.user.id,
          pessoa_id: input.pessoa_id || null,
          cpf: limparNumeros(input.cpf) || "",
          tipo_usuario: input.tipo_usuario || "CLIENTE",
          ativo: true,
          primeiro_acesso: true,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (usuarioError) {
        console.error("Erro ao criar registro de usuário:", usuarioError);
      }

      return {
        usuario_id: usuarioData?.id || authData.user.id,
        senha_temporaria: senha,
        mensagem: "Usuário criado! IMPORTANTE: Pode ser necessário confirmar o email antes de logar.",
      };
    }
  }

  // Fallback para método antigo (por CPF) - só cria na tabela
  const cpfLimpo = limparNumeros(input.cpf);

  const { data, error } = await supabase.rpc("criar_usuario_por_cpf", {
    p_cpf: cpfLimpo,
    p_tipo_usuario: input.tipo_usuario || null,
    p_nucleo_id: input.nucleo_id || null,
  });

  if (error) {
    console.error("Erro ao criar usuário:", error);
    throw new Error(error.message || "Erro ao criar usuário");
  }

  if (!data || data.length === 0) {
    throw new Error("Erro ao criar usuário: nenhum dado retornado");
  }

  return data[0];
}

/**
 * Gera uma senha personalizada baseada nos dados do usuário
 * Formato: 3 primeiros números do CPF + 3 primeiras letras do nome (capitalizado) + 3 últimos números do telefone
 * Exemplo: 342Wil991
 */
function gerarSenhaPersonalizada(cpf?: string, nome?: string, telefone?: string): string {
  // Limpar CPF e pegar 3 primeiros números
  const cpfLimpo = limparNumeros(cpf);
  const cpfParte = cpfLimpo.substring(0, 3).padEnd(3, "0");

  // Pegar 3 primeiras letras do nome (primeira maiúscula, resto minúscula)
  const nomeLimpo = (nome || "Usuario").replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const nomeParte = nomeLimpo.substring(0, 1).toUpperCase() +
                    nomeLimpo.substring(1, 3).toLowerCase();

  // Limpar telefone e pegar 3 últimos números
  const telLimpo = limparNumeros(telefone);
  const telParte = telLimpo.length >= 3
    ? telLimpo.substring(telLimpo.length - 3)
    : telLimpo.padStart(3, "1");

  return cpfParte + nomeParte + telParte;
}

/**
 * Gera uma senha temporária aleatória (fallback)
 */
function gerarSenhaTemporaria(): string {
  const maiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minusculas = "abcdefghjkmnpqrstuvwxyz";
  const numeros = "23456789";
  const todos = maiusculas + minusculas + numeros;

  let senha = "";
  senha += maiusculas.charAt(Math.floor(Math.random() * maiusculas.length));
  senha += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
  senha += numeros.charAt(Math.floor(Math.random() * numeros.length));

  for (let i = 0; i < 5; i++) {
    senha += todos.charAt(Math.floor(Math.random() * todos.length));
  }

  const senhaArray = senha.split("");
  for (let i = senhaArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [senhaArray[i], senhaArray[j]] = [senhaArray[j], senhaArray[i]];
  }

  return "WG" + senhaArray.join("") + "!";
}

/**
 * Atualiza dados do usuário
 */
export async function atualizarUsuario(
  id: string,
  dados: Partial<Omit<Usuario, "id" | "cpf" | "pessoa_id" | "criado_em">>
): Promise<void> {
  console.log("[atualizarUsuario] ID:", id);
  console.log("[atualizarUsuario] Dados:", dados);

  const { data, error, count } = await supabase
    .from("usuarios")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[atualizarUsuario] Erro:", error);
    throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }

  if (!data) {
    console.error("[atualizarUsuario] Nenhum registro atualizado para ID:", id);
    throw new Error("Usuário não encontrado ou sem permissÍo para atualizar");
  }

  console.log("[atualizarUsuario] Sucesso! Dados atualizados:", data);
}

/**
 * Atualiza permissões de um cliente
 */
export async function atualizarPermissoesCliente(
  id: string,
  permissoes: PermissoesCliente
): Promise<void> {
  const { error } = await supabase
    .from("usuarios")
    .update({
      ...permissoes,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar permissões:", error);
    throw error;
  }
}

/**
 * Ativa/desativa usuário
 */
export async function alterarStatusUsuario(
  id: string,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("usuarios")
    .update({
      ativo,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Erro ao alterar status do usuário:", error);
    throw error;
  }
}

/**
 * Exclui permanentemente um usuário do Auth E da tabela usuarios
 * Usa Edge Function para garantir exclusÍo completa
 * ATENÇÍO: Esta açÍo não pode ser desfeita!
 */
export async function excluirUsuario(id: string, excluirPessoa?: boolean): Promise<{
  sucesso: boolean;
  auth_excluido: boolean;
  usuario_excluido: boolean;
  pessoa_excluida: boolean;
  mensagem: string;
  erros: string[];
}> {
  try {
    // Usar Edge Function para exclusÍo completa
    const { data, error } = await supabase.functions.invoke("excluir-usuario-admin", {
      body: {
        usuario_id: id,
        excluir_pessoa: excluirPessoa || false,
      },
    });

    if (error) {
      console.error("Erro ao chamar Edge Function excluir-usuario-admin:", error);
      throw new Error(error.message || "Erro ao excluir usuário");
    }

    return {
      sucesso: data.sucesso || false,
      auth_excluido: data.auth_excluido || false,
      usuario_excluido: data.usuario_excluido || false,
      pessoa_excluida: data.pessoa_excluida || false,
      mensagem: data.mensagem || "OperaçÍo concluída",
      erros: data.erros || [],
    };

  } catch (err: any) {
    console.error("Erro ao excluir usuário:", err);

    // Fallback: tentar excluir apenas da tabela usuarios
    const { error: deleteError } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      sucesso: true,
      auth_excluido: false,
      usuario_excluido: true,
      pessoa_excluida: false,
      mensagem: "Usuário excluído da tabela (Auth pode ainda existir)",
      erros: [err.message],
    };
  }
}

/**
 * Exclui usuário apenas da tabela (sem Auth)
 * VersÍo simplificada para casos onde não há auth_user_id
 */
export async function excluirUsuarioSimples(id: string): Promise<void> {
  const { error } = await supabase
    .from("usuarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
}

/**
 * Reseta a senha do usuário usando a Edge Function Admin
 * Altera a senha diretamente no Supabase Auth
 */
export async function resetarSenhaUsuario(params: {
  usuario_id?: string;
  auth_user_id?: string;
  email?: string;
  nova_senha?: string;
}): Promise<{
  nova_senha: string;
  mensagem: string;
  sucesso: boolean;
}> {
  // Gerar nova senha se não foi fornecida
  const novaSenha = params.nova_senha || gerarSenhaTemporaria();

  try {
    // Usar Edge Function para alterar senha
    const { data, error } = await supabase.functions.invoke("alterar-senha-admin", {
      body: {
        usuario_id: params.usuario_id,
        auth_user_id: params.auth_user_id,
        email: params.email,
        nova_senha: novaSenha,
      },
    });

    if (error) {
      console.error("Erro ao chamar Edge Function alterar-senha-admin:", error);
      throw new Error(error.message || "Erro ao alterar senha");
    }

    if (!data.sucesso) {
      throw new Error(data.erro || "Erro ao alterar senha");
    }

    return {
      nova_senha: novaSenha,
      mensagem: data.mensagem || "Senha alterada com sucesso!",
      sucesso: true,
    };

  } catch (err: any) {
    console.error("Erro ao resetar senha:", err);
    return {
      nova_senha: novaSenha,
      mensagem: err.message || "Erro ao alterar senha. Verifique se o usuário existe.",
      sucesso: false,
    };
  }
}

/**
 * Reseta a senha do usuário (versÍo legada por CPF ou Email)
 * Mantido para compatibilidade
 */
export async function resetarSenhaUsuarioLegado(cpfOuEmail?: string | null): Promise<{
  nova_senha: string;
  mensagem: string;
  identificador: string;
}> {
  if (!cpfOuEmail) {
    return {
      nova_senha: gerarSenhaTemporaria(),
      mensagem: "Identificador nao informado",
      identificador: "",
    };
  }

  // Verificar se é email ou CPF
  const isEmail = cpfOuEmail.includes("@");

  let email: string | null = null;
  let cpf: string | null = null;
  let nomeUsuario: string | null = null;
  let authUserId: string | null = null;

  if (isEmail) {
    email = cpfOuEmail;
  } else {
    // Buscar dados do usuário pelo CPF
    const cpfLimpo = limparNumeros(cpfOuEmail);
    cpf = cpfLimpo;

    const { data: usuario } = await supabase
      .from("vw_usuarios_completo")
      .select("email, nome, cpf, auth_user_id")
      .or(`cpf.eq.${cpfOuEmail},cpf.eq.${cpfLimpo}`)
      .maybeSingle();

    email = usuario?.email || null;
    nomeUsuario = usuario?.nome || null;
    authUserId = usuario?.auth_user_id || null;
  }

  // Gerar nova senha
  const novaSenha = gerarSenhaTemporaria();
  const identificador = email || (cpf ? formatarCPF(cpf) : (cpfOuEmail || ""));

  // Tentar alterar via Edge Function se tiver auth_user_id ou email
  if (authUserId || email) {
    try {
      const { data, error } = await supabase.functions.invoke("alterar-senha-admin", {
        body: {
          auth_user_id: authUserId,
          email: email,
          nova_senha: novaSenha,
        },
      });

      if (!error && data?.sucesso) {
        return {
          nova_senha: novaSenha,
          mensagem: `Senha alterada para ${nomeUsuario || email || identificador}. Nova senha aplicada imediatamente!`,
          identificador,
        };
      }
    } catch (err) {
      console.error("Edge Function falhou:", err);
    }
  }

  // Fallback: retornar senha para aplicar manualmente
  return {
    nova_senha: novaSenha,
    mensagem: email
      ? `Senha gerada para ${nomeUsuario || email}. Para aplicar, acesse Supabase Auth > Users > ${email}`
      : `Senha gerada para ${nomeUsuario || "usuário"} (CPF: ${identificador}). Compartilhe diretamente.`,
    identificador,
  };
}

/**
 * Registra o último acesso do usuário
 */
export async function registrarUltimoAcesso(cpf?: string | null): Promise<void> {
  if (!cpf) return;

  // Limpar CPF
  const cpfLimpo = limparNumeros(cpf);

  const { error } = await supabase.rpc("registrar_ultimo_acesso", {
    p_cpf: cpfLimpo,
  });

  if (error) {
    console.error("Erro ao registrar último acesso:", error);
  }
}

/**
 * Verifica se um CPF já tem usuário cadastrado
 */
export async function verificarCPFExiste(cpf?: string | null): Promise<boolean> {
  if (!cpf) return false;

  // Limpar CPF
  const cpfLimpo = limparNumeros(cpf);

  const { data, error } = await supabase
    .from("usuarios")
    .select("id")
    .eq("cpf", cpfLimpo)
    .limit(1);

  if (error) {
    console.error("Erro ao verificar CPF:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Busca pessoas que ainda não têm usuário cadastrado
 */
export async function listarPessoasSemUsuario(): Promise<
  Array<{
    id: string;
    nome: string;
    cpf: string | null;
    cnpj: string | null;
    tipo: string;
    email: string | null;
    telefone: string | null;
  }>
> {
  return buscarPessoasSemUsuario("");
}

type PessoaCombobox = {
  id: string;
  nome: string;
  cpf: string | null;
  cnpj: string | null;
  tipo: string;
  email: string | null;
  telefone: string | null;
};

export async function buscarPessoasSemUsuario(termo: string): Promise<PessoaCombobox[]> {
  // Busca IDs que já têm usuário
  const { data: usuariosData } = await supabase
    .from("usuarios")
    .select("pessoa_id");
  const idsComUsuario = new Set(usuariosData?.map((u) => u.pessoa_id) || []);

  let query = supabase
    .from("pessoas")
    .select("id, nome, cpf, cnpj, tipo, email, telefone")
    .order("nome", { ascending: true });

  const termoLimpo = termo.trim();
  if (termoLimpo) {
    const termoNumeros = termoLimpo.replace(/\D/g, "");
    if (termoNumeros.length >= 3) {
      // Busca por documento
      query = query.or(`cpf.ilike.%${termoNumeros}%,cnpj.ilike.%${termoNumeros}%`);
    } else {
      // Busca por nome — inclui versÍo sem acentos para encontrar ex: "Sebastiao" → "SebastiÍo"
      const termoSemAcento = termoLimpo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (termoSemAcento !== termoLimpo) {
        query = query.or(`nome.ilike.%${termoLimpo}%,nome.ilike.%${termoSemAcento}%`);
      } else {
        query = query.ilike("nome", `%${termoLimpo}%`);
      }
    }
    // Sem limite quando pesquisando — o filtro já reduz o conjunto
    query = query.limit(200);
  } else {
    // Sem termo: limita para performance
    query = query.limit(100);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar pessoas:", error);
    throw error;
  }

  return (data || []).filter((p) => !idsComUsuario.has(p.id));
}

/**
 * Obtém estatísticas de usuários
 */
export async function obterEstatisticasUsuarios(): Promise<{
  total: number;
  ativos: number;
  inativos: number;
  porTipo: Record<TipoUsuario, number>;
}> {
  const { data, error } = await supabase
    .from("vw_usuarios_completo")
    .select("id, ativo, tipo_usuario");

  if (error) {
    console.error("Erro ao obter estatísticas:", error);
    throw error;
  }

  const total = data?.length || 0;
  const ativos = data?.filter((u) => u.ativo).length || 0;
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

  data?.forEach((u) => {
    if (u.tipo_usuario in porTipo) {
      porTipo[u.tipo_usuario as TipoUsuario]++;
    }
  });

  return {
    total,
    ativos,
    inativos,
    porTipo,
  };
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Formata CPF para exibiçÍo (000.000.000-00)
 */
export function formatarCPF(cpf?: string | null): string {
  if (!cpf) return "não informado";
  const cpfLimpo = limparNumeros(cpf);
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata CNPJ para exibiçÍo (00.000.000/0000-00)
 */
export function formatarCNPJ(cnpj?: string | null): string {
  if (!cnpj) return "não informado";
  const cnpjLimpo = limparNumeros(cnpj);
  if (cnpjLimpo.length !== 14) return cnpj;
  return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/**
 * Valida CPF
 */
export function validarCPF(cpf?: string | null): boolean {
  if (!cpf) return false;
  const cpfLimpo = limparNumeros(cpf);

  if (cpfLimpo.length !== 11) return false;

  let soma = 0;
  let resto;

  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

  // Valida segundo dígito
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}

/**
 * Valida CNPJ (verificacao basica de tamanho)
 */
export function validarCNPJ(cnpj?: string | null): boolean {
  if (!cnpj) return false;
  const cnpjLimpo = limparNumeros(cnpj);
  return cnpjLimpo.length === 14;
}

/**
 * Retorna label legível para tipo de usuário
 */
export function obterLabelTipoUsuario(tipo: TipoUsuario): string {
  const labels: Record<TipoUsuario, string> = {
    MASTER: "Founder & CEO",
    ADMIN: "Administrador",
    COMERCIAL: "Comercial",
    ATENDIMENTO: "Atendimento",
    COLABORADOR: "Colaborador",
    CLIENTE: "Cliente",
    ESPECIFICADOR: "Especificador",
    FORNECEDOR: "Fornecedor",
    JURIDICO: "Jurídico",
    FINANCEIRO: "Financeiro",
  };
  return labels[tipo] || tipo;
}

/**
 * Retorna cor do badge para tipo de usuário
 */
export function obterCorTipoUsuario(tipo: TipoUsuario): string {
  const cores: Record<TipoUsuario, string> = {
    MASTER: "purple",
    ADMIN: "blue",
    COMERCIAL: "orange",
    ATENDIMENTO: "teal",
    COLABORADOR: "green",
    CLIENTE: "gray",
    ESPECIFICADOR: "cyan",
    FORNECEDOR: "amber",
    JURIDICO: "indigo",
    FINANCEIRO: "emerald",
  };
  return cores[tipo] || "gray";
}



