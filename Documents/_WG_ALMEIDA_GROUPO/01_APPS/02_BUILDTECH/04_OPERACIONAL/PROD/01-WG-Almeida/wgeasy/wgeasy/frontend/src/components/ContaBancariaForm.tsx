// ============================================================
// COMPONENTE: Formulário de Conta Bancária
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, FormEvent } from "react";
import type { ContaBancaria, ContaBancariaFormData, TipoConta, TipoChavePix } from "@/types/empresas";
import { BANCOS_BRASILEIROS, buscarBancoPorCodigo } from "@/lib/bancos";

interface Props {
  conta?: ContaBancaria; // Se fornecido, modo ediçÍo
  onSave: (dados: ContaBancariaFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ContaBancariaForm({ conta, onSave, onCancel, loading }: Props) {
  const [formData, setFormData] = useState<ContaBancariaFormData>({
    banco_codigo: "",
    banco_nome: "",
    agencia: "",
    agencia_digito: "",
    conta: "",
    conta_digito: "",
    tipo_conta: "corrente",
    pix_tipo: undefined,
    pix_chave: "",
    apelido: "",
    padrao: false,
    ativo: true,
  });

  const [buscaBanco, setBuscaBanco] = useState("");

  // Carregar dados da conta em modo ediçÍo
  useEffect(() => {
    if (conta) {
      setFormData({
        banco_codigo: conta.banco_codigo,
        banco_nome: conta.banco_nome,
        agencia: conta.agencia,
        agencia_digito: conta.agencia_digito || "",
        conta: conta.conta,
        conta_digito: conta.conta_digito || "",
        tipo_conta: conta.tipo_conta,
        pix_tipo: conta.pix_tipo,
        pix_chave: conta.pix_chave || "",
        apelido: conta.apelido || "",
        padrao: conta.padrao,
        ativo: conta.ativo,
      });
      setBuscaBanco(`${conta.banco_codigo} - ${conta.banco_nome}`);
    }
  }, [conta]);

  const handleBancoInputChange = (valor: string) => {
    setBuscaBanco(valor);

    // Tentar encontrar banco pelo código ou nome
    const partes = valor.split(" - ");
    if (partes.length >= 2) {
      const codigo = partes[0].trim();
      const nome = partes.slice(1).join(" - ").trim();

      const banco = buscarBancoPorCodigo(codigo);
      if (banco) {
        setFormData({
          ...formData,
          banco_codigo: banco.codigo,
          banco_nome: banco.nome,
        });
      } else {
        // Permite digitaçÍo livre
        setFormData({
          ...formData,
          banco_codigo: codigo,
          banco_nome: nome,
        });
      }
    } else {
      // DigitaçÍo livre do nome
      setFormData({
        ...formData,
        banco_codigo: formData.banco_codigo || "000",
        banco_nome: valor,
      });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validações
    if (!formData.banco_codigo || !formData.banco_nome) {
      alert("Selecione um banco");
      return;
    }

    if (!formData.agencia || !formData.conta) {
      alert("Preencha agência e conta");
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Banco - Com busca e digitaçÍo livre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Banco <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          list="bancos-list"
          value={buscaBanco}
          onChange={(e) => handleBancoInputChange(e.target.value)}
          placeholder="Digite para buscar ou escrever o banco..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
        <datalist id="bancos-list">
          {BANCOS_BRASILEIROS.map((banco) => (
            <option key={banco.codigo} value={`${banco.codigo} - ${banco.nome}`}>
              {banco.nome_completo}
            </option>
          ))}
        </datalist>
        <p className="text-xs text-gray-500 mt-1">
          Digite para buscar ou escreva manualmente no formato: Código - Nome (ex: 208 - BTG Pactual)
        </p>
      </div>

      {/* Agência */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agência <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.agencia}
            onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
            placeholder="1234"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dígito</label>
          <input
            type="text"
            value={formData.agencia_digito}
            onChange={(e) => setFormData({ ...formData, agencia_digito: e.target.value })}
            placeholder="5"
            maxLength={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Conta */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conta <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.conta}
            onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
            placeholder="12345"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dígito</label>
          <input
            type="text"
            value={formData.conta_digito}
            onChange={(e) => setFormData({ ...formData, conta_digito: e.target.value })}
            placeholder="6"
            maxLength={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Tipo de Conta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Conta <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.tipo_conta}
          onChange={(e) => setFormData({ ...formData, tipo_conta: e.target.value as TipoConta })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          <option value="corrente">Conta Corrente</option>
          <option value="poupanca">Poupança</option>
          <option value="pagamento">Conta Pagamento</option>
        </select>
      </div>

      {/* PIX */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">PIX (Opcional)</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Chave</label>
            <select
              value={formData.pix_tipo || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pix_tipo: e.target.value ? (e.target.value as TipoChavePix) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Nenhuma</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="chave_aleatoria">Chave Aleatória</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
            <input
              type="text"
              value={formData.pix_chave}
              onChange={(e) => setFormData({ ...formData, pix_chave: e.target.value })}
              placeholder={
                formData.pix_tipo === "cpf"
                  ? "000.000.000-00"
                  : formData.pix_tipo === "cnpj"
                  ? "00.000.000/0000-00"
                  : formData.pix_tipo === "email"
                  ? "email@exemplo.com"
                  : formData.pix_tipo === "telefone"
                  ? "(00) 00000-0000"
                  : "Chave..."
              }
              disabled={!formData.pix_tipo}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Apelido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Apelido <span className="text-gray-400">(Opcional)</span>
        </label>
        <input
          type="text"
          value={formData.apelido}
          onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
          placeholder="Ex: Conta Principal, Conta Fornecedores..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Conta PadrÍo */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="padrao"
          checked={formData.padrao}
          onChange={(e) => setFormData({ ...formData, padrao: e.target.checked })}
          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="padrao" className="ml-2 text-sm text-gray-700">
          Definir como conta padrÍo para propostas e contratos
        </label>
      </div>

      {/* Ativo */}
      {conta && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
            Conta ativa
          </label>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Salvando..." : conta ? "💾 Salvar" : "➕ Adicionar"}
        </button>
      </div>
    </form>
  );
}

