// src/components/cliente/MateriaisCliente.tsx
// Componente para exibir materiais do projeto (arquivos do Google Drive + Diário de Obras)
// Layout horizontal com visualizador de arquivos ao clicar na pasta

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  Calendar,
  FolderOpen,
  X,
  Eye,
  ChevronRight,
  Loader2,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileType,
  Folder,
  ArrowLeft,
  Download
} from 'lucide-react';
import { googleDriveService, type MapeamentoPastas } from '@/services/googleDriveBrowserService';
import { supabase } from '@/lib/supabaseClient';

interface MateriaisClienteProps {
  clienteNome: string;
  oportunidadeId: string;
}

interface DiarioObra {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  fotos: string[];
  created_at: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string | null;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
}

export default function MateriaisCliente({ clienteNome, oportunidadeId }: MateriaisClienteProps) {
  const [carregando, setCarregando] = useState(true);
  const [mapeamento, setMapeamento] = useState<MapeamentoPastas | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);
  const [diarioObras, setDiarioObras] = useState<DiarioObra[]>([]);

  // Estados do visualizador de arquivos
  const [pastaAberta, setPastaAberta] = useState<{ tipo: string; id: string; nome: string } | null>(null);
  const [arquivosDaPasta, setArquivosDaPasta] = useState<DriveFile[]>([]);
  const [carregandoArquivos, setCarregandoArquivos] = useState(false);

  const carregarMateriais = useCallback(async () => {
    try {
      setCarregando(true);

      // Conectar ao Google Drive e buscar estrutura
      await googleDriveService.authenticate();
      const result = await googleDriveService.encontrarOuCriarEstrutura(clienteNome, oportunidadeId);

      // IMPORTANTE: Para o cliente, mostrar APENAS a pasta (C) compartilhável
      // A pasta (C) está DENTRO da pasta principal do cliente
      if (result.pastaId) {
        const pastaC = await googleDriveService.buscarPastaCompartilhavel(result.pastaId);
        if (pastaC) {
          setDriveFolderUrl(pastaC.webViewLink);

          // Buscar subpastas da pasta (C)
          const subpastas = await googleDriveService.listarSubpastas(pastaC.id);

          // Mapear para formato compatível com o componente
          setMapeamento({
            plantas: subpastas.find(p => p.name.toLowerCase().includes('projeto')) || null,
            fotos: subpastas.find(p => p.name.toLowerCase().includes('foto')) || null,
            documentos: subpastas.find(p => p.name.toLowerCase().includes('documento')) || null,
            outrasPasstas: subpastas.filter(p =>
              !p.name.toLowerCase().includes('projeto') &&
              !p.name.toLowerCase().includes('foto') &&
              !p.name.toLowerCase().includes('documento')
            ),
          });
        } else {
          // Fallback: se não encontrar pasta (C), não mostrar nada para o cliente
          console.log('⚠️ Pasta compartilhável (C) não encontrada - cliente não verá arquivos');
          setMapeamento(null);
          setDriveFolderUrl(null);
        }
      } else {
        setMapeamento(result.mapeamento);
        setDriveFolderUrl(result.pastaUrl);
      }

      // Buscar diário de obras (se existir tabela)
      try {
        const { data: diario, error } = await supabase
          .from('diario_obras')
          .select('*')
          .eq('oportunidade_id', oportunidadeId)
          .order('data', { ascending: false })
          .limit(5);

        if (!error && diario) {
          setDiarioObras(diario);
        }
      } catch {
        console.log('Tabela diario_obras não existe ainda');
      }
    } catch (error) {
      console.error('Erro ao carregar materiais:', error);
    } finally {
      setCarregando(false);
    }
  }, [clienteNome, oportunidadeId]);

  useEffect(() => {
    carregarMateriais();
  }, [carregarMateriais]);

  // Abrir pasta e listar arquivos
  async function abrirPasta(tipo: string, pastaId: string, pastaNome: string) {
    setPastaAberta({ tipo, id: pastaId, nome: pastaNome });
    setCarregandoArquivos(true);
    setArquivosDaPasta([]);

    try {
      const arquivos = await googleDriveService.listarArquivosDaPasta(pastaId);
      setArquivosDaPasta(arquivos);
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
    } finally {
      setCarregandoArquivos(false);
    }
  }

  // Fechar visualizador
  function fecharVisualizador() {
    setPastaAberta(null);
    setArquivosDaPasta([]);
  }

  // Obter ícone por tipo MIME
  function getIconePorMimeType(mimeType: string) {
    if (mimeType.startsWith('image/')) return <FileImage className="w-8 h-8 text-purple-500" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-8 h-8 text-red-500" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-8 h-8 text-pink-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-600" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-8 h-8 text-blue-600" />;
    if (mimeType.includes('folder')) return <Folder className="w-8 h-8 text-yellow-500" />;
    return <FileType className="w-8 h-8 text-gray-500" />;
  }

  // Formatar tamanho do arquivo
  function formatarTamanho(bytes?: string): string {
    if (!bytes) return '-';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  // Formatar data
  function formatarData(dateStr: string): string {
    return parseDataLocal(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function parseDataLocal(valor: string) {
    const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoSemHora) {
      const [, ano, mes, dia] = isoSemHora;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    return new Date(valor);
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando materiais do projeto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Link do Drive */}
      {driveFolderUrl && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Pasta do Projeto no Google Drive</h3>
                  <p className="text-sm text-gray-600">Todos os seus documentos em um só lugar</p>
                </div>
              </div>
              <Button
                onClick={() => window.open(driveFolderUrl, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Drive
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISUALIZADOR DE ARQUIVOS (Modal/Painel) */}
      {pastaAberta && (
        <Card className="border-2 border-blue-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fecharVisualizador}
                  className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                  title="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 text-blue-600" />
                </button>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    {pastaAberta.nome}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    {arquivosDaPasta.length} arquivo(s) encontrado(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fecharVisualizador}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {carregandoArquivos ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Carregando arquivos...</span>
              </div>
            ) : arquivosDaPasta.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum arquivo nesta pasta</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {arquivosDaPasta.map((arquivo) => (
                  <div
                    key={arquivo.id}
                    className="group p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => window.open(arquivo.webViewLink, '_blank')}
                  >
                    {/* Thumbnail ou Ícone */}
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                      {arquivo.thumbnailLink ? (
                        <img
                          src={arquivo.thumbnailLink}
                          alt={arquivo.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={arquivo.thumbnailLink ? 'hidden' : ''}>
                        {getIconePorMimeType(arquivo.mimeType)}
                      </div>
                    </div>

                    {/* Nome e Info */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-900 truncate" title={arquivo.name}>
                        {arquivo.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{formatarTamanho(arquivo.size)}</span>
                        <span>{formatarData(arquivo.createdTime)}</span>
                      </div>
                    </div>

                    {/* Ações ao hover */}
                    <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(arquivo.webViewLink, '_blank');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Ver
                      </Button>
                      {arquivo.webContentLink && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(arquivo.webContentLink, '_blank');
                          }}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PASTAS DO PROJETO - Layout Horizontal */}
      {mapeamento && !pastaAberta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              📂 Pastas do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Grid Horizontal de Pastas */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
              {/* Plantas */}
              {mapeamento.plantas && (
                <div
                  className="flex-shrink-0 w-44 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => abrirPasta('plantas', mapeamento.plantas!.id, mapeamento.plantas!.name)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-normal text-gray-900 text-sm mb-1">Plantas e Projetos</h4>
                    <p className="text-xs text-gray-500 truncate w-full">{mapeamento.plantas.name}</p>
                    <div className="mt-3 flex items-center gap-1 text-blue-600 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      Ver Arquivos
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* Fotos */}
              {mapeamento.fotos && (
                <div
                  className="flex-shrink-0 w-44 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => abrirPasta('fotos', mapeamento.fotos!.id, mapeamento.fotos!.name)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-normal text-gray-900 text-sm mb-1">Fotos do Projeto</h4>
                    <p className="text-xs text-gray-500 truncate w-full">{mapeamento.fotos.name}</p>
                    <div className="mt-3 flex items-center gap-1 text-purple-600 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      Ver Arquivos
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos */}
              {mapeamento.documentos && (
                <div
                  className="flex-shrink-0 w-44 p-4 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => abrirPasta('documentos', mapeamento.documentos!.id, mapeamento.documentos!.name)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <File className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-normal text-gray-900 text-sm mb-1">Documentos</h4>
                    <p className="text-xs text-gray-500 truncate w-full">{mapeamento.documentos.name}</p>
                    <div className="mt-3 flex items-center gap-1 text-green-600 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      Ver Arquivos
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* Outras Pastas */}
              {mapeamento.outrasPasstas.slice(0, 5).map((pasta, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-44 p-4 bg-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => abrirPasta('outras', pasta.id, pasta.name)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FolderOpen className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="font-normal text-gray-900 text-sm mb-1 truncate w-full" title={pasta.name}>
                      {pasta.name}
                    </h4>
                    <p className="text-xs text-gray-500">Pasta adicional</p>
                    <div className="mt-3 flex items-center gap-1 text-orange-600 text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      Ver Arquivos
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Indicador de scroll horizontal */}
            {(mapeamento.outrasPasstas.length > 3 || (mapeamento.plantas && mapeamento.fotos && mapeamento.documentos)) && (
              <p className="text-xs text-center text-gray-400 mt-2">
                ← Arraste para ver mais pastas →
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diário de Obras */}
      {diarioObras.length > 0 && !pastaAberta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              📔 Diário de Obras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diarioObras.map((registro) => (
                <div
                  key={registro.id}
                  className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-normal text-gray-900">{registro.titulo}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(registro.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{registro.descricao}</p>

                  {/* Fotos do Diário */}
                  {registro.fotos && registro.fotos.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                      {registro.fotos.map((foto, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-gray-200 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(foto, '_blank')}
                        >
                          <img
                            src={foto}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem se não houver materiais */}
      {!mapeamento?.plantas && !mapeamento?.fotos && !mapeamento?.documentos && diarioObras.length === 0 && !pastaAberta && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6 text-center">
            <p className="text-amber-800">
              📋 Ainda não há materiais disponíveis para este projeto.
            </p>
            <p className="text-sm text-amber-700 mt-2">
              Os materiais serÍo adicionados pela equipe WG conforme o projeto avança.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


