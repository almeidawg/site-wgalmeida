// Modal para criar nova solicitaçÍo de serviço
import React, { useState, useEffect } from 'react';
import { X, Truck, MapPin, DollarSign, Calendar, Building2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategorias } from '../hooks/useCategorias';
import { useServicos } from '../hooks/useServicos';
import { listarProjetos, listarFornecedores } from '../services/servicosApi';
import type { NovoServicoForm, TipoVinculo, TipoEndereco } from '../types';
import { TIPO_VINCULO_OPTIONS, TIPO_ENDERECO_OPTIONS, FORMA_PAGAMENTO_OPTIONS } from '../types';

interface NovoServicoModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ProjetoOption {
  id: string;
  numero: string;
  cliente_nome?: string;
  endereco_obra?: string;
}

interface FornecedorOption {
  id: string;
  nome: string;
  telefone?: string;
  endereco?: string;
}

export function NovoServicoModal({ onClose, onSuccess }: NovoServicoModalProps) {
  const { categorias } = useCategorias();
  const { criar, loading } = useServicos();

  const [projetos, setProjetos] = useState<ProjetoOption[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);

  const [form, setForm] = useState<NovoServicoForm>({
    tipo_vinculo: 'avulso',
    categoria_id: '',
    titulo: '',
    descricao: '',
    valor_servico: 0,
    coletar_tipo: 'manual',
    entregar_tipo: 'manual',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar opções
  useEffect(() => {
    async function loadOpcoes() {
      try {
        const [projetosData, fornecedoresData] = await Promise.all([
          listarProjetos(),
          listarFornecedores(),
        ]);
        setProjetos(projetosData);
        setFornecedores(fornecedoresData);
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
      } finally {
        setLoadingOpcoes(false);
      }
    }
    loadOpcoes();
  }, []);

  // Atualizar endereço quando selecionar projeto
  useEffect(() => {
    if (form.projeto_id && form.entregar_tipo === 'obra') {
      const projeto = projetos.find(p => p.id === form.projeto_id);
      if (projeto?.endereco_obra) {
        setForm(prev => ({
          ...prev,
          entregar_endereco_completo: projeto.endereco_obra,
        }));
      }
    }
  }, [form.projeto_id, form.entregar_tipo, projetos]);

  // Atualizar endereço quando selecionar fornecedor
  useEffect(() => {
    if (form.coletar_pessoa_id && form.coletar_tipo === 'fornecedor') {
      const fornecedor = fornecedores.find(f => f.id === form.coletar_pessoa_id);
      if (fornecedor?.endereco) {
        setForm(prev => ({
          ...prev,
          coletar_endereco_completo: fornecedor.endereco,
        }));
      }
    }
  }, [form.coletar_pessoa_id, form.coletar_tipo, fornecedores]);

  const handleChange = (field: keyof NovoServicoForm, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.categoria_id) {
      newErrors.categoria_id = 'Selecione a categoria';
    }
    if (!form.titulo.trim()) {
      newErrors.titulo = 'Informe o título';
    }
    if (form.valor_servico <= 0) {
      newErrors.valor_servico = 'Informe o valor';
    }
    if (form.tipo_vinculo !== 'avulso' && !form.projeto_id) {
      newErrors.projeto_id = 'Selecione o projeto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await criar(form);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-normal text-gray-900">
                Nova SolicitaçÍo de Serviço
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Tipo de Vínculo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Tipo de Vínculo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPO_VINCULO_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleChange('tipo_vinculo', opt.value as TipoVinculo)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        form.tipo_vinculo === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projeto (se vinculado) */}
              {form.tipo_vinculo !== 'avulso' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Projeto/Obra *
                  </label>
                  <select
                    value={form.projeto_id || ''}
                    onChange={(e) => handleChange('projeto_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.projeto_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loadingOpcoes}
                  >
                    <option value="">Selecione o projeto</option>
                    {projetos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.numero} - {p.cliente_nome || 'Sem cliente'}
                      </option>
                    ))}
                  </select>
                  {errors.projeto_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.projeto_id}</p>
                  )}
                </div>
              )}

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria do Serviço *
                </label>
                <select
                  value={form.categoria_id}
                  onChange={(e) => handleChange('categoria_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.categoria_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione a categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.categoria_id}</p>
                )}
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Ex: Frete de materiais para obra"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.titulo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.titulo && (
                  <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>
                )}
              </div>

              {/* DescriçÍo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DescriçÍo Detalhada
                </label>
                <textarea
                  value={form.descricao || ''}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  rows={3}
                  placeholder="Descreva os materiais, quantidades, observações importantes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Endereços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Coletar em */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 inline mr-1 text-gray-500" />
                    Coletar em
                  </label>
                  <select
                    value={form.coletar_tipo || 'manual'}
                    onChange={(e) => handleChange('coletar_tipo', e.target.value as TipoEndereco)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {TIPO_ENDERECO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  {form.coletar_tipo === 'fornecedor' && (
                    <select
                      value={form.coletar_pessoa_id || ''}
                      onChange={(e) => handleChange('coletar_pessoa_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Selecione o fornecedor</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  )}

                  <textarea
                    value={form.coletar_endereco_completo || ''}
                    onChange={(e) => handleChange('coletar_endereco_completo', e.target.value)}
                    rows={2}
                    placeholder="Endereço completo de coleta"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* Entregar em */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4 inline mr-1 text-green-500" />
                    Entregar em
                  </label>
                  <select
                    value={form.entregar_tipo || 'manual'}
                    onChange={(e) => handleChange('entregar_tipo', e.target.value as TipoEndereco)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {TIPO_ENDERECO_OPTIONS.filter(o => o.value !== 'fornecedor').map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <textarea
                    value={form.entregar_endereco_completo || ''}
                    onChange={(e) => handleChange('entregar_endereco_completo', e.target.value)}
                    rows={2}
                    placeholder="Endereço completo de entrega"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1 text-green-600" />
                    Valor do Serviço *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor_servico || ''}
                    onChange={(e) => handleChange('valor_servico', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.valor_servico ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.valor_servico && (
                    <p className="text-xs text-red-500 mt-1">{errors.valor_servico}</p>
                  )}
                </div>

                {/* Forma Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={form.forma_pagamento || ''}
                    onChange={(e) => handleChange('forma_pagamento', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {FORMA_PAGAMENTO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Data Necessidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Data Necessária
                  </label>
                  <input
                    type="date"
                    value={form.data_necessidade || ''}
                    onChange={(e) => handleChange('data_necessidade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-[#D94E1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  'Criar SolicitaçÍo'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

