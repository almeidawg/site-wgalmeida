// ============================================================
// COMPONENTE: PastasClienteDrive
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Exibe as pastas do Google Drive do cliente na área do cliente
// Renderiza arquivos diretamente no sistema (não redireciona)
// Usa o drive_link cadastrado na tabela pessoas
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FolderOpen,
  ExternalLink,
  Loader2,
  Folder,
  Image,
  FileText,
  Camera,
  ChevronDown,
  ChevronUp,
  X,
  ZoomIn,
  File,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface PastasClienteDriveProps {
  clienteId: string;
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
  if (!driveLink.includes('/')) {
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

export default function PastasClienteDrive({ clienteId }: PastasClienteDriveProps) {
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [clienteNome, setClienteNome] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<GrupoPasta[]>([]);
  const [expandedGrupo, setExpandedGrupo] = useState<string | null>(null);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);

  const carregarArquivos = useCallback(async (link: string) => {
    const folderId = extrairDriveFolderId(link);
    if (!folderId) {
      console.error("[PastasClienteDrive] não foi possível extrair folderId de:", link);
      return;
    }

    try {
      setLoadingFiles(true);
      console.log("[PastasClienteDrive] Buscando arquivos do folderId:", folderId);

      const response = await fetch(
        `${BACKEND_URL}/api/drive/diario-obra-images?folderId=${folderId}`
      );

      if (!response.ok) {
        console.error("[PastasClienteDrive] Erro na resposta:", response.status);
        return;
      }

      const data = await response.json();
      console.log("[PastasClienteDrive] Resposta do backend:", data);

      if (data.success && data.groups && data.groups.length > 0) {
        setGrupos(data.groups);
        // Expandir primeiro grupo automaticamente
        setExpandedGrupo(data.groups[0].folder);
      }
    } catch (err) {
      console.error("[PastasClienteDrive] Erro ao carregar arquivos:", err);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

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
        console.error("[PastasClienteDrive] Erro ao buscar drive_link:", fetchError);
        setError("não foi possível carregar informações do cliente");
        return;
      }

      console.log("[PastasClienteDrive] Cliente:", data?.nome, "| drive_link:", data?.drive_link);
      setClienteNome(data?.nome || "");
      setDriveLink(data?.drive_link || null);

      // Se tem drive_link, carregar arquivos
      if (data?.drive_link) {
        await carregarArquivos(data.drive_link);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [carregarArquivos, clienteId]);

  useEffect(() => {
    carregarDriveLink();
  }, [carregarDriveLink]);

  // Obter URL da imagem (priorizar URL pública)
  function getImageUrl(arquivo: DriveArquivo): string {
    return arquivo.directImageUrl || arquivo.thumbnailLink || arquivo.webContentLink || arquivo.webViewLink || "";
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando pastas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-700">não foi possível carregar a pasta</h3>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!driveLink) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-600">Pasta do Projeto</h3>
          <p className="text-sm text-gray-400 mt-2">
            As pastas do seu projeto serÍo disponibilizadas aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  const folderId = extrairDriveFolderId(driveLink);
  const driveUrl = folderId
    ? `https://drive.google.com/drive/folders/${folderId}`
    : driveLink;

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              <span>PASTA DO PROJETO</span>
            </div>
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir no Drive
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingFiles ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
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
                      <FolderOpen className="w-4 h-4 text-blue-500" />
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
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
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
            <div className="p-4 space-y-3">
              {/* Card informativo quando não há arquivos carregados */}
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FolderOpen className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-normal text-gray-800 group-hover:text-blue-700 transition-colors">
                      {clienteNome || "Meu Projeto"}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Acesse todos os arquivos do seu projeto
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </a>

              {/* Dicas de navegaçÍo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Estrutura de Pastas
                </h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span>Projeto Arquitetônico</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Camera className="w-4 h-4 text-orange-500" />
                    <span>Diário de Obra</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Image className="w-4 h-4 text-green-500" />
                    <span>Fotos do Imóvel</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Documentos</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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


