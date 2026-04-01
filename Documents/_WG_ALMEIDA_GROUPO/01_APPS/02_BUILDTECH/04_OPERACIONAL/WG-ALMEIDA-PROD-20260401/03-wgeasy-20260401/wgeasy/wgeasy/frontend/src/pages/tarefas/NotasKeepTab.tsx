// src/pages/tarefas/NotasKeepTab.tsx
// Espaço de Notas estilo Google Keep — categorias + cards colapsáveis
import { supabase } from '@/lib/supabaseClient'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  FileText as StickyNote,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface CategoriaKeep {
  id: string
  nome: string
  cor: string
}

interface NotaKeep {
  id: string
  titulo: string
  conteudo: string
  categoriaId: string | null
  cor: string
  collapsed: boolean
  criadoEm: string
}

const CORES = [
  { value: '#fef3c7', label: 'Amarelo' },
  { value: '#dbeafe', label: 'Azul' },
  { value: '#dcfce7', label: 'Verde' },
  { value: '#fce7f3', label: 'Rosa' },
  { value: '#f3e8ff', label: 'Roxo' },
  { value: '#fed7aa', label: 'Laranja' },
  { value: '#e5e7eb', label: 'Cinza' },
  { value: '#ffffff', label: 'Branco' },
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function NotasKeepTab() {
  const [categorias, setCategorias] = useState<CategoriaKeep[]>([])
  const [notas, setNotas] = useState<NotaKeep[]>([])

  // --- form nota ---
  const [showFormNota, setShowFormNota] = useState(false)
  const [novaTitulo, setNovaTitulo] = useState('')
  const [novaConteudo, setNovaConteudo] = useState('')
  const [novaCatId, setNovaCatId] = useState<string | null>(null)
  const [novaCor, setNovaCor] = useState(CORES[0].value)

  // --- form categoria ---
  const [showFormCat, setShowFormCat] = useState(false)
  const [nomeCat, setNomeCat] = useState('')
  const [corCat, setCorCat] = useState(CORES[1].value)

  // --- ediçÍo inline de nota ---
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitulo, setEditingTitulo] = useState('')
  const [editingConteudo, setEditingConteudo] = useState('')
  // ---- Supabase ----
  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase.from('notas_keep_categorias').select('*').order('nome')
      setCategorias(cats || [])
      const { data: nts } = await supabase
        .from('notas_keep')
        .select('*')
        .order('criadoEm', { ascending: false })
      setNotas(nts || [])
    }
    fetchData()
  }, [])
  async function addCategoria() {
    if (!nomeCat.trim()) return
    const { data } = await supabase
      .from('notas_keep_categorias')
      .insert({ id: uid(), nome: nomeCat.trim(), cor: corCat })
      .select()
    setCategorias((p) => [...p, ...(data || [])])
    setNomeCat('')
    setShowFormCat(false)
  }
  async function deletarCategoria(id: string) {
    if (!confirm('Excluir categoria e todas as notas dela?')) return
    await supabase.from('notas_keep_categorias').delete().eq('id', id)
    await supabase.from('notas_keep').delete().eq('categoriaId', id)
    setCategorias((p) => p.filter((c) => c.id !== id))
    setNotas((p) => p.filter((n) => n.categoriaId !== id))
  }

  async function addNota() {
    if (!novaTitulo.trim()) return
    const nota = {
      id: uid(),
      titulo: novaTitulo.trim(),
      conteudo: novaConteudo.trim(),
      categoriaId: novaCatId,
      cor: novaCor,
      collapsed: false,
      criadoEm: new Date().toISOString(),
    }
    const { data } = await supabase.from('notas_keep').insert(nota).select()
    setNotas((p) => [...(data || []), ...p])
    setNovaTitulo('')
    setNovaConteudo('')
    setNovaCatId(null)
    setNovaCor(CORES[0].value)
    setShowFormNota(false)
  }

  async function toggleCollapse(id: string) {
    const nota = notas.find((n) => n.id === id)
    if (!nota) return
    await supabase.from('notas_keep').update({ collapsed: !nota.collapsed }).eq('id', id)
    setNotas((p) => p.map((n) => (n.id === id ? { ...n, collapsed: !n.collapsed } : n)))
  }

  async function deletarNota(id: string) {
    if (!confirm('Excluir esta nota?')) return
    await supabase.from('notas_keep').delete().eq('id', id)
    setNotas((p) => p.filter((n) => n.id !== id))
  }

  function iniciarEdicao(nota: NotaKeep) {
    setEditingId(nota.id)
    setEditingTitulo(nota.titulo)
    setEditingConteudo(nota.conteudo)
  }

  async function salvarEdicao(id: string) {
    if (!editingTitulo.trim()) return
    await supabase
      .from('notas_keep')
      .update({ titulo: editingTitulo.trim(), conteudo: editingConteudo.trim() })
      .eq('id', id)
    setNotas((p) =>
      p.map((n) =>
        n.id === id ? { ...n, titulo: editingTitulo.trim(), conteudo: editingConteudo.trim() } : n
      )
    )
    setEditingId(null)
  }

  // ============================================================
  // AGRUPAMENTO
  // ============================================================

  const notasSemCat = notas.filter((n) => !n.categoriaId)
  const grupos = categorias.map((cat) => ({
    cat,
    notas: notas.filter((n) => n.categoriaId === cat.id),
  }))

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* --- Barra de ações --- */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFormNota(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
        >
          <Plus size={15} />
          Nova Nota
        </button>
        <button
          onClick={() => setShowFormCat(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
        >
          <Tag size={15} />
          Nova Categoria
        </button>
      </div>

      {/* --- Form nova nota --- */}
      {showFormNota && (
        <div className="bg-white border rounded-xl p-4 shadow-lg space-y-3 max-w-sm">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Nova Nota</span>
            <button
              onClick={() => setShowFormNota(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <input
            autoFocus
            placeholder="Título *"
            value={novaTitulo}
            onChange={(e) => setNovaTitulo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNota()}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <textarea
            placeholder="Conteúdo da nota..."
            value={novaConteudo}
            onChange={(e) => setNovaConteudo(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />

          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={novaCatId || ''}
              onChange={(e) => setNovaCatId(e.target.value || null)}
              className="border rounded-lg px-2 py-1.5 text-xs flex-1 focus:outline-none"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            {/* Paleta de cores */}
            <div className="flex gap-1 items-center">
              {CORES.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setNovaCor(c.value)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    novaCor === c.value ? 'border-gray-600 scale-125' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowFormNota(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={addNota}
              disabled={!novaTitulo.trim()}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* --- Form nova categoria --- */}
      {showFormCat && (
        <div className="bg-white border rounded-xl p-4 shadow-lg space-y-3 max-w-xs">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Nova Categoria</span>
            <button
              onClick={() => setShowFormCat(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
          <input
            autoFocus
            placeholder="Nome da categoria *"
            value={nomeCat}
            onChange={(e) => setNomeCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategoria()}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-1 items-center">
            {CORES.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => setCorCat(c.value)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  corCat === c.value ? 'border-gray-600 scale-125' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowFormCat(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={addCategoria}
              disabled={!nomeCat.trim()}
              className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>
      )}

      {/* --- Grupos por categoria --- */}
      {grupos.map(({ cat, notas: notasCat }) => (
        <section key={cat.id}>
          {/* Header da categoria */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.cor }}
            />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {cat.nome}
            </h3>
            <span className="text-xs text-gray-400">({notasCat.length})</span>
            <div className="flex-1 h-px bg-gray-100 ml-1" />
            <button
              onClick={() => deletarCategoria(cat.id)}
              className="text-gray-300 hover:text-red-400 transition-colors"
              title="Excluir categoria"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {notasCat.length === 0 ? (
            <p className="text-xs text-gray-400 pl-5 mb-4 italic">Nenhuma nota nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {notasCat.map((nota) => (
                <NoteCard
                  key={nota.id}
                  nota={nota}
                  isEditing={editingId === nota.id}
                  editingTitulo={editingTitulo}
                  editingConteudo={editingConteudo}
                  onToggle={toggleCollapse}
                  onDelete={deletarNota}
                  onEdit={iniciarEdicao}
                  onSaveEdit={salvarEdicao}
                  onCancelEdit={() => setEditingId(null)}
                  onChangeTitulo={setEditingTitulo}
                  onChangeConteudo={setEditingConteudo}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {/* --- Notas sem categoria --- */}
      {notasSemCat.length > 0 && (
        <section>
          {categorias.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Sem Categoria
              </h3>
              <span className="text-xs text-gray-400">({notasSemCat.length})</span>
              <div className="flex-1 h-px bg-gray-100 ml-1" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {notasSemCat.map((nota) => (
              <NoteCard
                key={nota.id}
                nota={nota}
                isEditing={editingId === nota.id}
                editingTitulo={editingTitulo}
                editingConteudo={editingConteudo}
                onToggle={toggleCollapse}
                onDelete={deletarNota}
                onEdit={iniciarEdicao}
                onSaveEdit={salvarEdicao}
                onCancelEdit={() => setEditingId(null)}
                onChangeTitulo={setEditingTitulo}
                onChangeConteudo={setEditingConteudo}
              />
            ))}
          </div>
        </section>
      )}

      {/* --- Empty state --- */}
      {notas.length === 0 && !showFormNota && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <StickyNote size={42} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm mb-1 font-medium">Nenhuma nota ainda</p>
          <p className="text-gray-400 text-xs mb-4">
            Crie categorias e adicione notas estilo Google Keep
          </p>
          <button
            onClick={() => setShowFormNota(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm"
          >
            Criar Primeira Nota
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CARD DE NOTA
// ============================================================

interface NoteCardProps {
  nota: NotaKeep
  isEditing: boolean
  editingTitulo: string
  editingConteudo: string
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (nota: NotaKeep) => void
  onSaveEdit: (id: string) => void
  onCancelEdit: () => void
  onChangeTitulo: (v: string) => void
  onChangeConteudo: (v: string) => void
}

function NoteCard({
  nota,
  isEditing,
  editingTitulo,
  editingConteudo,
  onToggle,
  onDelete,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeTitulo,
  onChangeConteudo,
}: NoteCardProps) {
  return (
    <div
      className="rounded-xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md"
      style={{ backgroundColor: nota.cor, borderColor: `${nota.cor}aa` }}
    >
      {/* Header — sempre visível, clique colapsa/expande */}
      {isEditing ? (
        <div className="px-3 pt-3 pb-1">
          <input
            autoFocus
            value={editingTitulo}
            onChange={(e) => onChangeTitulo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(nota.id)}
            className="w-full bg-white/70 border border-white rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-orange-400"
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none group"
          onClick={() => onToggle(nota.id)}
        >
          <span className="text-sm font-semibold text-gray-800 truncate flex-1 pr-1">
            {nota.titulo}
          </span>
          {nota.collapsed ? (
            <ChevronDown size={14} className="text-gray-500 shrink-0" />
          ) : (
            <ChevronUp size={14} className="text-gray-500 shrink-0" />
          )}
        </div>
      )}

      {/* Conteúdo — visível quando expandido */}
      {!nota.collapsed && (
        <>
          <div className="h-px bg-black/10 mx-3" />
          <div className="px-3 py-2">
            {isEditing ? (
              <textarea
                value={editingConteudo}
                onChange={(e) => onChangeConteudo(e.target.value)}
                rows={3}
                className="w-full bg-white/70 border border-white rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            ) : (
              <p className="text-xs text-gray-700 whitespace-pre-wrap min-h-[1rem]">
                {nota.conteudo || <span className="italic text-gray-400">Sem conteúdo</span>}
              </p>
            )}
          </div>

          {/* Rodapé com ações */}
          <div className="flex items-center justify-end gap-1 px-3 pb-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => onSaveEdit(nota.id)}
                  className="p-1 text-green-700 hover:bg-green-100 rounded transition-colors"
                  title="Salvar"
                >
                  <Check size={13} />
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                  title="Cancelar"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(nota)
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
                  title="Editar"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(nota.id)
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

