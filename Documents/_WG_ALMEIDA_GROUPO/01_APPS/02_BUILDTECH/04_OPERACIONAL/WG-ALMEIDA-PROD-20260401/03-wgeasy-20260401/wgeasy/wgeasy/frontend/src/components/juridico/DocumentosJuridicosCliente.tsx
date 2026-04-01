// ============================================================
// COMPONENTE: DocumentosJuridicosCliente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Exibe os documentos jurídicos do cliente a partir do Google Drive
// Busca arquivos na subpasta "juridico" da pasta do cliente
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FolderOpen,
  ExternalLink,
  Loader2,
  Folder,
  Image,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  ZoomIn,
  File,
  Scale,
  AlertCircle,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface DocumentosJuridicosClienteProps {
  clienteId: string;
  clienteNome?: string;
}

interface DriveArquivo {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  directImageUrl?: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
}

interface GrupoPasta {
  folder: string;
  files: DriveArquivo[];
}

function extrairDriveFolderId(driveLink: string): string | null {
  if (!driveLink) return null;

  // Se já é apenas o ID (sem URL)
  if (!driveLink.includes("/")) {
    return driveLink;
  }

  // Extrair ID do formato URL
  const regex = /folders\/([a-zA-Z0-9_-]+)/;
  const match = driveLink.match(regex);
  return match ? match[1] : null;
}

// Determinar ícone baseado no tipo de arquivo
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-green-500" />;
  if (mimeType.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
  if (mimeType.includes("document") || mimeType.includes("word")) return <FileText className="w-4 h-4 text-blue-500" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileText className="w-4 h-4 text-green-600" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

export default function DocumentosJuridicosCliente({ clienteId, clienteNome }: DocumentosJuridicosClienteProps) {
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string>(clienteNome || "");
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<GrupoPasta[]>([]);
  const [expandedGrupo, setExpandedGrupo] = useState<string | null>(null);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [pastaJuridicoEncontrada, setPastaJuridicoEncontrada] = useState(false);

  const carregarDriveLink = useCallback(async () => {
    if (!clienteId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("pessoas")
        .select("nome, drive_link")
        .eq("id", clienteId)
        .single();

      if (fetchError) {
        console.error("[DocumentosJuridicos] Erro ao buscar drive_link:", fetchError);
        setError("não foi possível carregar informações do cliente");
        return;
      }

      console.log("[DocumentosJuridicos] Cliente:", data?.nome, "| drive_link:", data?.drive_link);
      setNomeCliente(data?.nome || clienteNome || "");
      setDriveLink(data?.drive_link || null);

      if (data?.drive_link) {
        await buscarPastaJuridico(data.drive_link);
      }
    } catch (err) {
      console.error("[DocumentosJuridicos] Erro:", err);
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, clienteNome]);

  useEffect(() => {
    if (clienteId) {
      carregarDriveLink();
    }
  }, [clienteId, carregarDriveLink]);

  const carregarArquivos = useCallback(async (juridicoFolderId: string) => {
    try {
      console.log("[DocumentosJuridicos] Carregando arquivos da pasta juridico:", juridicoFolderId);

      const response = await fetch(
        `${BACKEND_URL}/api/drive/diario-obra-images?folderId=${juridicoFolderId}`
      );

      if (!response.ok) {
        console.error("[DocumentosJuridicos] Erro na resposta:", response.status);
        return;
      }

      const data = await response.json();
      console.log("[DocumentosJuridicos] Resposta do backend:", data);

      if (data.success && data.groups && data.groups.length > 0) {
        setGrupos(data.groups);
        setExpandedGrupo(data.groups[0].folder);
      } else if (data.success && data.files && data.files.length > 0) {
        // Se não há grupos, criar um grupo com todos os arquivos
        setGrupos([{ folder: "Documentos Jurídicos", files: data.files }]);
        setExpandedGrupo("Documentos Jurídicos");
      }
    } catch (err) {
      console.error("[DocumentosJuridicos] Erro ao carregar arquivos:", err);
    }
  }, []);

  const buscarPastaJuridico = useCallback(
    async (link: string) => {
      const folderId = extrairDriveFolderId(link);
      if (!folderId) {
        console.error("[DocumentosJuridicos] não foi possível extrair folderId de:", link);
        return;
      }

      try {
        setLoadingFiles(true);
        console.log("[DocumentosJuridicos] Buscando pasta juridico no folderId:", folderId);

        // Primeiro, buscar subpastas para encontrar a pasta "juridico"
        const responseSubfolders = await fetch(
          `${BACKEND_URL}/api/drive/subfolders?folderId=${folderId}`
        );

        if (!responseSubfolders.ok) {
          // Fallback: tentar buscar diretamente os arquivos
          await carregarArquivosDireto(folderId);
          return;
        }

        const subfoldersData = await responseSubfolders.json();
        console.log("[DocumentosJuridicos] Subpastas encontradas:", subfoldersData);

        // Procurar pasta "juridico" (case insensitive)
        const pastaJuridico = subfoldersData.folders?.find(
          (f: { name: string; id: string }) =>
            f.name.toLowerCase() === "juridico" ||
            f.name.toLowerCase() === "jurídico" ||
            f.name.toLowerCase().includes("juridico")
        );

        if (pastaJuridico) {
          console.log("[DocumentosJuridicos] Pasta juridico encontrada:", pastaJuridico);
          setPastaJuridicoEncontrada(true);
          await carregarArquivos(pastaJuridico.id);
        } else {
          console.log("[DocumentosJuridicos] Pasta juridico não encontrada");
          setPastaJuridicoEncontrada(false);
        }
      } catch (err) {
        console.error("[DocumentosJuridicos] Erro ao buscar pasta juridico:", err);
        // Tentar fallback
        await carregarArquivosDireto(folderId);
      } finally {
        setLoadingFiles(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carregarArquivos]
  );

  const carregarArquivosDireto = useCallback(async (folderId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/drive/diario-obra-images?folderId=${folderId}`
      );

      if (!response.ok) {
        console.error("[DocumentosJuridicos] Erro na resposta:", response.status);
        return;
      }

      const data = await response.json();
      console.log("[DocumentosJuridicos] Arquivos diretos:", data);

      // Filtrar apenas grupos que contenham "juridico" no nome
      if (data.success && data.groups) {
        const gruposJuridico = data.groups.filter(
          (g: GrupoPasta) =>
            g.folder.toLowerCase().includes("juridico") ||
            g.folder.toLowerCase().includes("jurídico")
        );

        if (gruposJuridico.length > 0) {
          setPastaJuridicoEncontrada(true);
          setGrupos(gruposJuridico);
          setExpandedGrupo(gruposJuridico[0].folder);
        }
      }
    } catch (err) {
      console.error("[DocumentosJuridicos] Erro ao carregar arquivos diretos:", err);
    }
  }, []);


  // Obter URL da imagem
  function getImageUrl(arquivo: DriveArquivo): string {
    return arquivo.directImageUrl || arquivo.thumbnailLink || arquivo.webContentLink || arquivo.webViewLink || "";
  }

  const folderId = driveLink ? extrairDriveFolderId(driveLink) : null;
  const driveUrl = folderId
    ? `https://drive.google.com/drive/folders/${folderId}`
    : driveLink;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-500">Carregando documentos jurídicos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-6 text-red-700">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!driveLink) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6">
        <div className="text-center py-6">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-600">Pasta do Cliente</h3>
          <p className="text-sm text-gray-400 mt-2">
            Este cliente não possui pasta do Google Drive vinculada
          </p>
        </div>
      </div>
    );
  }

  if (!pastaJuridicoEncontrada && !loadingFiles) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Scale className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-normal text-gray-900">Documentos Jurídicos</h3>
            <p className="text-sm text-gray-500">{nomeCliente}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                Nenhuma pasta "Jurídico" foi encontrada na pasta do cliente.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Para visualizar documentos aqui, crie uma pasta chamada "Juridico" dentro da pasta do cliente no Google Drive.
              </p>
            </div>
          </div>
        </div>

        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Pasta do Cliente no Drive
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5" />
              <div>
                <h3 className="font-normal">Documentos Jurídicos</h3>
                <p className="text-sm text-purple-200">{nomeCliente}</p>
              </div>
            </div>
            {driveUrl && (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Drive
              </a>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-0">
          {loadingFiles ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <span className="ml-2 text-sm text-gray-500">Carregando arquivos...</span>
            </div>
          ) : grupos.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {grupos.map((grupo) => (
                <div key={grupo.folder}>
                  <button
                    type="button"
                    onClick={() => setExpandedGrupo(
                      expandedGrupo === grupo.folder ? null : grupo.folder
                    )}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-purple-500" />
                      <span className="font-medium text-gray-700">{grupo.folder}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{grupo.files.length} arquivo(s)</span>
                      {expandedGrupo === grupo.folder ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedGrupo === grupo.folder && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {grupo.files.map((arquivo) => {
                          const isImage = arquivo.mimeType.startsWith("image/");
                          const imageUrl = getImageUrl(arquivo);

                          return isImage ? (
                            <button
                              type="button"
                              key={arquivo.id}
                              title={arquivo.name}
                              onClick={() => setImagemAmpliada(imageUrl)}
                              className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity group relative"
                            >
                              <img
                                src={imageUrl}
                                alt={arquivo.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=Foto";
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ) : (
                            <a
                              key={arquivo.id}
                              href={arquivo.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={arquivo.name}
                              className="aspect-square bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 p-2 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                            >
                              {getFileIcon(arquivo.mimeType)}
                              <span className="text-[10px] text-gray-600 text-center line-clamp-2 leading-tight">
                                {arquivo.name}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">Nenhum documento encontrado na pasta jurídico</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagem ampliada */}
      {imagemAmpliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Imagem ampliada"
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagemAmpliada(null)}
          onKeyDown={(e) => e.key === "Escape" && setImagemAmpliada(null)}
        >
          <button
            type="button"
            title="Fechar"
            aria-label="Fechar imagem"
            onClick={() => setImagemAmpliada(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imagemAmpliada}
            alt="Imagem ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}


