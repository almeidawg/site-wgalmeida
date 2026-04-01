import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, Building2, PiggyBank, CreditCard, Archive, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContasPessoais } from '../hooks';
import type { TipoConta, SubtipoConta, NovaContaForm, ContaPessoal } from '../types';

// Paleta de cores expandida para personalizaçÍo
const CORES_DISPONIVEIS = [
  '#F25C26', // Laranja WG
  '#22C55E', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#EAB308', // Amarelo
  '#14B8A6', // Teal
  '#F97316', // Laranja
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#EF4444', // Vermelho
  '#0EA5E9', // Sky
  '#A855F7', // Purple
  '#F43F5E', // Rose
  '#10B981', // Emerald
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const subtipoIcons: Record<SubtipoConta, typeof Wallet> = {
  corrente: Building2,
  poupanca: PiggyBank,
  investimento: Wallet,
  carteira: Wallet,
  cartao_credito: CreditCard,
};

export function ContasPessoais() {
  const { contas, loading, saldoTotal, criar, atualizar, arquivar } = useContasPessoais();
  const [modalAberto, setModalAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaPessoal | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [numeroConta, setNumeroConta] = useState('');
  const [tipo, setTipo] = useState<TipoConta>('PF');
  const [subtipo, setSubtipo] = useState<SubtipoConta>('corrente');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [cor, setCor] = useState('#F25C26');
  const [salvando, setSalvando] = useState(false);

  // FunçÍo para abrir modal de ediçÍo
  const abrirEdicao = (conta: ContaPessoal) => {
    setContaEditando(conta);
    setNome(conta.nome);
    setBanco(conta.banco || '');
    setAgencia(conta.agencia || '');
    setNumeroConta(conta.numero_conta || '');
    setTipo(conta.tipo);
    setSubtipo(conta.subtipo || 'corrente');
    setSaldoInicial(String(conta.saldo_inicial || 0));
    setCor(conta.cor || '#F25C26');
    setModalAberto(true);
  };

  // FunçÍo para fechar modal e limpar form
  const fecharModal = () => {
    setModalAberto(false);
    setContaEditando(null);
    setNome('');
    setBanco('');
    setAgencia('');
    setNumeroConta('');
    setTipo('PF');
    setSubtipo('corrente');
    setSaldoInicial('');
    setCor('#F25C26');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    setSalvando(true);
    try {
      const dados: NovaContaForm = {
        nome,
        banco: banco || undefined,
        agencia: agencia || undefined,
        numero_conta: numeroConta || undefined,
        tipo,
        subtipo,
        saldo_inicial: parseFloat(saldoInicial.replace(',', '.')) || 0,
        cor,
      };

      if (contaEditando) {
        // EdiçÍo
        await atualizar(contaEditando.id, dados);
      } else {
        // CriaçÍo
        await criar(dados);
      }

      fecharModal();
    } finally {
      setSalvando(false);
    }
  };

  const contasAtivas = contas.filter(c => c.status === 'ativa');
  const contasArquivadas = contas.filter(c => c.status === 'arquivada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-normal">Minhas Contas</h2>
          <p className="text-sm text-gray-500">
            Saldo total: <span className="font-normal text-gray-900">{formatCurrency(saldoTotal)}</span>
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="bg-primary hover:bg-[#D94D1A]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Lista de Contas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : contasAtivas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma conta cadastrada</p>
          <Button
            onClick={() => setModalAberto(true)}
            variant="outline"
            className="mt-4"
          >
            Cadastrar primeira conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contasAtivas.map((conta, index) => {
            const Icon = subtipoIcons[conta.subtipo || 'corrente'] || Wallet;
            const temDadosBancarios = conta.agencia || conta.numero_conta;
            return (
              <motion.div
                key={conta.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                style={{ borderTopColor: conta.cor, borderTopWidth: 4 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${conta.cor}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: conta.cor }} />
                    </div>
                    <div>
                      <h3 className="font-medium">{conta.nome}</h3>
                      <p className="text-xs text-gray-400">
                        {conta.banco || conta.subtipo || 'Conta'}
                      </p>
                      {/* Exibir Agência e Conta */}
                      {temDadosBancarios && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {conta.agencia && `Ag: ${conta.agencia}`}
                          {conta.agencia && conta.numero_conta && ' | '}
                          {conta.numero_conta && `Cc: ${conta.numero_conta}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {conta.tipo}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Saldo atual</p>
                    <p className={`text-xl font-normal ${conta.saldo_atual >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      {formatCurrency(conta.saldo_atual)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(conta)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600"
                      title="Editar conta"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja arquivar a conta "${conta.nome}"?`)) {
                          arquivar(conta.id);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                      title="Arquivar conta"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Contas Arquivadas */}
      {contasArquivadas.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Contas Arquivadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {contasArquivadas.map(conta => (
              <div key={conta.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{conta.nome}</span>
                </div>
                <p className="text-lg font-medium text-gray-500 mt-2">
                  {formatCurrency(conta.saldo_atual)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Conta */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{contaEditando ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Conta</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Conta Corrente Itaú"
                required
              />
            </div>

            <div>
              <Label htmlFor="banco">Banco (opcional)</Label>
              <Input
                id="banco"
                value={banco}
                onChange={e => setBanco(e.target.value)}
                placeholder="Ex: Itaú, Nubank, etc."
              />
            </div>

            {/* Campos de Agência e Conta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agencia">Agência</Label>
                <Input
                  id="agencia"
                  value={agencia}
                  onChange={e => setAgencia(e.target.value)}
                  placeholder="0000"
                />
              </div>
              <div>
                <Label htmlFor="numeroConta">Número da Conta</Label>
                <Input
                  id="numeroConta"
                  value={numeroConta}
                  onChange={e => setNumeroConta(e.target.value)}
                  placeholder="00000-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={e => setTipo(e.target.value as TipoConta)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>

              <div>
                <Label htmlFor="subtipo">Subtipo</Label>
                <select
                  id="subtipo"
                  value={subtipo}
                  onChange={e => setSubtipo(e.target.value as SubtipoConta)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                  <option value="investimento">Investimentos</option>
                  <option value="carteira">Carteira</option>
                  <option value="cartao_credito">CartÍo de Crédito</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="saldo">Saldo Inicial (R$)</Label>
              <Input
                id="saldo"
                value={saldoInicial}
                onChange={e => setSaldoInicial(e.target.value)}
                placeholder="0,00"
                disabled={!!contaEditando} // não permitir editar saldo inicial
              />
              {contaEditando && (
                <p className="text-xs text-gray-400 mt-1">Saldo inicial não pode ser alterado após criaçÍo</p>
              )}
            </div>

            <div>
              <Label htmlFor="cor">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CORES_DISPONIVEIS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${cor === c ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando || !nome} className="flex-1 bg-primary hover:bg-[#D94D1A]">
                {salvando ? 'Salvando...' : contaEditando ? 'Salvar Alterações' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


