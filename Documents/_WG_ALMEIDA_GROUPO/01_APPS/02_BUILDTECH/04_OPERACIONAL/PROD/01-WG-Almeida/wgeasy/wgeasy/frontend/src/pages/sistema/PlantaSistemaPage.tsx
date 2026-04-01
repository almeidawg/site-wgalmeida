/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/sistema/PlantaSistemaPage.tsx
// Página para configurar permissões por tipo de usuário

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Shield,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Save,
  Crown,
  User,
  Users,
  Briefcase,
  Headphones,
  UserCog,
  Building2,
  Truck,
  Scale,
  Coins,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import {
  usePreviewTipoUsuario,
  LABELS_TIPO_USUARIO,
  DESCRICOES_TIPO_USUARIO,
} from "@/hooks/usePreviewTipoUsuario";
import type { TipoUsuario } from "@/types/usuarios";
import {
  listarModulos,
  listarPermissoesTipoUsuario,
  atualizarPermissao,
  getLabelTipoUsuario,
  getCorTipoUsuario,
  TIPOS_USUARIO,
  type ModuloSistema,
  type PermissaoTipoUsuario,
} from "@/lib/permissoesModuloApi";

const ICONES_TIPO: Record<string, any> = {
  MASTER: Crown,
  ADMIN: Shield,
  COMERCIAL: Briefcase,
  ATENDIMENTO: Headphones,
  COLABORADOR: Users,
  CLIENTE: User,
  ESPECIFICADOR: UserCog,
  FORNECEDOR: Truck,
  JURIDICO: Scale,
  FINANCEIRO: Coins,
};

// Lista de tipos de usuário para preview
const TIPOS_PREVIEW: TipoUsuario[] = [
  "MASTER",
  "ADMIN",
  "COMERCIAL",
  "ATENDIMENTO",
  "COLABORADOR",
  "CLIENTE",
  "ESPECIFICADOR",
  "FORNECEDOR",
  "JURIDICO",
  "FINANCEIRO",
];

export default function PlantaSistemaPage() {
  const { toast } = useToast();
  const { isMaster, loading: loadingUser } = useUsuarioLogado();
  const { previewTipo, isPreviewMode, startPreview, stopPreview } = usePreviewTipoUsuario();

  const [modulos, setModulos] = useState<ModuloSistema[]>([]);
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoTipoUsuario[]>>({});
  const [tipoSelecionado, setTipoSelecionado] = useState("MASTER");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Ref para acessar stopPreview no cleanup sem causar re-render
  const stopPreviewRef = useRef(stopPreview);
  stopPreviewRef.current = stopPreview;

  // Carregar dados ao montar e limpar preview ao desmontar
  useEffect(() => {
    carregarDados();

    // Cleanup: limpar preview mode ao sair da página para evitar que Master fique preso em visÍo limitada
    return () => {
      const previewAtivo = sessionStorage.getItem("wg_preview_tipo_usuario");
      if (previewAtivo) {
        stopPreviewRef.current();
        if (import.meta.env.DEV) console.log("[PlantaSistema] Preview mode limpo automaticamente ao sair da página");
      }
    };
  }, []);

  useEffect(() => {
    if (tipoSelecionado && !permissoes[tipoSelecionado]) {
      carregarPermissoesTipo(tipoSelecionado);
    }
  }, [tipoSelecionado]);

  async function carregarDados() {
    try {
      setLoading(true);
      const modulosData = await listarModulos();
      setModulos(modulosData);

      // Carregar permissões do tipo selecionado
      await carregarPermissoesTipo(tipoSelecionado);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar módulos do sistema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function carregarPermissoesTipo(tipo: string) {
    try {
      const perms = await listarPermissoesTipoUsuario(tipo);
      setPermissoes((prev) => ({
        ...prev,
        [tipo]: perms,
      }));
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  }

  function getPermissaoModulo(moduloId: string): PermissaoTipoUsuario | undefined {
    return permissoes[tipoSelecionado]?.find((p) => p.modulo_id === moduloId);
  }

  async function handleTogglePermissao(
    moduloId: string,
    campo: "pode_visualizar" | "pode_criar" | "pode_editar" | "pode_excluir" | "pode_exportar" | "pode_importar",
    valor: boolean
  ) {
    // NÍo permitir alterar permissões do MASTER (sempre tem tudo)
    if (tipoSelecionado === "MASTER") {
      toast({
        title: "AçÍo nÍo permitida",
        description: "O Founder & CEO sempre tem acesso total ao sistema",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);

      // Buscar permissÍo atual para manter os outros valores
      const permAtual = getPermissaoModulo(moduloId);

      // Se está desabilitando "pode_visualizar", desabilitar todos os outros também
      let permissaoCompleta;
      if (campo === "pode_visualizar" && valor === false) {
        // Desabilitar tudo quando "Ver" for desativado
        permissaoCompleta = {
          pode_visualizar: false,
          pode_criar: false,
          pode_editar: false,
          pode_excluir: false,
          pode_exportar: false,
          pode_importar: false,
        };
      } else {
        permissaoCompleta = {
          pode_visualizar: permAtual?.pode_visualizar || false,
          pode_criar: permAtual?.pode_criar || false,
          pode_editar: permAtual?.pode_editar || false,
          pode_excluir: permAtual?.pode_excluir || false,
          pode_exportar: permAtual?.pode_exportar || false,
          pode_importar: permAtual?.pode_importar || false,
          [campo]: valor, // Sobrescrever o campo específico
        };
      }

      await atualizarPermissao(tipoSelecionado, moduloId, permissaoCompleta);

      // Atualizar estado local
      setPermissoes((prev) => {
        const permsAtuais = prev[tipoSelecionado] || [];
        const idx = permsAtuais.findIndex((p) => p.modulo_id === moduloId);

        if (idx >= 0) {
          const novasPerms = [...permsAtuais];
          // Se desabilitou "Ver", aplicar todas as alterações
          if (campo === "pode_visualizar" && valor === false) {
            novasPerms[idx] = { ...novasPerms[idx], ...permissaoCompleta };
          } else {
            novasPerms[idx] = { ...novasPerms[idx], [campo]: valor };
          }
          return { ...prev, [tipoSelecionado]: novasPerms };
        } else {
          return {
            ...prev,
            [tipoSelecionado]: [
              ...permsAtuais,
              {
                id: "",
                tipo_usuario: tipoSelecionado,
                modulo_id: moduloId,
                ...permissaoCompleta,
              },
            ],
          };
        }
      });

      toast({
        title: "PermissÍo atualizada",
        description: `PermissÍo alterada com sucesso`,
      });

      // Recarregar do banco para garantir sincronizaçÍo
      await carregarPermissoesTipo(tipoSelecionado);
    } catch (error) {
      console.error("Erro ao atualizar permissÍo:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissÍo",
        variant: "destructive",
      });
      // Recarregar mesmo em erro para sincronizar estado
      await carregarPermissoesTipo(tipoSelecionado);
    } finally {
      setSalvando(false);
    }
  }

  // Toggle para ativar/desativar todos os módulos de uma seçÍo
  async function handleToggleSecao(modulosSecao: ModuloSistema[], ativar: boolean) {
    if (tipoSelecionado === "MASTER") {
      toast({
        title: "AçÍo nÍo permitida",
        description: "O Founder & CEO sempre tem acesso total ao sistema",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);

      // Atualizar todos os módulos da seçÍo
      for (const modulo of modulosSecao) {
        const permissaoCompleta = {
          pode_visualizar: ativar,
          pode_criar: ativar,
          pode_editar: ativar,
          pode_excluir: ativar,
          pode_exportar: ativar,
          pode_importar: ativar,
        };

        await atualizarPermissao(tipoSelecionado, modulo.id, permissaoCompleta);
      }

      // Atualizar estado local
      setPermissoes((prev) => {
        const permsAtuais = [...(prev[tipoSelecionado] || [])];

        for (const modulo of modulosSecao) {
          const idx = permsAtuais.findIndex((p) => p.modulo_id === modulo.id);
          const novaPerm = {
            id: "",
            tipo_usuario: tipoSelecionado,
            modulo_id: modulo.id,
            pode_visualizar: ativar,
            pode_criar: ativar,
            pode_editar: ativar,
            pode_excluir: ativar,
            pode_exportar: ativar,
            pode_importar: ativar,
          };

          if (idx >= 0) {
            permsAtuais[idx] = novaPerm;
          } else {
            permsAtuais.push(novaPerm);
          }
        }

        return { ...prev, [tipoSelecionado]: permsAtuais };
      });

      toast({
        title: ativar ? "SeçÍo ativada" : "SeçÍo desativada",
        description: `${modulosSecao.length} módulos ${ativar ? "ativados" : "desativados"} com sucesso`,
      });

      // Recarregar permissões para garantir sincronizaçÍo
      await carregarPermissoesTipo(tipoSelecionado);
    } catch (error) {
      console.error("Erro ao atualizar seçÍo:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissões da seçÍo",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }

  // Verificar se todos os módulos de uma seçÍo estÍo ativos
  function isSecaoAtiva(modulosSecao: ModuloSistema[]): boolean {
    if (tipoSelecionado === "MASTER") return true;

    return modulosSecao.every((modulo) => {
      const perm = getPermissaoModulo(modulo.id);
      return perm?.pode_visualizar === true;
    });
  }

  // Agrupar módulos por seçÍo
  const modulosPorSecao = modulos.reduce((acc, modulo) => {
    if (!acc[modulo.secao]) {
      acc[modulo.secao] = [];
    }
    acc[modulo.secao].push(modulo);
    return acc;
  }, {} as Record<string, ModuloSistema[]>);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Apenas MASTER pode acessar esta página
  if (!isMaster) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Shield className="w-12 h-12 text-red-500" />
              <div>
                <h2 className="text-[20px] font-light text-red-700">Acesso Restrito</h2>
                <p className="text-[12px] text-red-600">
                  Apenas o Founder & CEO pode acessar a configuraçÍo de permissões do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-600" />
            Planta do Sistema
          </h1>
          <p className="text-[12px] text-gray-600 font-poppins mt-1">
            Configure as permissões de acesso para cada tipo de usuário
          </p>
        </div>
      </div>

      {/* Barra de Preview Ativo */}
      {isPreviewMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-[12px] text-amber-800">
                Modo Preview Ativo: {LABELS_TIPO_USUARIO[previewTipo!]}
              </p>
              <p className="text-[12px] text-amber-600">
                O menu lateral está exibindo a visÍo deste tipo de usuário
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={stopPreview}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Encerrar Preview
          </Button>
        </div>
      )}

      {/* SeçÍo: Visualizar Como */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-[20px] font-light flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Visualizar Como
          </CardTitle>
          <CardDescription>
            Clique em um tipo de usuário para ver como o menu lateral aparece para ele.
            Útil para validar as permissões configuradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {TIPOS_PREVIEW.map((tipo) => {
              const Icone = ICONES_TIPO[tipo] || User;
              const isActive = previewTipo === tipo;

              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      stopPreview();
                    } else {
                      startPreview(tipo);
                      toast({
                        title: `Preview: ${LABELS_TIPO_USUARIO[tipo]}`,
                        description: "O menu lateral agora mostra a visÍo deste usuário",
                      });
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    isActive
                      ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                      : "border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50"
                  }`}
                >
                  <Icone
                    className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[12px] ${
                      isActive ? "text-blue-700" : "text-gray-600"
                    }`}
                  >
                    {LABELS_TIPO_USUARIO[tipo]}
                  </span>
                  {isActive && (
                    <Badge className="bg-blue-500 text-white text-[12px] px-1.5 py-0">
                      Ativo
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-gray-500 mt-4">
            Dica: Quando o preview estiver ativo, navegue pelo sistema para ver exatamente o que cada tipo de usuário pode acessar.
          </p>
        </CardContent>
      </Card>

      {/* SeleçÍo de Tipo de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-light">Selecione o Tipo de Usuário</CardTitle>
          <CardDescription>
            Escolha o tipo de usuário para visualizar e editar suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {TIPOS_USUARIO.map((tipo) => {
              const Icone = ICONES_TIPO[tipo.value] || User;
              const isSelected = tipoSelecionado === tipo.value;
              const cor = getCorTipoUsuario(tipo.value);

              return (
                <button
                  key={tipo.value}
                  onClick={() => setTipoSelecionado(tipo.value)}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    isSelected
                      ? `border-${cor}-500 bg-${cor}-50 ring-2 ring-${cor}-200`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <Icone
                    className={`w-6 h-6 ${isSelected ? `text-${cor}-600` : "text-gray-500"}`}
                  />
                  <span
                    className={`text-[12px] ${
                      isSelected ? `text-${cor}-700` : "text-gray-600"
                    }`}
                  >
                    {tipo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Tipo Selecionado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const Icone = ICONES_TIPO[tipoSelecionado] || User;
                return <Icone className="w-6 h-6 text-orange-600" />;
              })()}
              <div>
                <CardTitle>{getLabelTipoUsuario(tipoSelecionado)}</CardTitle>
                <CardDescription>
                  {TIPOS_USUARIO.find((t) => t.value === tipoSelecionado)?.descricao}
                </CardDescription>
              </div>
            </div>
            {tipoSelecionado === "MASTER" && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                <Crown className="w-3 h-3 mr-1" />
                Acesso Total
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de Permissões */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <p className="text-gray-600">Carregando módulos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(modulosPorSecao).map(([secao, modulosSecao]) => (
            <Card key={secao}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {secao}
                    <Badge variant="outline" className="ml-2 text-[12px]">
                      {modulosSecao.length} módulos
                    </Badge>
                  </CardTitle>
                  {tipoSelecionado !== "MASTER" && (
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-gray-500">
                        {isSecaoAtiva(modulosSecao) ? "Tudo ativo" : "Parcial/Inativo"}
                      </span>
                      <Switch
                        checked={isSecaoAtiva(modulosSecao)}
                        onCheckedChange={(checked) => handleToggleSecao(modulosSecao, checked)}
                        disabled={salvando}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[250px]">Módulo</TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Plus className="w-4 h-4" />
                          <span>Criar</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center w-[100px]">
                        <div className="flex items-center justify-center gap-1">
                          <Upload className="w-4 h-4" />
                          <span>Import</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modulosSecao.map((modulo) => {
                      const perm = getPermissaoModulo(modulo.id);
                      const isMasterTipo = tipoSelecionado === "MASTER";
                      // Se "Ver" estiver desabilitado, os demais também ficam desabilitados
                      const podeVer = isMasterTipo || perm?.pode_visualizar || false;
                      const outrosDesabilitados = !podeVer && !isMasterTipo;

                      return (
                        <TableRow key={modulo.id} className={outrosDesabilitados ? "opacity-60" : ""}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{modulo.nome}</div>
                              <div className="text-[12px] text-gray-500">{modulo.path}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={podeVer}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_visualizar", v)
                              }
                              disabled={isMasterTipo || salvando}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isMasterTipo || perm?.pode_criar || false}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_criar", v)
                              }
                              disabled={isMasterTipo || salvando || outrosDesabilitados}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isMasterTipo || perm?.pode_editar || false}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_editar", v)
                              }
                              disabled={isMasterTipo || salvando || outrosDesabilitados}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isMasterTipo || perm?.pode_excluir || false}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_excluir", v)
                              }
                              disabled={isMasterTipo || salvando || outrosDesabilitados}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isMasterTipo || perm?.pode_exportar || false}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_exportar", v)
                              }
                              disabled={isMasterTipo || salvando || outrosDesabilitados}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={isMasterTipo || perm?.pode_importar || false}
                              onCheckedChange={(v) =>
                                handleTogglePermissao(modulo.id, "pode_importar", v)
                              }
                              disabled={isMasterTipo || salvando || outrosDesabilitados}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



