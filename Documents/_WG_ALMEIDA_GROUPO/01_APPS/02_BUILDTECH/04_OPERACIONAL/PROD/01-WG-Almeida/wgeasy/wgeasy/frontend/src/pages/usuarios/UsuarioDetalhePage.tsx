/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/usuarios/UsuarioDetalhePage.tsx

import { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, UserCheck, UserX, Key } from "lucide-react";

import {

  buscarUsuarioPorId,

  formatarCPF,

  obterLabelTipoUsuario,

  obterCorTipoUsuario,

  type UsuarioCompleto,

} from "@/lib/usuariosApi";

import { useToast } from "@/components/ui/use-toast";



export default function UsuarioDetalhePage() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { toast } = useToast();

  const [usuario, setUsuario] = useState<UsuarioCompleto | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (id) {

      carregarUsuario();

    }

  }, [id]);



  async function carregarUsuario() {

    try {

      setLoading(true);

      const data = await buscarUsuarioPorId(id!);

      if (!data) {

        throw new Error("Usuário nÍo encontrado");

      }

      setUsuario(data);

    } catch (error) {

      console.error("Erro ao carregar usuário:", error);

      toast({

        title: "Erro",

        description: "Erro ao carregar dados do usuário",

      });

      navigate("/usuarios");

    } finally {

      setLoading(false);

    }

  }



  if (loading) {

    return (

      <div className="max-w-4xl mx-auto p-6">

        <div className="text-center py-12">

          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>

          <p className="text-gray-600 mt-4">Carregando usuário...</p>

        </div>

      </div>

    );

  }



  if (!usuario) {

    return null;

  }



  return (

    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <Button

            variant="ghost"

            onClick={() => navigate("/usuarios")}

            className="hover:bg-gray-100"

          >

            <ArrowLeft className="w-4 h-4 mr-2" />

            Voltar

          </Button>

          <div>

            <h1 className="text-[24px] font-oswald font-normal text-gray-900">

              Detalhes do Usuário

            </h1>

            <p className="text-[12px] text-gray-600 font-poppins mt-1">{usuario.nome}</p>

          </div>

        </div>

        <Button

          onClick={() => navigate(`/usuarios/editar/${usuario.id}`)}

          className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-[14px]"

        >

          <Edit className="w-4 h-4" />

          Editar

        </Button>

      </div>



      {/* Informações Básicas */}

      <Card>

        <CardHeader>

          <CardTitle>Informações Básicas</CardTitle>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="flex items-center gap-6">

            {usuario.avatar_url ? (

              <img

                src={usuario.avatar_url}

                alt={usuario.nome}

                className="w-24 h-24 rounded-full object-cover"

              />

            ) : (

              <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center">

                <span className="text-orange-600 font-normal text-3xl">

                  {usuario.nome.charAt(0).toUpperCase()}

                </span>

              </div>

            )}

            <div className="flex-1 space-y-2">

              <div>

                <label className="text-sm font-medium text-gray-500">Nome</label>

                <p className="text-[14px] font-medium">{usuario.nome}</p>

              </div>

              <div className="flex gap-4">

                <div>

                  <label className="text-sm font-medium text-gray-500">CPF</label>

                  <p className="font-mono">{formatarCPF(usuario.cpf)}</p>

                </div>

                {usuario.email && (

                  <div>

                    <label className="text-sm font-medium text-gray-500">Email</label>

                    <p>{usuario.email}</p>

                  </div>

                )}

              </div>

            </div>

          </div>



          <div className="grid grid-cols-2 gap-4 pt-4 border-t">

            <div>

              <label className="text-sm font-medium text-gray-500">Tipo de Usuário</label>

              <div className="mt-1">

                <Badge

                  className={`bg-${obterCorTipoUsuario(usuario.tipo_usuario)}-50 text-${obterCorTipoUsuario(usuario.tipo_usuario)}-700 border-${obterCorTipoUsuario(usuario.tipo_usuario)}-200`}

                >

                  {obterLabelTipoUsuario(usuario.tipo_usuario)}

                </Badge>

              </div>

            </div>

            <div>

              <label className="text-sm font-medium text-gray-500">Status</label>

              <div className="mt-1">

                {usuario.ativo ? (

                  <Badge className="bg-green-50 text-green-700 border-green-200">

                    <UserCheck className="w-3 h-3 mr-1" />

                    Ativo

                  </Badge>

                ) : (

                  <Badge className="bg-red-50 text-red-700 border-red-200">

                    <UserX className="w-3 h-3 mr-1" />

                    Inativo

                  </Badge>

                )}

              </div>

            </div>

          </div>



          {usuario.ultimo_acesso && (

            <div className="pt-4 border-t">

              <label className="text-sm font-medium text-gray-500">Último Acesso</label>

              <p className="text-sm text-gray-600">

                {new Date(usuario.ultimo_acesso).toLocaleString("pt-BR")}

              </p>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  );

}


