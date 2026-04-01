// ============================================================
// Componente de Upload de Projeto com Análise de IA
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useRef } from "react";
import {
  analisarProjetoComIA,
  processarArquivoProjeto,
  salvarAnaliseNoBanco,
  validarConfiguracaoIA,
  type ProjetoAnalisado,
} from "@/lib/projetoAnaliseAI";
import { useToast } from "@/components/ui/use-toast";
import { ProgressoIA, useProgressoIA } from "@/components/ui/ProgressoIA";

interface UploadProjetoIAProps {
  projetoId: string;
  nucleoId?: string | null;
  onAnaliseCompleta?: (analise: ProjetoAnalisado) => void;
  className?: string;
}

export function UploadProjetoIA({
  projetoId,
  nucleoId = null,
  onAnaliseCompleta,
  className = "",
}: UploadProjetoIAProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Estados
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analisando, setAnalisando] = useState(false);
  const [tipoAnalise, setTipoAnalise] = useState<"completo" | "ambientes" | "elementos" | "acabamentos">("completo");
  const [resultado, setResultado] = useState<ProjetoAnalisado | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [promptPersonalizado, setPromptPersonalizado] = useState<string>("");
  const [mostrarPromptAvancado, setMostrarPromptAvancado] = useState(false);
  const [provedorIA, setProvedorIA] = useState<"openai" | "anthropic">(
    (import.meta.env.VITE_AI_PROVIDER as "openai" | "anthropic") || "openai"
  );

  // Hook de progresso com etapas
  const progresso = useProgressoIA();

  /**
   * Selecionar arquivo
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!tiposAceitos.includes(file.type)) {
      toast({
        title: "Arquivo não suportado",
        description: "Use imagens JPEG/PNG ou PDF.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O limite é de 10MB.",
        variant: "destructive",
      });
      return;
    }

    setArquivo(file);

    // Criar preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(""); // PDF não tem preview
    }
  };

  /**
   * Analisar projeto com IA
   */
  const handleAnalisar = async () => {
    if (!arquivo) {
      toast({
        title: "Arquivo não selecionado",
        description: "Selecione um arquivo primeiro",
        variant: "destructive",
      });
      return;
    }

    // Validar configuraçÍo de IA
    const validacao = validarConfiguracaoIA();
    if (!validacao.valido) {
      toast({
        title: "ConfiguraçÍo inválida",
        description: validacao.mensagem || "Configure as chaves da IA antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    setAnalisando(true);
    progresso.iniciar();

    try {
      // Etapa 1: Preparar arquivo
      progresso.avancarPara("upload");
      await new Promise((r) => setTimeout(r, 300)); // Pequeno delay para UX

      progresso.atualizarProgresso(50);
      const imagemBase64 = await processarArquivoProjeto(arquivo);
      progresso.atualizarProgresso(100);

      // Etapa 2: Processar imagem
      progresso.avancarPara("processando");

      // Determinar o tipo de mídia correto
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      if (arquivo.type === "image/png") {
        mediaType = "image/png";
      } else if (arquivo.type === "image/gif") {
        mediaType = "image/gif";
      } else if (arquivo.type === "image/webp") {
        mediaType = "image/webp";
      }
      progresso.atualizarProgresso(100);

      // Etapa 3: Analisar com IA (simula progresso durante a espera)
      progresso.avancarPara("ia", true); // true = simular progresso
      const analise = await analisarProjetoComIA(imagemBase64, tipoAnalise, mediaType, promptPersonalizado);

      // Etapa 4: Salvar no banco
      progresso.avancarPara("salvando");
      progresso.atualizarProgresso(30);
      await salvarAnaliseNoBanco(projetoId, analise, nucleoId);
      progresso.atualizarProgresso(100);

      // Concluído
      progresso.finalizar();
      setResultado(analise);
      setMostrarResultado(true);

      toast({
        title: "Análise concluída",
        description: `${analise.ambientes.length} ambientes reconhecidos pela IA em ${progresso.tempoDecorrido}s.`,
      });

      // Callback
      onAnaliseCompleta?.(analise);
    } catch (error: any) {
      console.error("Erro ao analisar projeto:", error);
      progresso.resetar();
      toast({
        title: "Erro ao analisar projeto",
        description: error.message || "não foi possível interpretar o arquivo, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setAnalisando(false);
    }
  };

  /**
   * Limpar seleçÍo
   */
  const handleLimpar = () => {
    setArquivo(null);
    setPreviewUrl("");
    setResultado(null);
    setMostrarResultado(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-normal text-gray-900">🤖 Análise com IA</h3>
          <p className="text-sm text-gray-600">Leitura inteligente de plantas arquitetônicas</p>
          <p className="text-xs text-gray-500 mt-1">
            A IA identifica nomes dos ambientes, metragens quadradas, cotas lineares e pé-direito exatamente como aparecem na planta.
          </p>
        </div>
      </div>

      {/* SeleçÍo de Arquivo */}
      {!arquivo && (
        <div>
          <label className="block text-sm font-normal text-gray-700 mb-2">Selecionar Projeto</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-700 font-medium mb-2">Clique para selecionar ou arraste aqui</p>
            <p className="text-sm text-gray-500">JPEG, PNG, GIF ou WebP (máx. 20MB)</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFileSelect} className="hidden" />
        </div>
      )}

      {/* Preview do Arquivo */}
      {arquivo && (
        <div className="space-y-4">
          {/* Informações do arquivo */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                {arquivo.type.startsWith("image/") ? (
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{arquivo.name}</p>
                <p className="text-sm text-gray-500">{(arquivo.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <button onClick={handleLimpar} className="text-gray-400 hover:text-red-500 transition-colors" disabled={analisando}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Preview da imagem */}
          {previewUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img src={previewUrl} alt="Preview" className="w-full h-64 object-contain bg-gray-50" loading="lazy" />
            </div>
          )}

          {/* Tipo de Análise */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">Tipo de Análise</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTipoAnalise("completo")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  tipoAnalise === "completo" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🎯 Completo</p>
                <p className="text-xs text-gray-600">Ambientes + Elementos + Acabamentos</p>
              </button>
              <button
                onClick={() => setTipoAnalise("ambientes")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  tipoAnalise === "ambientes" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🏠 Ambientes</p>
                <p className="text-xs text-gray-600">Identificar espaços e medidas</p>
              </button>
              <button
                onClick={() => setTipoAnalise("elementos")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  tipoAnalise === "elementos" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🚪 Elementos</p>
                <p className="text-xs text-gray-600">Portas, janelas, tomadas, etc.</p>
              </button>
              <button
                onClick={() => setTipoAnalise("acabamentos")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  tipoAnalise === "acabamentos" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🎨 Acabamentos</p>
                <p className="text-xs text-gray-600">Pisos, tintas, revestimentos, etc.</p>
              </button>
            </div>
          </div>

          {/* SeleçÍo do Provedor de IA */}
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-2">Provedor de IA</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setProvedorIA("openai")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  provedorIA === "openai" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🟢 OpenAI GPT-4</p>
                <p className="text-xs text-gray-600">Modelo GPT-4o Vision</p>
              </button>
              <button
                onClick={() => setProvedorIA("anthropic")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  provedorIA === "anthropic" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}
                disabled={analisando}
              >
                <p className="font-normal text-gray-900">🟠 Claude (Anthropic)</p>
                <p className="text-xs text-gray-600">Modelo Claude Sonnet</p>
              </button>
            </div>
          </div>

          {/* Prompt Personalizado */}
          <div>
            <button
              type="button"
              onClick={() => setMostrarPromptAvancado(!mostrarPromptAvancado)}
              className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              disabled={analisando}
            >
              <svg
                className={`w-4 h-4 transition-transform ${mostrarPromptAvancado ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              ⚙️ Instruções personalizadas para IA
            </button>

            {mostrarPromptAvancado && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={promptPersonalizado}
                  onChange={(e) => setPromptPersonalizado(e.target.value)}
                  placeholder="Exemplo: Foque apenas nos ambientes do térreo. Ignore cotas de esquadrias. Considere pé-direito padrÍo de 3m para áreas sociais..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                  disabled={analisando}
                />
                <p className="text-xs text-gray-500">
                  💡 Adicione instruções específicas para guiar a análise da IA. Quanto mais detalhado, melhor o resultado.
                </p>
              </div>
            )}
          </div>

          {/* Barra de Progresso Inteligente */}
          {analisando && progresso.ativo && (
            <ProgressoIA
              etapaAtual={progresso.etapaAtual}
              progressoEtapa={progresso.progressoEtapa}
              tempoDecorrido={progresso.tempoDecorrido}
              mostrarTempo={true}
            />
          )}

          {/* BotÍo Analisar */}
          <button
            onClick={handleAnalisar}
            disabled={analisando}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-normal hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {analisando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Analisar com IA
              </>
            )}
          </button>
        </div>
      )}

      {/* Resultado */}
      {mostrarResultado && resultado && (
        <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-normal text-green-900">Análise Concluída!</h4>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3">
              <p className="text-2xl font-normal text-purple-600">{resultado.ambientes.length}</p>
              <p className="text-xs text-gray-600">Ambientes</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-2xl font-normal text-indigo-600">{resultado.elementos.length}</p>
              <p className="text-xs text-gray-600">Elementos</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-2xl font-normal text-blue-600">{resultado.acabamentos.length}</p>
              <p className="text-xs text-gray-600">Acabamentos</p>
            </div>
          </div>

          {resultado.observacoes && resultado.observacoes.length > 0 && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <p className="text-sm font-normal text-gray-700 mb-1">Observações:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {resultado.observacoes.map((obs, idx) => (
                  <li key={idx}>• {obs}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


