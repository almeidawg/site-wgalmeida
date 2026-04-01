/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Modal de SolicitaçÍo de Reembolso/Pagamento
 * Permite solicitar reembolsos com captura de foto do comprovante
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Receipt,
  Camera,
  Upload,
  X,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Image,
  Trash2,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { googleDriveService } from "@/services/googleDriveBrowserService";

type DestinoPagamento = "meu" | "colaborador" | "fornecedor";

const DESTINO_OPTIONS: { value: DestinoPagamento; label: string }[] = [
  { value: "meu", label: "Meu Pagamento" },
  { value: "colaborador", label: "Para Colaborador" },
  { value: "fornecedor", label: "Para Fornecedor" },
];

interface Cliente {
  id: string;
  nome: string;
  google_drive_folder_id?: string;
}

interface Contrato {
  id: string;
  numero: string;
  cliente_nome?: string;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

interface SolicitacaoReembolsoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tipo: "reembolso" | "pagamento";
  solicitanteId: string;
}

export function SolicitacaoReembolsoModal({
  open,
  onClose,
  onSuccess,
  tipo,
  solicitanteId,
}: SolicitacaoReembolsoModalProps) {
  const { toast } = useToast();

  // Estados do formulário
  const [clienteId, setClienteId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [dataDespesa, setDataDespesa] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [categoria, setCategoria] = useState("outros");
  const [comentario, setComentario] = useState("");
  const [destinoPagamento, setDestinoPagamento] =
    useState<DestinoPagamento>("meu");
  const [clienteBusca, setClienteBusca] = useState("");
  const [centroCusto, setCentroCusto] = useState("");
  const [cpfBeneficiario, setCpfBeneficiario] = useState("");

  // Estados de dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Estados de imagem
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [imagemBlob, setImagemBlob] = useState<Blob | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Estados de loading
  const [loading, setLoading] = useState(false);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [carregandoContratos, setCarregandoContratos] = useState(false);

  // Dados extraídos do comprovante (OCR simulado)
  const [dadosExtraidos, setDadosExtraidos] = useState<{
    valor?: string;
    data?: string;
    estabelecimento?: string;
  } | null>(null);

  const clientesFiltrados = useMemo(() => {
    const termo = clienteBusca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter((cliente) =>
      cliente.nome.toLowerCase().includes(termo)
    );
  }, [clientes, clienteBusca]);

  const tipoPessoa =
    destinoPagamento === "colaborador"
      ? "COLABORADOR"
      : destinoPagamento === "fornecedor"
        ? "FORNECEDOR"
        : "CLIENTE";

  // Validar CPF
  const validarCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let mod = (sum * 10) % 11;
    if (mod === 10 || mod === 11) mod = 0;
    if (mod !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    mod = (sum * 10) % 11;
    if (mod === 10 || mod === 11) mod = 0;
    return mod === parseInt(cpf.charAt(10));
  };

  // Formatar CPF
  const formatarCPF = (value: string) => {
    const numeros = value.replace(/\D/g, "").slice(0, 11);
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Carregar clientes
  const carregarClientes = useCallback(async () => {
    setCarregandoClientes(true);
    try {
      let query = supabase
        .from("pessoas")
        .select("id, nome, google_drive_folder_id, status")
        .eq("tipo", tipoPessoa)
        .eq("ativo", true);

      // Excluir pessoas com status "concluido" apenas para clientes
      if (tipoPessoa === "CLIENTE") {
        query = query.or("status.is.null,status.neq.concluido");
      }

      const { data, error } = await query.order("nome", { ascending: true });

      if (!error) {
        setClientes(data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setCarregandoClientes(false);
    }
  }, [tipoPessoa]);

  // Carregar contratos do cliente (somente quando destino é CLIENTE)
  const carregarContratos = useCallback(async () => {
    if (!clienteId || tipoPessoa !== "CLIENTE") {
      setContratos([]);
      return;
    }

    setCarregandoContratos(true);
    try {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero, cliente:pessoas!contratos_cliente_id_fkey(nome)")
        .eq("cliente_id", clienteId)
        .order("numero", { ascending: false });

      if (!error) {
        setContratos(
          (data || []).map((c: any) => ({
            ...c,
            cliente_nome: c.cliente?.nome,
          }))
        );
      }
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
    } finally {
      setCarregandoContratos(false);
    }
  }, [clienteId]);

  // Carregar categorias
  const carregarCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_despesa")
        .select("id, nome, icone, cor")
        .eq("ativo", true)
        .order("ordem");

      if (!error && data) {
        setCategorias(data);
      } else {
        // Categorias padrÍo se tabela não existir
        setCategorias([
          { id: "alimentacao", nome: "AlimentaçÍo", icone: "utensils", cor: "#F59E0B" },
          { id: "transporte", nome: "Transporte", icone: "car", cor: "#3B82F6" },
          { id: "material", nome: "Material de Obra", icone: "hammer", cor: "#10B981" },
          { id: "servicos", nome: "Serviços", icone: "briefcase", cor: "#06B6D4" },
          { id: "outros", nome: "Outros", icone: "receipt", cor: "#6B7280" },
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }, []);

  // Efeitos de carregamento
  useEffect(() => {
    if (open) {
      carregarClientes();
      carregarCategorias();
    }
  }, [open, carregarClientes, carregarCategorias, tipoPessoa]);

  useEffect(() => {
    if (open && clienteId) {
      carregarContratos();
      setContratoId("");
    }
  }, [clienteId, open, carregarContratos]);

  // Buscar centro de custo automaticamente quando selecionar colaborador/fornecedor
  useEffect(() => {
    const buscarCentroCusto = async () => {
      if (!clienteId || tipoPessoa === "CLIENTE") {
        setCentroCusto("");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pessoas")
          .select("centro_custo, cpf")
          .eq("id", clienteId)
          .single();

        if (!error && data) {
          setCentroCusto(data.centro_custo || "");
          setCpfBeneficiario(data.cpf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar centro de custo:", error);
      }
    };

    if (open && clienteId) {
      buscarCentroCusto();
    }
  }, [clienteId, open, tipoPessoa]);

  // Limpar formulário
  const limparFormulario = () => {
    setClienteId("");
    setContratoId("");
    setDescricao("");
    setValor("");
    setDataDespesa(new Date().toISOString().split("T")[0]);
    setCategoria("outros");
    setComentario("");
    setDestinoPagamento("meu");
    setClienteBusca("");
    setCentroCusto("");
    setCpfBeneficiario("");
    setImagemPreview(null);
    setImagemBlob(null);
    setDadosExtraidos(null);
  };

  // Handler para captura de foto
  const handleCapturaFoto = (imageData: string, blob: Blob) => {
    setImagemPreview(imageData);
    setImagemBlob(blob);
    setShowCamera(false);

    // Simular extraçÍo de dados (em produçÍo, usar OCR real)
    // Aqui você pode integrar com Google Vision API ou similar
    toast({
      title: "Foto capturada",
      description: "Preencha os dados do comprovante",
    });
  };

  // Handler para upload de arquivo
  const handleUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Selecione apenas arquivos de imagem",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagemPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Converter para blob
    file.arrayBuffer().then((buffer) => {
      setImagemBlob(new Blob([buffer], { type: file.type }));
    });
  };

  // Remover imagem
  const removerImagem = () => {
    setImagemPreview(null);
    setImagemBlob(null);
    setDadosExtraidos(null);
  };

  // Formatar valor monetário
  const formatarValorInput = (value: string) => {
    // Remove tudo que não é número
    const numero = value.replace(/\D/g, "");
    // Converte para decimal
    const decimal = (parseInt(numero) / 100).toFixed(2);
    // Formata
    return decimal === "NaN" ? "" : decimal;
  };

  // Enviar solicitaçÍo
  const handleEnviar = async () => {
    // Validações
    if (!clienteId) {
      toast({
        title: "Erro",
        description: "Selecione o cliente",
        variant: "destructive",
      });
      return;
    }

    // Validar CPF se for colaborador ou fornecedor
    if (tipoPessoa !== "CLIENTE" && cpfBeneficiario) {
      if (!validarCPF(cpfBeneficiario)) {
        toast({
          title: "Erro",
          description: "CPF inválido",
          variant: "destructive",
        });
        return;
      }
    }

    if (!descricao.trim()) {
      toast({
        title: "Erro",
        description: "Informe a descriçÍo da despesa",
        variant: "destructive",
      });
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (!valorNumerico || valorNumerico <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    const destinoLabel =
      tipo === "pagamento"
        ? DESTINO_OPTIONS.find((opt) => opt.value === destinoPagamento)?.label
        : undefined;
    const comentarioFinal = [
      comentario.trim(),
      destinoLabel ? `Destino: ${destinoLabel}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    setLoading(true);

    try {
      let comprovanteUrl: string | null = null;
      let googleDriveUrl: string | null = null;
      let googleDriveFileId: string | null = null;

      // Upload da imagem para Google Drive se existir
      if (imagemBlob) {
        const clienteSelecionado = clientes.find((c) => c.id === clienteId);

        if (clienteSelecionado) {
          try {
            // Autenticar no Google Drive
            await googleDriveService.authenticate();

            // Buscar pasta do cliente no Google Drive
            let pastaClienteId = clienteSelecionado.google_drive_folder_id;

            if (!pastaClienteId) {
              // Se não tem pasta, tentar buscar pelo nome
              const pastaExistente = await googleDriveService.buscarPastaCliente(
                clienteSelecionado.nome
              );
              if (pastaExistente) {
                pastaClienteId = pastaExistente.id;
              }
            }

            if (pastaClienteId) {
              // Buscar ou criar subpasta "Reembolsos" dentro de "05 . Financeiro - CONFIDENCIAL"
              const subpastas = await googleDriveService.listarSubpastas(pastaClienteId);

              // Procurar pasta Financeiro
              let pastaFinanceiroId: string | null = null;
              const pastaFinanceiro = subpastas.find(
                (p) => p.name.toLowerCase().includes("financeiro")
              );

              if (pastaFinanceiro) {
                pastaFinanceiroId = pastaFinanceiro.id;
              } else {
                // Criar pasta Financeiro se não existir
                const novaFinanceiro = await googleDriveService.criarPasta(
                  "05 . Financeiro - CONFIDENCIAL",
                  pastaClienteId
                );
                pastaFinanceiroId = novaFinanceiro.folderId;
              }

              // Procurar ou criar pasta Reembolsos dentro de Financeiro
              const subpastasFinanceiro = await googleDriveService.listarSubpastas(pastaFinanceiroId);
              let pastaReembolsosId: string;

              const pastaReembolsos = subpastasFinanceiro.find(
                (p) => p.name.toLowerCase().includes("reembolso")
              );

              if (pastaReembolsos) {
                pastaReembolsosId = pastaReembolsos.id;
              } else {
                // Criar pasta Reembolsos
                const novaPasta = await googleDriveService.criarPasta(
                  "Reembolsos",
                  pastaFinanceiroId
                );
                pastaReembolsosId = novaPasta.folderId;
              }

              // Fazer upload do comprovante
              const dataFormatada = new Date().toISOString().split("T")[0].replace(/-/g, "");
              const fileName = `${dataFormatada}_${tipo}_${descricao.substring(0, 30).replace(/\s+/g, "_")}.jpg`;

              const file = new File([imagemBlob], fileName, { type: "image/jpeg" });
              const uploadResult = await googleDriveService.uploadArquivo(file, pastaReembolsosId);

              googleDriveUrl = uploadResult.webViewLink;
              googleDriveFileId = uploadResult.id;
              comprovanteUrl = uploadResult.webViewLink;

              toast({
                title: "Foto salva no Google Drive",
                description: `Pasta: ${clienteSelecionado.nome}/Financeiro/Reembolsos`,
              });
            } else {
              console.warn("Pasta do cliente não encontrada no Google Drive");
              // Fallback: salvar no Supabase Storage
              const fileNameFallback = `reembolso_${Date.now()}.jpg`;
              const filePath = `reembolsos/${solicitanteId}/${fileNameFallback}`;

              const { error: uploadError } = await supabase.storage
                .from("documentos")
                .upload(filePath, imagemBlob, {
                  contentType: "image/jpeg",
                  upsert: true,
                });

              if (!uploadError) {
                const { data: urlData } = supabase.storage
                  .from("documentos")
                  .getPublicUrl(filePath);
                comprovanteUrl = urlData.publicUrl;
              }
            }
          } catch (driveError) {
            console.error("Erro ao fazer upload no Google Drive:", driveError);
            toast({
              title: "Aviso",
              description: "não foi possível salvar no Google Drive. A foto será salva localmente.",
              variant: "destructive",
            });

            // Fallback: salvar no Supabase Storage
            const fileNameFallback = `reembolso_${Date.now()}.jpg`;
            const filePath = `reembolsos/${solicitanteId}/${fileNameFallback}`;

            const { error: uploadError } = await supabase.storage
              .from("documentos")
              .upload(filePath, imagemBlob, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (!uploadError) {
              const { data: urlData } = supabase.storage
                .from("documentos")
                .getPublicUrl(filePath);
              comprovanteUrl = urlData.publicUrl;
            }
          }
        }
      }

      // Inserir solicitaçÍo
      const { error } = await supabase.from("solicitacoes_reembolso").insert({
        tipo,
        solicitante_id: solicitanteId,
        cliente_id: clienteId,
        contrato_id: contratoId || null,
        descricao: descricao.trim(),
        valor: valorNumerico,
        data_despesa: dataDespesa,
        categoria,
        comprovante_url: comprovanteUrl,
        google_drive_url: googleDriveUrl,
        google_drive_file_id: googleDriveFileId,
        comentario_solicitante: comentarioFinal || null,
        status: "pendente",
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${
          tipo === "reembolso"
            ? "Reembolso"
            : destinoLabel ?? "Pagamento"
        } solicitado com sucesso!`,
      });

      limparFormulario();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao enviar solicitaçÍo:", error);
      toast({
        title: "Erro",
        description: "não foi possível enviar a solicitaçÍo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    limparFormulario();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          aria-describedby="solicitacao-pagamento-descricao"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#F25C26]" />
              {tipo === "reembolso"
                ? "Solicitar Reembolso"
                : "Solicitar Pagamento"}
            </DialogTitle>
            <DialogDescription id="solicitacao-pagamento-descricao">
              Preencha os dados e anexe o comprovante para enviar a solicitaçÍo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Área de Comprovante */}
            <div>
              <Label className="mb-2 block">Comprovante</Label>
              {imagemPreview ? (
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={imagemPreview}
                    alt="Comprovante"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removerImagem}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-24 flex-col gap-2"
                    onClick={() => setShowCamera(true)}
                  >
                    <Camera className="h-6 w-6 text-[#F25C26]" />
                    <span className="text-xs">Tirar Foto</span>
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadArquivo}
                    />
                    <div className="h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#F25C26] hover:bg-orange-50 transition-colors">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Fazer Upload
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 mb-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                {tipoPessoa === "CLIENTE" ? "Cliente *" : "Beneficiário *"}
              </Label>
              <Input
                value={clienteBusca}
                onChange={(e) => setClienteBusca(e.target.value)}
                placeholder={
                  tipoPessoa === "CLIENTE"
                    ? "Buscar cliente..."
                    : "Buscar beneficiário..."
                }
              />
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoClientes
                        ? "Carregando..."
                        : "Selecione o cliente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clientesFiltrados.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tipo === "pagamento" && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Tipo de Pagamento
                </Label>
                <Select
                  value={destinoPagamento}
                  onValueChange={(value) =>
                    setDestinoPagamento(value as DestinoPagamento)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Meu Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Centro de Custo (exibir quando colaborador/fornecedor) */}
            {tipoPessoa !== "CLIENTE" && centroCusto && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Centro de Custo
                </Label>
                <Input value={centroCusto} disabled className="bg-gray-50" />
              </div>
            )}

            {/* CPF (exibir quando colaborador/fornecedor) */}
            {tipoPessoa !== "CLIENTE" && cpfBeneficiario && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  CPF do Beneficiário
                </Label>
                <Input
                  value={formatarCPF(cpfBeneficiario)}
                  disabled
                  className={`bg-gray-50 ${
                    validarCPF(cpfBeneficiario)
                      ? "border-green-300"
                      : "border-red-300"
                  }`}
                />
                {!validarCPF(cpfBeneficiario) && (
                  <p className="text-xs text-red-500 mt-1">CPF inválido</p>
                )}
              </div>
            )}
            {/* Contrato (opcional) */}
            {clienteId && tipoPessoa === "CLIENTE" && (
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Contrato/Projeto (opcional)
                </Label>
                <Select value={contratoId} onValueChange={setContratoId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        carregandoContratos
                          ? "Carregando..."
                          : "Selecione o contrato"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {contratos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DescriçÍo */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <FileText className="h-4 w-4 text-gray-400" />
                DescriçÍo da Despesa *
              </Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Almoço com cliente, Uber para obra..."
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  Valor *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Data da Despesa *
                </Label>
                <Input
                  type="date"
                  value={dataDespesa}
                  onChange={(e) => setDataDespesa(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <Tag className="h-4 w-4 text-gray-400" />
                Categoria
              </Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.cor }}
                        />
                        {cat.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comentário */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                Comentário (opcional)
              </Label>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Informações adicionais sobre a despesa..."
                rows={2}
              />
            </div>

            {/* Info do fluxo */}
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Fluxo de AprovaçÍo:</p>
              <p className="text-xs text-blue-600">
                Sua solicitaçÍo será enviada para aprovaçÍo. Após aprovada, o
                valor será incluído no faturamento do cliente e você receberá o
                reembolso.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnviar}
                className="flex-1 bg-primary hover:bg-[#D94E1F]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Enviar SolicitaçÍo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Câmera */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCapturaFoto}
        title="Fotografar Comprovante"
      />
    </>
  );
}

export default SolicitacaoReembolsoModal;
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


