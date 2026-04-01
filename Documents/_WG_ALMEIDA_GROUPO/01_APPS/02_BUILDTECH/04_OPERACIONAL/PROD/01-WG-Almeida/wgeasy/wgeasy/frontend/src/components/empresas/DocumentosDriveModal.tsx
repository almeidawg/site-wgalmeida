// ============================================================
// MODAL: Documentos do Google Drive - Empresa/Sócio
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Folder,
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Link2,
} from 'lucide-react';
import { googleDriveService, type DriveFile } from '@/services/googleDriveBrowserService';
import { atualizarPastaDriveEmpresa, atualizarPastaDriveSocio } from '@/lib/empresasApi';

interface DocumentosDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'empresa' | 'socio';
  entidadeId: string;
  entidadeNome: string;
  folderId?: string | null;
  folderUrl?: string | null;
  onFolderUpdated?: (folderId: string, folderUrl: string) => void;
}

// ID da pasta base para empresas/sócios no Drive
const PASTA_BASE_EMPRESAS = '1ZQk7gHx8mNpF3rT5qL2wKjY9uA6bVcXd'; // Ajustar conforme necessário

export default function DocumentosDriveModal({
  isOpen,
  onClose,
  tipo,
  entidadeId,
  entidadeNome,
  folderId,
  folderUrl,
  onFolderUpdated,
}: DocumentosDriveModalProps) {
  const [carregando, setCarregando] = useState(false);
  const [arquivos, setArquivos] = useState<DriveFile[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [pastaCriadaId, setPastaCriadaId] = useState<string | null>(folderId || null);
  const [pastaCriadaUrl, setPastaCriadaUrl] = useState<string | null>(folderUrl || null);
  const [configurandoLink, setConfigurandoLink] = useState(false);
  const [linkManual, setLinkManual] = useState('');

  const carregarArquivos = useCallback(async () => {
    if (!pastaCriadaId) return;

    try {
      setCarregando(true);
      setErro(null);

      await googleDriveService.authenticate();
      const lista = await googleDriveService.listarArquivosDaPasta(pastaCriadaId);
      setArquivos(lista);
    } catch (error: unknown) {
      console.error('Erro ao carregar arquivos:', error);
      setErro('Erro ao carregar arquivos do Google Drive. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [pastaCriadaId]);

  useEffect(() => {
    if (isOpen && pastaCriadaId) {
      void carregarArquivos();
    }
  }, [isOpen, pastaCriadaId, carregarArquivos]);

  useEffect(() => {
    setPastaCriadaId(folderId || null);
    setPastaCriadaUrl(folderUrl || null);
  }, [folderId, folderUrl]);

  async function criarPastaDrive() {
    try {
      setCriandoPasta(true);
      setErro(null);

      await googleDriveService.authenticate();

      // Criar pasta com nome da entidade
      const nomeFormatado = tipo === 'empresa'
        ? `EMPRESA - ${entidadeNome.toUpperCase()}`
        : `SOCIO - ${entidadeNome.toUpperCase()}`;

      const result = await googleDriveService.criarPasta(nomeFormatado, PASTA_BASE_EMPRESAS);

      // Atualizar no banco de dados
      if (tipo === 'empresa') {
        await atualizarPastaDriveEmpresa(entidadeId, result.folderId, result.folderUrl);
      } else {
        await atualizarPastaDriveSocio(entidadeId, result.folderId, result.folderUrl);
      }

      setPastaCriadaId(result.folderId);
      setPastaCriadaUrl(result.folderUrl);

      if (onFolderUpdated) {
        onFolderUpdated(result.folderId, result.folderUrl);
      }

      // Carregar arquivos da pasta (estará vazia)
      await carregarArquivos();
    } catch (error: unknown) {
      console.error('Erro ao criar pasta:', error);
      setErro('Erro ao criar pasta no Google Drive. Verifique as permissões.');
    } finally {
      setCriandoPasta(false);
    }
  }

  async function vincularPastaExistente() {
    if (!linkManual.trim()) {
      setErro('Cole o link da pasta do Google Drive');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);

      // Extrair o ID da pasta do link
      // Formatos suportados:
      // https://drive.google.com/drive/folders/FOLDER_ID
      // https://drive.google.com/drive/u/0/folders/FOLDER_ID
      const match = linkManual.match(/folders\/([a-zA-Z0-9_-]+)/);

      if (!match || !match[1]) {
        setErro('Link inválido. Cole o link de uma pasta do Google Drive.');
        return;
      }

      const extractedFolderId = match[1];
      const extractedFolderUrl = `https://drive.google.com/drive/folders/${extractedFolderId}`;

      // Testar se a pasta existe e está acessível
      await googleDriveService.authenticate();

      try {
        await googleDriveService.listarArquivosDaPasta(extractedFolderId);
      } catch {
        setErro('não foi possível acessar a pasta. Verifique se ela existe e está compartilhada.');
        return;
      }

      // Atualizar no banco de dados
      if (tipo === 'empresa') {
        await atualizarPastaDriveEmpresa(entidadeId, extractedFolderId, extractedFolderUrl);
      } else {
        await atualizarPastaDriveSocio(entidadeId, extractedFolderId, extractedFolderUrl);
      }

      setPastaCriadaId(extractedFolderId);
      setPastaCriadaUrl(extractedFolderUrl);
      setConfigurandoLink(false);
      setLinkManual('');

      if (onFolderUpdated) {
        onFolderUpdated(extractedFolderId, extractedFolderUrl);
      }

      // Carregar arquivos
      await carregarArquivos();
    } catch (error: unknown) {
      console.error('Erro ao vincular pasta:', error);
      setErro('Erro ao vincular pasta. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  function getIconeArquivo(mimeType: string) {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-purple-500" />;
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (mimeType.includes('folder')) {
      return <Folder className="w-5 h-5 text-yellow-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  }

  function formatarTamanho(bytes?: string) {
    if (!bytes) return '-';
    const size = parseInt(bytes, 10);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-normal text-gray-900">
                Documentos - {tipo === 'empresa' ? 'Empresa' : 'Sócio'}
              </h2>
              <p className="text-sm text-gray-600">{entidadeNome}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Sem pasta vinculada */}
          {!pastaCriadaId && !configurandoLink && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-normal text-gray-700 mb-2">
                Nenhuma pasta vinculada
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Vincule uma pasta existente do Google Drive ou crie uma nova para armazenar os documentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setConfigurandoLink(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
                >
                  <Link2 size={18} />
                  Vincular Pasta Existente
                </button>
                <button
                  type="button"
                  onClick={criarPastaDrive}
                  disabled={criandoPasta}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {criandoPasta ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Folder size={18} />
                      Criar Nova Pasta
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Formulário para vincular pasta existente */}
          {!pastaCriadaId && configurandoLink && (
            <div className="py-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-normal text-blue-800 mb-2">Como vincular uma pasta:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Abra o Google Drive</li>
                  <li>Navegue até a pasta desejada</li>
                  <li>Clique com botÍo direito na pasta</li>
                  <li>Selecione "Copiar link"</li>
                  <li>Cole o link abaixo</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link da Pasta do Google Drive
                  </label>
                  <input
                    type="text"
                    value={linkManual}
                    onChange={(e) => setLinkManual(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConfigurandoLink(false);
                      setLinkManual('');
                      setErro(null);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={vincularPastaExistente}
                    disabled={carregando || !linkManual.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {carregando ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      'Vincular Pasta'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Com pasta vinculada - mostrar arquivos */}
          {pastaCriadaId && (
            <>
              {/* Barra de ações */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {arquivos.length} arquivo(s)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={carregarArquivos}
                    disabled={carregando}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
                  </button>
                  {pastaCriadaUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(pastaCriadaUrl, '_blank')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Abrir no Drive
                    </button>
                  )}
                </div>
              </div>

              {/* Loading */}
              {carregando && arquivos.length === 0 && (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                  <p className="text-gray-600">Carregando arquivos...</p>
                </div>
              )}

              {/* Lista vazia */}
              {!carregando && arquivos.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-normal text-gray-700 mb-2">
                    Pasta vazia
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Adicione arquivos diretamente no Google Drive.
                  </p>
                  {pastaCriadaUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(pastaCriadaUrl, '_blank')}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium inline-flex items-center gap-2"
                    >
                      <ExternalLink size={16} />
                      Abrir pasta no Drive
                    </button>
                  )}
                </div>
              )}

              {/* Lista de arquivos */}
              {arquivos.length > 0 && (
                <div className="space-y-2">
                  {arquivos.map((arquivo) => (
                    <div
                      key={arquivo.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {getIconeArquivo(arquivo.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {arquivo.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatarTamanho(arquivo.size)}
                          {arquivo.createdTime && (
                            <> - {new Date(arquivo.createdTime).toLocaleDateString('pt-BR')}</>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.open(arquivo.webViewLink, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Abrir arquivo"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Erro */}
          {erro && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


