/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Receipt, Clock, CheckCircle, AlertCircle, Search, Edit2, Trash2, Building2, Users, ChevronDown, ChevronRight, RefreshCw, CreditCard, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInputBR } from '@/components/ui/DateInputBR';
import { formatarData, formatarMoeda } from '@/lib/utils';
import InfinitePayLinkModal from '@/components/financeiro/InfinitePayLinkModal';
import { copiarLinkPagamento, formatarStatusInfinitePay } from '@/lib/infinitepayApi';

const CobrancasPage = () => {
  const { toast } = useToast();
  const [cobrancas, setCobrancas] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState<any>(null);
  const [agruparPorCliente, setAgruparPorCliente] = useState(false);
  const [clientesExpandidos, setClientesExpandidos] = useState<Set<string>>(new Set());
  const [newCobranca, setNewCobranca] = useState({
    obra_id: '',
    cliente: '',
    valor: '',
    vencimento: '',
    status: 'Pendente',
  });
  const [dadosBancarios, setDadosBancarios] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    pix: '',
  });
  const [isInfinitePayOpen, setIsInfinitePayOpen] = useState(false);
  const [infinitePayCobranca, setInfinitePayCobranca] = useState<any>(null);

  // Agrupar cobranças por cliente
  const cobrancasAgrupadas = useMemo(() => {
    if (!agruparPorCliente) return null;

    const grupos: Record<string, { cliente: string; cobrancas: any[]; totalValor: number; totalPendente: number }> = {};

    cobrancas.forEach(cob => {
      const clienteKey = cob.cliente || 'Sem Cliente';
      if (!grupos[clienteKey]) {
        grupos[clienteKey] = {
          cliente: clienteKey,
          cobrancas: [],
          totalValor: 0,
          totalPendente: 0,
        };
      }
      grupos[clienteKey].cobrancas.push(cob);
      grupos[clienteKey].totalValor += cob.valor || 0;
      if (cob.status !== 'Pago') {
        grupos[clienteKey].totalPendente += cob.valor || 0;
      }
    });

    return Object.values(grupos).sort((a, b) => b.totalPendente - a.totalPendente);
  }, [cobrancas, agruparPorCliente]);

  const toggleClienteExpandido = (cliente: string) => {
    setClientesExpandidos(prev => {
      const novo = new Set(prev);
      if (novo.has(cliente)) {
        novo.delete(cliente);
      } else {
        novo.add(cliente);
      }
      return novo;
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar cobranças sem join (evita erro de FK)
      let query = supabase
        .from('cobrancas')
        .select('*');

      if (searchTerm) {
        // Buscar por cliente ou observações
        query = query.or(`cliente.ilike.%${searchTerm}%,observacoes.ilike.%${searchTerm}%`);
      }
      if (filtroStatus !== 'Todos') {
        if (filtroStatus === 'Vencido') {
          // Vencido = nÍo pago e data < hoje
          query = query.neq('status', 'Pago').lt('vencimento', new Date().toISOString().split('T')[0]);
        } else {
          query = query.eq('status', filtroStatus);
        }
      }

      query = query.order('vencimento', { ascending: true });

      const [cobrancasRes, obrasRes, contratosRes] = await Promise.all([
        query,
        supabase.from('obras').select('id, nome'),
        supabase.from('contratos').select('id, numero').order('numero', { ascending: false }),
      ]);

      if (cobrancasRes.error) throw cobrancasRes.error;
      if (obrasRes.error) throw obrasRes.error;

      // Criar mapas para lookup
      const obrasMap: Record<string, string> = {};
      (obrasRes.data || []).forEach((o: any) => { obrasMap[o.id] = o.nome; });
      const contratosMap: Record<string, { numero: string }> = {};
      (contratosRes.data || []).forEach((c: any) => { contratosMap[c.id] = { numero: c.numero }; });

      // Adicionar dados relacionados às cobranças
      const cobrancasComRelacionados = (cobrancasRes.data || []).map((cob: any) => ({
        ...cob,
        obra: cob.obra_id ? { nome: obrasMap[cob.obra_id] } : null,
        contrato: cob.contrato_id ? contratosMap[cob.contrato_id] : null,
      }));

      setCobrancas(cobrancasComRelacionados);
      setObras(obrasRes.data || []);

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados', description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast, searchTerm, filtroStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCobranca(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewCobranca(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCobranca = async () => {
    if (!newCobranca.obra_id || !newCobranca.cliente || !newCobranca.valor || !newCobranca.vencimento) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para continuar.',
      });
      return;
    }

    const dataToSubmit = { ...newCobranca, valor: parseFloat(newCobranca.valor) };

    const { error } = await supabase.from('cobrancas').insert([dataToSubmit]);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança adicionada.' });
      setIsDialogOpen(false);
      setNewCobranca({ obra_id: '', cliente: '', valor: '', vencimento: '', status: 'Pendente' });
      fetchData();
    }
  };

  const handleEditCobranca = (cobranca: any) => {
    setSelectedCobranca(cobranca);
    setNewCobranca({
      obra_id: cobranca.obra_id,
      cliente: cobranca.cliente,
      valor: cobranca.valor.toString(),
      vencimento: cobranca.vencimento,
      status: cobranca.status,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCobranca = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cobrança?')) return;

    const { error } = await supabase.from('cobrancas').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Cobrança excluída.' });
      fetchData();
    }
  };

  const handleOpenBankDialog = (cobranca: any) => {
    setSelectedCobranca(cobranca);
    // Carregar dados bancários se existirem
    if (cobranca.dados_bancarios) {
      setDadosBancarios(cobranca.dados_bancarios);
    } else {
      setDadosBancarios({
        banco: '',
        agencia: '',
        conta: '',
        tipo_conta: 'corrente',
        pix: '',
      });
    }
    setIsBankDialogOpen(true);
  };

  const handleSaveBankData = async () => {
    if (!selectedCobranca) return;

    const { error } = await supabase
      .from('cobrancas')
      .update({ dados_bancarios: dadosBancarios })
      .eq('id', selectedCobranca.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'Dados bancários salvos.' });
      setIsBankDialogOpen(false);
      fetchData();
    }
  };

  const getStatusIcon = (status: string, vencimento: string) => {
    if (status === 'Pago') return <CheckCircle className="w-3 h-3" />;
    const hoje = new Date();
    const dataVenc = new Date(vencimento);
    if (dataVenc < hoje && status !== 'Pago') return <AlertCircle className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  const getStatusColor = (status: string, vencimento: string) => {
    if (status === 'Pago') return 'bg-green-100 text-green-700';
    const hoje = new Date();
    const dataVenc = new Date(vencimento);
    if (dataVenc < hoje && status !== 'Pago') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusLabel = (status: string, vencimento: string) => {
    if (status === 'Pago') return 'Pago';
    const hoje = new Date();
    const dataVenc = new Date(vencimento);
    if (dataVenc < hoje) return 'Vencido';
    return 'Pendente';
  };

  return (
    <>
      <div className="min-h-screen bg-white p-3 sm:p-6">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Controle de Cobrancas</h1>
                <p className="text-[12px] text-gray-600">Gerencie cobrancas e recebimentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-10 h-10 text-[12px] border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nova Cobranca
              </button>
            </div>
          </div>
        </div>

        {/* AREA DE FILTROS */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2">
              {['Todos', 'Pendente', 'Vencido', 'Pago'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg font-normal transition-colors text-[12px] ${
                    filtroStatus === status
                      ? 'bg-wg-primary text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAgruparPorCliente(!agruparPorCliente)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors ${
                agruparPorCliente
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Agrupar cobranças por cliente"
            >
              <Users className="w-3.5 h-3.5" />
              Agrupar por Cliente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary"></div>
          </div>
        ) : agruparPorCliente && cobrancasAgrupadas ? (
          /* VisualizaçÍo Agrupada por Cliente */
          <div className="space-y-2">
            {cobrancasAgrupadas.map((grupo) => (
              <div key={grupo.cliente} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header do Grupo */}
                <button
                  type="button"
                  onClick={() => toggleClienteExpandido(grupo.cliente)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {clientesExpandidos.has(grupo.cliente) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="font-normal text-[12px] text-gray-800">{grupo.cliente}</span>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {grupo.cobrancas.length} cobranca{grupo.cobrancas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <span className="font-light text-gray-700">
                        {formatarMoeda(grupo.totalValor)}
                      </span>
                    </div>
                    {grupo.totalPendente > 0 && (
                      <div className="text-red-600">
                        <span>Pendente: </span>
                        <span className="font-light">
                          {formatarMoeda(grupo.totalPendente)}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Cobranças do Cliente */}
                {clientesExpandidos.has(grupo.cliente) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {grupo.cobrancas.map((cobranca) => (
                      <div key={cobranca.id} className="px-4 py-2 pl-12 flex items-center justify-between hover:bg-gray-50/50">
                        <div className="flex items-center gap-3 flex-1">
                          <span className={`px-2 py-0.5 rounded-full text-[12px] font-normal ${getStatusColor(cobranca.status, cobranca.vencimento)}`}>
                            {getStatusLabel(cobranca.status, cobranca.vencimento)}
                          </span>
                          <span className="text-[12px] text-gray-600">{cobranca.obra?.nome}</span>
                          <span className="text-[12px] text-gray-400">
                            Venc: {formatarData(cobranca.vencimento)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-light text-[#16a34a]">
                            {formatarMoeda(cobranca.valor)}
                          </span>
                          {cobranca.link_pagamento ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copiarLinkPagamento(cobranca.link_pagamento);
                                if (ok) toast({ title: 'Link copiado!' });
                              }}
                              className="p-1 text-teal-500 hover:text-teal-700"
                              title="Copiar link de pagamento"
                            >
                              <Copy size={14} />
                            </button>
                          ) : cobranca.status !== 'Pago' ? (
                            <button
                              type="button"
                              onClick={() => { setInfinitePayCobranca(cobranca); setIsInfinitePayOpen(true); }}
                              className="p-1 text-gray-400 hover:text-teal-600"
                              title="Gerar link InfinitePay"
                            >
                              <CreditCard size={14} />
                            </button>
                          ) : null}
                          <button type="button" onClick={() => handleOpenBankDialog(cobranca)} className="p-1 text-gray-400 hover:text-blue-600" title="Dados Bancários">
                            <Building2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleEditCobranca(cobranca)} className="p-1 text-gray-400 hover:text-amber-600" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteCobranca(cobranca.id)} className="p-1 text-gray-400 hover:text-red-600" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {cobrancasAgrupadas.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-[12px]">
                Nenhuma cobrança encontrada
              </div>
            )}
          </div>
        ) : (
          /* VisualizaçÍo Lista Normal - Compacta */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Contrato</th>
                  <th className="px-2 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wide">Obra</th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide">Vencimento</th>
                  <th className="px-2 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="px-2 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wide w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cobrancas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-[12px]">
                      Nenhuma cobrança encontrada
                    </td>
                  </tr>
                ) : (
                  cobrancas.map((cobranca) => (
                    <tr key={cobranca.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-normal ${getStatusColor(cobranca.status, cobranca.vencimento)}`}>
                          {getStatusIcon(cobranca.status, cobranca.vencimento)}
                          {getStatusLabel(cobranca.status, cobranca.vencimento)}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-normal text-gray-800 text-[12px]">{cobranca.cliente}</td>
                      <td className="px-2 py-2 text-gray-600 text-[12px]">{cobranca.contrato?.numero || '-'}</td>
                      <td className="px-2 py-2 text-gray-600 text-[12px]">{cobranca.obra?.nome || '-'}</td>
                      <td className="px-2 py-2 text-center text-gray-500 text-[12px]">
                        {formatarData(cobranca.vencimento)}
                      </td>
                      <td className="px-2 py-2 text-right font-light text-[#16a34a] text-[12px]">
                        {formatarMoeda(cobranca.valor)}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {cobranca.link_pagamento ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copiarLinkPagamento(cobranca.link_pagamento);
                                if (ok) toast({ title: 'Link copiado!' });
                              }}
                              className="p-1 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded"
                              title="Copiar link de pagamento"
                            >
                              <Copy size={14} />
                            </button>
                          ) : cobranca.status !== 'Pago' ? (
                            <button
                              type="button"
                              onClick={() => { setInfinitePayCobranca(cobranca); setIsInfinitePayOpen(true); }}
                              className="p-1 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded"
                              title="Gerar link InfinitePay"
                            >
                              <CreditCard size={14} />
                            </button>
                          ) : null}
                          <button type="button" onClick={() => handleOpenBankDialog(cobranca)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Dados Bancários">
                            <Building2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleEditCobranca(cobranca)} className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDeleteCobranca(cobranca.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[20px] font-light">
              {selectedCobranca ? 'Editar Cobrança' : 'Nova Cobrança'}
            </DialogTitle>
            <DialogDescription>
              {selectedCobranca ? 'Atualize os dados da cobrança.' : 'Registre uma nova cobrança a receber.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={newCobranca.obra_id} onValueChange={(value) => handleSelectChange('obra_id', value)}>
              <SelectTrigger><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
              <SelectContent>{obras.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Input name="cliente" placeholder="Cliente" value={newCobranca.cliente} onChange={handleInputChange} className="text-[12px]" />
            <Input name="valor" type="number" placeholder="Valor" value={newCobranca.valor} onChange={handleInputChange} className="text-[12px]" />
            <DateInputBR
              value={newCobranca.vencimento}
              onChange={(val) => setNewCobranca((prev) => ({ ...prev, vencimento: val }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-[12px]"
              placeholder="dd/mm/aaaa"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddCobranca} className="bg-wg-primary hover:bg-wg-primary/90 text-[13px]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InfinitePayLinkModal
        open={isInfinitePayOpen}
        onOpenChange={setIsInfinitePayOpen}
        cobranca={infinitePayCobranca}
        onLinkGerado={fetchData}
      />

      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-light">Dados Bancários para Recebimento</DialogTitle>
            <DialogDescription>
              Configure as informações bancárias para receber o pagamento desta cobrança.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[12px] font-normal text-gray-700 mb-1 block">Banco</label>
                <Input
                  placeholder="Nome do banco"
                  value={dadosBancarios.banco}
                  onChange={(e) => setDadosBancarios({ ...dadosBancarios, banco: e.target.value })}
                  className="text-[12px]"
                />
              </div>
              <div>
                <label className="text-[12px] font-normal text-gray-700 mb-1 block">Agência</label>
                <Input
                  placeholder="0000"
                  value={dadosBancarios.agencia}
                  onChange={(e) => setDadosBancarios({ ...dadosBancarios, agencia: e.target.value })}
                  className="text-[12px]"
                />
              </div>
              <div>
                <label className="text-[12px] font-normal text-gray-700 mb-1 block">Conta</label>
                <Input
                  placeholder="00000-0"
                  value={dadosBancarios.conta}
                  onChange={(e) => setDadosBancarios({ ...dadosBancarios, conta: e.target.value })}
                  className="text-[12px]"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[12px] font-normal text-gray-700 mb-1 block">Tipo de Conta</label>
                <Select
                  value={dadosBancarios.tipo_conta}
                  onValueChange={(value) => setDadosBancarios({ ...dadosBancarios, tipo_conta: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    <SelectItem value="pagamento">Conta Pagamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-[12px] font-normal text-gray-700 mb-1 block">Chave PIX (opcional)</label>
                <Input
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  value={dadosBancarios.pix}
                  onChange={(e) => setDadosBancarios({ ...dadosBancarios, pix: e.target.value })}
                  className="text-[12px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBankDialogOpen(false)}
              className="text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBankData}
              className="bg-wg-primary hover:bg-wg-primary/90 text-[13px]"
            >
              Salvar Dados Bancários
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CobrancasPage;

