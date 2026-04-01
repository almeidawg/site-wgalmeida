// ============================================================
// MODAL: Importar Comprovante - Cole e Extraia Dados
// Sistema WG Easy - Grupo WG Almeida
// Parser de texto de comprovantes PIX/TED/Boleto
// ============================================================

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Banknote,
  Calendar,
  User,
  Building2,
  Tag,
  FileText,
  Loader2,
} from "lucide-react";
import {
  parseComprovante,
  DadosComprovante,
  sugerirDescricaoLancamento,
} from "@/lib/comprovanteParser";

// Cores WG
const WG_ORANGE = "#F25C26";

interface ImportarComprovanteModalProps {
  open: boolean;
  onClose: () => void;
  onImportar: (dados: DadosLancamentoExtraido) => void;
}

export interface DadosLancamentoExtraido {
  tipo: "receita" | "despesa";
  valor: number;
  data: Date | null;
  descricao: string;
  favorecido: string;
  favorecidoDocumento: string;
  banco: string;
  idTransacao: string;
  formaPagamento: string;
  dadosOriginais: DadosComprovante;
}

export default function ImportarComprovanteModal({
  open,
  onClose,
  onImportar,
}: ImportarComprovanteModalProps) {
  const [etapa, setEtapa] = useState<"colar" | "revisar">("colar");
  const [textoComprovante, setTextoComprovante] = useState("");
  const [dadosExtraidos, setDadosExtraidos] = useState<DadosComprovante | null>(null);
  const [processando, setProcessando] = useState(false);

  // Campos editáveis
  const [tipoLancamento, setTipoLancamento] = useState<"receita" | "despesa">("receita");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [favorecido, setFavorecido] = useState("");

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setEtapa("colar");
      setTextoComprovante("");
      setDadosExtraidos(null);
      setTipoLancamento("receita");
      setValor("");
      setData("");
      setDescricao("");
      setFavorecido("");
    }
  }, [open]);

  // Colar da área de transferência
  const handleColar = async () => {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto) {
        setTextoComprovante(texto);
      }
    } catch {
      console.warn("não foi possível acessar a área de transferência");
    }
  };

  // Processar comprovante
  const handleProcessar = () => {
    if (!textoComprovante.trim()) return;

    setProcessando(true);

    // Simular pequeno delay para UX
    setTimeout(() => {
      const dados = parseComprovante(textoComprovante);
      setDadosExtraidos(dados);

      // Preencher campos editáveis
      setValor(dados.valor > 0 ? dados.valor.toFixed(2).replace(".", ",") : "");

      if (dados.data) {
        const dataFormatada = dados.data.toISOString().split("T")[0];
        setData(dataFormatada);
      }

      setDescricao(sugerirDescricaoLancamento(dados));
      setFavorecido(dados.pagadorNome || dados.recebedorNome || "");

      // Se recebemos dinheiro (tem pagador), é receita
      // Se pagamos alguém (tem recebedor e não tem pagador), é despesa
      if (dados.pagadorNome && dados.recebedorNome.toLowerCase().includes("wg")) {
        setTipoLancamento("receita");
      } else {
        setTipoLancamento("despesa");
      }

      setEtapa("revisar");
      setProcessando(false);
    }, 300);
  };

  // Confirmar importaçÍo
  const handleConfirmar = () => {
    if (!dadosExtraidos) return;

    const valorNumero = parseFloat(valor.replace(/\./g, "").replace(",", "."));

    const dadosFinais: DadosLancamentoExtraido = {
      tipo: tipoLancamento,
      valor: valorNumero || 0,
      data: data ? new Date(data) : null,
      descricao,
      favorecido,
      favorecidoDocumento: dadosExtraidos.pagadorDocumento || dadosExtraidos.recebedorDocumento,
      banco: dadosExtraidos.pagadorBanco || dadosExtraidos.recebedorBanco,
      idTransacao: dadosExtraidos.idTransacao,
      formaPagamento: dadosExtraidos.tipo,
      dadosOriginais: dadosExtraidos,
    };

    onImportar(dadosFinais);
    onClose();
  };

  // Indicador de confiança
  const renderConfianca = (confianca: number) => {
    const cor = confianca >= 80 ? "text-green-600" : confianca >= 50 ? "text-yellow-600" : "text-red-600";
    const icone = confianca >= 80 ? CheckCircle2 : AlertCircle;
    const Icone = icone;

    return (
      <div className={`flex items-center gap-1.5 ${cor}`}>
        <Icone className="w-4 h-4" />
        <span className="text-sm font-medium">{confianca}% detectado</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5" style={{ color: WG_ORANGE }} />
            Importar Comprovante
          </DialogTitle>
        </DialogHeader>

        {/* ETAPA 1: Colar texto */}
        {etapa === "colar" && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Como usar:</strong> Copie o texto do comprovante do seu app bancário
                e cole aqui. O sistema vai extrair automaticamente os dados.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Texto do Comprovante</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleColar}
                  className="gap-1.5"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Colar
                </Button>
              </div>
              <Textarea
                placeholder="Cole aqui o texto copiado do comprovante PIX, TED ou Boleto..."
                value={textoComprovante}
                onChange={(e) => setTextoComprovante(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleProcessar}
                disabled={!textoComprovante.trim() || processando}
                style={{ backgroundColor: WG_ORANGE }}
              >
                {processando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extrair Dados
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ETAPA 2: Revisar dados extraídos */}
        {etapa === "revisar" && dadosExtraidos && (
          <div className="space-y-4">
            {/* Status da extraçÍo */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-1 text-xs font-normal rounded"
                  style={{
                    backgroundColor: `${WG_ORANGE}20`,
                    color: WG_ORANGE,
                  }}
                >
                  {dadosExtraidos.tipo}
                </span>
                {dadosExtraidos.idTransacao && (
                  <span className="text-xs text-gray-500 font-mono">
                    {dadosExtraidos.idTransacao.substring(0, 15)}...
                  </span>
                )}
              </div>
              {renderConfianca(dadosExtraidos.confianca)}
            </div>

            {/* Campos editáveis */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tipo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Tipo de Lançamento
                </Label>
                <Select value={tipoLancamento} onValueChange={(v) => setTipoLancamento(v as "receita" | "despesa")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">
                      <span className="text-green-600">Receita (Entrada)</span>
                    </SelectItem>
                    <SelectItem value="despesa">
                      <span className="text-red-600">Despesa (Saída)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" />
                  Valor
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Data
                </Label>
                <Input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>

              {/* Favorecido/Pagador */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {tipoLancamento === "receita" ? "Pagador" : "Favorecido"}
                </Label>
                <Input
                  value={favorecido}
                  onChange={(e) => setFavorecido(e.target.value)}
                  placeholder="Nome"
                />
              </div>
            </div>

            {/* DescriçÍo */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                DescriçÍo
              </Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="DescriçÍo do lançamento"
              />
            </div>

            {/* Info adicional extraída */}
            {(dadosExtraidos.pagadorBanco || dadosExtraidos.recebedorBanco) && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>
                    {dadosExtraidos.pagadorBanco || dadosExtraidos.recebedorBanco}
                  </span>
                </div>
                {dadosExtraidos.idTransacao && (
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <Tag className="w-4 h-4" />
                    <span className="font-mono text-xs">{dadosExtraidos.idTransacao}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEtapa("colar")}>
                Voltar
              </Button>
              <Button
                onClick={handleConfirmar}
                disabled={!valor || !data}
                style={{ backgroundColor: WG_ORANGE }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Criar Lançamento
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


