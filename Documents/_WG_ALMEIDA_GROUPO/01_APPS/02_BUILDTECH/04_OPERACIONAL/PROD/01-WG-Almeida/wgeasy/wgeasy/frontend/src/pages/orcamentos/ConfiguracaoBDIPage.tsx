// ============================================================
// PÁGINA DE CONFIGURAÇÍO DE BDI
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, Copy, Calculator, Info, Check, X, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useToast } from '@/components/ui/use-toast';
import {
  ConfiguracaoBDI,
  BDI_RESIDENCIAL,
  BDI_COMERCIAL,
  BDI_REFORMA,
  precificacaoService,
} from '../../lib/precificacaoAutomatizada';

interface ConfiguracaoBDIDB {
  id: string;
  empresa_id: string;
  projeto_id?: string;
  nome: string;
  tipo: string;
  administracao_central: number;
  seguro_garantia: number;
  risco_imprevistos: number;
  despesas_financeiras: number;
  lucro: number;
  tributo_pis: number;
  tributo_cofins: number;
  tributo_iss: number;
  tributo_irpj: number;
  tributo_csll: number;
  bdi_total_calculado: number;
  ativo: boolean;
  padrao: boolean;
  created_at: string;
  updated_at: string;
}

const TIPOS_BDI = [
  { value: 'residencial', label: 'Residencial', preset: BDI_RESIDENCIAL },
  { value: 'comercial', label: 'Comercial', preset: BDI_COMERCIAL },
  { value: 'reforma', label: 'Reforma', preset: BDI_REFORMA },
  { value: 'personalizado', label: 'Personalizado', preset: null },
];

export default function ConfiguracaoBDIPage() {
  const { showToast } = useToast();
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoBDIDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ConfiguracaoBDIDB>>({});
  const [bdiCalculado, setBdiCalculado] = useState<number>(0);
  const [mostrarNovoForm, setMostrarNovoForm] = useState(false);

  // Carregar configurações
  const carregarConfiguracoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_bdi')
        .select('*')
        .eq('ativo', true)
        .order('padrao', { ascending: false })
        .order('nome', { ascending: true });

      if (error) throw error;
      setConfiguracoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      showToast('Erro ao carregar configurações de BDI', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  // Calcular BDI quando form muda
  useEffect(() => {
    if (formData.administracao_central !== undefined) {
      const config: ConfiguracaoBDI = {
        administracaoCentral: formData.administracao_central || 0,
        seguroGarantia: formData.seguro_garantia || 0,
        riscoImprevistos: formData.risco_imprevistos || 0,
        despesasFinanceiras: formData.despesas_financeiras || 0,
        lucro: formData.lucro || 0,
        tributos: {
          pis: formData.tributo_pis || 0,
          cofins: formData.tributo_cofins || 0,
          iss: formData.tributo_iss || 0,
          irpj: formData.tributo_irpj || 0,
          csll: formData.tributo_csll || 0,
        },
      };
      const bdi = precificacaoService.calcularBDI(config);
      setBdiCalculado(bdi);
    }
  }, [formData]);

  // Iniciar novo formulário
  const iniciarNovo = (tipo: string = 'personalizado') => {
    const tipoSelecionado = TIPOS_BDI.find(t => t.value === tipo);
    const preset = tipoSelecionado?.preset;

    setFormData({
      nome: '',
      tipo,
      administracao_central: preset?.administracaoCentral || 4,
      seguro_garantia: preset?.seguroGarantia || 0.8,
      risco_imprevistos: preset?.riscoImprevistos || 1,
      despesas_financeiras: preset?.despesasFinanceiras || 1,
      lucro: preset?.lucro || 8,
      tributo_pis: preset?.tributos.pis || 0.65,
      tributo_cofins: preset?.tributos.cofins || 3,
      tributo_iss: preset?.tributos.iss || 3,
      tributo_irpj: preset?.tributos.irpj || 0,
      tributo_csll: preset?.tributos.csll || 0,
      padrao: false,
    });
    setMostrarNovoForm(true);
    setEditando(null);
  };

  // Editar configuraçÍo existente
  const editarConfiguracao = (config: ConfiguracaoBDIDB) => {
    setFormData(config);
    setEditando(config.id);
    setMostrarNovoForm(false);
  };

  // Aplicar preset
  const aplicarPreset = (tipo: string) => {
    const tipoSelecionado = TIPOS_BDI.find(t => t.value === tipo);
    const preset = tipoSelecionado?.preset;

    if (preset) {
      setFormData(prev => ({
        ...prev,
        tipo,
        administracao_central: preset.administracaoCentral,
        seguro_garantia: preset.seguroGarantia,
        risco_imprevistos: preset.riscoImprevistos,
        despesas_financeiras: preset.despesasFinanceiras,
        lucro: preset.lucro,
        tributo_pis: preset.tributos.pis,
        tributo_cofins: preset.tributos.cofins,
        tributo_iss: preset.tributos.iss,
        tributo_irpj: preset.tributos.irpj || 0,
        tributo_csll: preset.tributos.csll || 0,
      }));
    } else {
      setFormData(prev => ({ ...prev, tipo }));
    }
  };

  // Salvar configuraçÍo
  const salvarConfiguracao = async () => {
    try {
      if (!formData.nome?.trim()) {
        showToast('Informe um nome para a configuraçÍo', 'error');
        return;
      }

      const dadosSalvar = {
        nome: formData.nome,
        tipo: formData.tipo || 'personalizado',
        administracao_central: formData.administracao_central,
        seguro_garantia: formData.seguro_garantia,
        risco_imprevistos: formData.risco_imprevistos,
        despesas_financeiras: formData.despesas_financeiras,
        lucro: formData.lucro,
        tributo_pis: formData.tributo_pis,
        tributo_cofins: formData.tributo_cofins,
        tributo_iss: formData.tributo_iss,
        tributo_irpj: formData.tributo_irpj || 0,
        tributo_csll: formData.tributo_csll || 0,
        padrao: formData.padrao || false,
        ativo: true,
      };

      if (editando) {
        const { error } = await supabase
          .from('configuracoes_bdi')
          .update(dadosSalvar)
          .eq('id', editando);

        if (error) throw error;
        showToast('ConfiguraçÍo atualizada com sucesso', 'success');
      } else {
        // Obter empresa_id do usuário
        const { data: userData } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .single();

        const { error } = await supabase
          .from('configuracoes_bdi')
          .insert({ ...dadosSalvar, empresa_id: userData?.empresa_id });

        if (error) throw error;
        showToast('ConfiguraçÍo criada com sucesso', 'success');
      }

      setEditando(null);
      setMostrarNovoForm(false);
      setFormData({});
      carregarConfiguracoes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar configuraçÍo', 'error');
    }
  };

  // Excluir configuraçÍo
  const excluirConfiguracao = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta configuraçÍo?')) return;

    try {
      const { error } = await supabase
        .from('configuracoes_bdi')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      showToast('ConfiguraçÍo excluída', 'success');
      carregarConfiguracoes();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir configuraçÍo', 'error');
    }
  };

  // Definir como padrÍo
  const definirComoPadrao = async (id: string) => {
    try {
      // Remover padrÍo de todas
      await supabase
        .from('configuracoes_bdi')
        .update({ padrao: false })
        .neq('id', id);

      // Definir nova como padrÍo
      const { error } = await supabase
        .from('configuracoes_bdi')
        .update({ padrao: true })
        .eq('id', id);

      if (error) throw error;
      showToast('ConfiguraçÍo definida como padrÍo', 'success');
      carregarConfiguracoes();
    } catch (error) {
      console.error('Erro:', error);
      showToast('Erro ao definir padrÍo', 'error');
    }
  };

  // Duplicar configuraçÍo
  const duplicarConfiguracao = (config: ConfiguracaoBDIDB) => {
    setFormData({
      ...config,
      id: undefined,
      nome: `${config.nome} (Cópia)`,
      padrao: false,
    });
    setMostrarNovoForm(true);
    setEditando(null);
  };

  // Cancelar ediçÍo
  const cancelar = () => {
    setEditando(null);
    setMostrarNovoForm(false);
    setFormData({});
  };

  // Renderizar campo numérico
  const renderCampo = (
    label: string,
    campo: keyof ConfiguracaoBDIDB,
    sufixo: string = '%',
    info?: string
  ) => (
    <div className="flex flex-col">
      <label className="text-xs text-gray-600 mb-1 flex items-center gap-1">
        {label}
        {info && (
          <span title={info} className="cursor-help">
            <Info size={12} className="text-gray-400" />
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={typeof formData[campo] === "number" ? formData[campo] : 0}
          onChange={(e) => setFormData({ ...formData, [campo]: parseFloat(e.target.value) || 0 })}
          className="w-full p-2 pr-8 border rounded text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {sufixo}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      {/* Header */}
      <div className={LAYOUT.pageHeader}>
        <div>
          <h1 className={`${TYPOGRAPHY.pageTitle} flex items-center gap-2 sm:gap-3`}>
            <Calculator className="text-blue-600" />
            ConfiguraçÍo de BDI
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
            BonificaçÍo e Despesas Indiretas - Conforme metodologia TCU
          </p>
        </div>
        <button
          onClick={() => iniciarNovo()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          <span className="text-[14px]">Nova ConfiguraçÍo</span>
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Fórmula do BDI (TCU):</p>
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
              BDI = ((1 + AC + SG + R + DF) × (1 + L) / (1 - T)) - 1
            </code>
            <p className="mt-2 text-xs">
              AC = AdministraçÍo Central | SG = Seguro/Garantia | R = Riscos | DF = Despesas Financeiras | L = Lucro | T = Tributos
            </p>
          </div>
        </div>
      </div>

      {/* Formulário de EdiçÍo/CriaçÍo */}
      {(mostrarNovoForm || editando) && (
        <div className={`${LAYOUT.card} mb-4 sm:mb-6`}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4 flex items-center gap-2`}>
            <Building2 size={20} className="text-gray-600" />
            {editando ? 'Editar ConfiguraçÍo' : 'Nova ConfiguraçÍo'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Nome */}
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Nome da ConfiguraçÍo *</label>
              <input
                type="text"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: BDI PadrÍo Obras Residenciais"
                className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
              />
            </div>

            {/* Tipo/Preset */}
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Tipo (Preset)</label>
              <select
                value={formData.tipo || 'personalizado'}
                onChange={(e) => aplicarPreset(e.target.value)}
                className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
              >
                {TIPOS_BDI.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos de Custos Indiretos */}
          <div className="mb-6">
            <h3 className="text-sm font-normal text-gray-700 mb-3 border-b pb-2">
              Custos Indiretos
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCampo('AdministraçÍo Central (AC)', 'administracao_central', '%', 'Custos administrativos da empresa')}
              {renderCampo('Seguro e Garantia (SG)', 'seguro_garantia', '%', 'Seguros e garantias contratuais')}
              {renderCampo('Riscos/Imprevistos (R)', 'risco_imprevistos', '%', 'Margem para imprevistos')}
              {renderCampo('Despesas Financeiras (DF)', 'despesas_financeiras', '%', 'Custos financeiros do projeto')}
            </div>
          </div>

          {/* Lucro */}
          <div className="mb-6">
            <h3 className="text-sm font-normal text-gray-700 mb-3 border-b pb-2">
              Lucro
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCampo('Lucro (L)', 'lucro', '%', 'Margem de lucro desejada')}
            </div>
          </div>

          {/* Tributos */}
          <div className="mb-6">
            <h3 className="text-sm font-normal text-gray-700 mb-3 border-b pb-2">
              Tributos (T)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {renderCampo('PIS', 'tributo_pis', '%', 'Lucro Real: 1,65% | Presumido: 0,65%')}
              {renderCampo('COFINS', 'tributo_cofins', '%', 'Lucro Real: 7,6% | Presumido: 3%')}
              {renderCampo('ISS', 'tributo_iss', '%', 'Varia por município (2% a 5%)')}
              {renderCampo('IRPJ', 'tributo_irpj', '%', 'Opcional - se aplicável')}
              {renderCampo('CSLL', 'tributo_csll', '%', 'Opcional - se aplicável')}
            </div>
          </div>

          {/* Resultado do BDI */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">BDI Calculado</p>
                <p className="text-xs text-green-600">Aplicar este percentual sobre o custo direto</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-normal text-green-700">
                  {bdiCalculado.toFixed(2)}%
                </p>
                <p className="text-xs text-green-600">
                  Multiplicador: {(1 + bdiCalculado / 100).toFixed(4)}x
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox PadrÍo */}
          <div className="flex items-center gap-2 mb-6">
            <input
              type="checkbox"
              id="padrao"
              checked={formData.padrao || false}
              onChange={(e) => setFormData({ ...formData, padrao: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="padrao" className="text-[12px] text-gray-700">
              Definir como configuraçÍo padrÍo da empresa
            </label>
          </div>

          {/* Botões de AçÍo */}
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelar}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={18} />
              <span className="text-[14px]">Cancelar</span>
            </button>
            <button
              onClick={salvarConfiguracao}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              <Save size={18} />
              <span className="text-[14px]">Salvar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Configurações */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-[16px] font-normal text-gray-700">Configurações Salvas</h2>
        </div>

        {configuracoes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calculator size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-[12px]">Nenhuma configuraçÍo de BDI cadastrada</p>
            <button
              onClick={() => iniciarNovo('residencial')}
              className="mt-4 text-blue-600 hover:underline text-[14px]"
            >
              Criar primeira configuraçÍo
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {configuracoes.map(config => (
              <div
                key={config.id}
                className={`p-4 hover:bg-gray-50 transition ${
                  editando === config.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      config.padrao ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Calculator size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-800 text-[14px]">{config.nome}</h3>
                        {config.padrao && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            PadrÍo
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {config.tipo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        AC: {config.administracao_central}% | L: {config.lucro}% |
                        ISS: {config.tributo_iss}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[20px] font-normal text-blue-600">
                        {config.bdi_total_calculado?.toFixed(2) || '0.00'}%
                      </p>
                      <p className="text-xs text-gray-500">BDI Total</p>
                    </div>

                    <div className="flex items-center gap-1">
                      {!config.padrao && (
                        <button
                          onClick={() => definirComoPadrao(config.id)}
                          title="Definir como padrÍo"
                          className="p-2 hover:bg-green-100 rounded-lg text-gray-500 hover:text-green-600 transition"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => duplicarConfiguracao(config)}
                        title="Duplicar"
                        className="p-2 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => editarConfiguracao(config)}
                        title="Editar"
                        className="p-2 hover:bg-yellow-100 rounded-lg text-gray-500 hover:text-yellow-600 transition"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={() => excluirConfiguracao(config.id)}
                        title="Excluir"
                        className="p-2 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-600 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

