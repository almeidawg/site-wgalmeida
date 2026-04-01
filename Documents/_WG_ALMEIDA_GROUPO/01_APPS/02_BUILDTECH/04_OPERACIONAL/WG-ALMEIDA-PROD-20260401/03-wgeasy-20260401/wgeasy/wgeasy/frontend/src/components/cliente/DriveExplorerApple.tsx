// ============================================================
// COMPONENTE: DriveExplorerApple
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Navegador de arquivos do Google Drive estilo Apple Finder
// Design moderno com navegaçÍo por breadcrumbs e visualizaçÍo
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Folder,
  FileText,
  File,
  ChevronRight,
  ArrowLeft,
  Grid3X3,
  List,
  Loader2,
  Download,
  X,
  Home,
  FolderOpen,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileType,
  ZoomIn,
} from "lucide-react";
import { cn, formatarData } from "@/lib/utils";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

interface DriveExplorerAppleProps {
  clienteId: string;
}

interface FolderItem {
  id: string;
  name: string;
  type: "folder" | "file";
  mimeType?: string;
  thumbnailUrl?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
  children?: FolderItem[];
  fileCount?: number;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

// Ícone baseado no tipo de arquivo
function getFileIcon(mimeType?: string) {
  if (!mimeType) return <File className="w-8 h-8 text-gray-400" />;

  if (mimeType.startsWith("image/")) return <FileImage className="w-8 h-8 text-emerald-500" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="w-8 h-8 text-purple-500" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="w-8 h-8 text-pink-500" />;
  if (mimeType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
  if (mimeType.includes("document") || mimeType.includes("word")) return <FileType className="w-8 h-8 text-blue-600" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return <FileText className="w-8 h-8 text-orange-500" />;

  return <File className="w-8 h-8 text-gray-400" />;
}

// Formatar tamanho do arquivo
function formatSize(bytes?: string): string {
  if (!bytes) return "";
  const size = parseInt(bytes, 10);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Formatar data usando a funcao padrao do sistema
function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return formatarData(dateStr, "medio");
  } catch {
    return "";
  }
}

export default function DriveExplorerApple({ clienteId }: DriveExplorerAppleProps) {
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContents, setLoadingContents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contents, setContents] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Extrair folder ID do link do Drive
  const extrairFolderId = (link: string): string | null => {
    if (!link) return null;
    if (!link.includes("/")) return link;
    const regex = /folders\/([a-zA-Z0-9_-]+)/;
    const match = link.match(regex);
    return match ? match[1] : null;
  };

  // Carregar link do Drive do cliente
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
        .select("drive_link")
        .eq("id", clienteId)
        .single();

      if (fetchError || !data?.drive_link) {
        setError("Pasta do Drive não configurada");
        setLoading(false);
        return;
      }

      setDriveLink(data.drive_link);
      const folderId = extrairFolderId(data.drive_link);
      if (folderId) {
        setCurrentFolderId(folderId);
        setBreadcrumbs([{ id: folderId, name: "Meu Projeto" }]);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  // Carregar conteúdo da pasta atual
  const carregarConteudo = useCallback(async (folderId: string) => {
    try {
      setLoadingContents(true);

      const response = await fetch(
        `${BACKEND_URL}/api/drive/folder-contents?folderId=${folderId}&depth=1`
      );

      if (!response.ok) {
        console.error("Erro ao buscar conteúdo:", response.status);
        setContents([]);
        return;
      }

      const data = await response.json();

      if (data.success && data.contents) {
        // Ordenar: pastas primeiro, depois arquivos
        const sorted = [...data.contents].sort((a, b) => {
          if (a.type === "folder" && b.type !== "folder") return -1;
          if (a.type !== "folder" && b.type === "folder") return 1;
          return a.name.localeCompare(b.name);
        });
        setContents(sorted);
      } else {
        setContents([]);
      }
    } catch (err) {
      console.error("Erro ao carregar conteúdo:", err);
      setContents([]);
    } finally {
      setLoadingContents(false);
    }
  }, []);

  // Navegar para uma pasta
  const navegarPara = useCallback((folder: FolderItem) => {
    if (folder.type !== "folder") return;

    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelectedItem(null);
  }, []);

  // Navegar via breadcrumb
  const navegarBreadcrumb = useCallback((index: number) => {
    const target = breadcrumbs[index];
    if (!target) return;

    setCurrentFolderId(target.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSelectedItem(null);
  }, [breadcrumbs]);

  // Voltar para pasta anterior
  const voltar = useCallback(() => {
    if (breadcrumbs.length <= 1) return;

    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    const previousFolder = newBreadcrumbs[newBreadcrumbs.length - 1];

    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolderId(previousFolder.id);
    setSelectedItem(null);
  }, [breadcrumbs]);

  // Abrir arquivo
  const abrirArquivo = useCallback((item: FolderItem) => {
    if (item.type === "folder") {
      navegarPara(item);
    } else if (item.mimeType?.startsWith("image/") && item.thumbnailUrl) {
      setPreviewImage(item.thumbnailUrl);
    } else if (item.webViewLink) {
      window.open(item.webViewLink, "_blank");
    }
  }, [navegarPara]);

  // Efeitos
  useEffect(() => {
    carregarDriveLink();
  }, [carregarDriveLink]);

  useEffect(() => {
    if (currentFolderId) {
      carregarConteudo(currentFolderId);
    }
  }, [currentFolderId, carregarConteudo]);

  // Estados de loading/erro
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <div className="h-3 w-48 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="px-4 py-3 bg-gradient-to-b from-gray-50 to-gray-100/50 border-b border-gray-200">
          <div className="h-4 w-64 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="p-4 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`drive-skeleton-${index}`} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-2xl bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !driveLink) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Folder className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-normal text-gray-700">Pasta do Projeto</h3>
          <p className="text-sm text-gray-400 mt-2">
            {error || "As pastas do seu projeto serÍo disponibilizadas aqui"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Indicador da pasta vinculada */}
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-emerald-700 font-medium">Pasta vinculada ao seu cadastro</span>
        </div>

        {/* Header com Breadcrumbs - Estilo macOS */}
        <div className="bg-gradient-to-b from-gray-50 to-gray-100/50 border-b border-gray-200">
          {/* Barra de navegaçÍo */}
          <div className="px-4 py-3 flex items-center gap-3">
            {/* Botões de navegaçÍo */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={voltar}
                disabled={breadcrumbs.length <= 1}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  breadcrumbs.length > 1
                    ? "hover:bg-gray-200 text-gray-600"
                    : "text-gray-300 cursor-not-allowed"
                )}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Breadcrumbs */}
            <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => navegarBreadcrumb(index)}
                    className={cn(
                      "px-2 py-1 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                      index === breadcrumbs.length - 1
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {index === 0 ? (
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" />
                        {crumb.name}
                      </span>
                    ) : (
                      crumb.name
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Controles de visualizaçÍo */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>

              {/* Link externo removido para manter navegaçÍo apenas dentro do portal */}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="min-h-[400px]">
          {loadingContents ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-500">Carregando...</span>
            </div>
          ) : contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">Pasta vazia</h3>
              <p className="text-sm text-gray-400 mt-1">
                Nenhum arquivo nesta pasta
              </p>
            </div>
          ) : viewMode === "grid" ? (
            // VisualizaçÍo em Grade (estilo Finder)
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {contents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => abrirArquivo(item)}
                    onDoubleClick={() => item.type === "folder" && navegarPara(item)}
                    className={cn(
                      "group p-3 rounded-xl transition-all text-center",
                      "hover:bg-blue-50 focus:bg-blue-100 focus:outline-none",
                      selectedItem?.id === item.id && "bg-blue-100 ring-2 ring-blue-500"
                    )}
                  >
                    {/* Ícone/Thumbnail */}
                    <div className="relative mx-auto mb-2">
                      {item.type === "folder" ? (
                        <div className="w-16 h-16 mx-auto">
                          <Folder className="w-full h-full text-blue-500 drop-shadow-sm" />
                          {item.fileCount !== undefined && item.fileCount > 0 && (
                            <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                              {item.fileCount}
                            </span>
                          )}
                        </div>
                      ) : item.mimeType?.startsWith("image/") && item.thumbnailUrl ? (
                        <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-lg">
                            <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto flex items-center justify-center">
                          {getFileIcon(item.mimeType)}
                        </div>
                      )}
                    </div>

                    {/* Nome */}
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-tight group-hover:text-blue-700">
                      {item.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // VisualizaçÍo em Lista
            <div className="divide-y divide-gray-100">
              {/* Header da lista */}
              <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 grid grid-cols-12 gap-4">
                <div className="col-span-6">Nome</div>
                <div className="col-span-3">Modificado</div>
                <div className="col-span-2">Tamanho</div>
                <div className="col-span-1"></div>
              </div>

              {contents.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => abrirArquivo(item)}
                  className={cn(
                    "w-full px-4 py-3 grid grid-cols-12 gap-4 items-center text-left",
                    "hover:bg-blue-50 focus:bg-blue-100 focus:outline-none transition-colors",
                    selectedItem?.id === item.id && "bg-blue-100"
                  )}
                >
                  {/* Nome com ícone */}
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    {item.type === "folder" ? (
                      <Folder className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    ) : item.mimeType?.startsWith("image/") && item.thumbnailUrl ? (
                      <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0">
                        {getFileIcon(item.mimeType)}
                      </div>
                    )}
                    <span className="text-sm text-gray-700 truncate">
                      {item.name}
                    </span>
                  </div>

                  {/* Data */}
                  <div className="col-span-3 text-xs text-gray-500">
                    {formatDate(item.modifiedTime)}
                  </div>

                  {/* Tamanho */}
                  <div className="col-span-2 text-xs text-gray-500">
                    {item.type === "folder"
                      ? `${item.fileCount || 0} itens`
                      : formatSize(item.size)
                    }
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 flex justify-end">
                    {item.webViewLink && item.type !== "folder" && (
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer com estatísticas */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {contents.filter((c) => c.type === "folder").length} pastas,{" "}
            {contents.filter((c) => c.type === "file").length} arquivos
          </span>
          <span className="text-gray-400">
            WG Easy Drive Explorer
          </span>
        </div>
      </div>

      {/* Modal de Preview de Imagem */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}


