import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import PessoaAvatarUploader from "@/components/pessoas/PessoaAvatarUploader";
import { gerarFichaClientePDF } from "@/lib/pdfFichaCliente";
import { useToast } from "@/components/ui/use-toast";

import {
  Phone,
  Mail,
  Edit,
  Trash,
  FileText,
  MessageCircle,
  Copy,
} from "lucide-react";

import ObrasList from "@/components/pessoas/ObrasList";
import DocumentosList from "@/components/pessoas/DocumentosList";
import OportunidadeTimeline from "@/components/oportunidades/OportunidadeTimeline";

type PessoaDetalhe = {
  id: string;
  nome: string;
  tipo?: string | null;
  cargo?: string | null;
  unidade?: string | null;
  cpf?: string | null;
  rg?: string | null;
  empresa?: string | null;
  contato_responsavel?: string | null;
  pix?: string | null;
  email?: string | null;
  telefone?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  obra_cep?: string | null;
  obra_logradouro?: string | null;
  obra_numero?: string | null;
  obra_complemento?: string | null;
  obra_bairro?: string | null;
  obra_cidade?: string | null;
  obra_estado?: string | null;
  avatar_url?: string | null;
  foto_url?: string | null;
  avatar?: string | null;
};

export default function PessoaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pessoa, setPessoa] = useState<PessoaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { toast } = useToast();

  // Busca pessoa no Supabase
  const fetchPessoa = useCallback(async () => {
    if (!id) {
      setErro("ID nÍo informado");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar pessoa:", error);
        setErro("Pessoa nÍo encontrada ou erro ao carregar dados.");
        setPessoa(null);
      } else {
        setPessoa(data);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      setErro("Erro inesperado ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPessoa();
  }, [fetchPessoa]);

  async function deletarPessoa() {
    if (!confirm("Deseja realmente excluir este cadastro?")) return;

    await supabase.from("pessoas").delete().eq("id", id);
    // Redirecionar para a lista correta baseado no tipo da pessoa
    const rotasPorTipo: Record<string, string> = {
      CLIENTE: "/pessoas/clientes",
      COLABORADOR: "/pessoas/colaboradores",
      FORNECEDOR: "/pessoas/fornecedores",
      ESPECIFICADOR: "/pessoas/especificadores",
    };
    const tipoPessoa = pessoa?.tipo || "CLIENTE";
    navigate(rotasPorTipo[tipoPessoa] || "/pessoas/clientes");
  }

  async function gerarPdfCliente() {
    if (!pessoa) return;
    try {
      await gerarFichaClientePDF({ pessoaId: pessoa.id });
    } catch (error) {
      console.error("Erro ao gerar PDF do cliente:", error);
      toast({
        title: error instanceof Error ? error.message : "NÍo foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="bg-white rounded-xl p-12 text-center border border-red-200 shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-[24px]">!</span>
          </div>
          <h2 className="text-[18px] font-light text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-[12px] text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg text-[13px] font-normal hover:bg-red-600 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!pessoa) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <h2 className="text-[18px] font-light text-gray-900 mb-2">Pessoa nao encontrada</h2>
          <p className="text-[12px] text-gray-600 mb-6">O cadastro solicitado nao existe.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const telefoneNumeros = (pessoa.telefone || "").replaceAll(/\D/g, "");
  // Se o telefone ja comeca com 55 (Brasil), nao adiciona 55 novamente
  const telefoneComCodigo = telefoneNumeros.startsWith("55")
    ? telefoneNumeros
    : `55${telefoneNumeros}`;
  const whatsapp = telefoneNumeros ? `https://wa.me/${telefoneComCodigo}` : null;

  const emailLink = pessoa.email ? `mailto:${pessoa.email}` : null;

  const formatarBloco = (
    titulo: string,
    campos: Array<[string, string | number | null | undefined]>
  ) => {
    const linhas = campos
      .filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== "")
      .map(([label, valor]) => `${label}: ${valor}`);
    return [titulo, ...linhas].join("\n");
  };

  const textoInformacoesGerais = formatarBloco("Informacoes Gerais", [
    ["Nome", pessoa.nome],
    ["Cargo / Funcao", pessoa.cargo],
    ["Unidade", pessoa.unidade],
    ["CPF", pessoa.cpf],
    ["RG", pessoa.rg],
    ["Empresa", pessoa.empresa],
    ["Contato Responsavel", pessoa.contato_responsavel],
    ["PIX", pessoa.pix],
    ["Email", pessoa.email],
    ["Telefone", pessoa.telefone],
  ]);

  const textoEndereco = formatarBloco("Endereco", [
    ["CEP", pessoa.cep],
    ["Logradouro", pessoa.logradouro],
    ["Numero", pessoa.numero],
    ["Complemento", pessoa.complemento],
    ["Bairro", pessoa.bairro],
    ["Cidade", pessoa.cidade],
    ["Estado", pessoa.estado],
  ]);

  const textoEnderecoObra = formatarBloco("Endereco da Obra", [
    ["CEP", pessoa.obra_cep],
    ["Logradouro", pessoa.obra_logradouro],
    ["Numero", pessoa.obra_numero],
    ["Complemento", pessoa.obra_complemento],
    ["Bairro", pessoa.obra_bairro],
    ["Cidade", pessoa.obra_cidade],
    ["Estado", pessoa.obra_estado],
  ]);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">

      {/* TOPO */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-6">

          {/* Avatar */}
          <PessoaAvatarUploader
            pessoaId={pessoa.id}
            nome={pessoa.nome}
            avatar_url={pessoa.avatar_url}
            foto_url={pessoa.foto_url}
            avatar={pessoa.avatar}
            onChange={async (data) => {
              await supabase.from("pessoas").update(data).eq("id", pessoa.id);
              fetchPessoa();
            }}
          />

          {/* Nome + tipo */}
          <div className="flex-1">
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">{pessoa.nome}</h1>
            <p className="text-[12px] text-gray-600 mt-1">{pessoa.tipo}</p>

            <div className="flex gap-4 text-[11px] text-gray-400 mt-3">
              {pessoa.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {pessoa.email}
                </div>
              )}

              {pessoa.telefone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {pessoa.telefone}
                </div>
              )}
            </div>
          </div>

          {/* Acoes */}
          <div className="flex items-center gap-2">

            {/* EDITAR */}
            <button
              onClick={() => {
                const pluralizarTipo = (tipo: string): string => {
                  const t = tipo.toLowerCase();
                  if (t.endsWith('or')) return t + 'es';
                  if (t.endsWith('e')) return t + 's';
                  return t + 's';
                };
                const tipoPlural = pluralizarTipo(pessoa.tipo || "cliente");
                navigate(`/pessoas/${tipoPlural}/editar/${pessoa.id}`);
              }}
              className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
              title="Editar"
            >
              <Edit className="w-5 h-5" />
            </button>

            {/* PDF */}
            <button
              onClick={gerarPdfCliente}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              title="Gerar PDF"
            >
              <FileText className="w-5 h-5" />
            </button>

            {/* WHATSAPP */}
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                title="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            )}

            {/* EMAIL */}
            {emailLink && (
              <a
                href={emailLink}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                title="Enviar Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            )}

            {/* EXCLUIR */}
            <button
              onClick={deletarPessoa}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Excluir"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* INFO GERAL */}
      <Section title="Informacoes Gerais" copyText={textoInformacoesGerais}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Info label="Cargo / Funcao" value={pessoa.cargo} />
          <Info label="Unidade" value={pessoa.unidade} />
          <Info label="CPF" value={pessoa.cpf} />
          <Info label="RG" value={pessoa.rg} />
          <Info label="Empresa" value={pessoa.empresa} />
          <Info label="Contato Responsavel" value={pessoa.contato_responsavel} />
          <Info label="PIX" value={pessoa.pix} />
        </div>
      </Section>

      {/* ENDEREÇO */}
      <Section title="Endereco" copyText={textoEndereco}>
        <Endereco pessoa={pessoa} />
      </Section>

      {/* ENDEREÇO DA OBRA */}
      {pessoa.tipo === "CLIENTE" && (
        <Section title="Endereco da Obra" copyText={textoEnderecoObra}>
          <Endereco pessoa={pessoa} prefixo="obra_" />
        </Section>
      )}

      {/* DOCUMENTOS */}
      <Section title="Documentos">
        <DocumentosList documentos={[]} />
      </Section>

      {/* OBRAS */}
      <Section title="Obras">
        <ObrasList obras={[]} />
      </Section>

      {/* OPORTUNIDADES */}
      <Section title="Oportunidades / Comercial">
        <OportunidadeTimeline pessoaId={pessoa.id} />
      </Section>

      {/* HISTÓRICO */}
      <Section title="Histórico">
        <div className="text-gray-500 text-sm">Em desenvolvimento...</div>
      </Section>

    </div>
  );
}

/* ---- COMPONENTES AUXILIARES ---- */

type SectionProps = {
  title: string;
  children: ReactNode;
  copyText?: string;
};

function Section({ title, children, copyText }: SectionProps) {
  const { toast } = useToast();
  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch (err) {
      console.error("Erro ao copiar:", err);
      toast({ title: "NÍo foi possível copiar os dados.", variant: "destructive" });
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4 mb-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-light text-gray-900">{title}</h2>
        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
            title="Copiar dados deste bloco"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

type InfoProps = {
  label: string;
  value?: string | number | null;
};

function Info({ label, value }: InfoProps) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-gray-400">{label}</span>
      <span className="text-[13px] font-normal text-gray-900">{value}</span>
    </div>
  );
}

type EnderecoProps = {
  pessoa: PessoaDetalhe;
  prefixo?: string;
};

function Endereco({ pessoa, prefixo = "" }: EnderecoProps) {
  const c = (campo: string) => {
    const key = `${prefixo}${campo}` as keyof PessoaDetalhe;
    return pessoa?.[key];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <Info label="CEP" value={c("cep")} />
      <Info label="Logradouro" value={c("logradouro")} />
      <Info label="Numero" value={c("numero")} />
      <Info label="Complemento" value={c("complemento")} />
      <Info label="Bairro" value={c("bairro")} />
      <Info label="Cidade" value={c("cidade")} />
      <Info label="Estado" value={c("estado")} />
    </div>
  );
}

