import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  CreditCard,
  Edit,
  Archive,
  Calendar,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContasPessoais } from '../hooks';
import type { ContaPessoal, NovaContaForm, SubtipoConta, TipoConta } from '../types';

// Paleta de cores para cartões
const CORES_CARTOES = [
  '#1A1A2E', // Preto
  '#16213E', // Azul Escuro
  '#0F3460', // Azul
  '#533483', // Roxo
  '#E94560', // Vermelho/Rosa
  '#F25C26', // Laranja WG
  '#22C55E', // Verde
  '#3B82F6', // Azul Claro
  '#8B5CF6', // Roxo Claro
  '#EC4899', // Rosa
  '#EAB308', // Dourado
  '#6B7280', // Cinza
];

// Bandeiras de cartÍo
const BANDEIRAS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'outro', label: 'Outro' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function CartoesCredito() {
  const { contas, loading, criar, atualizar, arquivar } = useContasPessoais();
  const [modalAberto, setModalAberto] = useState(false);
  const [cartaoEditando, setCartaoEditando] = useState<ContaPessoal | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [banco, setBanco] = useState('');
  const [bandeira, setBandeira] = useState('visa');
  const [limite, setLimite] = useState('');
  const [diaVencimento, setDiaVencimento] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('');
  const [cor, setCor] = useState('#1A1A2E');
  const [salvando, setSalvando] = useState(false);

  // Filtrar apenas cartões de crédito
  const cartoes = contas.filter(c => c.subtipo === 'cartao_credito' && c.status === 'ativa');
  const cartoesArquivados = contas.filter(c => c.subtipo === 'cartao_credito' && c.status === 'arquivada');

  // Calcular totais
  const limiteTotal = cartoes.reduce((sum, c) => sum + (c.saldo_inicial || 0), 0);
  const faturaTotal = cartoes.reduce((sum, c) => sum + Math.abs(c.saldo_atual || 0), 0);
  const limiteDisponivel = limiteTotal - faturaTotal;

  // FunçÍo para abrir modal de ediçÍo
  const abrirEdicao = (cartao: ContaPessoal) => {
    setCartaoEditando(cartao);
    setNome(cartao.nome);
    setBanco(cartao.banco || '');
    setBandeira(cartao.icone || 'visa');
    setLimite(String(cartao.saldo_inicial || 0));
    setDiaVencimento(cartao.agencia || ''); // Usando agencia para dia vencimento
    setDiaFechamento(cartao.numero_conta || ''); // Usando numero_conta para dia fechamento
    setCor(cartao.cor || '#1A1A2E');
    setModalAberto(true);
  };

  // FunçÍo para fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setCartaoEditando(null);
    setNome('');
    setBanco('');
    setBandeira('visa');
    setLimite('');
    setDiaVencimento('');
    setDiaFechamento('');
    setCor('#1A1A2E');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    setSalvando(true);
    try {
      // NOTA: Para cartões de crédito, reutilizamos campos da ContaPessoal:
      // - agencia → dia do vencimento da fatura
      // - numero_conta → dia do fechamento da fatura
      // - saldo_inicial → limite do cartÍo
      // - icone → bandeira do cartÍo (visa, mastercard, etc.)
      // TODO: Migrar para campos dedicados na tabela fin_pessoal_contas
      const dados: NovaContaForm = {
        nome,
        banco: banco || undefined,
        agencia: diaVencimento || undefined,
        numero_conta: diaFechamento || undefined,
        tipo: 'PF' as TipoConta,
        subtipo: 'cartao_credito' as SubtipoConta,
        saldo_inicial: parseFloat(limite.replace(',', '.')) || 0,
        cor,
        icone: bandeira,
      };

      if (cartaoEditando) {
        await atualizar(cartaoEditando.id, dados);
      } else {
        await criar(dados);
      }

      fecharModal();
    } finally {
      setSalvando(false);
    }
  };

  // Calcular porcentagem de uso
  const calcularUso = (cartao: ContaPessoal) => {
    const limite = cartao.saldo_inicial || 0;
    const usado = Math.abs(cartao.saldo_atual || 0);
    if (limite === 0) return 0;
    return Math.min((usado / limite) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header com totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Limite Total</p>
              <p className="text-lg font-normal text-gray-900">{formatCurrency(limiteTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Fatura Atual</p>
              <p className="text-lg font-normal text-red-600">{formatCurrency(faturaTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Limite Disponível</p>
              <p className="text-lg font-normal text-green-600">{formatCurrency(limiteDisponivel)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* BotÍo Novo CartÍo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-normal">Meus Cartões</h2>
          <p className="text-sm text-gray-500">{cartoes.length} cartÍo(ões) cadastrado(s)</p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="bg-primary hover:bg-[#D94D1A]">
          <Plus className="w-4 h-4 mr-2" />
          Novo CartÍo
        </Button>
      </div>

      {/* Lista de Cartões */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : cartoes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum cartÍo cadastrado</p>
          <Button
            onClick={() => setModalAberto(true)}
            variant="outline"
            className="mt-4"
          >
            Cadastrar primeiro cartÍo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((cartao, index) => {
            const uso = calcularUso(cartao);
            const fatura = Math.abs(cartao.saldo_atual || 0);
            const limite = cartao.saldo_inicial || 0;
            const disponivel = limite - fatura;
            const bandeiraNome = BANDEIRAS.find(b => b.value === cartao.icone)?.label || cartao.icone;

            return (
              <motion.div
                key={cartao.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-xl shadow-lg"
                style={{ backgroundColor: cartao.cor || '#1A1A2E' }}
              >
                {/* Design do CartÍo */}
                <div className="p-5 text-white min-h-[200px] flex flex-col justify-between">
                  {/* Topo: Banco + Bandeira */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs opacity-70">{cartao.banco || 'Banco'}</p>
                      <h3 className="font-normal text-lg">{cartao.nome}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-wider opacity-70">{bandeiraNome}</span>
                    </div>
                  </div>

                  {/* Meio: Limite e Fatura */}
                  <div className="my-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="opacity-70">Fatura Atual</span>
                      <span className="font-normal">{formatCurrency(fatura)}</span>
                    </div>

                    {/* Barra de uso */}
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          uso > 80 ? 'bg-red-400' : uso > 50 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${uso}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs mt-2 opacity-70">
                      <span>Disponível: {formatCurrency(disponivel)}</span>
                      <span>Limite: {formatCurrency(limite)}</span>
                    </div>
                  </div>

                  {/* Rodapé: Vencimento + Ações */}
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      {cartao.agencia && (
                        <div className="flex items-center gap-1 opacity-70">
                          <Calendar className="w-3 h-3" />
                          <span>Venc. dia {cartao.agencia}</span>
                        </div>
                      )}
                      {cartao.numero_conta && (
                        <div className="opacity-70">
                          <span>Fecha dia {cartao.numero_conta}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(cartao)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Editar cartÍo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja arquivar o cartÍo "${cartao.nome}"?`)) {
                            arquivar(cartao.id);
                          }
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Arquivar cartÍo"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cartões Arquivados */}
      {cartoesArquivados.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Cartões Arquivados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {cartoesArquivados.map(cartao => (
              <div key={cartao.id} className="p-4 bg-gray-100 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{cartao.nome}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Limite: {formatCurrency(cartao.saldo_inicial || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo/Editar CartÍo */}
      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cartaoEditando ? 'Editar CartÍo' : 'Novo CartÍo de Crédito'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do CartÍo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Nubank Ultravioleta"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banco">Banco/Emissor</Label>
                <Input
                  id="banco"
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                  placeholder="Ex: Nubank"
                />
              </div>
              <div>
                <Label htmlFor="bandeira">Bandeira</Label>
                <select
                  id="bandeira"
                  value={bandeira}
                  onChange={e => setBandeira(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {BANDEIRAS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="limite">Limite do CartÍo (R$)</Label>
              <Input
                id="limite"
                value={limite}
                onChange={e => setLimite(e.target.value)}
                placeholder="5000,00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diaVencimento">Dia do Vencimento</Label>
                <Input
                  id="diaVencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={diaVencimento}
                  onChange={e => setDiaVencimento(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="diaFechamento">Dia do Fechamento</Label>
                <Input
                  id="diaFechamento"
                  type="number"
                  min="1"
                  max="31"
                  value={diaFechamento}
                  onChange={e => setDiaFechamento(e.target.value)}
                  placeholder="03"
                />
              </div>
            </div>

            <div>
              <Label>Cor do CartÍo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CORES_CARTOES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCor(c)}
                    className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                      cor === c ? 'border-[#F25C26] ring-2 ring-offset-2 ring-[#F25C26]' : 'border-transparent'
                    }`}
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
                {salvando ? 'Salvando...' : cartaoEditando ? 'Salvar Alterações' : 'Criar CartÍo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

