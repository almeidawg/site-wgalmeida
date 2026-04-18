import CoverPage from '@/components/moodboard-generator/CoverPage'
import EnvironmentPage from '@/components/moodboard-generator/EnvironmentPage'
import MaterialPage from '@/components/moodboard-generator/MaterialPage'
import SEO from '@/components/SEO'
import ResponsiveWebpImage from '@/components/ResponsiveWebpImage'
import { getStyleImageUrl } from '@/data/styleImageManifest'
import { ENVIRONMENT_DATA, MATERIAL_DATA, PAGE_SIZES } from '@/lib/moodboard-constants'
import { exportToPDF, preloadImages } from '@/lib/moodboard-pdf'
import { motion } from '@/lib/motion-lite'
import { buildImageQuery, searchUnsplashImages } from '@/lib/unsplash'
import { styleCatalog } from '@/utils/styleCatalog'
import { buildMoodboardShareUrl } from '@/utils/moodboardShare'
import { buildStyleEditorialSearchPlan } from '@/lib/styleEditorialSearchProfile'
import {
  ArrowLeft,
  Briefcase,
  Check,
  Download,
  Eye,
  ImagePlus,
  Loader2,
  Palette,
  RefreshCcw,
  Sparkles,
  SwatchBook,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const STYLE_MATERIAL_PRESETS = {
  minimalismo: ['paleta-neutra', 'paineis-madeira', 'tecidos', 'revestimentos-naturais'],
  contemporaneo: ['paleta-neutra', 'paleta-pedras', 'acabamentos-premium', 'iluminacao-decorativa'],
  industrial: ['materiais-metalicos', 'revestimentos-naturais', 'acabamentos-premium', 'objetos-decorativos'],
  escandinavo: ['paleta-neutra', 'paineis-madeira', 'tecidos', 'tapetes-texturas'],
  japandi: ['paleta-neutra', 'paineis-madeira', 'tecidos', 'objetos-decorativos'],
  boho: ['paleta-terrosa', 'tecidos', 'tapetes-texturas', 'objetos-decorativos'],
  coastal: ['paleta-fria', 'tecidos', 'paineis-madeira', 'objetos-decorativos'],
  'mid-century': ['paineis-madeira', 'materiais-metalicos', 'tapetes-texturas', 'iluminacao-decorativa'],
  'art-deco': ['paleta-pedras', 'materiais-metalicos', 'acabamentos-premium', 'iluminacao-decorativa'],
  classico: ['paleta-neutra', 'paleta-pedras', 'tecidos', 'acabamentos-premium'],
  moderno: ['paleta-neutra', 'materiais-metalicos', 'revestimentos-naturais', 'iluminacao-decorativa'],
  rustico: ['paleta-terrosa', 'paineis-madeira', 'tecidos', 'revestimentos-naturais'],
  farmhouse: ['paleta-neutra', 'paineis-madeira', 'tecidos', 'objetos-decorativos'],
  ecletico: ['paleta-terrosa', 'tecidos', 'objetos-decorativos', 'tapetes-texturas'],
  maximalista: ['paleta-terrosa', 'tecidos', 'materiais-metalicos', 'objetos-decorativos'],
  tropical: ['paleta-fria', 'paleta-terrosa', 'tecidos', 'objetos-decorativos'],
  'wabi-sabi': ['paleta-neutra', 'revestimentos-naturais', 'tecidos', 'objetos-decorativos'],
}

const STYLE_ENVIRONMENT_PRESETS = {
  minimalismo: ['sala-estar-minimalista', 'quarto-moderno', 'banheiro-contemporaneo', 'home-office'],
  contemporaneo: ['sala-estar-contemporaneo', 'quarto-master', 'cozinha-gourmet', 'banheiro-contemporaneo'],
  industrial: ['cozinha-industrial', 'home-office', 'lavabo-statement', 'hall-entrada'],
  escandinavo: ['sala-estar-minimalista', 'quarto-moderno', 'quarto-infantil', 'home-office'],
  japandi: ['sala-estar-minimalista', 'quarto-master', 'banheiro-spa', 'hall-entrada'],
  boho: ['sala-estar-contemporaneo', 'quarto-master', 'varanda-gourmet', 'lavabo-statement'],
  coastal: ['sala-estar-contemporaneo', 'quarto-master', 'varanda-gourmet', 'banheiro-spa'],
  'art-deco': ['lavabo-statement', 'hall-entrada', 'sala-estar-classico', 'quarto-master'],
  classico: ['sala-estar-classico', 'cozinha-classica', 'quarto-master', 'hall-entrada'],
  moderno: ['sala-estar-contemporaneo', 'cozinha-gourmet', 'banheiro-contemporaneo', 'walk-in-closet'],
  rustico: ['area-gourmet', 'varanda-gourmet', 'cozinha-classica', 'sala-estar-classico'],
  tropical: ['area-gourmet', 'varanda-gourmet', 'piscina-resort', 'sala-estar-contemporaneo'],
}

const CATEGORY_FALLBACK_MATERIALS = {
  contemporaneo: ['paleta-neutra', 'acabamentos-premium', 'revestimentos-naturais'],
  tradicional: ['paleta-pedras', 'tecidos', 'acabamentos-premium'],
  ecletico: ['paleta-terrosa', 'objetos-decorativos', 'tapetes-texturas'],
}

const CATEGORY_FALLBACK_ENVIRONMENTS = {
  contemporaneo: ['sala-estar-contemporaneo', 'cozinha-gourmet', 'banheiro-contemporaneo'],
  tradicional: ['sala-estar-classico', 'quarto-master', 'hall-entrada'],
  ecletico: ['lavabo-statement', 'varanda-gourmet', 'sala-estar-contemporaneo'],
}

const uniq = (items) => [...new Set(items)]

const getSuggestedMaterialIds = (styleEntry) => {
  if (!styleEntry) return []
  return uniq(
    STYLE_MATERIAL_PRESETS[styleEntry.slug] ||
      CATEGORY_FALLBACK_MATERIALS[styleEntry.category] ||
      ['paleta-neutra', 'tecidos', 'revestimentos-naturais']
  ).filter((id) => MATERIAL_DATA[id])
}

const getSuggestedEnvironmentIds = (styleEntry) => {
  if (!styleEntry) return []
  return uniq(
    STYLE_ENVIRONMENT_PRESETS[styleEntry.slug] ||
      CATEGORY_FALLBACK_ENVIRONMENTS[styleEntry.category] ||
      ['sala-estar-contemporaneo', 'quarto-master', 'cozinha-gourmet']
  ).filter((id) => ENVIRONMENT_DATA[id])
}

const getRelatedStyles = (styleEntry) => {
  if (!styleEntry) return styleCatalog.slice(0, 8)

  const sameCategory = styleCatalog.filter(
    (entry) => entry.slug !== styleEntry.slug && entry.category === styleEntry.category
  )
  const sharedTags = styleCatalog.filter(
    (entry) =>
      entry.slug !== styleEntry.slug &&
      entry.category !== styleEntry.category &&
      entry.tags.some((tag) => styleEntry.tags.includes(tag))
  )

  return uniq([...sameCategory, ...sharedTags]).slice(0, 6)
}

const sanitizeSlug = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildEnvironmentReason = (styleTitle, environmentTitle) =>
  `Usar ${environmentTitle.toLowerCase()} como leitura principal do estilo ${styleTitle}, priorizando atmosfera, proporcao e consistencia visual.`

const buildMaterialReason = (styleTitle, materialTitle) =>
  `Selecionar referencias de ${materialTitle.toLowerCase()} para traduzir o estilo ${styleTitle} em textura, acabamento e percepcao de qualidade.`

const getPhotoLabel = (photo, fallback) =>
  photo?.alt_description || photo?.description || fallback

const StyleSelectionCard = ({ style, selected, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(style)}
    className={`group overflow-hidden rounded-[1.7rem] border text-left transition-all duration-300 ${
      selected
        ? 'border-wg-orange shadow-[0_22px_60px_rgba(242,92,38,0.18)]'
        : 'border-black/5 bg-white hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(30,24,20,0.08)]'
    }`}
  >
    <div className="relative h-56 overflow-hidden">
      <ResponsiveWebpImage
        src={getStyleImageUrl({ slug: style.slug, variant: 'card' }) || style.image}
        alt={style.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
      <div className="absolute left-4 top-4 flex gap-2">
        {style.colors.slice(0, 4).map((color) => (
          <span
            key={`${style.slug}-${color}`}
            className="h-7 w-7 rounded-full border border-white/70 shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {selected && (
        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-wg-orange px-3 py-1.5 text-xs text-white">
          <Check className="h-3.5 w-3.5" />
          Selecionado
        </div>
      )}
    </div>
    <div className="space-y-3 p-5">
      <div>
        <h3 className="text-lg text-gray-900">{style.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{style.excerpt}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {style.tags.slice(0, 3).map((tag) => (
          <span key={`${style.slug}-${tag}`} className="rounded-full bg-black/5 px-3 py-1 text-xs text-gray-600">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  </button>
)

const SelectionChip = ({ active, onClick, title, description, accent = 'orange' }) => {
  const accentClass = {
    orange: active ? 'border-wg-orange bg-wg-orange/5 text-wg-black' : 'border-black/8 bg-white text-gray-700',
    dark: active ? 'border-wg-black bg-black text-white' : 'border-black/8 bg-white text-gray-700',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${accentClass[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm">{title}</p>
          <p className={`mt-1 text-xs leading-relaxed ${active ? 'text-current opacity-80' : 'text-gray-500'}`}>{description}</p>
        </div>
        {active && <Check className="h-4 w-4 flex-shrink-0" />}
      </div>
    </button>
  )
}

export default function MoodboardGenerator() {
  const [clientName, setClientName] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedStyleSlug, setSelectedStyleSlug] = useState('')
  const [selectedEnvironments, setSelectedEnvironments] = useState([])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [colorPalette, setColorPalette] = useState(['#F25C26', '#2C5F6F', '#1A3A52', '#8B5A3C'])
  const [pageSize, setPageSize] = useState('MOBILE_PORTRAIT')
  const [orientation, setOrientation] = useState('portrait')
  const [customColor, setCustomColor] = useState('#F25C26')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedGuide, setGeneratedGuide] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [progress, setProgress] = useState(0)
  const [liveReferences, setLiveReferences] = useState([])
  const [isLoadingReferences, setIsLoadingReferences] = useState(false)
  const [referencesError, setReferencesError] = useState('')
  const [selectedReferenceId, setSelectedReferenceId] = useState('')

  const pagesRef = useRef([])

  const selectedStyleEntry =
    styleCatalog.find((style) => style.slug === selectedStyleSlug) ||
    styleCatalog.find((style) => style.title === selectedStyle)

  const relatedStyles = getRelatedStyles(selectedStyleEntry)
  const suggestedMaterials = getSuggestedMaterialIds(selectedStyleEntry)
  const suggestedEnvironments = getSuggestedEnvironmentIds(selectedStyleEntry)

  const applyStyleSelection = (style) => {
    const nextPalette = style.colors?.length ? style.colors.slice(0, 5) : colorPalette

    setSelectedStyle(style.title)
    setSelectedStyleSlug(style.slug)
    setColorPalette(nextPalette)
    setCustomColor(nextPalette[0] || '#F25C26')
    setSelectedMaterials((prev) => uniq([...getSuggestedMaterialIds(style), ...prev]))
    setSelectedEnvironments((prev) => uniq([...getSuggestedEnvironmentIds(style), ...prev]))
  }

  const loadLiveReferences = async (styleEntry) => {
    if (!styleEntry) {
      setLiveReferences([])
      setSelectedReferenceId('')
      return
    }

    const searchPlan = buildStyleEditorialSearchPlan(styleEntry)
    const queries = uniq([searchPlan.mainQuery, ...(searchPlan.searchTerms || [])]).slice(0, 4)

    setIsLoadingReferences(true)
    setReferencesError('')

    try {
      const batches = await Promise.all(
        queries.map((query) =>
          searchUnsplashImages({
            query,
            orientation: 'landscape',
            perPage: 2,
          })
        )
      )

      const flattened = batches
        .flat()
        .filter(Boolean)
        .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 8)

      setLiveReferences(flattened)
      setSelectedReferenceId(flattened[0]?.id || '')
      if (!flattened.length) {
        setReferencesError('Nao encontramos referencias vivas agora. A base fixa de estilos continua disponivel.')
      }
    } catch (error) {
      console.error('Erro ao carregar referencias vivas:', error)
      setReferencesError('Nao foi possivel carregar referencias vivas agora.')
      setLiveReferences([])
      setSelectedReferenceId('')
    } finally {
      setIsLoadingReferences(false)
    }
  }

  useEffect(() => {
    if (!selectedStyleEntry) {
      setLiveReferences([])
      setSelectedReferenceId('')
      return
    }

    loadLiveReferences(selectedStyleEntry)
  }, [selectedStyleSlug, selectedStyle])

  const toggleEnvironment = (env) => {
    setSelectedEnvironments((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    )
  }

  const toggleMaterial = (mat) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    )
  }

  const addColorToPalette = () => {
    if (!colorPalette.includes(customColor)) {
      setColorPalette([...colorPalette, customColor])
    }
  }

  const removeColor = (color) => {
    setColorPalette(colorPalette.filter((c) => c !== color))
  }

  const fetchGuideAssets = async () => {
    const totalItems = selectedEnvironments.length + selectedMaterials.length + 1
    let completed = 0

    const guide = {
      kind: 'style-guide',
      slug: `guia-${sanitizeSlug(clientName)}-${sanitizeSlug(selectedStyleEntry?.slug || selectedStyle)}`,
      clientName,
      styleTitle: selectedStyle,
      styleSlug: selectedStyleEntry?.slug || '',
      styleDescription: selectedStyleEntry?.excerpt || '',
      styleTags: selectedStyleEntry?.tags || [],
      colorPalette,
      createdAt: new Date().toISOString(),
      cover: null,
      environments: [],
      materials: [],
      ctaUrl: '/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard',
    }

    try {
      const selectedReference = liveReferences.find((reference) => reference.id === selectedReferenceId)

      if (selectedReference?.urls?.regular) {
        guide.cover = {
          imageUrl: selectedReference.urls.regular,
          title: selectedStyle,
          caption: getPhotoLabel(selectedReference, `Referencia principal para ${selectedStyle}`),
          photographer: selectedReference.photographer || selectedReference.user?.name || '',
          profileUrl: selectedReference.profileUrl || selectedReference.user?.links?.html || '',
          unsplashPage: selectedReference.unsplashPage || '',
        }
      } else {
        const [coverPhoto] = await searchUnsplashImages({
          query: `${selectedStyle} interior design editorial residential premium`,
          orientation: 'landscape',
          perPage: 1,
        })

        if (coverPhoto?.urls?.regular) {
          guide.cover = {
            imageUrl: coverPhoto.urls.regular,
            title: selectedStyle,
            caption: getPhotoLabel(coverPhoto, `Referencia principal para ${selectedStyle}`),
            photographer: coverPhoto.photographer || coverPhoto.user?.name || '',
            profileUrl: coverPhoto.profileUrl || coverPhoto.user?.links?.html || '',
            unsplashPage: coverPhoto.unsplashPage || '',
          }
        }
      }

      completed++
      setProgress(Math.round((completed / totalItems) * 100))

      for (const env of selectedEnvironments) {
        const envData = ENVIRONMENT_DATA[env]
        const query = buildImageQuery(selectedStyle, envData.searchQuery, colorPalette)
        const [photo] = await searchUnsplashImages({
          query,
          orientation: 'landscape',
          perPage: 1,
        })

        if (photo?.urls?.regular) {
          guide.environments.push({
            id: env,
            title: envData.title,
            description: envData.description,
            rationale: buildEnvironmentReason(selectedStyle, envData.title),
            query,
            imageUrl: photo.urls.regular,
            caption: getPhotoLabel(photo, `${envData.title} para ${selectedStyle}`),
            photographer: photo.photographer || photo.user?.name || '',
            profileUrl: photo.profileUrl || photo.user?.links?.html || '',
            unsplashPage: photo.unsplashPage || '',
          })
        }

        completed++
        setProgress(Math.round((completed / totalItems) * 100))
        await new Promise((resolve) => setTimeout(resolve, 220))
      }

      for (const mat of selectedMaterials) {
        const matData = MATERIAL_DATA[mat]
        const query = `${selectedStyle} ${matData.searchQuery} detail shot interior`
        const results = await searchUnsplashImages({
          query,
          orientation: 'squarish',
          perPage: 4,
        })

        if (results.length > 0) {
          guide.materials.push({
            id: mat,
            title: matData.title,
            description: matData.description,
            rationale: buildMaterialReason(selectedStyle, matData.title),
            query,
            images: results.slice(0, 4).map((photo) => ({
              imageUrl: photo.urls.regular,
              caption: getPhotoLabel(photo, `${matData.title} - detalhe`),
              photographer: photo.photographer || photo.user?.name || '',
              profileUrl: photo.profileUrl || photo.user?.links?.html || '',
              unsplashPage: photo.unsplashPage || '',
            })),
          })
        }

        completed++
        setProgress(Math.round((completed / totalItems) * 100))
        await new Promise((resolve) => setTimeout(resolve, 220))
      }
    } catch (error) {
      console.error('Error fetching guide assets:', error)
    }

    return guide
  }

  const handleGenerate = async () => {
    if (!clientName || !selectedStyle) {
      alert('Preencha o nome do cliente e selecione um estilo por imagem.')
      return
    }

    if (selectedEnvironments.length === 0 && selectedMaterials.length === 0) {
      alert('Selecione pelo menos um ambiente ou uma camada de materiais para montar o documento.')
      return
    }

    setIsGenerating(true)
    setProgress(0)

    const guide = await fetchGuideAssets()
    setGeneratedGuide(guide)

    const allImageUrls = [
      guide?.cover?.imageUrl,
      ...(guide?.environments || []).map((entry) => entry.imageUrl),
      ...(guide?.materials || []).flatMap((entry) => entry.images.map((image) => image.imageUrl)),
    ].filter(Boolean)
    await preloadImages(allImageUrls)

    setProgress(100)
    setIsGenerating(false)
    setShowPreview(true)
  }

  const handleExportPDF = async () => {
    if (pagesRef.current.length === 0) {
      alert('Nenhuma página para exportar.')
      return
    }

    const selectedPageSize = PAGE_SIZES[pageSize]
    const fileName = `moodboard-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`

    await exportToPDF(pagesRef.current, {
      pageSize: selectedPageSize,
      orientation,
      quality: 0.95,
      fileName,
    })
  }

  const handleOpenPublicGuide = () => {
    if (!generatedGuide) {
      alert('Gere a apresentacao antes de abrir a pagina publica.')
      return
    }

    const url = buildMoodboardShareUrl(generatedGuide)
    if (!url) {
      alert('Nao foi possivel montar a pagina publica agora.')
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        pathname="/moodboard-generator"
        title="Sistema de Moodboard Profissional | WG Almeida"
        description="Escolha estilos por imagem, abra paletas, tecidos, revestimentos e acabamentos, e gere um documento visual pronto para briefing e decisão."
        keywords="moodboard profissional, descoberta de estilo por imagem, briefing visual, paleta cores ambientes, tecidos revestimentos acabamentos"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!showPreview ? (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
                Add-on estratégico para projetos e pré-venda
              </div>
              <h1 className="mb-2 text-4xl font-light text-gray-900">
                Sistema de moodboard profissional
              </h1>
              <p className="mb-8 max-w-4xl text-lg text-gray-600">
                O cliente não precisa saber o nome do estilo. Primeiro ele reage ao que vê,
                depois o sistema abre caminhos próximos, paletas, tecidos, revestimentos,
                acabamentos e peças decorativas para formar um documento visual mais claro.
              </p>
            </motion.div>

            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  icon: Eye,
                  title: 'Escolha visual primeiro',
                  text: 'A jornada começa por imagem, não por nome técnico de estilo.',
                },
                {
                  icon: Users,
                  title: 'Abre caminhos relacionados',
                  text: 'Depois da reação inicial, mostramos estilos próximos e combinações coerentes.',
                },
                {
                  icon: Briefcase,
                  title: 'Documento pronto para uso',
                  text: 'A saída vira material para briefing, venda consultiva, projeto e aprovação.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-wg-orange/10 text-wg-orange">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-lg text-gray-900">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                to="/solicite-proposta?service=Sistema%20de%20Experi%C3%AAncia%20Visual&context=moodboard"
                className="inline-flex items-center gap-2 rounded-full bg-wg-black px-6 py-3 text-sm text-white transition-colors hover:bg-wg-black/92"
              >
                Estruturar como add-on
              </Link>
              <Link
                to="/revista-estilos"
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm text-wg-black transition-colors hover:bg-black/[0.03]"
              >
                Ver guia de estilos
              </Link>
            </div>

            <div className="space-y-8 rounded-[2rem] bg-white p-8 shadow-lg">
              <div>
                <label className="mb-2 block text-sm text-gray-700">Nome do Cliente *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-wg-orange"
                />
              </div>

              <section className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wg-orange/10 text-wg-orange">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl text-gray-900">1. Escolha o que parece certo</h2>
                    <p className="text-sm text-gray-600">
                      Selecione pela imagem. O sistema assume o estilo dominante e abre os próximos blocos.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {styleCatalog.slice(0, 12).map((style) => (
                    <StyleSelectionCard
                      key={style.slug}
                      style={style}
                      selected={selectedStyleSlug === style.slug}
                      onSelect={applyStyleSelection}
                    />
                  ))}
                </div>
              </section>

              {selectedStyleEntry && (
                <>
                  <section className="rounded-[1.7rem] border border-black/5 bg-gray-50 p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-gray-500">Estilo identificado</p>
                        <h3 className="text-2xl text-gray-900">{selectedStyleEntry.title}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
                          {selectedStyleEntry.excerpt}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedStyleEntry.tags.map((tag) => (
                            <span key={`${selectedStyleEntry.slug}-${tag}`} className="rounded-full bg-white px-3 py-1 text-xs text-gray-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Paleta inicial inferida</p>
                        <div className="flex flex-wrap gap-3">
                          {colorPalette.map((color) => (
                            <div key={`${selectedStyleEntry.slug}-${color}`} className="text-center">
                              <div
                                className="mx-auto h-14 w-14 rounded-2xl border border-black/5 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="mt-2 block text-[11px] uppercase tracking-[0.14em] text-gray-500">
                                {color}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                        <SwatchBook className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl text-gray-900">2. Refinar caminhos próximos</h2>
                        <p className="text-sm text-gray-600">
                          Se o cliente gostou “mais ou menos”, usamos estilos vizinhos para refinar sem exigir nomenclatura técnica.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {relatedStyles.map((style) => (
                        <StyleSelectionCard
                          key={style.slug}
                          style={style}
                          selected={selectedStyleSlug === style.slug}
                          onSelect={applyStyleSelection}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl text-gray-900">2A. Referencias vivas com Unsplash</h2>
                          <p className="text-sm text-gray-600">
                            Esta camada usa a mesma logica editorial do admin para abrir referencias proximas ao estilo escolhido.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadLiveReferences(selectedStyleEntry)}
                        disabled={isLoadingReferences}
                        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-wg-black transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoadingReferences ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                        Atualizar referencias
                      </button>
                    </div>

                    {referencesError && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {referencesError}
                      </div>
                    )}

                    {isLoadingReferences ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white">
                            <div className="h-44 animate-pulse bg-gray-200" />
                            <div className="space-y-3 p-4">
                              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {liveReferences.map((reference) => {
                          const selected = selectedReferenceId === reference.id
                          return (
                            <button
                              type="button"
                              key={reference.id}
                              onClick={() => setSelectedReferenceId(reference.id)}
                              className={`overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 ${
                                selected
                                  ? 'border-wg-orange shadow-[0_18px_48px_rgba(242,92,38,0.16)]'
                                  : 'border-black/5 bg-white hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(30,24,20,0.08)]'
                              }`}
                            >
                              <div className="relative h-44 overflow-hidden">
                                <img
                                  src={reference.urls.regular}
                                  alt={reference.alt_description || selectedStyleEntry.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                                {selected && (
                                  <div className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-wg-orange px-3 py-1 text-xs text-white">
                                    <Check className="h-3.5 w-3.5" />
                                    Base escolhida
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 p-4">
                                <p className="line-clamp-2 text-sm leading-relaxed text-gray-700">
                                  {reference.alt_description || `Referencia visual para ${selectedStyleEntry.title}`}
                                </p>
                                <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                                  Foto base para capa e direcao visual
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wg-orange/10 text-wg-orange">
                        <Palette className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl text-gray-900">3. Paleta, tecidos e acabamentos</h2>
                        <p className="text-sm text-gray-600">
                          Abrimos as camadas que ajudam a montar o documento final e orientar a busca automática no Unsplash.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-black/5 bg-white p-5">
                      <div className="mb-4 flex flex-wrap items-center gap-4">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          className="h-11 w-16 cursor-pointer rounded"
                        />
                        <button
                          type="button"
                          onClick={addColorToPalette}
                          className="rounded-lg bg-wg-orange px-4 py-2 text-white transition-colors hover:bg-orange-600"
                        >
                          Adicionar cor
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {colorPalette.map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => removeColor(color)}
                            className="relative h-14 w-14 rounded-2xl border border-black/5 shadow-sm transition-transform hover:scale-105"
                            style={{ backgroundColor: color }}
                            title={`Remover ${color}`}
                          >
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                              ×
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm text-gray-700">Camadas sugeridas para este estilo</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(MATERIAL_DATA).map(([id, material]) => (
                          <SelectionChip
                            key={id}
                            active={selectedMaterials.includes(id)}
                            onClick={() => toggleMaterial(id)}
                            title={material.title}
                            description={material.description}
                            accent={suggestedMaterials.includes(id) ? 'orange' : 'dark'}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-xl text-gray-900">4. Ambientes para compor o documento</h2>
                        <p className="text-sm text-gray-600">
                          Escolhemos os espaços onde esse estilo será lido com mais clareza.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(ENVIRONMENT_DATA).map(([id, environment]) => (
                        <SelectionChip
                          key={id}
                          active={selectedEnvironments.includes(id)}
                          onClick={() => toggleEnvironment(id)}
                          title={environment.title}
                          description={environment.description}
                          accent={suggestedEnvironments.includes(id) ? 'orange' : 'dark'}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}

              <section className="grid grid-cols-1 gap-4 rounded-[1.5rem] border border-black/5 bg-gray-50 p-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Tamanho da Página</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-wg-orange"
                  >
                    {Object.entries(PAGE_SIZES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-gray-700">Orientação</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-wg-orange"
                  >
                    <option value="portrait">Retrato (Vertical)</option>
                    <option value="landscape">Paisagem (Horizontal)</option>
                  </select>
                </div>
              </section>

              <div className="rounded-[1.5rem] border border-black/5 bg-wg-black p-6 text-white">
                <p className="text-sm uppercase tracking-[0.22em] text-white/55">Resumo do documento</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Estilo base</p>
                    <p className="mt-1 text-lg">{selectedStyle || 'Escolha por imagem'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Ambientes</p>
                    <p className="mt-1 text-lg">{selectedEnvironments.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Camadas materiais</p>
                    <p className="mt-1 text-lg">{selectedMaterials.length}</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-xl bg-wg-orange py-4 text-lg text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {isGenerating ? `Gerando... ${progress}%` : 'Gerar apresentação de moodboard'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenPublicGuide}
                  className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-6 py-3 text-wg-black transition-colors hover:bg-black/[0.03]"
                >
                  <Eye className="h-5 w-5" />
                  Pagina publica
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 rounded-lg bg-wg-orange px-6 py-3 text-white transition-colors hover:bg-orange-600"
                >
                  <Download className="h-5 w-5" />
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div
                ref={(el) => {
                  if (el) pagesRef.current[0] = el
                }}
                style={{
                  width: orientation === 'portrait' ? '595px' : '842px',
                  height: orientation === 'portrait' ? '842px' : '595px',
                  margin: '0 auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <CoverPage
                  clientName={clientName}
                  colorPalette={colorPalette}
                  backgroundImage={generatedGuide?.cover?.imageUrl}
                  styleTitle={generatedGuide?.styleTitle}
                  styleDescription={generatedGuide?.styleDescription}
                  pageNumber={1}
                />
              </div>

              {(generatedGuide?.environments || []).map((environment, index) => {
                const pageNum = index + 2

                return (
                  <div
                    key={environment.id}
                    ref={(el) => {
                      if (el) pagesRef.current[pageNum - 1] = el
                    }}
                    style={{
                      width: orientation === 'portrait' ? '595px' : '842px',
                      height: orientation === 'portrait' ? '842px' : '595px',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <EnvironmentPage
                      title={environment.title}
                      description={environment.description}
                      imageUrl={environment.imageUrl || ''}
                      caption={environment.caption}
                      rationale={environment.rationale}
                      pageNumber={pageNum}
                    />
                  </div>
                )
              })}

              {(generatedGuide?.materials || []).map((material, index) => {
                const pageNum = (generatedGuide?.environments?.length || 0) + index + 2
                const images = material.images?.map((image) => image.imageUrl) || []

                return (
                  <div
                    key={material.id}
                    ref={(el) => {
                      if (el) pagesRef.current[pageNum - 1] = el
                    }}
                    style={{
                      width: orientation === 'portrait' ? '595px' : '842px',
                      height: orientation === 'portrait' ? '842px' : '595px',
                      margin: '0 auto',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    <MaterialPage
                      title={material.title}
                      description={material.description}
                      images={images}
                      rationale={material.rationale}
                      pageNumber={pageNum}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
