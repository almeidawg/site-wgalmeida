// ============================================================
// Memorial Upload Modal - Upload de Memorial de Obra
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback, type ChangeEvent } from "react";
import { X, Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MemorialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemorialProcessado: (memorialId: string) => void;
}

interface MemorialProcessado {
  id: string;
  arquivo: string;
  blocos: number;
  servicos: number;
  ambientes: number;
}

export default function MemorialUploadModal({
  isOpen,
  onClose,
  onMemorialProcessado,
}: MemorialUploadModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [memorial, setMemorial] = useState<MemorialProcessado | null>(null);

  // Upload de arquivo
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      const tiposPermitidos = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!tiposPermitidos.includes(file.type)) {
        toast.error("Tipo de arquivo não suportado. Use PDF ou DOCX.");
        return;
      }

      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
        return;
      }

      setArquivo(file);
      setMemorial(null);
    }
  }, []);

  // Processar memorial
  const handleUpload = useCallback(async () => {
    if (!arquivo) return;

    setUploading(true);
    setProgresso(10);

    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);

      setProgresso(30);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/memorial/upload`,
        {
          method: "POST",
          headers: {
            "X-Internal-Key": import.meta.env.VITE_INTERNAL_API_KEY,
          },
          body: formData,
        }
      );

      setProgresso(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar memorial");
      }

      const data = await response.json();

      setProgresso(100);
      setMemorial(data.memorial);

      toast.success(
        `Memorial processado: ${data.memorial.servicos} serviços encontrados!`
      );

      // Chamar callback após 1 segundo
      setTimeout(() => {
        onMemorialProcessado(data.memorial.id);
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao processar memorial:", error);
      toast.error(error.message || "Falha ao processar memorial");
      setProgresso(0);
    } finally {
      setUploading(false);
    }
  }, [arquivo, onMemorialProcessado]);

  // Resetar modal
  const handleClose = useCallback(() => {
    setArquivo(null);
    setMemorial(null);
    setProgresso(0);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F25C26] to-orange-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Importar Memorial de Obra
              </h2>
              <p className="text-sm text-white/90">
                IA irá processar e categorizar automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!memorial ? (
            <>
              {/* Área de Upload */}
              <div className="mb-6">
                <label
                  htmlFor="file-upload"
                  className={`
                    flex flex-col items-center justify-center
                    border-2 border-dashed rounded-xl p-8
                    cursor-pointer transition-all
                    ${arquivo ? "border-[#F25C26] bg-orange-50" : "border-gray-300 hover:border-[#F25C26] hover:bg-gray-50"}
                    ${uploading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    {arquivo ? (
                      <>
                        <FileText className="w-12 h-12 text-[#F25C26]" />
                        <p className="text-sm font-medium text-gray-900">
                          {arquivo.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(arquivo.size / 1024).toFixed(2)} KB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          Clique para selecionar ou arraste o arquivo
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF ou DOCX • Máximo 10MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Informações */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  🤖 O que a IA fará automaticamente:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 ml-4">
                  <li>• Extrair e categorizar todos os serviços</li>
                  <li>• Identificar ambientes e dimensões</li>
                  <li>• Fazer matching com pricelist (85-90% de precisÍo)</li>
                  <li>• Calcular quantidades estimadas</li>
                </ul>
              </div>

              {/* Progresso */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Processando memorial...
                    </span>
                    <span className="text-sm font-medium text-[#F25C26]">
                      {progresso}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!arquivo || uploading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Processar com IA
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Resultado do Processamento */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Memorial Processado com Sucesso!
                </h3>
                <p className="text-sm text-gray-600">
                  {memorial.arquivo}
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">{memorial.blocos}</p>
                  <p className="text-xs text-blue-600 font-medium">Blocos</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{memorial.servicos}</p>
                  <p className="text-xs text-green-600 font-medium">Serviços</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-700">{memorial.ambientes}</p>
                  <p className="text-xs text-purple-600 font-medium">Ambientes</p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Próximo passo: RevisÍo de matching
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Você será redirecionado para revisar os itens identificados pela IA
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Continuar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


