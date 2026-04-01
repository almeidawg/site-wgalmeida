/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/ClienteArquivosPage.tsx
// Página de arquivos da área do cliente com iframe do Google Drive

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FolderOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import ClienteArquivos from '@/components/cliente/ClienteArquivos';
import { useImpersonation, ImpersonationBar } from '@/hooks/useImpersonation';

// FunçÍo para extrair ID de pasta do Google Drive a partir de um link
function extractDriveFolderId(driveLink: string | null | undefined): string | null {
  if (!driveLink) return null;
  // Padrões comuns de links do Drive:
  // https://drive.google.com/drive/folders/FOLDER_ID?...
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const match = driveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export default function ClienteArquivosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    isImpersonating,
    impersonatedUser,
    stopImpersonation,
    canImpersonate,
    loading: impersonationLoading,
  } = useImpersonation();

  const [loading, setLoading] = useState(true);
  const [clienteInfo, setClienteInfo] = useState<{
    clienteNome: string;
    oportunidadeId: string;
    podeUpload: boolean;
    driveLink: string | null;
    driveFolderId: string | null;
  } | null>(null);

  // ID do cliente passado na URL (para acesso master)
  const clienteIdParam = searchParams.get('cliente_id');

  useEffect(() => {
    if (!impersonationLoading) {
      carregarInformacoesCliente();
    }
  }, [impersonationLoading, isImpersonating, clienteIdParam]);

  async function carregarInformacoesCliente() {
    try {
      let pessoaId: string | null = null;

      // Se estiver impersonando, usar o ID do cliente impersonado
      if (isImpersonating && impersonatedUser) {
        pessoaId = impersonatedUser.id;
      } else if (clienteIdParam && canImpersonate) {
        // Master/Admin acessando com cliente_id na URL (aguardando impersonaçÍo carregar)
        pessoaId = clienteIdParam;
      } else {
        // Fluxo normal - pegar usuário logado
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        // Buscar informações do usuário/cliente
        const { data: usuario, error: erroUsuario } = await supabase
          .from('usuarios')
          .select('pessoa_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (erroUsuario || !usuario) {
          console.error('Erro ao buscar usuário:', erroUsuario);
          return;
        }

        pessoaId = usuario.pessoa_id;
      }

      if (!pessoaId) {
        console.error('Nenhum ID de pessoa encontrado');
        return;
      }

      // Buscar pessoa (cliente) incluindo drive_link
      const { data: pessoa, error: erroPessoa } = await supabase
        .from('pessoas')
        .select('id, nome, tipo, drive_link')
        .eq('id', pessoaId)
        .maybeSingle();

      if (erroPessoa || !pessoa) {
        console.error('Erro ao buscar pessoa:', erroPessoa);
        return;
      }

      // Extrair folder ID do drive_link
      const driveLink = pessoa.drive_link || null;
      const driveFolderId = extractDriveFolderId(driveLink);

      // Buscar oportunidade/contrato do cliente
      const { data: oportunidade, error: erroOportunidade } = await supabase
        .from('oportunidades')
        .select('id')
        .eq('cliente_id', pessoa.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (erroOportunidade || !oportunidade) {
        console.error('Erro ao buscar oportunidade:', erroOportunidade);
        // Usar ID genérico se não encontrar oportunidade
        setClienteInfo({
          clienteNome: pessoa.nome,
          oportunidadeId: `CLIENTE-${pessoa.id}`,
          podeUpload: true,
          driveLink,
          driveFolderId,
        });
      } else {
        setClienteInfo({
          clienteNome: pessoa.nome,
          oportunidadeId: oportunidade.id,
          podeUpload: true, // Cliente sempre pode fazer upload
          driveLink,
          driveFolderId,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || impersonationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!clienteInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erro ao carregar informações do cliente</p>
          <Button onClick={() => navigate('/area-cliente')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // URL de voltar (preservando cliente_id se impersonando)
  const voltarUrl = isImpersonating && clienteIdParam
    ? `/wgx?cliente_id=${clienteIdParam}`
    : '/wgx';

  return (
    <>
      {/* Barra de impersonaçÍo */}
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={stopImpersonation}
        />
      )}

      <div className={`max-w-7xl mx-auto p-6 space-y-6 ${isImpersonating ? "pt-20" : ""}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(voltarUrl)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-oswald font-normal text-gray-900">
              {isImpersonating ? `Arquivos de ${impersonatedUser?.nome}` : 'Meus Arquivos'}
            </h1>
            <p className="text-sm text-gray-600">
              Visualize e envie arquivos do seu projeto
            </p>
          </div>
        </div>

        {/* Iframe do Google Drive - se pasta configurada */}
        {clienteInfo.driveFolderId ? (
          <div className="space-y-4">
            {/* Card com informações e link externo */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-normal text-gray-900">Pasta do Projeto</h2>
                    <p className="text-sm text-gray-600">
                      Acesse todos os arquivos do seu projeto WG Almeida
                    </p>
                  </div>
                </div>
                {clienteInfo.driveLink && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(clienteInfo.driveLink!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir no Google Drive
                  </Button>
                )}
              </div>
            </div>

            {/* Iframe do Google Drive */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <iframe
                src={`https://drive.google.com/embeddedfolderview?id=${clienteInfo.driveFolderId}#grid`}
                className="w-full h-[600px] border-0"
                title="Arquivos do Projeto - Google Drive"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Dica */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Dica:</p>
                <p>Clique em "Abrir no Google Drive" para ter acesso completo aos arquivos, incluindo download e visualizaçÍo em tela cheia.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Fallback quando não há pasta configurada */
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-normal text-gray-900 mb-2">
              Pasta não configurada
            </h3>
            <p className="text-lg text-gray-600 mb-4 max-w-md mx-auto">
              A pasta do Google Drive ainda não foi configurada para o seu projeto.
              Entre em contato com a equipe WG Almeida para mais informações.
            </p>
            <Button
              variant="outline"
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            >
              Falar com a WG Almeida
            </Button>
          </div>
        )}

        {/* Componente de Upload de Arquivos */}
        <ClienteArquivos
          clienteNome={clienteInfo.clienteNome}
          oportunidadeId={clienteInfo.oportunidadeId}
          podeUpload={clienteInfo.podeUpload}
        />
      </div>
    </>
  );
}


