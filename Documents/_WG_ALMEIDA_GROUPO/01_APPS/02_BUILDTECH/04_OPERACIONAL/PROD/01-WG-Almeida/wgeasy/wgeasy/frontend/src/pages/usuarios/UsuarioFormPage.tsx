/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/usuarios/UsuarioFormPage.tsx
import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import {
  criarUsuario,
  buscarUsuarioPorId,
  atualizarUsuario,
  buscarPessoasSemUsuario,
  formatarCPF,
  formatarCNPJ,
  validarCPF,
  validarCNPJ,
  obterLabelTipoUsuario,
  type TipoUsuario,
  type PermissoesCliente,
} from "@/lib/usuariosApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function UsuarioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [pessoas, setPessoas] = useState<
    Array<{
      id: string;
      nome: string;
      cpf: string | null;
      cnpj: string | null;
      tipo: string;
      email: string | null;
      telefone: string | null;
    }>
  >([]);

  // Dados do formulário
  const [pessoaSelecionada, setPessoaSelecionada] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("CLIENTE");
  const [ativo, setAtivo] = useState(true);

  // Permissões do cliente
  const [permissoes, setPermissoes] = useState<PermissoesCliente>({
    cliente_pode_ver_valores: true,
    cliente_pode_ver_cronograma: true,
    cliente_pode_ver_documentos: true,
    cliente_pode_ver_proposta: true,
    cliente_pode_ver_contratos: true,
    cliente_pode_fazer_upload: true,
    cliente_pode_comentar: true,
  });

  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);
  const [emailGerado, setEmailGerado] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [buscandoPessoas, setBuscandoPessoas] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pessoaSelecionadaData, setPessoaSelecionadaData] = useState<{
    id: string;
    nome: string;
    cpf: string | null;
    cnpj: string | null;
    tipo: string;
    email: string | null;
    telefone: string | null;
  } | null>(null);

  const getDocumentoInfo = (pessoa: {
    cpf: string | null;
    cnpj: string | null;
  }) => {
    const documentoBruto = pessoa.cpf || pessoa.cnpj || "";
    const documentoNumeros = documentoBruto.replace(/\D/g, "");
    const isCnpj = documentoNumeros.length === 14;
    const isCpf = documentoNumeros.length === 11;
    const label = isCnpj ? "CNPJ" : "CPF";
    const valor = isCnpj
      ? formatarCNPJ(documentoNumeros)
      : isCpf
        ? formatarCPF(documentoNumeros)
        : "NÍo informado";

    return {
      documentoBruto,
      documentoNumeros,
      isCnpj,
      isCpf,
      label,
      valor,
    };
  };

  const isEmailValido = (email?: string | null) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  useEffect(() => {
    if (isEdit) {
      carregarUsuario();
    }
  }, [id]);

  // Busca server-side com debounce quando o dropdown está aberto
  useEffect(() => {
    if (!dropdownOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      carregarPessoas(buscaPessoa);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buscaPessoa, dropdownOpen]);

  async function carregarUsuario() {
    if (!id) return;

    try {
      setLoading(true);
      const usuario = await buscarUsuarioPorId(id);

      if (!usuario) {
        toast({
          title: "Erro",
          description: "Usuário nÍo encontrado",
          variant: "destructive",
        });
        navigate("/usuarios");
        return;
      }

      setTipoUsuario(usuario.tipo_usuario);
      setAtivo(usuario.ativo);
      setPermissoes({
        cliente_pode_ver_valores: usuario.cliente_pode_ver_valores,
        cliente_pode_ver_cronograma: usuario.cliente_pode_ver_cronograma,
        cliente_pode_ver_documentos: usuario.cliente_pode_ver_documentos,
        cliente_pode_ver_proposta: usuario.cliente_pode_ver_proposta,
        cliente_pode_ver_contratos: usuario.cliente_pode_ver_contratos,
        cliente_pode_fazer_upload: usuario.cliente_pode_fazer_upload,
        cliente_pode_comentar: usuario.cliente_pode_comentar,
      });
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function carregarPessoas(termo = "") {
    try {
      setBuscandoPessoas(true);
      const data = await buscarPessoasSemUsuario(termo);
      setPessoas(data);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
    } finally {
      setBuscandoPessoas(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isEdit && !pessoaSelecionada) {
      toast({
        title: "Erro",
        description: "Selecione uma pessoa",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        // Atualizar usuário existente
        await atualizarUsuario(id, {
          tipo_usuario: tipoUsuario,
          ativo,
          ...permissoes,
        });

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
        navigate("/usuarios");
      } else {
        // Criar novo usuário
        const pessoa = pessoaSelecionadaData;
        if (!pessoa) {
          toast({
            title: "Erro",
            description: "Pessoa nÍo encontrada",
            variant: "destructive",
          });
          return;
        }

        const {
          documentoNumeros,
          isCnpj,
          isCpf,
        } = getDocumentoInfo(pessoa);

        if (!documentoNumeros) {
          toast({
            title: "Erro",
            description: "A pessoa precisa ter CPF ou CNPJ cadastrado para criar usuário.",
            variant: "destructive",
          });
          return;
        }

        if (!isCpf && !isCnpj) {
          toast({
            title: "Erro",
            description: "Documento inválido",
            variant: "destructive",
          });
          return;
        }

        if (isCnpj ? !validarCNPJ(documentoNumeros) : !validarCPF(documentoNumeros)) {
          toast({
            title: "Erro",
            description: isCnpj ? "CNPJ inválido" : "CPF inválido",
            variant: "destructive",
          });
          return;
        }

        // IMPORTANTE: Verificar se pessoa tem email valido
        if (!pessoa.email || !isEmailValido(pessoa.email)) {
          toast({
            title: "Erro",
            description: "A pessoa precisa ter um email valido cadastrado para criar usuário. Edite o cadastro da pessoa primeiro.",
            variant: "destructive",
          });
          return;
        }

        // Chamar a nova funçÍo que cria no auth também
        // Senha será gerada: 3 dígitos do documento + 3 letras Nome + 3 dígitos Telefone
        const emailLimpo = pessoa.email.trim().toLowerCase();
        const resultado = await criarUsuario({
          cpf: documentoNumeros,
          tipo_usuario: tipoUsuario,
          email: emailLimpo,
          pessoa_id: pessoa.id,
          nome: pessoa.nome,
          telefone: pessoa.telefone || "",
        });

        setSenhaGerada(resultado.senha_temporaria);
        setEmailGerado(emailLimpo);
        toast({
          title: "Usuário criado com sucesso!",
          description: `Login: ${emailLimpo} | Senha: ${resultado.senha_temporaria}`,
          duration: 15000,
        });

        // NÍo navegar ainda, mostrar a senha
      }
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/usuarios")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-[24px] font-oswald font-normal text-gray-900">
            {isEdit ? "Editar Usuário" : "Novo Usuário"}
          </h1>
          <p className="text-sm text-gray-600 font-poppins mt-1">
            {isEdit
              ? "Atualize as informações do usuário"
              : "Crie um novo acesso ao sistema"}
          </p>
        </div>
      </div>

      {/* Senha Gerada */}
      {senhaGerada && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-4xl">🔑</div>
              <h3 className="text-[20px] font-normal text-green-800">
                Usuário criado com sucesso!
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700 mb-1">Email de login:</p>
                  <div className="bg-white p-3 rounded-lg border border-green-300">
                    <p className="text-[14px] font-mono font-medium text-green-900">
                      {emailGerado}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Senha temporária:</p>
                  <div className="bg-white p-3 rounded-lg border-2 border-green-300">
                    <p className="text-[20px] font-mono font-normal text-green-900">
                      {senhaGerada}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Envie essas credenciais por WhatsApp para o usuário.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`Login: ${emailGerado}\nSenha: ${senhaGerada}`);
                    toast({
                      title: "Sucesso",
                      description: "Credenciais copiadas!",
                    });
                  }}
                >
                  Copiar Credenciais
                </Button>
                <Button variant="outline" onClick={() => navigate("/usuarios")}>
                  Voltar para Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário */}
      {!senhaGerada && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Dados do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SeleçÍo de Pessoa (apenas para novo) */}
              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="pessoa">Pessoa *</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                    <input
                      type="text"
                      autoComplete="off"
                      disabled={loading}
                      placeholder={
                        pessoaSelecionadaData
                          ? pessoaSelecionadaData.nome
                          : "Buscar por nome ou CPF/CNPJ..."
                      }
                      value={buscaPessoa}
                      onChange={(e) => setBuscaPessoa(e.target.value)}
                      onFocus={() => {
                        setDropdownOpen(true);
                        setBuscaPessoa("");
                      }}
                      onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                      className="w-full pl-9 pr-3 py-2 h-10 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {dropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                        {buscandoPessoas ? (
                          <div className="px-3 py-3 text-sm text-gray-400">Buscando...</div>
                        ) : pessoas.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-400">Nenhuma pessoa encontrada.</div>
                        ) : (
                          pessoas.map((pessoa) => (
                            <div
                              key={pessoa.id}
                              onMouseDown={() => {
                                setPessoaSelecionada(pessoa.id);
                                setPessoaSelecionadaData(pessoa);
                                setBuscaPessoa("");
                                setDropdownOpen(false);
                              }}
                              className={cn(
                                "px-3 py-2 cursor-pointer hover:bg-orange-50 text-sm flex items-center justify-between",
                                pessoaSelecionada === pessoa.id && "bg-orange-100"
                              )}
                            >
                              <span>
                                {pessoa.nome}
                                <span className="ml-2 text-xs text-gray-400">
                                  {getDocumentoInfo(pessoa).valor} · {pessoa.tipo}
                                </span>
                              </span>
                              {!pessoa.email && (
                                <span className="ml-2 text-xs text-amber-500 shrink-0">sem email</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Informações da pessoa selecionada */}
              {pessoaSelecionadaData && (
                <Card className={`${pessoaSelecionadaData.email ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Nome:</p>
                        <p className="font-medium">{pessoaSelecionadaData.nome}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {getDocumentoInfo(pessoaSelecionadaData).label}:
                        </p>
                        <p className="font-medium font-mono">
                          {getDocumentoInfo(pessoaSelecionadaData).valor}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email (usado para login):</p>
                        <p className={`font-medium ${!pessoaSelecionadaData.email ? 'text-amber-600' : ''}`}>
                          {pessoaSelecionadaData.email || "⚠️ NÍo informado - necessário para login!"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Telefone:</p>
                        <p className="font-medium">
                          {pessoaSelecionadaData.telefone || "NÍo informado"}
                        </p>
                      </div>
                    </div>
                    {!pessoaSelecionadaData.email && (
                      <div className="mt-4 p-3 bg-amber-100 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Cadastre um email para esta pessoa antes de criar o usuário.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tipo de Usuário */}
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Usuário *</Label>
                <Select
                  value={tipoUsuario}
                  onValueChange={(v) => setTipoUsuario(v as TipoUsuario)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASTER">
                      Founder & CEO - Acesso máximo
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      {obterLabelTipoUsuario("ADMIN")} - Acesso total
                    </SelectItem>
                    <SelectItem value="COMERCIAL">
                      {obterLabelTipoUsuario("COMERCIAL")} - Vendas e propostas
                    </SelectItem>
                    <SelectItem value="ATENDIMENTO">
                      {obterLabelTipoUsuario("ATENDIMENTO")} - Suporte ao cliente
                    </SelectItem>
                    <SelectItem value="COLABORADOR">
                      {obterLabelTipoUsuario("COLABORADOR")} - Acesso completo
                    </SelectItem>
                    <SelectItem value="JURIDICO">
                      {obterLabelTipoUsuario("JURIDICO")} - Módulo Jurídico
                    </SelectItem>
                    <SelectItem value="FINANCEIRO">
                      {obterLabelTipoUsuario("FINANCEIRO")} - Módulo Financeiro
                    </SelectItem>
                    <SelectItem value="CLIENTE">
                      {obterLabelTipoUsuario("CLIENTE")} - Acesso limitado
                    </SelectItem>
                    <SelectItem value="ESPECIFICADOR">
                      {obterLabelTipoUsuario("ESPECIFICADOR")} - Acesso aos projetos
                    </SelectItem>
                    <SelectItem value="FORNECEDOR">
                      {obterLabelTipoUsuario("FORNECEDOR")} - Acesso limitado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status (apenas para ediçÍo) */}
              {isEdit && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Status do Usuário</Label>
                    <p className="text-sm text-gray-600">
                      Usuários inativos nÍo podem acessar o sistema
                    </p>
                  </div>
                  <Switch checked={ativo} onCheckedChange={setAtivo} />
                </div>
              )}

              {/* Permissões do Cliente */}
              {tipoUsuario === "CLIENTE" && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Permissões do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ver Valores</Label>
                        <p className="text-sm text-gray-600">
                          Permite visualizar valores financeiros
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_ver_valores}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_ver_valores: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ver Cronograma</Label>
                        <p className="text-sm text-gray-600">
                          Permite visualizar cronograma do projeto
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_ver_cronograma}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_ver_cronograma: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ver Documentos</Label>
                        <p className="text-sm text-gray-600">
                          Permite visualizar documentos do projeto
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_ver_documentos}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_ver_documentos: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ver Proposta</Label>
                        <p className="text-sm text-gray-600">
                          Permite visualizar propostas
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_ver_proposta}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_ver_proposta: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ver Contratos</Label>
                        <p className="text-sm text-gray-600">
                          Permite visualizar contratos
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_ver_contratos}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_ver_contratos: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Fazer Upload</Label>
                        <p className="text-sm text-gray-600">
                          Permite fazer upload de arquivos
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_fazer_upload}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_fazer_upload: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Comentar</Label>
                        <p className="text-sm text-gray-600">
                          Permite comentar em tarefas
                        </p>
                      </div>
                      <Switch
                        checked={permissoes.cliente_pode_comentar}
                        onCheckedChange={(checked) =>
                          setPermissoes({
                            ...permissoes,
                            cliente_pode_comentar: checked,
                          })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    (!isEdit && !pessoaSelecionada) ||
                    Boolean(!isEdit && pessoaSelecionadaData && !pessoaSelecionadaData.email)
                  }
                  className="flex-1"
                >
                  {loading ? (
                    "Salvando..."
                  ) : isEdit ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Atualizar
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Usuário
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/usuarios")}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

