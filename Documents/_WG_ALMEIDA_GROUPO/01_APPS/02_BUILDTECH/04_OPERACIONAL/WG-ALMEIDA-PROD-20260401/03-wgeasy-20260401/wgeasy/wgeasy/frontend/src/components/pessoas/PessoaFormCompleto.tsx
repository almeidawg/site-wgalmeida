/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { FilePlus as FolderPlus, ExternalLink, Loader2, FileCheck as FolderCheck } from "lucide-react";
import PessoaAvatarUploader from "@/components/pessoas/PessoaAvatarUploader";
import type { PessoaInput, PessoaTipo } from "@/types/pessoas";
import { formatCPF, formatCNPJ, formatRG, formatCEP } from "@/lib/formatters";
import { buscarEmpresaPorCNPJ } from "@/lib/cnpjApi";
import { BANCOS_BRASILEIROS } from "@/lib/bancos";
import { PhoneInputInternacional } from "@/components/ui/PhoneInputInternacional";
import {
  listarCategoriasComissao,
  listarEspecificadoresMaster,
  CategoriaComissao,
  EspecificadorMaster,
} from "@/lib/cadastroLinkApi";
import { criarPastaCliente, isBackendConfigured } from "@/lib/apiSecure";
import { listarCategoriasCompras, type CategoriaCompras } from "@/lib/listaComprasApi";
import { listarCategorias, type PricelistCategoria } from "@/lib/pricelistApi";

type PessoaFormCompletoProps = {
  tipo: PessoaTipo;
  onSubmit: (data: PessoaInput) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<PessoaInput> & { id?: string };
};

// Valores padrao de estado civil - consistentes para salvar e carregar
const ESTADOS_CIVIS_VALIDOS = [
  "Solteiro",
  "Casado",
  "Divorciado",
  "Viuvo",
  "Uniao Estavel",
];

function normalizarEstadoCivil(valor?: string | null): string | null {
  if (!valor) return null;

  // Normalizar para comparacao (remover acentos e lowercase)
  const valorNormalizado = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Mapa de possiveis valores para o valor padrao
  const mapa: Record<string, string> = {
    solteiro: "Solteiro",
    "solteiro(a)": "Solteiro",
    casado: "Casado",
    "casado(a)": "Casado",
    divorciado: "Divorciado",
    "divorciado(a)": "Divorciado",
    viuvo: "Viuvo",
    "viuvo(a)": "Viuvo",
    viuva: "Viuvo",
    "viuva(a)": "Viuvo",
    "uniao estavel": "Uniao Estavel",
    uniao_estavel: "Uniao Estavel",
    "uniÍo estável": "Uniao Estavel",
  };

  return mapa[valorNormalizado] || valor;
}

export function PessoaFormCompleto({
  tipo,
  onSubmit,
  onCancel,
  initialData,
}: PessoaFormCompletoProps) {
  const [enderecoObraDiferente, setEnderecoObraDiferente] = useState(
    initialData?.obra_endereco_diferente ?? false
  );
  const [form, setForm] = useState<Record<string, any>>({
    ...initialData,
    nome: initialData?.nome || "",
    email: initialData?.email || "",
    telefone: initialData?.telefone || "",
    cpf: initialData?.cpf || "",
    cnpj: initialData?.cnpj || "",
    rg: initialData?.rg || "",
    nacionalidade: initialData?.nacionalidade || "Brasileira",
    estado_civil: initialData?.estado_civil || "",
    profissao: initialData?.profissao || "",
    cargo: initialData?.cargo || "",
    empresa: initialData?.empresa || "",
    categoria: initialData?.categoria || "",
    unidade: initialData?.unidade || "",
    observacoes: initialData?.observacoes || "",
    drive_link: initialData?.drive_link || "",
    tipo,
    ativo: initialData?.ativo ?? true,
    obra_endereco_diferente: initialData?.obra_endereco_diferente ?? false,
    avatar_url: initialData?.avatar_url || null,
    foto_url: initialData?.foto_url || null,
    avatar: initialData?.avatar || null,
    cep: initialData?.cep || "",
    logradouro: initialData?.logradouro || "",
    numero: initialData?.numero || "",
    complemento: initialData?.complemento || "",
    bairro: initialData?.bairro || "",
    cidade: initialData?.cidade || "",
    estado: initialData?.estado || "",
    obra_cep: initialData?.obra_cep || "",
    obra_logradouro: initialData?.obra_logradouro || "",
    obra_numero: initialData?.obra_numero || "",
    obra_complemento: initialData?.obra_complemento || "",
    obra_bairro: initialData?.obra_bairro || "",
    obra_cidade: initialData?.obra_cidade || "",
    obra_estado: initialData?.obra_estado || "",
    // Dados bancários
    banco: initialData?.banco || "",
    agencia: initialData?.agencia || "",
    conta: initialData?.conta || "",
    tipo_conta: initialData?.tipo_conta || "corrente",
    pix: initialData?.pix || "",
    // Comissionamento (especificadores)
    categoria_comissao_id: initialData?.categoria_comissao_id || "",
    is_master: initialData?.is_master || false,
    indicado_por_id: initialData?.indicado_por_id || "",
  });

  const [loading, setLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [cpfEhCnpj, setCpfEhCnpj] = useState(false);
  const [criandoPastaDrive, setCriandoPastaDrive] = useState(false);

  // Estados para comissionamento (especificadores)
  const [categoriasComissao, setCategoriasComissao] = useState<
  CategoriaComissao[]
>([]);
const [especificadoresMaster, setEspecificadoresMaster] = useState<
  EspecificadorMaster[]
>([]);
const [loadingComissao, setLoadingComissao] = useState(false);

// Estados para categorias de compras (colaboradores e fornecedores)
const [categoriasCompras, setCategoriasCompras] = useState<CategoriaCompras[]>([]);
const [loadingCategorias, setLoadingCategorias] = useState(false);

// Categorias do Pricelist (para colaboradores)
const [categoriasPricelist, setCategoriasPricelist] = useState<PricelistCategoria[]>([]);
const [loadingCategoriasPricelist, setLoadingCategoriasPricelist] = useState(false);

// Carregar categorias de compras (ainda usado em fluxos antigos de fornecedor)
useEffect(() => {
  if (tipo === "FORNECEDOR") {
    setLoadingCategorias(true);
    listarCategoriasCompras()
      .then((cats) => {
        setCategoriasCompras(cats);
      })
      .catch((error) => {
        console.error("Erro ao carregar categorias de compras:", error);
      })
      .finally(() => {
        setLoadingCategorias(false);
      });
  }
}, [tipo]);

// Carregar categorias do pricelist (colaboradores e fornecedores)
useEffect(() => {
  if (tipo === "COLABORADOR" || tipo === "FORNECEDOR") {
    setLoadingCategoriasPricelist(true);
    listarCategorias()
      .then((cats) => setCategoriasPricelist(cats))
      .catch((error) => {
        console.error("Erro ao carregar categorias do pricelist:", error);
        setCategoriasPricelist([]);
      })
      .finally(() => setLoadingCategoriasPricelist(false));
  }
}, [tipo]);

  // Carregar dados de comissionamento para especificadores e colaboradores
  useEffect(() => {
    if (tipo === "ESPECIFICADOR" || tipo === "COLABORADOR") {
      setLoadingComissao(true);
      Promise.all([listarCategoriasComissao(), listarEspecificadoresMaster()])
        .then(([cats, masters]) => {
          // Filtrar categorias pelo tipo de pessoa atual
          const catsRelevantes = cats.filter((c) => c.tipo_pessoa === tipo);
          setCategoriasComissao(catsRelevantes);
          setEspecificadoresMaster(masters);
        })
        .catch((error) => {
          console.error("Erro ao carregar dados de comissionamento:", error);
        })
        .finally(() => {
          setLoadingComissao(false);
        });
    }
  }, [tipo]);

  // Atualizar formulário quando initialData mudar (modo ediçÍo)
  useEffect(() => {
    if (initialData) {
      // Se tiver CNPJ mas não CPF, mostrar CNPJ no campo CPF
      const cpfOuCnpj = initialData?.cpf || initialData?.cnpj || "";
      const ehCnpj = !initialData?.cpf && initialData?.cnpj;

      setForm({
        ...(initialData as Partial<PessoaInput>),
        nome: initialData?.nome || "",
        email: initialData?.email || "",
        telefone: initialData?.telefone || "",
        cpf: cpfOuCnpj,
        cnpj: initialData?.cnpj || "",
        rg: initialData?.rg || "",
        nacionalidade: initialData?.nacionalidade || "Brasileira",
        estado_civil: initialData?.estado_civil || "",
        profissao: initialData?.profissao || "",
        cargo: initialData?.cargo || "",
        empresa: initialData?.empresa || "",
        categoria: initialData?.categoria || "",
        unidade: initialData?.unidade || "",
        observacoes: initialData?.observacoes || "",
        drive_link: initialData?.drive_link || "",
        tipo,
        ativo: initialData?.ativo ?? true,
        obra_endereco_diferente: initialData?.obra_endereco_diferente ?? false,
        avatar_url: initialData?.avatar_url || null,
        foto_url: initialData?.foto_url || null,
        avatar: initialData?.avatar || null,
        cep: initialData?.cep || "",
        logradouro: initialData?.logradouro || "",
        numero: initialData?.numero || "",
        complemento: initialData?.complemento || "",
        bairro: initialData?.bairro || "",
        cidade: initialData?.cidade || "",
        estado: initialData?.estado || "",
        obra_cep: initialData?.obra_cep || "",
        obra_logradouro: initialData?.obra_logradouro || "",
        obra_numero: initialData?.obra_numero || "",
        obra_complemento: initialData?.obra_complemento || "",
        obra_bairro: initialData?.obra_bairro || "",
        obra_cidade: initialData?.obra_cidade || "",
        obra_estado: initialData?.obra_estado || "",
        // Dados bancários
        banco: initialData?.banco || "",
        agencia: initialData?.agencia || "",
        conta: initialData?.conta || "",
        tipo_conta: initialData?.tipo_conta || "corrente",
        pix: initialData?.pix || "",
        // Comissionamento (especificadores)
        categoria_comissao_id: initialData?.categoria_comissao_id || "",
        is_master: initialData?.is_master || false,
        indicado_por_id: initialData?.indicado_por_id || "",
      });
      setEnderecoObraDiferente(initialData?.obra_endereco_diferente ?? false);
      setCpfEhCnpj(Boolean(ehCnpj));
    }
  }, [initialData, tipo]);

  useEffect(() => {
    if (!enderecoObraDiferente && tipo === "CLIENTE") {
      setForm((prev) => ({
        ...(prev as Partial<PessoaInput>),
        obra_cep: (prev as any).cep || "",
        obra_logradouro: (prev as any).logradouro || "",
        obra_numero: (prev as any).numero || "",
        obra_complemento: (prev as any).complemento || "",
        obra_bairro: (prev as any).bairro || "",
        obra_cidade: (prev as any).cidade || "",
        obra_estado: (prev as any).estado || "",
      }));
    }
  }, [
    enderecoObraDiferente,
    tipo,
    form.cep,
    form.logradouro,
    form.numero,
    form.complemento,
    form.bairro,
    form.cidade,
    form.estado,
  ]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let formattedValue = value;
    if (type !== "checkbox") {
      if (name === "cpf") {
        const digits = value.replace(/\D/g, "");
        if (digits.length <= 11) {
          formattedValue = formatCPF(value);
          setCpfEhCnpj(false);
        } else {
          formattedValue = formatCNPJ(value);
          setCpfEhCnpj(digits.length === 14);
        }
      } else if (name === "cnpj") formattedValue = formatCNPJ(value);
      else if (name === "rg") formattedValue = formatRG(value);
      else if (name === "cep" || name === "obra_cep")
        formattedValue = formatCEP(value);
    }
    setForm((prev) => ({
      ...(prev as Partial<PessoaInput>),
      [name]: type === "checkbox" ? checked : formattedValue,
    }));
  }

  async function buscarCep(cep: string, prefixo: string = "") {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setForm((prev: any) => ({
          ...prev,
          [`${prefixo}logradouro`]: data.logradouro || "",
          [`${prefixo}bairro`]: data.bairro || "",
          [`${prefixo}cidade`]: data.localidade || "",
          [`${prefixo}estado`]: data.uf || "",
        }));
      }
    } finally {
      setBuscandoCep(false);
    }
  }

  async function buscarDadosCNPJ() {
    // O campo unificado CPF/CNPJ usa form.cpf, entÍo lemos de lá
    const cnpjLimpo = (form.cpf || form.cnpj || "").replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      alert("CNPJ deve ter 14 dígitos");
      return;
    }
    setBuscandoCnpj(true);
    try {
      const dados = await buscarEmpresaPorCNPJ(cnpjLimpo);
      setForm((prev) => ({
        ...(prev as Partial<PessoaInput>),
        nome: dados.razao_social || dados.nome_fantasia || (prev as any).nome,
        empresa:
          dados.nome_fantasia || dados.razao_social || (prev as any).empresa,
        email: dados.email || (prev as any).email,
        telefone: dados.telefone || (prev as any).telefone,
        cep: dados.cep || (prev as any).cep,
        logradouro: dados.logradouro || (prev as any).logradouro,
        numero: dados.numero || (prev as any).numero,
        complemento: dados.complemento || (prev as any).complemento,
        bairro: dados.bairro || (prev as any).bairro,
        cidade: dados.municipio || (prev as any).cidade,
        estado: dados.uf || (prev as any).estado,
      }));
      if (dados.cep) await buscarCep(dados.cep, "");
    } catch (error: any) {
      alert(error?.message || "Erro ao buscar dados do CNPJ");
    } finally {
      setBuscandoCnpj(false);
    }
  }

  // FunçÍo auxiliar para converter string vazia em null
  function emptyToNull(value: string | null | undefined): string | null {
    if (value === undefined || value === null || value === "") return null;
    return value.trim() || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!(form.nome ?? "").trim() || !(form.email ?? "").trim()) {
      alert("Nome e E-mail sÍo obrigatórios.");
      return;
    }

    // Tratar CPF/CNPJ - se tiver 14 dígitos, é CNPJ
    const cpfDigits = (form.cpf || "").replace(/\D/g, "");
    let cpfFinal: string | null = null;
    let cnpjFinal: string | null = null;

    if (cpfDigits.length === 14) {
      cnpjFinal = form.cpf;
      cpfFinal = null;
    } else if (cpfDigits.length === 11) {
      cpfFinal = form.cpf;
      cnpjFinal = emptyToNull(form.cnpj);
    } else {
      cpfFinal = emptyToNull(form.cpf);
      cnpjFinal = emptyToNull(form.cnpj);
    }

    // Construir objeto com todos os campos, convertendo strings vazias para null
    const data: PessoaInput = {
      // Campos obrigatórios
      nome: (form.nome ?? "").trim(),
      email: (form.email ?? "").trim(),
      tipo: form.tipo || tipo,
      ativo: form.ativo ?? true,

      // Dados pessoais
      telefone: emptyToNull(form.telefone),
      cpf: cpfFinal,
      cnpj: cnpjFinal,
      rg: emptyToNull(form.rg),
      nacionalidade: emptyToNull(form.nacionalidade),
      estado_civil: normalizarEstadoCivil(form.estado_civil) || null,
      profissao: emptyToNull(form.profissao),
      cargo: emptyToNull(form.cargo),
      empresa: emptyToNull(form.empresa),
      categoria: emptyToNull(form.categoria),
      unidade: emptyToNull(form.unidade),

      // Endereço
      cep: emptyToNull(form.cep),
      logradouro: emptyToNull(form.logradouro),
      numero: emptyToNull(form.numero),
      complemento: emptyToNull(form.complemento),
      bairro: emptyToNull(form.bairro),
      cidade: emptyToNull(form.cidade),
      estado: emptyToNull(form.estado),

      // Endereço da obra (clientes)
      obra_endereco_diferente: form.obra_endereco_diferente ?? false,
      obra_cep: emptyToNull(form.obra_cep),
      obra_logradouro: emptyToNull(form.obra_logradouro),
      obra_numero: emptyToNull(form.obra_numero),
      obra_complemento: emptyToNull(form.obra_complemento),
      obra_bairro: emptyToNull(form.obra_bairro),
      obra_cidade: emptyToNull(form.obra_cidade),
      obra_estado: emptyToNull(form.obra_estado),

      // Dados bancários
      banco: emptyToNull(form.banco),
      agencia: emptyToNull(form.agencia),
      conta: emptyToNull(form.conta),
      tipo_conta: emptyToNull(form.tipo_conta),
      pix: emptyToNull(form.pix),

      // Comissionamento (especificadores)
      categoria_comissao_id: emptyToNull(form.categoria_comissao_id),
      is_master: form.is_master ?? null,
      indicado_por_id: emptyToNull(form.indicado_por_id),

      // Informações adicionais
      observacoes: emptyToNull(form.observacoes),
      drive_link: emptyToNull(form.drive_link),
      avatar: form.avatar || null,
      avatar_url: form.avatar_url || null,
      foto_url: form.foto_url || null,
    };

    console.log("[PessoaFormCompleto] Dados a salvar:", data);

    setLoading(true);
    try {
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-6 font-poppins"
    >
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <PessoaAvatarUploader
          pessoaId={initialData?.id}
          nome={form.nome || "Sem Nome"}
          avatar_url={form.avatar_url}
          foto_url={form.foto_url}
          avatar={form.avatar}
          onChange={(data) => setForm((prev: any) => ({ ...prev, ...data }))}
        />
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-normal mb-4 text-gray-800">
          Dados Básicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="nome" className="block text-sm font-medium">
              Nome *
            </label>
            <input
              id="nome"
              name="nome"
              value={form.nome ?? ""}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md"
              title="Nome completo"
              placeholder="Digite o nome"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail *
            </label>
            <input
              id="email"
              name="email"
              value={form.email ?? ""}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded-md"
              title="E-mail"
              placeholder="Digite o e-mail"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Telefone</label>
            <PhoneInputInternacional
              value={form.telefone ?? ""}
              onChange={(value) =>
                setForm((prev: any) => ({ ...prev, telefone: value || "" }))
              }
              placeholder="Telefone com DDD"
              defaultCountry="BR"
            />
          </div>
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium">
              CPF/CNPJ
            </label>
            <input
              id="cpf"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="CPF ou CNPJ"
              placeholder="Digite o CPF ou CNPJ"
            />
          </div>
          {cpfEhCnpj && (
            <button
              type="button"
              onClick={buscarDadosCNPJ}
              className="text-sm text-blue-600 underline"
            >
              Buscar dados do CNPJ
            </button>
          )}
          <div>
            <label htmlFor="rg" className="block text-sm font-medium">
              RG
            </label>
            <input
              id="rg"
              name="rg"
              value={form.rg}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="RG"
              placeholder="Digite o RG"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Estado Civil</label>
            <select
              name="estado_civil"
              value={form.estado_civil}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Selecione o estado civil"
            >
              <option value="">Selecione</option>
              <option value="Solteiro">Solteiro</option>
              <option value="Casado">Casado</option>
              <option value="Divorciado">Divorciado</option>
              <option value="Viuvo">Viuvo</option>
              <option value="Uniao Estavel">Uniao Estavel</option>
            </select>
          </div>
          {tipo === "COLABORADOR" ? (
            <div>
              <label className="block text-sm font-medium">Cargo / FunçÍo</label>
              <input
                name="cargo"
                value={form.cargo}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                title="Cargo ou funçÍo do colaborador"
                placeholder="Ex: Coordenador, Engenheiro..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium">ProfissÍo</label>
              <input
                name="profissao"
                value={form.profissao}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                title="ProfissÍo"
                placeholder="Digite a ProfissÍo"
              />
            </div>
          )}
          {tipo === "FORNECEDOR" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Categoria do Fornecedor
              </label>
              {loadingCategoriasPricelist ? (
                <div className="w-full border px-3 py-2 rounded-md text-gray-500">
                  Carregando categorias...
                </div>
              ) : (
                <select
                  name="categoria"
                  value={form.categoria ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Categorias cadastradas em /pricelist/categorias"
                >
                  <option value="">Selecione a categoria</option>
                  {categoriasPricelist.map((cat) => (
                    <option key={cat.id} value={cat.nome}>
                      {cat.nome} {cat.tipo ? `• ${cat.tipo}` : ""}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Origem: categorias do módulo Pricelist.
              </p>
            </div>
          )}
          {tipo === "COLABORADOR" && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Categoria do Colaborador
              </label>
              {loadingCategoriasPricelist ? (
                <div className="w-full border px-3 py-2 rounded-md text-gray-500">
                  Carregando categorias...
                </div>
              ) : (
                <select
                  name="categoria"
                  value={form.categoria ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Categorias cadastradas em /pricelist/categorias"
                >
                  <option value="">Selecione a categoria</option>
                  {categoriasPricelist.map((cat) => (
                    <option key={cat.id} value={cat.nome}>
                      {cat.nome} {cat.tipo ? `• ${cat.tipo}` : ""}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Origem: categorias do módulo Pricelist.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-lg font-normal mb-4 text-gray-800">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">CEP</label>
            <input
              name="cep"
              value={form.cep}
              onChange={handleChange}
              onBlur={() => buscarCep(form.cep)}
              className="w-full border px-3 py-2 rounded-md"
              title="CEP"
              placeholder="Digite o CEP"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Logradouro</label>
            <input
              name="logradouro"
              value={form.logradouro}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Logradouro"
              placeholder="Digite o logradouro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Número</label>
            <input
              name="numero"
              value={form.numero}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Número"
              placeholder="Digite o número"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Complemento</label>
            <input
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Complemento"
              placeholder="Digite o complemento"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Bairro</label>
            <input
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Bairro"
              placeholder="Digite o bairro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cidade</label>
            <input
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Cidade"
              placeholder="Digite a cidade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Estado</label>
            <input
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              title="Estado"
              placeholder="Digite o estado"
            />
          </div>
        </div>
      </div>

      {tipo === "CLIENTE" && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-normal mb-4 text-gray-800">
            Google Drive
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Link da pasta do cliente
              </label>
              <div className="flex gap-2">
                <input
                  name="drive_link"
                  value={form.drive_link ?? ""}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 border px-3 py-2 rounded-md"
                />
                {form.drive_link && (
                  <a
                    href={form.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    title="Abrir pasta no Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Cole o link da pasta ou clique em &quot;Gerar Pasta&quot; para
                criar automaticamente.
              </p>
            </div>

            {/* BotÍo para gerar pasta automaticamente */}
            {isBackendConfigured() && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {form.drive_link ? (
                      <span className="flex items-center gap-2 text-green-700">
                        <FolderCheck className="w-4 h-4" />
                        Pasta configurada
                      </span>
                    ) : (
                      "Gerar pasta automaticamente no Google Drive"
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.drive_link
                      ? "Você pode gerar novamente se precisar de uma nova pasta"
                      : "Cria a estrutura de pastas: Documentos, Projeto, Orçamentos, Contratos, Diário de Obra, Fotos, Financeiro"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={criandoPastaDrive || !form.nome?.trim()}
                  onClick={async () => {
                    if (!form.nome?.trim()) {
                      alert("Preencha o nome do cliente primeiro");
                      return;
                    }
                    setCriandoPastaDrive(true);
                    try {
                      const folder = await criarPastaCliente(form.nome.trim());
                      setForm((prev: any) => ({
                        ...prev,
                        drive_link: folder.link,
                      }));
                      alert(
                        `Pasta criada com sucesso!\n\nLink: ${folder.link}`
                      );
                    } catch (error: any) {
                      console.error("Erro ao criar pasta:", error);
                      alert(
                        `Erro ao criar pasta: ${
                          error.message || "Erro desconhecido"
                        }`
                      );
                    } finally {
                      setCriandoPastaDrive(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {criandoPastaDrive ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      Gerar Pasta
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dados do Imóvel / Endereço da Obra - apenas para Cliente */}
      {tipo === "CLIENTE" && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-normal mb-4 text-gray-800">
            Dados do Imóvel
          </h2>

          {/* Checkbox para obra no mesmo endereço */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={!enderecoObraDiferente}
                onChange={(e) => {
                  const obraMesmoEndereco = e.target.checked;
                  setEnderecoObraDiferente(!obraMesmoEndereco);
                  setForm((prev: any) => ({
                    ...prev,
                    obra_endereco_diferente: !obraMesmoEndereco,
                  }));
                }}
                className="w-5 h-5 text-[#F25C26] rounded border-gray-300 focus:ring-[#F25C26]"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  A obra é no mesmo endereço cadastrado
                </span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {!enderecoObraDiferente
                    ? "O endereço do cliente será usado automaticamente"
                    : "Preencha o endereço da obra abaixo"}
                </p>
              </div>
            </label>
          </div>

          {/* Campos do endereço da obra - só aparecem se for diferente */}
          {enderecoObraDiferente && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium">CEP da Obra</label>
                <input
                  name="obra_cep"
                  value={form.obra_cep}
                  onChange={handleChange}
                  onBlur={() => buscarCep(form.obra_cep, "obra_")}
                  className="w-full border px-3 py-2 rounded-md"
                  title="CEP da Obra"
                  placeholder="Digite o CEP da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Logradouro</label>
                <input
                  name="obra_logradouro"
                  value={form.obra_logradouro}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Logradouro da Obra"
                  placeholder="Digite o logradouro da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Número</label>
                <input
                  name="obra_numero"
                  value={form.obra_numero}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Número da Obra"
                  placeholder="Digite o número da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Complemento</label>
                <input
                  name="obra_complemento"
                  value={form.obra_complemento}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Complemento da Obra"
                  placeholder="Digite o complemento da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Bairro</label>
                <input
                  name="obra_bairro"
                  value={form.obra_bairro}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Bairro da Obra"
                  placeholder="Digite o bairro da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Cidade</label>
                <input
                  name="obra_cidade"
                  value={form.obra_cidade}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Cidade da Obra"
                  placeholder="Digite a cidade da obra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Estado</label>
                <input
                  name="obra_estado"
                  value={form.obra_estado}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md"
                  title="Estado da Obra"
                  placeholder="Digite o estado da obra"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dados Bancários - apenas para Colaborador, Fornecedor e Especificador */}
      {(tipo === "COLABORADOR" ||
        tipo === "FORNECEDOR" ||
        tipo === "ESPECIFICADOR") && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-normal mb-4 text-gray-800">
            Dados Bancários
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Banco</label>
              <input
                name="banco"
                list="bancos-list"
                value={form.banco}
                onChange={handleChange}
                placeholder="Digite para buscar ou selecione..."
                className="w-full border px-3 py-2 rounded-md"
                title="Banco"
              />
              <datalist id="bancos-list">
                {BANCOS_BRASILEIROS.map((banco) => (
                  <option
                    key={banco.codigo}
                    value={`${banco.codigo} - ${banco.nome}`}
                  >
                    {banco.nome_completo}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium">Agência</label>
              <input
                name="agencia"
                value={form.agencia}
                onChange={handleChange}
                placeholder="0000"
                className="w-full border px-3 py-2 rounded-md"
                title="Agência"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Conta</label>
              <input
                name="conta"
                value={form.conta}
                onChange={handleChange}
                placeholder="00000-0"
                className="w-full border px-3 py-2 rounded-md"
                title="Conta bancária"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo de Conta</label>
              <select
                name="tipo_conta"
                value={form.tipo_conta}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                title="Tipo de conta bancária"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="pagamento">Conta Pagamento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Chave PIX</label>
              <input
                name="pix"
                value={form.pix}
                onChange={handleChange}
                placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                className="w-full border px-3 py-2 rounded-md"
                title="Chave PIX"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comissionamento - para Especificadores e Colaboradores */}
      {(tipo === "ESPECIFICADOR" || tipo === "COLABORADOR") && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-normal mb-4 text-gray-800">
            Comissionamento
          </h2>
          {loadingComissao ? (
            <div className="text-center py-4 text-gray-500">
              Carregando categorias...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">
                  Categoria de ComissÍo
                </label>
                <select
                  name="categoria_comissao_id"
                  value={form.categoria_comissao_id}
                  onChange={handleChange}
                  title="Categoria de ComissÍo"
                  className="w-full border px-3 py-2 rounded-md"
                >
                  <option value="">Selecione a categoria</option>
                  {categoriasComissao.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome} {cat.is_master ? "(Master)" : ""}{" "}
                      {cat.is_indicacao ? "(IndicaçÍo)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define o percentual de comissÍo que este{" "}
                  {tipo === "ESPECIFICADOR" ? "especificador" : "colaborador"}{" "}
                  receberá
                </p>
              </div>

              {/* Mostrar campo de indicador apenas se a categoria selecionada for de indicaçÍo */}
              {categoriasComissao.find(
                (c) => c.id === form.categoria_comissao_id
              )?.is_indicacao && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">
                    Indicado por (Master)
                  </label>
                  <select
                    name="indicado_por_id"
                    value={form.indicado_por_id}
                    onChange={handleChange}
                    title="Indicado por Master"
                    className="w-full border px-3 py-2 rounded-md"
                  >
                    <option value="">Selecione quem indicou</option>
                    {especificadoresMaster.map((master) => (
                      <option key={master.id} value={master.id}>
                        {master.nome} ({master.tipo})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    O Master recebe uma comissÍo adicional sobre as vendas deste{" "}
                    {tipo === "ESPECIFICADOR" ? "especificador" : "colaborador"}
                  </p>
                </div>
              )}

              {/* InformaçÍo sobre a categoria selecionada */}
              {form.categoria_comissao_id && (
                <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const cat = categoriasComissao.find(
                      (c) => c.id === form.categoria_comissao_id
                    );
                    if (!cat) return null;
                    return (
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">{cat.nome}</p>
                        {cat.descricao && (
                          <p className="text-gray-500 mt-1">{cat.descricao}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {cat.is_master && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                              Master
                            </span>
                          )}
                          {cat.is_indicacao && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Sobre IndicaçÍo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-md"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}


/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


