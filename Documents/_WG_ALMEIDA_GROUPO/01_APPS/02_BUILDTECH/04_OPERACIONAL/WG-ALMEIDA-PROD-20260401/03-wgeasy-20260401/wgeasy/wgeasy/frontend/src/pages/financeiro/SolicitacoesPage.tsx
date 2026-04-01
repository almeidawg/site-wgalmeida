/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from 'react';
import { formatarData, formatarMoeda } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Plus, FileText as FileTextIcon, Clock, CheckCircle, XCircle, Edit, Trash2, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabaseRaw as supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateInputBR } from '@/components/ui/DateInputBR';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CategoriaHierarquicaSelect from '@/components/financeiro/CategoriaHierarquicaSelect';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SolicitacoesPage = () => {
  const { toast } = useToast();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [obras, setObras] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSolicitacao, setEditingSolicitacao] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('solicitacoes_pagamento')
        .select(`*, obra:obras(nome), categoria:fin_categories(name)`);

      if (searchTerm) {
        query = query.or(`fornecedor.ilike.*${searchTerm}*,obra.nome.ilike.*${searchTerm}*`);
      }
      if (filtroStatus !== 'Todos') {
        query = query.eq('status', filtroStatus);
      }

      query = query.order('data_solicitacao', { ascending: false }).range(0, 49999);

      const [solicitacoesRes, obrasRes, categoriasRes] = await Promise.all([
        query,
        supabase.from('obras').select('id, nome'),
        supabase.from('fin_categories').select('id, name').eq('ativo', true),
      ]);

      if (solicitacoesRes.error) throw solicitacoesRes.error;
      if (obrasRes.error) throw obrasRes.error;
      if (categoriasRes.error) throw categoriasRes.error;

      setSolicitacoes(solicitacoesRes.data || []);
      setObras(obrasRes.data || []);
      setCategorias(categoriasRes.data || []);

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

  const openFormForNew = () => {
    setEditingSolicitacao(null);
    setIsFormOpen(true);
  };

  const openFormForEdit = (solicitacao: any) => {
    setEditingSolicitacao(solicitacao);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('solicitacoes_pagamento').delete().match({ id });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
    } else {
      toast({ title: 'Sucesso!', description: 'SolicitaçÍo excluída.' });
      fetchData();
    }
  };

  const showNotImplementedToast = () => {
    toast({
      title: '🚧 Em construçÍo!',
      description: 'Esta funcionalidade ainda nÍo foi implementada. Peça no próximo prompt! 🚀',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendente': return <Clock className="text-yellow-600" size={20} />;
      case 'Aprovado': return <CheckCircle className="text-blue-600" size={20} />;
      case 'Pago': return <CheckCircle className="text-green-600" size={20} />;
      case 'Rejeitado': return <XCircle className="text-red-600" size={20} />;
      default: return <FileTextIcon className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-700';
      case 'Aprovado': return 'bg-blue-100 text-blue-700';
      case 'Pago': return 'bg-green-100 text-green-700';
      case 'Rejeitado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Solicitações de Pagamento</h1>
            <p className="text-[12px] text-gray-600 mt-1">Controle de aprovações e pagamentos</p>
          </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={openFormForNew} className="bg-wg-primary hover:bg-wg-primary/90 whitespace-nowrap text-[14px]">
              <Plus size={20} className="mr-2" />
              Nova
            </Button>
          </div>
        </div>

        <div className="wg-card p-4">
          <div className="flex flex-wrap gap-2">
            {['Todos', 'Pendente', 'Aprovado', 'Pago', 'Rejeitado'].map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-4 py-2 rounded-lg transition-colors text-[12px] ${
                  filtroStatus === status
                    ? 'bg-wg-primary text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wg-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((sol, index) => (
              <motion.div
                key={sol.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="wg-card p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-100 rounded-lg mt-1 hidden sm:block">
                      {getStatusIcon(sol.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className={`px-3 py-1 rounded-full text-[8px] ${getStatusColor(sol.status)}`}>
                          {sol.status}
                        </span>
                        <h3 className="text-[12px] text-gray-700">SOL-{String(sol.id).substring(0, 4)}</h3>
                      </div>
                      <p className="text-[13px] font-light text-gray-900">{sol.fornecedor}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[12px] mt-1">
                        <div><span className="text-gray-500">Obra: </span><span className="text-gray-800">{sol.obra?.nome}</span></div>
                        <div><span className="text-gray-500">Categoria: </span><span className="text-gray-800">{sol.categoria?.name}</span></div>
                        <div><span className="text-gray-500">Data: </span><span className="text-gray-800">{formatarData(sol.data_solicitacao)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                    <p className="text-[18px] font-light text-[#2B4580]">
                      {formatarMoeda(sol.valor)}
                    </p>
                     <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openFormForEdit(sol)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>Esta açÍo excluirá permanentemente a solicitaçÍo.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sol.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="icon" onClick={showNotImplementedToast}><FileTextIcon className="h-4 w-4 text-gray-500" /></Button>
                        <Button variant="ghost" size="icon" onClick={showNotImplementedToast}><Share2 className="h-4 w-4 text-gray-500" /></Button>
                      </div>
                  </div>
                </div>
              </motion.div>
            ))}
             {solicitacoes.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-500">
                <p>Nenhuma solicitaçÍo encontrada.</p>
                <p className="text-[12px]">Tente ajustar sua busca ou adicione uma nova solicitaçÍo.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isFormOpen && (
        <SolicitacaoForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          solicitacao={editingSolicitacao}
          obras={obras}
          categorias={categorias}
          onSuccess={fetchData}
        />
      )}
    </>
  );
};


const SolicitacaoForm = ({ isOpen, setIsOpen, solicitacao, obras, categorias, onSuccess }: any) => {
  const { toast } = useToast();
  const isEditing = !!solicitacao;

  // Estados para dados reais
  const [clientes, setClientes] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [empresasGrupo, setEmpresasGrupo] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const [formData, setFormData] = useState({
    obra_id: '',
    categoria_id: '',
    fornecedor: '',
    favorecido_id: '',
    tipo_favorecido: 'FORNECEDOR', // FORNECEDOR, COLABORADOR, EMPRESA
    valor: '',
    data_solicitacao: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    descricao: '',
  });

  // Buscar dados reais ao abrir o formulário
  useEffect(() => {
    const fetchDadosFormulario = async () => {
      setLoadingDados(true);
      try {
        // Buscar todas as pessoas por tipo (excluindo clientes concluídos)
        const [clientesRes, fornecedoresRes, colaboradoresRes, empresasRes] = await Promise.all([
          supabase.from('pessoas').select('id, nome, status').eq('tipo', 'CLIENTE').eq('ativo', true).or('status.is.null,status.neq.concluido').order('nome'),
          supabase.from('pessoas').select('id, nome').eq('tipo', 'FORNECEDOR').eq('ativo', true).order('nome'),
          supabase.from('pessoas').select('id, nome').eq('tipo', 'COLABORADOR').eq('ativo', true).order('nome'),
          supabase.from('empresas_grupo').select('id, nome_fantasia').order('nome_fantasia'),
        ]);

        setClientes(clientesRes.data || []);
        setFornecedores(fornecedoresRes.data || []);
        setColaboradores(colaboradoresRes.data || []);
        setEmpresasGrupo(empresasRes.data || []);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoadingDados(false);
      }
    };

    if (isOpen) fetchDadosFormulario();
  }, [isOpen]);

  useEffect(() => {
    if (isEditing) {
      setFormData({
        obra_id: solicitacao.obra_id || '',
        categoria_id: solicitacao.categoria_id || '',
        fornecedor: solicitacao.fornecedor || '',
        favorecido_id: solicitacao.favorecido_id || '',
        tipo_favorecido: solicitacao.tipo_favorecido || 'FORNECEDOR',
        valor: solicitacao.valor || '',
        data_solicitacao: new Date(solicitacao.data_solicitacao).toISOString().split('T')[0],
        status: solicitacao.status || 'Pendente',
        descricao: solicitacao.descricao || '',
      });
    } else {
       setFormData({
        obra_id: '', categoria_id: '', fornecedor: '', favorecido_id: '', tipo_favorecido: 'FORNECEDOR',
        valor: '', data_solicitacao: new Date().toISOString().split('T')[0], status: 'Pendente', descricao: '',
      });
    }
  }, [solicitacao, isOpen, isEditing]);

  // Lista de favorecidos baseada no tipo selecionado
  const favorecidosLista = formData.tipo_favorecido === 'FORNECEDOR' ? fornecedores :
                           formData.tipo_favorecido === 'COLABORADOR' ? colaboradores :
                           empresasGrupo;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSelectChange = (name: string, value: string) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    const { obra_id, categoria_id, valor, fornecedor } = formData;
    if (!obra_id || !categoria_id || !valor || !fornecedor) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: "Preencha todos os campos para continuar." });
      return;
    }

    const dataToSubmit = { ...formData, valor: parseFloat(valor) };

    let response;
    if (isEditing) {
      response = await supabase.from('solicitacoes_pagamento').update(dataToSubmit).match({ id: solicitacao.id });
    } else {
      response = await supabase.from('solicitacoes_pagamento').insert([dataToSubmit]);
    }

    if (response.error) {
      toast({ variant: 'destructive', title: 'Erro', description: response.error.message });
    } else {
      toast({ title: 'Sucesso!', description: `SolicitaçÍo ${isEditing ? 'atualizada' : 'criada'}.` });
      setIsOpen(false);
      onSuccess();
    }
  };

  return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar SolicitaçÍo" : "Nova SolicitaçÍo de Pagamento"}</DialogTitle>
            <DialogDescription>Preencha os detalhes da solicitaçÍo de pagamento.</DialogDescription>
          </DialogHeader>

          {loadingDados ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {/* Projeto/Obra */}
              <div>
                <label className="text-[12px] text-gray-700 mb-1 block">Projeto/Obra *</label>
                <Select value={formData.obra_id} onValueChange={(value) => handleSelectChange('obra_id', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                  <SelectContent>{obras.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-[12px] text-gray-700 mb-1 block">Categoria *</label>
                <CategoriaHierarquicaSelect
                  tipo="expense"
                  value={formData.categoria_id || null}
                  onChange={(id) => handleSelectChange('categoria_id', id || '')}
                  placeholder="Selecione a categoria..."
                  nivelMinimo={2}
                />
              </div>

              {/* Tipo de Favorecido */}
              <div>
                <label className="text-[12px] text-gray-700 mb-1 block">Tipo de Favorecido *</label>
                <Select value={formData.tipo_favorecido} onValueChange={(value) => {
                  handleSelectChange('tipo_favorecido', value);
                  handleSelectChange('favorecido_id', ''); // Limpa seleçÍo ao mudar tipo
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                    <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                    <SelectItem value="EMPRESA">Empresa do Grupo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Favorecido (baseado no tipo) */}
              <div>
                <label className="text-[12px] text-gray-700 mb-1 block">
                  {formData.tipo_favorecido === 'FORNECEDOR' ? 'Fornecedor' :
                   formData.tipo_favorecido === 'COLABORADOR' ? 'Colaborador' : 'Empresa'} *
                </label>
                <Select value={formData.favorecido_id} onValueChange={(value) => handleSelectChange('favorecido_id', value)}>
                  <SelectTrigger><SelectValue placeholder={`Selecione ${formData.tipo_favorecido === 'EMPRESA' ? 'a empresa' : 'o favorecido'}`} /></SelectTrigger>
                  <SelectContent>
                    {favorecidosLista.map((f: any) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome || f.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* DescriçÍo */}
              <div>
                <label className="text-[12px] text-gray-700 mb-1 block">DescriçÍo</label>
                <Input name="descricao" placeholder="Ex: Compra de materiais, Serviço de pintura..." value={formData.descricao} onChange={handleInputChange} />
              </div>

              {/* Valor e Data em linha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-gray-700 mb-1 block">Valor *</label>
                  <Input name="valor" type="number" step="0.01" placeholder="0,00" value={formData.valor} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="text-[12px] text-gray-700 mb-1 block">Data da SolicitaçÍo</label>
                  <DateInputBR
                    value={formData.data_solicitacao}
                    onChange={(val) => setFormData((prev: typeof formData) => ({ ...prev, data_solicitacao: val }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                  <label className="text-[12px] text-gray-700 mb-1 block">Status</label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                  <SelectContent>
                     {['Pendente', 'Aprovado', 'Pago', 'Rejeitado'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} className="bg-wg-primary hover:bg-wg-primary/90" disabled={loadingDados}>
              {isEditing ? 'Atualizar' : 'Criar SolicitaçÍo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
};


export default SolicitacoesPage;

