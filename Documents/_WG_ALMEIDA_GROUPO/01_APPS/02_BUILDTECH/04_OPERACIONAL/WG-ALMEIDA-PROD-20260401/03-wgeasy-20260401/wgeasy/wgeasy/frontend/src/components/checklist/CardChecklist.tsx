import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckSquare, Plus, Trash2, Check, ClipboardPaste, X, Pencil, AtSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
  data_inicio?: string | null;
  data_fim?: string | null;
}

interface Checklist {
  id: string;
  nome: string;
  progresso: number;
  concluido: boolean;
  items?: ChecklistItem[];
}

interface ChecklistTemplate {
  id: string;
  nome: string;
  nucleo: string | null;
}

interface PessoaMencaoOption {
  id: string;
  nome: string;
  tipo?: string | null;
  cargo?: string | null;
}

interface CardChecklistProps {
  oportunidadeId: string;
  nucleo?: string; // Núcleo específico (engenharia, arquitetura, marcenaria)
  onChecklistsChanged?: () => void;
  onCriarNotaJornada?: () => void | Promise<void>;
  onCronogramaChecklist?: (checklistId: string) => void | Promise<void>;
  cronogramaChecklistLoadingId?: string | null;
  cronogramaResultadoPorChecklist?: Record<
    string,
    { tarefas_criadas: number; tarefas_existentes: number }
  >;
  desabilitarCronogramaChecklist?: boolean;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function CardChecklist({
  oportunidadeId,
  nucleo,
  onChecklistsChanged,
  onCriarNotaJornada,
  onCronogramaChecklist,
  cronogramaChecklistLoadingId,
  cronogramaResultadoPorChecklist,
  desabilitarCronogramaChecklist = false,
}: CardChecklistProps) {
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [creatingChecklist, setCreatingChecklist] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistName, setEditingChecklistName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [addingItemChecklistId, setAddingItemChecklistId] = useState<string | null>(null);
  const [newItemChecklistText, setNewItemChecklistText] = useState('');
  const [mencaoReconhecidaItemId, setMencaoReconhecidaItemId] = useState<string | null>(null);
  const [bulkMentionChecklistId, setBulkMentionChecklistId] = useState<string | null>(null);
  const [bulkMentionText, setBulkMentionText] = useState('');
  const [showBulkMentionSuggestions, setShowBulkMentionSuggestions] = useState(false);
  const [pessoasMencao, setPessoasMencao] = useState<PessoaMencaoOption[]>([]);
  const [itemDateDrafts, setItemDateDrafts] = useState<
    Record<string, { data_inicio: string; data_fim: string }>
  >({});
  const [savingDateItemIds, setSavingDateItemIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function extrairMencoesIds(texto: string): string[] {
    const regex = /@\[([^\]]+)\]/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(texto)) !== null) {
      ids.push(match[1]);
    }
    return [...new Set(ids)];
  }

  function extrairMencoesNomes(texto: string): string[] {
    const nomes: string[] = [];
    const regex = /(^|[\s(])@([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*){0,5})/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(texto)) !== null) {
      const nomeLimpo = String(match[2] || "")
        .trim()
        .replace(/[.,;:!?]+$/, "");
      if (nomeLimpo) nomes.push(nomeLimpo);
    }
    return [...new Set(nomes)];
  }

  function normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function renderTextoComMencoes(texto: string) {
    const partes = texto.split(/(@[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*(?:\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9._-]*){0,5})/g);
    return partes.map((parte, idx) => {
      if (/^@[A-Za-zÀ-ÿ]/.test(parte)) {
        return (
          <span key={`${parte}-${idx}`} className="text-green-700 font-medium">
            {parte}
          </span>
        );
      }
      return <span key={`${parte}-${idx}`}>{parte}</span>;
    });
  }

  function limparTokensMencao(nome: string): string[] {
    const blacklist = new Set([
      "colaborador",
      "fornecedor",
      "cliente",
      "usuario",
      "usuário",
      "admin",
      "master",
    ]);

    return normalizarTexto(nome)
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !blacklist.has(t));
  }

  async function resolverMencoesParaPessoas(
    texto: string,
    cache: Map<string, string | null>
  ): Promise<string[]> {
    const idsExplicitos = extrairMencoesIds(texto);
    const nomes = extrairMencoesNomes(texto);
    const ids = new Set<string>(idsExplicitos);

    for (const nome of nomes) {
      const chave = nome.toLowerCase();
      if (!cache.has(chave)) {
        let pessoaId: string | null = null;

        const tokens = limparTokensMencao(nome);
        const primeiroToken = tokens[0] || nome.split(/\s+/)[0] || nome;
        const { data: candidatos } = await supabase
          .from("pessoas")
          .select("id, nome")
          .ilike("nome", `%${primeiroToken}%`)
          .limit(100);

        const alvo = normalizarTexto(nome);
        let melhor: { id: string; score: number } | null = null;

        for (const candidato of (candidatos || []) as Array<{ id: string; nome: string | null }>) {
          const nomeCand = normalizarTexto(candidato.nome || '');
          if (!nomeCand) continue;

          let score = 0;
          if (nomeCand === alvo) score += 100;
          if (nomeCand.includes(alvo)) score += 50;
          if (nomeCand.startsWith(tokens[0] || "")) score += 20;

          for (const token of tokens) {
            if (nomeCand.includes(token)) score += 15;
          }

          if (!melhor || score > melhor.score) {
            melhor = { id: candidato.id, score };
          }
        }

        if (melhor && melhor.score >= 30) {
          pessoaId = melhor.id;
        }

        cache.set(chave, pessoaId);
      }

      const resolved = cache.get(chave);
      if (resolved) ids.add(resolved);
    }

    return [...ids];
  }

  async function criarNotificacoesMencoesChecklist(
    checklistNome: string,
    itens: Array<{ id: string; texto: string }>
  ): Promise<Set<string>> {
    const cacheMencoes = new Map<string, string | null>();
    const mencionadosPorItem: Array<{ itemId: string; pessoaId: string }> = [];

    for (const item of itens) {
      const ids = await resolverMencoesParaPessoas(item.texto || "", cacheMencoes);
      ids.forEach((pessoaId) => mencionadosPorItem.push({ itemId: item.id, pessoaId }));
    }

    if (mencionadosPorItem.length === 0) return new Set<string>();

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;

      let autorPessoaId = userId;
      if (userId) {
        const { data: usuarioSistema } = await supabase
          .from("usuarios")
          .select("pessoa_id")
          .eq("auth_user_id", userId)
          .maybeSingle();
        autorPessoaId = (usuarioSistema as any)?.pessoa_id || userId;
      }

      let autorNome = "Alguém";
      if (autorPessoaId) {
        const { data: autorPessoa } = await supabase
          .from("pessoas")
          .select("nome")
          .eq("id", autorPessoaId)
          .maybeSingle();
        autorNome = autorPessoa?.nome || autorNome;
      }

      const notificacoes = mencionadosPorItem
        .filter((mencao) => isUuid(mencao.pessoaId))
        .map((mencao) => ({
        tipo: "mencao",
        titulo: `${autorNome} mencionou você em um checklist`,
        mensagem: `Checklist: ${checklistNome}`,
        referencia_tipo: "checklist_item",
        referencia_id: mencao.itemId,
        destinatario_id: mencao.pessoaId,
        para_todos_admins: false,
        url_acao: "/colaborador/notificacoes",
        texto_acao: "Ver notificações",
      }));

      if (notificacoes.length === 0) return new Set<string>();

      const { error } = await supabase.from("notificacoes_sistema").insert(notificacoes);
      if (error) {
        console.error("Erro ao inserir notificações de checklist:", {
          error,
          checklistNome,
          total: notificacoes.length,
        });
        return new Set<string>();
      }
      return new Set(
        mencionadosPorItem
          .filter((m) => isUuid(m.pessoaId))
          .map((m) => m.itemId)
      );
    } catch (error) {
      console.error("Erro ao criar notificações de mençÍo do checklist:", error);
      return new Set<string>();
    }
  }

  const loadChecklists = useCallback(async () => {
    try {
      let query = supabase
        .from('cliente_checklists')
        .select(`
          *,
          cliente_checklist_items(*)
        `)
        .eq('oportunidade_id', oportunidadeId);

      // Filtrar por núcleo se fornecido
      if (nucleo) {
        query = query.eq('nucleo', nucleo);
      }

      const { data, error } = await query.order('criado_em', { ascending: false });

      if (error) throw error;

      const checklistsWithItems =
        data?.map((c) => ({
          ...c,
          items:
            (c.cliente_checklist_items as ChecklistItem[] | undefined)?.sort(
              (a, b) => a.ordem - b.ordem
            ) || [],
        })) || [];

      setChecklists(checklistsWithItems);
    } catch (error) {
      console.error('Erro ao carregar checklists:', error);
    } finally {
      setLoading(false);
    }
  }, [oportunidadeId, nucleo]);

  const loadTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('id, nome, nucleo')
        .eq('ativo', true)
        .order('ordem');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  }, []);

  const loadPessoasMencao = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome, tipo, cargo')
        .eq('ativo', true)
        .order('nome', { ascending: true })
        .limit(300);

      if (error) throw error;
      setPessoasMencao((data as PessoaMencaoOption[]) || []);
    } catch (error) {
      console.error('Erro ao carregar pessoas para mençÍo:', error);
    }
  }, []);

  useEffect(() => {
    loadChecklists();
    loadTemplates();
    loadPessoasMencao();
  }, [loadChecklists, loadTemplates, loadPessoasMencao]);

  function getDateDraft(item: ChecklistItem): { data_inicio: string; data_fim: string } {
    return (
      itemDateDrafts[item.id] || {
        data_inicio: item.data_inicio ? item.data_inicio.slice(0, 10) : '',
        data_fim: item.data_fim ? item.data_fim.slice(0, 10) : '',
      }
    );
  }

  function adicionarUmDia(dataIso: string): string {
    if (!dataIso) return dataIso;
    const d = new Date(`${dataIso}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  async function persistDateDraftIfChanged(checklistId: string, item: ChecklistItem) {
    if (savingDateItemIds.has(item.id)) return;
    const draft = itemDateDrafts[item.id];
    if (!draft) return;

    const atualInicio = item.data_inicio ? item.data_inicio.slice(0, 10) : '';
    const atualFim = item.data_fim ? item.data_fim.slice(0, 10) : '';
    if (draft.data_inicio === atualInicio && draft.data_fim === atualFim) return;

    let novoInicio = draft.data_inicio || null;
    let novoFim = draft.data_fim || null;

    // Evita violar constraint data_fim >= data_inicio
    if (novoInicio && !novoFim) {
      novoFim = adicionarUmDia(novoInicio);
    }
    if (novoInicio && novoFim && novoFim < novoInicio) {
      novoFim = adicionarUmDia(novoInicio);
    }

    setSavingDateItemIds((prev) => new Set(prev).add(item.id));
    try {
      await updateChecklistItemDatas(checklistId, item.id, {
        data_inicio: novoInicio,
        data_fim: novoFim,
      });
      // Forward sync datas para cronograma (não-bloqueante)
      try {
        const { sincronizarChecklistParaCronograma } = await import('@/lib/checklistCronogramaIntegration');
        await sincronizarChecklistParaCronograma({
          checklistItemId: item.id,
          concluido: item.concluido,
          data_inicio: novoInicio,
          data_fim: novoFim,
        });
      } catch (syncErr) {
        console.warn('Forward sync dates to cronograma failed:', syncErr);
      }
      setItemDateDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } finally {
      setSavingDateItemIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  const termoMencaoHeader = bulkMentionText.trim().startsWith('@')
    ? normalizarTexto(bulkMentionText.trim().slice(1))
    : '';
  const pessoasMencaoFiltradas =
    termoMencaoHeader.length >= 2
      ? pessoasMencao
          .filter((p) => normalizarTexto(p.nome || '').includes(termoMencaoHeader))
          .slice(0, 8)
      : [];

  async function applyTemplate(templateId: string) {
    try {
      const { data: checklistsAntes } = await supabase
        .from("cliente_checklists")
        .select("id")
        .eq("oportunidade_id", oportunidadeId);
      const idsAntes = new Set((checklistsAntes || []).map((c: any) => c.id));

      const { error } = await supabase
        .rpc('aplicar_template_checklist', {
          p_oportunidade_id: oportunidadeId,
          p_template_id: templateId,
          p_nucleo: nucleo || null // Vincular ao núcleo específico
        });

      if (error) throw error;

      const { data: checklistsDepois } = await supabase
        .from("cliente_checklists")
        .select("id, nome, cliente_checklist_items(id, texto)")
        .eq("oportunidade_id", oportunidadeId);

      const novosChecklists = (checklistsDepois || []).filter((checklist: any) => !idsAntes.has(checklist.id));
      for (const checklist of novosChecklists) {
        const itens = ((checklist as any).cliente_checklist_items || []) as Array<{ id: string; texto: string }>;
        await criarNotificacoesMencoesChecklist(checklist.nome || "Checklist", itens);
        if (onCronogramaChecklist) {
          await onCronogramaChecklist(checklist.id);
        }
      }

      setShowTemplateSelector(false);
      loadChecklists();
      onChecklistsChanged?.();
      await onCriarNotaJornada?.();
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast({ variant: 'destructive', title: 'Erro ao aplicar template' });
    }
  }

  async function toggleItem(checklistId: string, itemId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('cliente_checklist_items')
        .update({
          concluido: !currentStatus,
          concluido_em: !currentStatus ? new Date().toISOString() : null,
          concluido_por: !currentStatus ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', itemId);

      if (error) throw error;

      // Forward sync para cronograma (não-bloqueante)
      try {
        const { sincronizarChecklistParaCronograma } = await import('@/lib/checklistCronogramaIntegration');
        await sincronizarChecklistParaCronograma({
          checklistItemId: itemId,
          concluido: !currentStatus,
        });
      } catch (syncErr) {
        console.warn('Forward sync to cronograma failed:', syncErr);
      }

      // Atualizar estado local
      setChecklists(prev => prev.map(c => {
        if (c.id === checklistId) {
          const updatedItems = c.items?.map(item =>
            item.id === itemId ? { ...item, concluido: !currentStatus } : item
          );
          const totalItems = updatedItems?.length || 0;
          const concluidos = updatedItems?.filter(i => i.concluido).length || 0;
          const progresso = totalItems > 0 ? Math.round((concluidos / totalItems) * 100) : 0;

          return {
            ...c,
            items: updatedItems,
            progresso,
            concluido: progresso === 100
          };
        }
        return c;
      }));

      onChecklistsChanged?.();
      await onCriarNotaJornada?.();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  }

  async function deleteChecklist(checklistId: string) {
    if (!confirm('Tem certeza que deseja excluir este checklist?')) return;

    try {
      const { error } = await supabase
        .from('cliente_checklists')
        .delete()
        .eq('id', checklistId);

      if (error) throw error;

      setChecklists(prev => prev.filter(c => c.id !== checklistId));
      onChecklistsChanged?.();
    } catch (error) {
      console.error('Erro ao excluir checklist:', error);
    }
  }

  async function updateChecklistName(checklistId: string) {
    const nome = editingChecklistName.trim();
    if (!nome) return;
    try {
      const { error } = await supabase
        .from('cliente_checklists')
        .update({ nome })
        .eq('id', checklistId);
      if (error) throw error;
      setChecklists(prev => prev.map(c => (c.id === checklistId ? { ...c, nome } : c)));
      setEditingChecklistId(null);
      setEditingChecklistName('');
      onChecklistsChanged?.();
    } catch (error) {
      console.error('Erro ao atualizar nome do checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar nome do checklist' });
    }
  }

  async function updateChecklistItemText(checklistId: string, itemId: string) {
    const texto = editingItemText.trim();
    if (!texto) return;
    try {
      const { error } = await supabase
        .from('cliente_checklist_items')
        .update({ texto })
        .eq('id', itemId);
      if (error) throw error;
      setChecklists(prev =>
        prev.map(c =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items?.map(item => (item.id === itemId ? { ...item, texto } : item)),
              }
            : c
        )
      );
      const checklistAtual = checklists.find((c) => c.id === checklistId);
      const idsComMencao = await criarNotificacoesMencoesChecklist(
        checklistAtual?.nome || "Checklist",
        [{ id: itemId, texto }]
      );
      if (idsComMencao.has(itemId)) {
        setMencaoReconhecidaItemId(itemId);
        setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === itemId ? null : prev)), 2500);
      }
      setEditingItemId(null);
      setEditingItemText('');
      await onCriarNotaJornada?.();
    } catch (error) {
      console.error('Erro ao atualizar item do checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar item do checklist' });
    }
  }

  async function addItemToChecklist(checklistId: string) {
    const texto = newItemChecklistText.trim();
    if (!texto) return;
    try {
      const hoje = new Date();
      const inicio = hoje.toISOString().slice(0, 10);
      const fim = new Date(hoje);
      fim.setDate(fim.getDate() + 1);
      const fimIso = fim.toISOString().slice(0, 10);

      const checklist = checklists.find((c) => c.id === checklistId);
      const proximaOrdem = (checklist?.items?.length || 0) + 1;

      const { data: itemCriado, error } = await supabase
        .from('cliente_checklist_items')
        .insert({
          checklist_id: checklistId,
          texto,
          concluido: false,
          ordem: proximaOrdem,
          data_inicio: inicio,
          data_fim: fimIso,
        })
        .select('id, texto, concluido, ordem, data_inicio, data_fim')
        .single();

      if (error || !itemCriado) throw error;

      setChecklists((prev) =>
        prev.map((c) => {
          if (c.id !== checklistId) return c;
          const updatedItems = [...(c.items || []), itemCriado as ChecklistItem];
          const totalItems = updatedItems.length;
          const concluidos = updatedItems.filter((i) => i.concluido).length;
          const progresso = totalItems > 0 ? Math.round((concluidos / totalItems) * 100) : 0;
          return {
            ...c,
            items: updatedItems,
            progresso,
            concluido: progresso === 100 && totalItems > 0,
          };
        })
      );

      const idsComMencao = await criarNotificacoesMencoesChecklist(
        checklist?.nome || "Checklist",
        [{ id: itemCriado.id, texto: itemCriado.texto }]
      );
      if (idsComMencao.has(itemCriado.id)) {
        setMencaoReconhecidaItemId(itemCriado.id);
        setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === itemCriado.id ? null : prev)), 2500);
      }

      setAddingItemChecklistId(null);
      setNewItemChecklistText('');
      onChecklistsChanged?.();
      await onCriarNotaJornada?.();
      if (onCronogramaChecklist) {
        await onCronogramaChecklist(checklistId);
      }
    } catch (error) {
      console.error('Erro ao adicionar item ao checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao adicionar item ao checklist' });
    }
  }

  async function aplicarMencaoNoChecklist(checklistId: string) {
    const mencaoRaw = bulkMentionText.trim();
    if (!mencaoRaw) return;

    const mencaoTexto = mencaoRaw.startsWith('@') ? mencaoRaw : `@${mencaoRaw}`;
    const checklist = checklists.find((c) => c.id === checklistId);
    const itens = checklist?.items || [];
    if (itens.length === 0) return;

    try {
      const updates: Array<{ id: string; texto: string }> = [];
      for (const item of itens) {
        if ((item.texto || '').includes(mencaoTexto)) continue;
        updates.push({ id: item.id, texto: `${item.texto} ${mencaoTexto}`.trim() });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('cliente_checklist_items')
          .update({ texto: update.texto })
          .eq('id', update.id);
        if (error) throw error;
      }

      if (updates.length > 0) {
        setChecklists((prev) =>
          prev.map((c) =>
            c.id === checklistId
              ? {
                  ...c,
                  items: c.items?.map((item) => {
                    const update = updates.find((u) => u.id === item.id);
                    return update ? { ...item, texto: update.texto } : item;
                  }),
                }
              : c
          )
        );

        const idsComMencao = await criarNotificacoesMencoesChecklist(
          checklist?.nome || "Checklist",
          updates.map((u) => ({ id: u.id, texto: u.texto }))
        );

        const primeiro = updates[0]?.id || null;
        if (primeiro && idsComMencao.has(primeiro)) {
          setMencaoReconhecidaItemId(primeiro);
          setTimeout(() => setMencaoReconhecidaItemId((prev) => (prev === primeiro ? null : prev)), 2500);
        }
      }

      setBulkMentionChecklistId(null);
      setBulkMentionText('');
      setShowBulkMentionSuggestions(false);
      await onCriarNotaJornada?.();
      if (onCronogramaChecklist) {
        await onCronogramaChecklist(checklistId);
      }
    } catch (error) {
      console.error('Erro ao aplicar mençÍo no checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao aplicar mençÍo no checklist' });
    }
  }

  async function deleteChecklistItem(checklistId: string, itemId: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error } = await supabase
        .from('cliente_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev =>
        prev.map((c) => {
          if (c.id !== checklistId) return c;
          const updatedItems = (c.items || []).filter((item) => item.id !== itemId);
          const totalItems = updatedItems.length;
          const concluidos = updatedItems.filter((i) => i.concluido).length;
          const progresso = totalItems > 0 ? Math.round((concluidos / totalItems) * 100) : 0;

          return {
            ...c,
            items: updatedItems,
            progresso,
            concluido: progresso === 100 && totalItems > 0,
          };
        })
      );

      if (editingItemId === itemId) {
        setEditingItemId(null);
        setEditingItemText('');
      }

      onChecklistsChanged?.();
      await onCriarNotaJornada?.();
    } catch (error) {
      console.error('Erro ao excluir item do checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao excluir item do checklist' });
    }
  }

  async function updateChecklistItemDatas(
    checklistId: string,
    itemId: string,
    patch: { data_inicio?: string | null; data_fim?: string | null }
  ) {
    try {
      const payload = {
        ...(patch.data_inicio !== undefined ? { data_inicio: patch.data_inicio || null } : {}),
        ...(patch.data_fim !== undefined ? { data_fim: patch.data_fim || null } : {}),
      };

      const { error } = await supabase
        .from('cliente_checklist_items')
        .update(payload)
        .eq('id', itemId);

      if (error) throw error;

      setChecklists(prev =>
        prev.map((c) =>
          c.id === checklistId
            ? {
                ...c,
                items: c.items?.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        ...(patch.data_inicio !== undefined ? { data_inicio: patch.data_inicio || null } : {}),
                        ...(patch.data_fim !== undefined ? { data_fim: patch.data_fim || null } : {}),
                      }
                    : item
                ),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar datas do item:', error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar datas do item' });
    }
  }

  // Criar checklist rápido a partir de texto colado (cada linha = 1 item)
  async function criarChecklistRapido() {
    if (!quickAddText.trim()) {
      toast({ variant: 'destructive', title: 'Cole ou digite os itens do checklist' });
      return;
    }

    // Separar texto por linhas e filtrar linhas vazias
    const linhas = quickAddText
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0);

    if (linhas.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum item válido encontrado' });
      return;
    }

    const nomeChecklist = quickAddName.trim() || `Checklist ${new Date().toLocaleDateString('pt-BR')}`;

    try {
      setCreatingChecklist(true);

      // 1. Criar o checklist
      const { data: novoChecklist, error: checklistError } = await supabase
        .from('cliente_checklists')
        .insert({
          oportunidade_id: oportunidadeId,
          nucleo: nucleo || null, // Vincular ao núcleo específico
          nome: nomeChecklist,
          progresso: 0,
          concluido: false
        })
        .select()
        .single();

      if (checklistError) throw checklistError;

      // 2. Criar os itens do checklist
      const hoje = new Date();
      const inicio = hoje.toISOString().slice(0, 10);
      const fim = new Date(hoje);
      fim.setDate(fim.getDate() + 1);
      const fimIso = fim.toISOString().slice(0, 10);
      const itensParaInserir = linhas.map((texto, index) => ({
        checklist_id: novoChecklist.id,
        texto: texto,
        concluido: false,
        ordem: index + 1,
        data_inicio: inicio,
        data_fim: fimIso,
      }));

      const { data: itensCriados, error: itensError } = await supabase
        .from('cliente_checklist_items')
        .insert(itensParaInserir)
        .select("id, texto");

      if (itensError) throw itensError;

      await criarNotificacoesMencoesChecklist(
        nomeChecklist,
        (itensCriados || []).map((item: any) => ({ id: item.id, texto: item.texto }))
      );
      if (onCronogramaChecklist) {
        await onCronogramaChecklist(novoChecklist.id);
      }

      // Fechar modal e recarregar
      setShowQuickAdd(false);
      setQuickAddText('');
      setQuickAddName('');
      loadChecklists();
      onChecklistsChanged?.();
      await onCriarNotaJornada?.();

    } catch (error) {
      console.error('Erro ao criar checklist:', error);
      toast({ variant: 'destructive', title: 'Erro ao criar checklist' });
    } finally {
      setCreatingChecklist(false);
    }
  }

  // Handler para detectar paste no textarea
  function handlePaste() {
    // O texto colado já será inserido automaticamente pelo browser
    // Apenas focamos no campo após um pequeno delay para UX
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  }

  // Contar quantos itens serÍo criados
  function contarItens(): number {
    return quickAddText
      .split('\n')
      .map(linha => linha.trim())
      .filter(linha => linha.length > 0).length;
  }

  function getNucleoColor(nucleo: string) {
    switch (nucleo) {
      case 'arquitetura': return 'bg-blue-500';
      case 'engenharia': return 'bg-green-500';
      case 'marcenaria': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Carregando checklists...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-normal text-gray-800 flex items-center gap-2">
          <CheckSquare size={20} />
          Checklists
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            title="Colar lista de itens"
          >
            <ClipboardPaste size={16} />
            + Colar Checklist
          </button>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
          >
            <Plus size={16} />
            + Checklist Modelos
          </button>
          {onCriarNotaJornada && (
            <button
              onClick={() => onCriarNotaJornada()}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              title="Inserir nota da jornada do cliente"
            >
              <Plus size={16} />
              + Nota
            </button>
          )}
        </div>
      </div>

      {/* Checklists */}
      {checklists.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CheckSquare size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm mb-3">Nenhum checklist adicionado</p>
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
          >
            Adicionar Primeiro Checklist
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map(checklist => (
            <div key={checklist.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Checklist Header */}
              <div
                className="p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedChecklist(
                  expandedChecklist === checklist.id ? null : checklist.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingChecklistId === checklist.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingChecklistName}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setEditingChecklistName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              updateChecklistName(checklist.id);
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingChecklistId(null);
                              setEditingChecklistName('');
                            }
                          }}
                          className="w-full border rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateChecklistName(checklist.id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Salvar nome"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChecklistId(null);
                            setEditingChecklistName('');
                          }}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          title="Cancelar ediçÍo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <h4 className="font-medium text-gray-800">{checklist.nome}</h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChecklistId(checklist.id);
                            setEditingChecklistName(checklist.nome);
                          }}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                          title="Editar título"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${checklist.progresso}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {checklist.progresso}%
                      </span>
                    </div>
                    {cronogramaResultadoPorChecklist?.[checklist.id] && (
                      <p className="text-[11px] text-green-600 mt-1">
                        {cronogramaResultadoPorChecklist[checklist.id].tarefas_criadas} criada(s) e{" "}
                        {cronogramaResultadoPorChecklist[checklist.id].tarefas_existentes} existente(s).
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedChecklist(checklist.id);
                        setBulkMentionChecklistId(checklist.id);
                        setBulkMentionText('');
                      }}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                      title="Mencionar pessoa em todos os itens"
                    >
                      <AtSign size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedChecklist(checklist.id);
                        setAddingItemChecklistId(checklist.id);
                        setNewItemChecklistText('');
                      }}
                      className="p-1.5 text-green-700 hover:bg-green-50 rounded"
                      title="Adicionar item"
                    >
                      <Plus size={16} />
                    </button>
                    {onCronogramaChecklist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCronogramaChecklist(checklist.id);
                        }}
                        disabled={
                          desabilitarCronogramaChecklist ||
                          cronogramaChecklistLoadingId === checklist.id
                        }
                        className="px-2 py-1 text-[11px] rounded border bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Gerar tarefas no cronograma para este checklist"
                      >
                        {cronogramaChecklistLoadingId === checklist.id
                          ? "Sincronizando..."
                          : "Cronograma"}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChecklist(checklist.id);
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              {expandedChecklist === checklist.id && (
                <div className="p-3 space-y-2">
                  {bulkMentionChecklistId === checklist.id && (
                    <div className="relative flex items-center gap-1.5 p-2 bg-emerald-50 rounded border border-emerald-200">
                      <input
                        type="text"
                        value={bulkMentionText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setBulkMentionText(e.target.value);
                          setShowBulkMentionSuggestions(true);
                        }}
                        onFocus={() => setShowBulkMentionSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowBulkMentionSuggestions(false), 120);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            aplicarMencaoNoChecklist(checklist.id);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setBulkMentionChecklistId(null);
                            setBulkMentionText('');
                          }
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Ex.: @Wellington de Melo Colaborador"
                        autoFocus
                      />
                      {showBulkMentionSuggestions && pessoasMencaoFiltradas.length > 0 && (
                        <div className="absolute mt-24 z-20 w-[320px] max-h-44 overflow-auto rounded border bg-white shadow-lg">
                          {pessoasMencaoFiltradas.map((pessoa) => (
                            <button
                              key={pessoa.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setBulkMentionText(`@${pessoa.nome}`);
                                setShowBulkMentionSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-50"
                            >
                              <p className="text-sm text-gray-800">{pessoa.nome}</p>
                              <p className="text-[11px] text-gray-500">
                                {pessoa.tipo || 'pessoa'}{pessoa.cargo ? ` • ${pessoa.cargo}` : ''}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          aplicarMencaoNoChecklist(checklist.id);
                        }}
                        className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                        title="Aplicar mençÍo em todos itens"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBulkMentionChecklistId(null);
                          setBulkMentionText('');
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {addingItemChecklistId === checklist.id && (
                    <div className="flex items-center gap-1.5 p-2 bg-green-50 rounded border border-green-200">
                      <input
                        type="text"
                        value={newItemChecklistText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNewItemChecklistText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            addItemToChecklist(checklist.id);
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            e.stopPropagation();
                            setAddingItemChecklistId(null);
                            setNewItemChecklistText('');
                          }
                        }}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Digite o novo item..."
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItemToChecklist(checklist.id);
                        }}
                        className="p-1 text-green-700 hover:bg-green-100 rounded"
                        title="Salvar novo item"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingItemChecklistId(null);
                          setNewItemChecklistText('');
                        }}
                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {checklist.items && checklist.items.length > 0 ? (
                    <>
                      <div className="flex justify-end">
                        <div className="grid grid-cols-2 gap-2 w-[220px] text-[10px] text-gray-500 font-medium text-center">
                          <span>Início</span>
                          <span>Final</span>
                        </div>
                      </div>
                      {checklist.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (editingItemId !== item.id) {
                            toggleItem(checklist.id, item.id, item.concluido);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (editingItemId === item.id) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleItem(checklist.id, item.id, item.concluido);
                          }
                        }}
                      >
                        <div className={`
                          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5
                          ${item.concluido
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 bg-white'
                          }
                        `}>
                          {item.concluido && <Check size={14} className="text-white" />}
                        </div>
                        {editingItemId === item.id ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingItemText}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditingItemText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  updateChecklistItemText(checklist.id, item.id);
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingItemId(null);
                                  setEditingItemText('');
                                }
                              }}
                              className="w-full border rounded px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateChecklistItemText(checklist.id, item.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Salvar item"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItemId(null);
                                setEditingItemText('');
                              }}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                              title="Cancelar ediçÍo"
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChecklistItem(checklist.id, item.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Excluir item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`
                                flex-1 text-sm
                                ${item.concluido
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-800'
                                }
                              `}>
                                {renderTextoComMencoes(item.texto)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItemId(item.id);
                                  setEditingItemText(item.texto);
                                }}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                title="Editar item"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteChecklistItem(checklist.id, item.id);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Excluir item"
                              >
                                <Trash2 size={12} />
                              </button>
                              {mencaoReconhecidaItemId === item.id && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                                  MençÍo reconhecida
                                </span>
                              )}
                            </div>
                            <div
                              className="grid grid-cols-2 gap-2 shrink-0 w-[220px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="date"
                                value={getDateDraft(item).data_inicio}
                                onChange={(e) =>
                                  setItemDateDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      data_inicio: e.target.value,
                                      data_fim: getDateDraft(item).data_fim,
                                    },
                                  }))
                                }
                                onBlur={() => persistDateDraftIfChanged(checklist.id, item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    persistDateDraftIfChanged(checklist.id, item);
                                  }
                                }}
                                className="w-full border rounded px-1.5 py-0 h-[20px] text-[10px] text-gray-700"
                              />
                              <input
                                type="date"
                                min={getDateDraft(item).data_inicio || undefined}
                                value={getDateDraft(item).data_fim}
                                onChange={(e) =>
                                  setItemDateDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      data_inicio: getDateDraft(item).data_inicio,
                                      data_fim: e.target.value,
                                    },
                                  }))
                                }
                                onBlur={() => persistDateDraftIfChanged(checklist.id, item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    persistDateDraftIfChanged(checklist.id, item);
                                  }
                                }}
                                className="w-full border rounded px-1.5 py-0 h-[20px] text-[10px] text-gray-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-4">
                      Nenhum item neste checklist
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-normal text-gray-800">Selecionar Template</h3>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum template disponível
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getNucleoColor(template.nucleo || 'geral')}`} />
                        <div>
                          <p className="font-medium text-gray-800">{template.nome}</p>
                          <p className="text-xs text-gray-500 capitalize">{template.nucleo}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTemplateSelector(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal - Colar texto para criar checklist */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-normal text-gray-800 flex items-center gap-2">
                  <ClipboardPaste size={20} className="text-green-600" />
                  Criar Checklist Rápido
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cole ou digite os itens - cada linha será um item do checklist
                </p>
              </div>
              <button
                type="button"
                title="Fechar"
                onClick={() => {
                  setShowQuickAdd(false);
                  setQuickAddText('');
                  setQuickAddName('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Nome do checklist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Checklist (opcional)
                </label>
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder={`Checklist ${new Date().toLocaleDateString('pt-BR')}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Área de texto para colar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Itens do Checklist
                </label>
                <textarea
                  ref={textareaRef}
                  value={quickAddText}
                  onChange={(e) => setQuickAddText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Cole aqui sua lista de tarefas...&#10;&#10;Exemplo:&#10;Verificar medidas do ambiente&#10;Confirmar cores com cliente&#10;Solicitar aprovaçÍo do projeto"
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                />
                {quickAddText && (
                  <p className="text-sm text-gray-500 mt-1">
                    {contarItens()} item(s) será(Ío) criado(s)
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowQuickAdd(false);
                  setQuickAddText('');
                  setQuickAddName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={creatingChecklist}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={criarChecklistRapido}
                disabled={creatingChecklist || !quickAddText.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creatingChecklist ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Criando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Criar Checklist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


