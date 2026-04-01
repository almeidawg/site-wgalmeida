// src/components/cliente/ClienteArquivos.tsx
// Componente para área do cliente visualizar e fazer upload de arquivos

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  Folder,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { googleDriveService, type MapeamentoPastas } from '@/services/googleDriveBrowserService';

interface ClienteArquivosProps {
  clienteNome: string;
  oportunidadeId: string;
  podeUpload: boolean;
  /** SEGURANÇA (VER-017): ID da pasta específica do cliente (de pessoas.drive_folder_id) */
  clienteDriveFolderId?: string | null;
}

interface ArquivoLocal {
  file: File;
  tipo: 'plantas' | 'fotos' | 'documentos';
  preview?: string;
}

export default function ClienteArquivos({ clienteNome, oportunidadeId, podeUpload, clienteDriveFolderId }: ClienteArquivosProps) {
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);
  const [mapeamento, setMapeamento] = useState<MapeamentoPastas | null>(null);
  const [arquivosParaUpload, setArquivosParaUpload] = useState<ArquivoLocal[]>([]);
  const [fazendoUpload, setFazendoUpload] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // FunçÍo de conexÍo ao Google Drive
  const conectarGoogleDrive = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      // Autenticar
      await googleDriveService.authenticate();

      // SEGURANÇA (VER-017): Se cliente tem pasta própria configurada, usar ela
      // Isso impede que o cliente veja a estrutura da pasta raiz
      if (clienteDriveFolderId) {
        // Usar pasta isolada do cliente
        const mapeamentoCliente = await googleDriveService.mapearEstruturaPastas(clienteDriveFolderId);
        setDriveFolderId(clienteDriveFolderId);
        setDriveFolderUrl(`https://drive.google.com/drive/folders/${clienteDriveFolderId}`);
        setMapeamento(mapeamentoCliente);
      } else {
        // Fallback: Buscar ou criar estrutura (apenas se não tem pasta configurada)
        const result = await googleDriveService.encontrarOuCriarEstrutura(clienteNome, oportunidadeId);
        setDriveFolderId(result.pastaId);
        setDriveFolderUrl(result.pastaUrl);
        setMapeamento(result.mapeamento);
      }

      setConectado(true);
    } catch (error) {
      console.error('Erro ao conectar Google Drive:', error);
      setErro('não foi possível conectar ao Google Drive. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [clienteNome, oportunidadeId, clienteDriveFolderId]);

  // Conectar ao Google Drive automaticamente ao carregar
  useEffect(() => {
    if (!conectado) {
      conectarGoogleDrive();
    }
  }, [conectado, conectarGoogleDrive]);

  // Detectar tipo de arquivo automaticamente
  function detectarTipoArquivo(fileName: string): 'plantas' | 'fotos' | 'documentos' {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Plantas/Projetos
    if (['pdf', 'dwg', 'dxf', 'skp', 'rvt'].includes(ext)) {
      return 'plantas';
    }

    // Fotos
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) {
      return 'fotos';
    }

    // Documentos
    return 'documentos';
  }

  // Adicionar arquivos para upload
  const handleFilesSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const novosArquivos: ArquivoLocal[] = Array.from(files).map((file) => {
      const tipo = detectarTipoArquivo(file.name);

      // Criar preview para imagens
      let preview: string | undefined;
      if (tipo === 'fotos') {
        preview = URL.createObjectURL(file);
      }

      return { file, tipo, preview };
    });

    setArquivosParaUpload((prev) => [...prev, ...novosArquivos]);
  }, []);

  // Remover arquivo da lista
  function removerArquivo(index: number) {
    setArquivosParaUpload((prev) => {
      const novo = [...prev];
      // Revogar preview se existir
      if (novo[index].preview) {
        URL.revokeObjectURL(novo[index].preview!);
      }
      novo.splice(index, 1);
      return novo;
    });
  }

  // Fazer upload dos arquivos
  async function fazerUpload() {
    if (!driveFolderId || !mapeamento || arquivosParaUpload.length === 0) return;

    try {
      setFazendoUpload(true);
      setErro(null);

      const erros: string[] = [];
      let uploadCount = 0;

      for (const { file, tipo } of arquivosParaUpload) {
        try {
          // Determinar pasta de destino
          let pastaDestino: string | null = null;

          switch (tipo) {
            case 'plantas':
              pastaDestino = mapeamento.plantas?.id || null;
              break;
            case 'fotos':
              pastaDestino = mapeamento.fotos?.id || null;
              break;
            case 'documentos':
              pastaDestino = mapeamento.documentos?.id || null;
              break;
          }

          if (!pastaDestino) {
            erros.push(`${file.name}: Pasta de destino não encontrada`);
            continue;
          }

          // Upload
          await googleDriveService.uploadArquivo(file, pastaDestino);
          uploadCount++;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Erro desconhecido';
          erros.push(`${file.name}: ${msg}`);
        }
      }

      // Limpar arquivos após upload
      arquivosParaUpload.forEach((arq) => {
        if (arq.preview) URL.revokeObjectURL(arq.preview);
      });
      setArquivosParaUpload([]);

      // Mostrar resultado
      if (erros.length > 0) {
        setErro(`${uploadCount} arquivo(s) enviado(s) com sucesso.\n\nErros:\n${erros.join('\n')}`);
      } else {
        alert(`✅ ${uploadCount} arquivo(s) enviado(s) com sucesso!`);
      }
    } catch {
      setErro('Erro ao fazer upload dos arquivos. Tente novamente.');
    } finally {
      setFazendoUpload(false);
    }
  }

  // Ícone por tipo de arquivo
  function getIconePorTipo(tipo: string) {
    switch (tipo) {
      case 'plantas':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'fotos':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'documentos':
        return <File className="w-5 h-5 text-green-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Conectando ao Google Drive...</p>
        </div>
      </div>
    );
  }

  if (!conectado) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <h3 className="font-normal text-red-800 mb-2">Erro ao Conectar</h3>
              <p className="text-sm text-red-700 mb-4">{erro || 'não foi possível conectar ao Google Drive.'}</p>
              <Button onClick={conectarGoogleDrive}>Tentar Novamente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Info da Pasta */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Folder className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-normal text-gray-900">Seus Arquivos do Projeto</h3>
              </div>
              <p className="text-sm text-gray-600">
                Cliente: <span className="font-normal">{clienteNome}</span>
              </p>
            </div>
            {driveFolderUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(driveFolderUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Drive
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estrutura de Pastas Detectada */}
      {mapeamento && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📂 Pastas do Projeto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Plantas */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Plantas e Projetos</p>
                    <p className="text-xs text-gray-600">
                      {mapeamento.plantas?.name || 'Pasta não encontrada'}
                    </p>
                  </div>
                </div>
                {mapeamento.plantas && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(mapeamento.plantas!.webViewLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Fotos */}
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Fotos</p>
                    <p className="text-xs text-gray-600">
                      {mapeamento.fotos?.name || 'Pasta não encontrada'}
                    </p>
                  </div>
                </div>
                {mapeamento.fotos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(mapeamento.fotos!.webViewLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Documentos */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">Documentos</p>
                    <p className="text-xs text-gray-600">
                      {mapeamento.documentos?.name || 'Pasta não encontrada'}
                    </p>
                  </div>
                </div>
                {mapeamento.documentos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(mapeamento.documentos!.webViewLink, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload de Arquivos - Só mostra se tiver permissÍo */}
      {podeUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Enviar Seus Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Área de Drop */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelect(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Clique para selecionar ou arraste arquivos aqui
                </p>
                <p className="text-xs text-gray-500">
                  PDFs, Imagens, Documentos - SerÍo organizados automaticamente
                </p>
              </div>

              <input
                id="fileInput"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelect(e.target.files)}
              />

              {/* Lista de Arquivos para Upload */}
              {arquivosParaUpload.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      {arquivosParaUpload.length} arquivo(s) selecionado(s)
                    </p>
                    <Button
                      onClick={fazerUpload}
                      disabled={fazendoUpload}
                      size="sm"
                    >
                      {fazendoUpload ? 'Enviando...' : 'Enviar Todos'}
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {arquivosParaUpload.map((arquivo, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {arquivo.preview ? (
                          <img
                            src={arquivo.preview}
                            alt={arquivo.file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            {getIconePorTipo(arquivo.tipo)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {arquivo.file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {(arquivo.file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {arquivo.tipo}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerArquivo(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem de Erro */}
              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 whitespace-pre-line">{erro}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-1 text-sm text-blue-800">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>PDFs e DWGs vÍo para "Plantas e Projetos"</li>
                <li>Fotos (JPG, PNG) vÍo para "Fotos"</li>
                <li>Documentos (DOC, XLS) vÍo para "Documentos"</li>
                <li>Clique no ícone para abrir a pasta no Google Drive</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


