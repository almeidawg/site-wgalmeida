/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Copy, CheckSquare, Download, Share2, Save, X, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const loadJsPdf = () => import('jspdf');

interface ChecklistTemplate {
  id: string;
  nome: string;
  nucleo: 'arquitetura' | 'engenharia' | 'marcenaria' | 'geral';
  descricao: string;
  ordem: number;
  ativo: boolean;
  total_itens?: number;
}

interface TemplateItem {
  id: string;
  texto: string;
  ordem: number;
  grupo?: string;
}

interface TemplateFormData {
  nome: string;
  nucleo: 'arquitetura' | 'engenharia' | 'marcenaria' | 'geral';
  descricao: string;
  ordem: number;
}

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [filtroNucleo, setFiltroNucleo] = useState<'todos' | 'arquitetura' | 'engenharia' | 'marcenaria' | 'geral'>('todos');

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<TemplateFormData>({
    nome: '',
    nucleo: 'geral',
    descricao: '',
    ordem: 0
  });

  // Item editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select(`
          *,
          checklist_template_items(id)
        `)
        .order('ordem');

      if (error) throw error;

      const templatesWithCount = data?.map(t => ({
        ...t,
        total_itens: t.checklist_template_items?.length || 0
      })) || [];

      setTemplates(templatesWithCount);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplateItems(template: ChecklistTemplate) {
    try {
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', template.id)
        .order('ordem');

      if (error) throw error;
      setItems(data || []);
      setSelectedTemplate(template);
      setShowItemsModal(true);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  }

  async function createTemplate() {
    try {
      const { error } = await supabase
        .from('checklist_templates')
        .insert({
          nome: formData.nome,
          nucleo: formData.nucleo,
          descricao: formData.descricao,
          ordem: formData.ordem
        });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template criado com sucesso!" });
      setShowCreateModal(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar template" });
    }
  }

  async function updateTemplate() {
    if (!selectedTemplate) return;

    try {
      const { error } = await supabase
        .from('checklist_templates')
        .update({
          nome: formData.nome,
          nucleo: formData.nucleo,
          descricao: formData.descricao,
          ordem: formData.ordem
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template atualizado com sucesso!" });
      setShowEditModal(false);
      resetForm();
      setSelectedTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar template" });
    }
  }

  async function duplicateTemplate(template: ChecklistTemplate) {
    try {
      // Criar novo template
      const { data: newTemplate, error: templateError } = await supabase
        .from('checklist_templates')
        .insert({
          nome: `${template.nome} (Cópia)`,
          nucleo: template.nucleo,
          descricao: template.descricao,
          ordem: template.ordem + 1
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Copiar itens
      const { data: itemsData, error: itemsError } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', template.id);

      if (itemsError) throw itemsError;

      if (itemsData && itemsData.length > 0) {
        const newItems = itemsData.map(item => ({
          template_id: newTemplate.id,
          texto: item.texto,
          ordem: item.ordem,
          grupo: item.grupo
        }));

        await supabase
          .from('checklist_template_items')
          .insert(newItems);
      }

      toast({ title: "Sucesso", description: "Template duplicado com sucesso!" });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar template" });
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const { error } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Template excluído com sucesso!" });
      loadTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir template" });
    }
  }

  async function addItem() {
    if (!selectedTemplate || !newItemText.trim()) return;

    try {
      // Separar por linhas e filtrar linhas vazias
      const lines = newItemText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) return;

      // Calcular ordem inicial
      const baseOrdem = items.length > 0 ? Math.max(...items.map(i => i.ordem)) + 1 : 0;

      // Criar array de itens para inserir
      const newItems = lines.map((line, index) => ({
        template_id: selectedTemplate.id,
        texto: line,
        ordem: baseOrdem + index
      }));

      const { error } = await supabase
        .from('checklist_template_items')
        .insert(newItems);

      if (error) throw error;

      setNewItemText('');
      loadTemplateItems(selectedTemplate);

      // Feedback
      const count = lines.length;
      if (count > 1) {
        toast({ title: "Sucesso", description: `${count} itens adicionados com sucesso!` });
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao adicionar item" });
    }
  }

  async function updateItem(itemId: string) {
    if (!editingItemText.trim()) return;

    try {
      const { error } = await supabase
        .from('checklist_template_items')
        .update({ texto: editingItemText.trim() })
        .eq('id', itemId);

      if (error) throw error;

      setEditingItemId(null);
      setEditingItemText('');
      if (selectedTemplate) loadTemplateItems(selectedTemplate);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar item" });
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('checklist_template_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      if (selectedTemplate) loadTemplateItems(selectedTemplate);
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir item" });
    }
  }

  function openEditModal(template: ChecklistTemplate) {
    setSelectedTemplate(template);
    setFormData({
      nome: template.nome,
      nucleo: template.nucleo,
      descricao: template.descricao || '',
      ordem: template.ordem
    });
    setShowEditModal(true);
  }

  function resetForm() {
    setFormData({
      nome: '',
      nucleo: 'geral',
      descricao: '',
      ordem: 0
    });
  }

  async function generatePDF(template: ChecklistTemplate, templateItems: TemplateItem[]) {
    const { default: jsPDF } = await loadJsPdf();
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(17, 153, 142); // #11998e
    doc.text('Template de Checklist', 20, 20);

    // Template info
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(template.nome, 20, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Núcleo: ${template.nucleo.charAt(0).toUpperCase() + template.nucleo.slice(1)}`, 20, 45);

    if (template.descricao) {
      doc.text(template.descricao, 20, 52, { maxWidth: 170 });
    }

    // Items
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Itens do Checklist:', 20, 65);

    let yPosition = 75;
    templateItems.forEach((item, index) => {
      // Checkbox
      doc.rect(20, yPosition - 3, 4, 4);

      // Text
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(`${index + 1}. ${item.texto}`, 160);
      doc.text(lines, 30, yPosition);

      yPosition += lines.length * 5 + 3;

      // New page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gerado pelo WG EASY - Sistema Empresarial', 20, 285);

    // Save
    doc.save(`template-${template.nome.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
  }

  async function shareWhatsApp(template: ChecklistTemplate, templateItems: TemplateItem[]) {
    const text = `*${template.nome}*\n\n` +
      `Núcleo: ${template.nucleo.charAt(0).toUpperCase() + template.nucleo.slice(1)}\n` +
      (template.descricao ? `${template.descricao}\n` : '') +
      `\n*Itens do Checklist:*\n\n` +
      templateItems.map((item, i) => `${i + 1}. ${item.texto}`).join('\n') +
      `\n\n_Gerado pelo WG EASY_`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  }

  function getNucleoColor(nucleo: string) {
    switch (nucleo) {
      case 'arquitetura': return 'bg-[#5E9B94]/10 text-[#5E9B94]';
      case 'engenharia': return 'bg-[#3B82F6]/10 text-[#3B82F6]';
      case 'marcenaria': return 'bg-[#8B5E3C]/10 text-[#8B5E3C]';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getNucleoBorderColor(nucleo: string) {
    switch (nucleo) {
      case 'arquitetura': return 'border-l-[#5E9B94]';
      case 'engenharia': return 'border-l-[#3B82F6]';
      case 'marcenaria': return 'border-l-[#8B5E3C]';
      default: return 'border-l-gray-400';
    }
  }

  function getNucleoIconBg(nucleo: string) {
    switch (nucleo) {
      case 'arquitetura': return 'bg-[#5E9B94]';
      case 'engenharia': return 'bg-[#3B82F6]';
      case 'marcenaria': return 'bg-[#8B5E3C]';
      default: return 'bg-gray-500';
    }
  }

  function getNucleoPrefix(nucleo: string) {
    switch (nucleo) {
      case 'arquitetura': return 'ARQ';
      case 'engenharia': return 'ENG';
      case 'marcenaria': return 'MARC';
      default: return 'GER';
    }
  }

  // Extrair título limpo (sem prefixo numérico)
  function getTituloLimpo(nome: string) {
    // Remove prefixos como "01/ARQ - ", "02/ENG - ", etc.
    return nome.replace(/^\d{2}\/[A-Z]+\s*-\s*/, '');
  }

  // Gerar nome com prefixo padronizado
  function gerarNomeComPrefixo(titulo: string, nucleo: string, ordem: number) {
    const tituloLimpo = getTituloLimpo(titulo);
    const prefix = getNucleoPrefix(nucleo);
    const numeroFormatado = String(ordem + 1).padStart(2, '0');
    return `${numeroFormatado}/${prefix} - ${tituloLimpo}`;
  }

  // FunçÍo para reordenar cards via drag & drop
  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    // Reordenar localmente primeiro para feedback imediato
    const reordered = Array.from(templatesFiltrados);
    const [removed] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, removed);

    // Atualizar ordem e nome de todos os templates afetados
    const updates = reordered.map((template, index) => ({
      id: template.id,
      ordem: index,
      nome: gerarNomeComPrefixo(template.nome, template.nucleo, index)
    }));

    // Atualizar estado local imediatamente com novos nomes
    const reorderedWithNames = reordered.map((template, index) => ({
      ...template,
      ordem: index,
      nome: gerarNomeComPrefixo(template.nome, template.nucleo, index)
    }));

    if (filtroNucleo === 'todos') {
      setTemplates(reorderedWithNames);
    } else {
      // Reconstruir array completo mantendo os nÍo filtrados
      const notFiltered = templates.filter(t => t.nucleo !== filtroNucleo);
      const newTemplates = [...notFiltered, ...reorderedWithNames].sort((a, b) => a.ordem - b.ordem);
      setTemplates(newTemplates);
    }

    // Persistir no banco
    try {
      for (const update of updates) {
        await supabase
          .from('checklist_templates')
          .update({ ordem: update.ordem, nome: update.nome })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Erro ao reordenar templates:', error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar nova ordem" });
      loadTemplates(); // Recarregar em caso de erro
    }
  }

  // Filtrar templates por núcleo
  const templatesFiltrados = filtroNucleo === 'todos'
    ? templates
    : templates.filter(t => t.nucleo === filtroNucleo);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Templates de Checklists</h1>
          <p className="text-[12px] text-gray-600 mt-1">Gerencie modelos padronizados para os cards</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-[14px]"
        >
          <Plus size={20} />
          Novo Template
        </button>
      </div>

      {/* Filtro por Núcleo */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[12px] text-gray-700 mr-2">Filtrar por núcleo:</span>
        <button
          onClick={() => setFiltroNucleo('todos')}
          className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
            filtroNucleo === 'todos'
              ? 'bg-wg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroNucleo('arquitetura')}
          className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
            filtroNucleo === 'arquitetura'
              ? 'bg-[#5E9B94] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Arquitetura
        </button>
        <button
          onClick={() => setFiltroNucleo('engenharia')}
          className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
            filtroNucleo === 'engenharia'
              ? 'bg-[#3B82F6] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Engenharia
        </button>
        <button
          onClick={() => setFiltroNucleo('marcenaria')}
          className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
            filtroNucleo === 'marcenaria'
              ? 'bg-[#8B5E3C] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Marcenaria
        </button>
        <button
          onClick={() => setFiltroNucleo('geral')}
          className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
            filtroNucleo === 'geral'
              ? 'bg-gray-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Geral
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando templates...</p>
        </div>
      ) : templatesFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-[20px] font-light text-gray-500 mb-4">
            {filtroNucleo === 'todos' ? 'Nenhum template cadastrado' : `Nenhum template de ${filtroNucleo}`}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-[14px]"
          >
            Criar Primeiro Template
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="templates-grid" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {templatesFiltrados.map((template, index) => (
                  <Draggable key={template.id} draggableId={template.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-stretch gap-0"
                      >
                        {/* Grip Handle à esquerda do card */}
                        <div
                          {...provided.dragHandleProps}
                          className={`flex flex-col items-center justify-start py-3 px-2 rounded-l-lg ${getNucleoIconBg(template.nucleo)} text-white cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging ? 'ring-2 ring-[#F25C26]' : ''
                          }`}
                          title="Arraste para reordenar"
                        >
                          <GripVertical size={18} />
                          <span className="font-normal text-[13px] mt-1">{String(index + 1).padStart(2, '0')}</span>
                          <span
                            className="font-medium text-[11px] mt-2 whitespace-nowrap"
                            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                          >
                            {template.nucleo.toUpperCase()}
                          </span>
                        </div>

                        {/* Card principal */}
                        <div
                          className={`flex-1 bg-white rounded-r-lg shadow-md border-t border-r border-b border-gray-200 p-4 transition-shadow ${
                            snapshot.isDragging ? 'shadow-2xl ring-2 ring-[#F25C26]' : 'hover:shadow-lg'
                          }`}
                        >
                          {/* Header - Título */}
                          <div className="mb-2">
                            <h3 className="font-light text-[13px] text-gray-900 line-clamp-2">
                              {template.nome}
                            </h3>
                          </div>

                          {/* DescriçÍo */}
                          {template.descricao && (
                            <p className="text-[12px] text-gray-600 mb-3 line-clamp-2">
                              {template.descricao}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-3 mb-3 text-[12px] text-gray-600">
                            <div className="flex items-center gap-1">
                              <CheckSquare size={18} />
                              <span>{template.total_itens || 0} itens</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={async () => {
                                const { data } = await supabase
                                  .from('checklist_template_items')
                                  .select('*')
                                  .eq('template_id', template.id)
                                  .order('ordem');
                                loadTemplateItems(template);
                              }}
                              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-[12px]"
                            >
                              Gerenciar Itens
                            </button>
                            <button
                              onClick={() => openEditModal(template)}
                              className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => duplicateTemplate(template)}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              title="Duplicar"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Modal: Criar/Editar Template */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-[18px] font-light text-gray-900">
                {showCreateModal ? 'Novo Template' : 'Editar Template'}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Programa de Necessidades"
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-gray-700 mb-1">
                    Núcleo *
                  </label>
                  <select
                    value={formData.nucleo}
                    onChange={(e) => setFormData({ ...formData, nucleo: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="geral">Geral</option>
                    <option value="arquitetura">Arquitetura</option>
                    <option value="engenharia">Engenharia</option>
                    <option value="marcenaria">Marcenaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] text-gray-700 mb-1">
                    DescriçÍo
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="DescriçÍo do template..."
                  />
                </div>

                <div>
                  <label className="block text-[12px] text-gray-700 mb-1">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={showCreateModal ? createTemplate : updateTemplate}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                <Save size={16} />
                {showCreateModal ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Itens */}
      {showItemsModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-[20px] font-light text-gray-800">{selectedTemplate.nome}</h2>
                <p className="text-[12px] text-gray-600 mt-1">Gerenciar itens do checklist</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const { data } = await supabase
                      .from('checklist_template_items')
                      .select('*')
                      .eq('template_id', selectedTemplate.id)
                      .order('ordem');
                    await generatePDF(selectedTemplate, data || []);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  title="Gerar PDF"
                >
                  <Download size={16} />
                  PDF
                </button>
                <button
                  onClick={async () => {
                    const { data } = await supabase
                      .from('checklist_template_items')
                      .select('*')
                      .eq('template_id', selectedTemplate.id)
                      .order('ordem');
                    shareWhatsApp(selectedTemplate, data || []);
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  title="Compartilhar WhatsApp"
                >
                  <Share2 size={16} />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Item */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <label className="block text-[12px] text-gray-700">
                      Adicionar Novo Item
                    </label>
                    <p className="text-[12px] text-gray-600 mt-1">
                      💡 Dica: Cole múltiplas linhas - cada linha será um item separado
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      // Ctrl+Enter ou Cmd+Enter para adicionar
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        addItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Digite o texto do item... (cada linha = um item)"
                    rows={4}
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 h-fit"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
                <p className="text-[12px] text-gray-500 mt-2">
                  Pressione <strong>Ctrl+Enter</strong> para adicionar rapidamente
                </p>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <p className="text-center text-[12px] text-gray-500 py-8">Nenhum item cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[12px] mt-1">
                        {index + 1}
                      </span>

                      {editingItemId === item.id ? (
                        <>
                          <input
                            type="text"
                            value={editingItemText}
                            onChange={(e) => setEditingItemText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateItem(item.id)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => updateItem(item.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItemId(null);
                              setEditingItemText('');
                            }}
                            className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-[12px] text-gray-800">{item.texto}</p>
                            {item.grupo && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[12px]">
                                {item.grupo}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditingItemText(item.texto);
                            }}
                            className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowItemsModal(false);
                  setSelectedTemplate(null);
                  setEditingItemId(null);
                  setEditingItemText('');
                  setNewItemText('');
                  loadTemplates();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



