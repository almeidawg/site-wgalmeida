/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// COMPONENTE: OportunidadeArquivos
// Gerenciamento de arquivos (plantas, fotos, documentos)
// Upload, visualizaçÍo, download e exclusÍo via Supabase Storage
// IntegraçÍo com Google Drive para backup e compartilhamento
// ============================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Image, Folder, Download, Trash2, Upload, X, Cloud, Link as LinkIcon, FolderOpen, Check, ChevronRight, Pencil } from 'lucide-react';
import { googleDriveService, type MapeamentoPastas, type SubPasta } from '@/services/googleDriveBrowserService';

interface ArquivoItem {
  name: string;
  path: string;
  publicUrl: string;
  size: number;
  tipo: 'plantas' | 'fotos' | 'documentos';
  createdAt: string;
}

interface OportunidadeArquivosProps {
  oportunidadeId: string;
  clienteNome?: string;
}

export default function OportunidadeArquivos({ oportunidadeId, clienteNome = 'Cliente' }: OportunidadeArquivosProps) {
  const [arquivos, setArquivos] = useState<ArquivoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Estados do Google Drive
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [mapeamento, setMapeamento] = useState<MapeamentoPastas | null>(null);
  const [pastaExistente, setPastaExistente] = useState(false);
  // Novo: ediçÍo manual do link
  const [editandoLink, setEditandoLink] = useState(false);
  const [linkEditado, setLinkEditado] = useState<string | null>(null);

  // Estados para seleçÍo de pasta no upload
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<'plantas' | 'fotos' | 'documentos'>('documentos');
  const [allDriveFolders, setAllDriveFolders] = useState<SubPasta[]>([]);
  const [selectedDriveFolder, setSelectedDriveFolder] = useState<string | null>(null);

  // Verificar se já está autenticado ao montar
  useEffect(() => {
    checkDriveAuth();
  }, []);

  // Carregar arquivos ao montar
  useEffect(() => {
    loadArquivos();
  }, [oportunidadeId]);

  /**
   * Verifica se já existe sessÍo ativa do Google Drive
   */
  async function checkDriveAuth() {
    if (googleDriveService.isAuthenticated()) {
      setDriveConnected(true);
      console.log('✅ Google Drive já autenticado (sessÍo existente)');

      // Tentar recuperar pasta do cliente automaticamente
      try {
        const pastaExiste = await googleDriveService.buscarPastaCliente(clienteNome, oportunidadeId);
        if (pastaExiste) {
          setDriveFolderId(pastaExiste.id);
          setDriveFolderUrl(pastaExiste.webViewLink);
          setPastaExistente(true);

          // Mapear estrutura da pasta
          const mapeamentoResult = await googleDriveService.mapearEstruturaPastas(pastaExiste.id);
          setMapeamento(mapeamentoResult);

          // Carregar todas as subpastas para seleçÍo
          const subpastas = await googleDriveService.listarSubpastas(pastaExiste.id);
          setAllDriveFolders(subpastas);

          console.log('✅ Pasta do cliente recuperada automaticamente');
        }
      } catch (error) {
        console.log('ℹ️ Pasta do cliente não encontrada, será necessário criar');
      }
    }
  }

  async function loadArquivos() {
    try {
      setLoading(true);
      const allFiles: ArquivoItem[] = [];

      // Buscar arquivos de cada tipo
      const tipos: ('plantas' | 'fotos' | 'documentos')[] = ['plantas', 'fotos', 'documentos'];

      for (const tipo of tipos) {
        const path = `${oportunidadeId}/${tipo}`;
        const { data, error } = await supabase.storage
          .from('oportunidades')
          .list(path, {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (error) {
          console.error(`Erro ao listar ${tipo}:`, error);
          continue;
        }

        if (data) {
          for (const file of data) {
            const filePath = `${path}/${file.name}`;
            const { data: urlData } = supabase.storage
              .from('oportunidades')
              .getPublicUrl(filePath);

            allFiles.push({
              name: file.name,
              path: filePath,
              publicUrl: urlData.publicUrl,
              size: file.metadata?.size || 0,
              tipo,
              createdAt: file.created_at || new Date().toISOString()
            });
          }
        }
      }

      setArquivos(allFiles);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      alert('Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Abre o dialog de seleçÍo de pasta antes de fazer upload
   */
  function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    // Detectar tipo automaticamente baseado no primeiro arquivo
    const primeiroArquivo = files[0];
    const tipoDetectado = detectarTipoArquivo(primeiroArquivo.name);

    // Guardar arquivos e abrir dialog
    setPendingFiles(files);
    setSelectedUploadFolder(tipoDetectado);
    setShowFolderDialog(true);
  }

  /**
   * Executa o upload após usuário confirmar a pasta
   */
  async function executeUpload() {
    if (!pendingFiles || pendingFiles.length === 0) return;

    setShowFolderDialog(false);
    setUploading(true);

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        // Usar pasta selecionada pelo usuário
        const path = `${oportunidadeId}/${selectedUploadFolder}/${file.name}`;

        const { error } = await supabase.storage
          .from('oportunidades')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true // Permitir substituir arquivo existente
          });

        if (error) {
          console.error('Erro ao fazer upload:', error);
          alert(`Erro ao enviar ${file.name}: ${error.message}`);
          continue;
        }

        // Se tiver pasta do Drive selecionada, fazer upload lá também
        if (selectedDriveFolder && driveConnected) {
          try {
            await googleDriveService.uploadArquivo(file, selectedDriveFolder);
            console.log(`✅ ${file.name} enviado para Google Drive`);
          } catch (driveError) {
            console.error(`Erro ao enviar ${file.name} para Drive:`, driveError);
          }
        }
      }

      // Recarregar lista
      await loadArquivos();
      alert(`${pendingFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
      setPendingFiles(null);
      setSelectedDriveFolder(null);
    }
  }

  async function deleteArquivo(arquivo: ArquivoItem) {
    if (!confirm(`Deseja realmente excluir "${arquivo.name}"?`)) return;

    try {
      const { error } = await supabase.storage
        .from('oportunidades')
        .remove([arquivo.path]);

      if (error) throw error;

      // Atualizar lista
      setArquivos(prev => prev.filter(a => a.path !== arquivo.path));
      alert('Arquivo excluido com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      alert('Erro ao excluir arquivo');
    }
  }

  function detectarTipoArquivo(filename: string): 'plantas' | 'fotos' | 'documentos' {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Plantas e projetos
    if (['pdf', 'dwg', 'dxf', 'skp', 'rvt', 'ifc'].includes(ext)) {
      return 'plantas';
    }

    // Fotos e imagens
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'fotos';
    }

    // Documentos gerais
    return 'documentos';
  }

  // ============================================================
  // FUNÇÕES DO GOOGLE DRIVE
  // ============================================================

  async function connectGoogleDrive() {
    try {
      setLoading(true);
      await googleDriveService.authenticate();
      setDriveConnected(true);
      alert('✅ Conectado ao Google Drive com sucesso!');

      // Criar pasta automaticamente após conectar
      await createDriveFolder();
    } catch (error) {
      console.error('Erro ao conectar com Google Drive:', error);
      alert('Erro ao conectar com Google Drive. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }

  async function createDriveFolder() {
    try {
      setSyncing(true);

      // Encontrar pasta existente OU criar nova estrutura
      const result = await googleDriveService.encontrarOuCriarEstrutura(clienteNome, oportunidadeId);

      setDriveFolderId(result.pastaId);
      setDriveFolderUrl(result.pastaUrl);
      setMapeamento(result.mapeamento);

      // Verificar se encontrou pasta existente
      const pastaExiste = await googleDriveService.buscarPastaCliente(clienteNome, oportunidadeId);
      setPastaExistente(!!pastaExiste);

      // Tornar pasta pública
      await googleDriveService.tornarPastaPublica(result.pastaId);

      // Mensagem com detalhes do mapeamento
      const detalhes = [
        `📁 Pasta: ${clienteNome} - ${oportunidadeId}`,
        '',
        '📂 Estrutura detectada:',
        `  • Plantas: ${result.mapeamento.plantas?.name || 'não encontrada'}`,
        `  • Fotos: ${result.mapeamento.fotos?.name || 'não encontrada'}`,
        `  • Documentos: ${result.mapeamento.documentos?.name || 'não encontrada'}`,
      ];

      if (result.mapeamento.outrasPasstas.length > 0) {
        detalhes.push('');
        detalhes.push('📋 Outras pastas encontradas:');
        result.mapeamento.outrasPasstas.forEach(p => {
          detalhes.push(`  • ${p.name}`);
        });
      }

      alert(`✅ ${pastaExiste ? 'Pasta existente encontrada e mapeada!' : 'Nova pasta criada!'}\n\n${detalhes.join('\n')}`);
    } catch (error) {
      console.error('Erro ao configurar pasta no Drive:', error);
      alert('Erro ao configurar pasta no Google Drive');
    } finally {
      setSyncing(false);
    }
  }

  async function syncWithDrive() {
    if (!driveFolderId || !mapeamento) {
      alert('Conecte ao Google Drive e configure as pastas primeiro');
      return;
    }

    try {
      setSyncing(true);
      let syncCount = 0;
      const erros: string[] = [];

      // Sincronizar cada arquivo do Supabase para o Drive
      for (const arquivo of arquivos) {
        try {
          // Buscar o arquivo do Supabase
          const { data: fileData } = await supabase.storage
            .from('oportunidades')
            .download(arquivo.path);

          if (!fileData) continue;

          // Converter Blob para File
          const file = new File([fileData], arquivo.name, { type: fileData.type });

          // Determinar pasta de destino baseado no tipo do arquivo
          let pastaDestino: string | null = null;

          switch (arquivo.tipo) {
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
            erros.push(`${arquivo.name}: Pasta de destino não encontrada para tipo "${arquivo.tipo}"`);
            continue;
          }

          // Upload para Google Drive na pasta correta
          await googleDriveService.uploadArquivo(file, pastaDestino);
          syncCount++;
        } catch (err) {
          console.error(`Erro ao sincronizar ${arquivo.name}:`, err);
          erros.push(`${arquivo.name}: ${err}`);
        }
      }

      // Mensagem de resultado
      let mensagem = `✅ ${syncCount} arquivo(s) sincronizado(s) com Google Drive!`;

      if (erros.length > 0) {
        mensagem += `\n\n⚠️ ${erros.length} erro(s):\n${erros.slice(0, 3).join('\n')}`;
        if (erros.length > 3) {
          mensagem += `\n... e mais ${erros.length - 3} erro(s)`;
        }
      }

      alert(mensagem);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert('Erro ao sincronizar arquivos');
    } finally {
      setSyncing(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  function getFileIcon(tipo: string) {
    switch (tipo) {
      case 'plantas':
        return <Folder size={20} className="text-blue-600" />;
      case 'fotos':
        return <Image size={20} className="text-green-600" />;
      case 'documentos':
        return <FileText size={20} className="text-orange-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getTipoLabel(tipo: string): string {
    const labels = {
      plantas: 'Plantas e Projetos',
      fotos: 'Fotos e Imagens',
      documentos: 'Documentos Gerais'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  }

  function getTipoColor(tipo: string): string {
    const colors = {
      plantas: 'bg-blue-100 text-blue-800',
      fotos: 'bg-green-100 text-green-800',
      documentos: 'bg-orange-100 text-orange-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  // Agrupar arquivos por tipo
  const plantas = arquivos.filter(a => a.tipo === 'plantas');
  const fotos = arquivos.filter(a => a.tipo === 'fotos');
  const documentos = arquivos.filter(a => a.tipo === 'documentos');

  return (
    <div className="space-y-3">
      {/* DIALOG DE SELEÇÍO DE PASTA */}
      {showFolderDialog && pendingFiles && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="text-blue-600" size={20} />
                  <h3 className="font-normal text-gray-900">Escolher Pasta para Upload</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderDialog(false);
                    setPendingFiles(null);
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  title="Fechar"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {pendingFiles.length} arquivo(s) selecionado(s)
              </p>
            </div>

            {/* Arquivos selecionados */}
            <div className="p-4 bg-gray-50 border-b">
              <p className="text-xs font-medium text-gray-700 mb-2">Arquivos:</p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {Array.from(pendingFiles).map((file, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white border rounded text-xs text-gray-700 truncate max-w-[150px]"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                ))}
              </div>
            </div>

            {/* SeleçÍo de pasta local (Supabase) */}
            <div className="p-4 border-b">
              <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Folder size={16} className="text-orange-500" />
                Pasta Local (Sistema)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['plantas', 'fotos', 'documentos'] as const).map((tipo) => (
                  <button
                    type="button"
                    key={tipo}
                    onClick={() => setSelectedUploadFolder(tipo)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      selectedUploadFolder === tipo
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tipo === 'plantas' && <Folder size={20} className="text-blue-600" />}
                    {tipo === 'fotos' && <Image size={20} className="text-green-600" />}
                    {tipo === 'documentos' && <FileText size={20} className="text-orange-600" />}
                    <span className="text-xs font-medium capitalize">{tipo}</span>
                    {selectedUploadFolder === tipo && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* SeleçÍo de pasta do Drive (se conectado) */}
            {driveConnected && driveFolderId && allDriveFolders.length > 0 && (
              <div className="p-4 border-b">
                <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Cloud size={16} className="text-blue-500" />
                  Pasta Google Drive (opcional)
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedDriveFolder(null)}
                    className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all ${
                      selectedDriveFolder === null
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <X size={14} className="text-gray-400" />
                    <span className="text-gray-600">não enviar para o Drive</span>
                    {selectedDriveFolder === null && <Check size={14} className="ml-auto text-purple-600" />}
                  </button>
                  {allDriveFolders.map((pasta) => (
                    <button
                      type="button"
                      key={pasta.id}
                      onClick={() => setSelectedDriveFolder(pasta.id)}
                      className={`w-full p-2 rounded-lg border text-left text-sm flex items-center gap-2 transition-all ${
                        selectedDriveFolder === pasta.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FolderOpen size={14} className="text-blue-500" />
                      <span className="truncate flex-1">{pasta.name}</span>
                      {selectedDriveFolder === pasta.id && <Check size={14} className="text-purple-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de açÍo */}
            <div className="p-4 flex gap-2 justify-end bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowFolderDialog(false);
                  setPendingFiles(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeUpload}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Enviar para {selectedUploadFolder}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* GOOGLE DRIVE - Compacto */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cloud size={16} className="text-blue-600" />
              <span className="text-xs font-medium text-gray-900">Drive</span>
              {driveConnected && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
                  Conectado
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">

              {/* Se não estiver editando, mostra o link e ícone de ediçÍo */}
              {(!editandoLink && (linkEditado || driveFolderUrl)) && (
                <>
                  <a
                    href={linkEditado || driveFolderUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Abrir pasta no Drive"
                  >
                    <LinkIcon size={14} />
                  </a>
                  <button
                    type="button"
                    className="p-1 ml-1 text-gray-500 hover:text-blue-600 rounded"
                    title="Editar link da pasta"
                    onClick={() => {
                      setEditandoLink(true);
                      setLinkEditado(linkEditado || driveFolderUrl || "");
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                </>
              )}

              {/* Input para editar o link */}
              {editandoLink && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setEditandoLink(false);
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    type="url"
                    className="border rounded px-2 py-1 text-xs w-48"
                    value={linkEditado || ""}
                    onChange={e => setLinkEditado(e.target.value)}
                    placeholder="Cole o link da pasta"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Salvar link"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Cancelar"
                    onClick={() => setEditandoLink(false)}
                  >
                    <X size={14} />
                  </button>
                </form>
              )}

              {!driveConnected ? (
                <button
                  type="button"
                  onClick={connectGoogleDrive}
                  disabled={loading}
                  className="px-2 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? '...' : 'Conectar'}
                </button>
              ) : (
                <>
                  {!driveFolderId && (
                    <button
                      type="button"
                      onClick={createDriveFolder}
                      disabled={syncing}
                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {syncing ? '...' : 'Criar Pasta'}
                    </button>
                  )}

                  {driveFolderId && arquivos.length > 0 && (
                    <button
                      type="button"
                      onClick={syncWithDrive}
                      disabled={syncing}
                      className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {syncing ? '...' : `Sync (${arquivos.length})`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mapeamento compacto - só mostra se conectado */}
          {driveFolderId && mapeamento && (
            <div className="mt-2 pt-2 border-t border-blue-200 flex flex-wrap gap-1 text-[10px]">
              {mapeamento.plantas && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Plantas</span>
              )}
              {mapeamento.fotos && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Fotos</span>
              )}
              {mapeamento.documentos && (
                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Docs</span>
              )}
              {mapeamento.outrasPasstas.length > 0 && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  +{mapeamento.outrasPasstas.length} pastas
                </span>
              )}
            </div>
          )}
        </div>

        {/* ZONA DE UPLOAD - Compacta */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <Upload className="h-6 w-6 text-gray-400" />
            <div className="text-left">
              <p className="text-xs text-gray-600 font-medium">
                {uploading ? 'Enviando...' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-[10px] text-gray-400">
                Plantas (PDF, DWG) | Fotos (JPG, PNG) | Docs (DOC, XLS)
              </p>
            </div>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className={`px-3 py-1.5 bg-primary text-white text-xs rounded cursor-pointer whitespace-nowrap ${
                uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
              }`}
            >
              {uploading ? '...' : 'Selecionar'}
            </label>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">Carregando...</p>
        </div>
      )}

      {/* LISTA VAZIA */}
      {!loading && arquivos.length === 0 && (
        <div className="text-center py-3 text-gray-400">
          <FileText className="mx-auto h-6 w-6 mb-1 opacity-50" />
          <p className="text-xs">Nenhum arquivo ainda</p>
        </div>
      )}

      {/* PLANTAS */}
      {plantas.length > 0 && (
        <div className="bg-white border rounded-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <Folder size={14} className="text-blue-600" />
            <span className="text-xs font-medium text-gray-700">Plantas ({plantas.length})</span>
          </div>
          <div className="space-y-1">
            {plantas.map((arquivo) => (
              <div
                key={arquivo.path}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">{arquivo.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={arquivo.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Baixar"
                  >
                    <Download size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteArquivo(arquivo)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOTOS - Grid Compacto */}
      {fotos.length > 0 && (
        <div className="bg-white border rounded-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <Image size={14} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700">Fotos ({fotos.length})</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {fotos.map((arquivo) => (
              <div
                key={arquivo.path}
                className="relative group bg-gray-100 rounded overflow-hidden aspect-square"
              >
                <img
                  src={arquivo.publicUrl}
                  alt={arquivo.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-1">
                  <a
                    href={arquivo.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 p-1 bg-white text-blue-600 rounded transition-all"
                    title="Ver"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteArquivo(arquivo)}
                    className="opacity-0 group-hover:opacity-100 p-1 bg-white text-red-600 rounded transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTOS */}
      {documentos.length > 0 && (
        <div className="bg-white border rounded-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-700">Documentos ({documentos.length})</span>
          </div>
          <div className="space-y-1">
            {documentos.map((arquivo) => (
              <div
                key={arquivo.path}
                className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">{arquivo.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={arquivo.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Baixar"
                  >
                    <Download size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteArquivo(arquivo)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


