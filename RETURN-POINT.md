# RETURN-POINT — site-wgalmeida
**Atualizado:** 18/04/2026

## Auditoria visual/editorial — 18/04/2026

- padronização do sistema de botões concluída em `src/components/ui/button.jsx` e `src/index.css`
- classe faltante `wg-btn-pill-outline-dark` criada e validada
- CTAs públicos críticos convergiram para o mesmo padrão de raio, borda, peso e hover
- segunda onda concluída em metadados públicos, schema e sitemap de vídeo para remover português degradado e alinhar experiência visual dos botões outline
- revisão editorial aplicada em páginas públicas com maior exposição:
  - `Architecture.jsx`
  - `Engineering.jsx`
  - `Carpentry.jsx`
  - `ArquiteturaInterioresVilaNovaConceicao.jsx`
  - `ObraTurnKey.jsx`
  - `ICCRI.jsx`
  - `ICCRIParaImobiliarias.jsx`
- camada de SEO textual corrigida em `src/data/seoConfig.js`
- `schemaConfig.js`, `Blog.jsx`, `Testimonials.jsx`, `ObraEasyLanding.jsx` e `public/video-sitemap.xml` revisados para consistência de idioma, localidade e padrão visual
- `public/sitemap.xml` regenerado após a build

### Validação executada

- `npm run lint` OK
- `npm run check:imports` OK
- `npm run audit:consistency:strict` OK
- `npm run build` OK
- preview local em `http://127.0.0.1:3015` OK
- checagem visual automatizada com screenshots em:
  - `C:\Users\Atendimento\site-wgalmeida-audit`
- rotas auditadas no preview:
  - `/`
  - `/arquitetura`
  - `/engenharia`
  - `/marcenaria`
  - `/processo`
  - `/iccri`
  - `/iccri-para-imobiliarias`

### Pendência real após este bloco

- ainda existe massa editorial antiga em outras páginas e conteúdos de blog com português degradado em ASCII (`Sao`, `Indice`, `Construcao`, etc.)
- a próxima rodada certa é continuar essa limpeza nos conteúdos secundários e nos dados estruturados (`schemaConfig`, filas editoriais e blog legado)

## Estado atual

### PRs mergeados em main
| PR | Descrição |
|---|---|
| #14 | Admin editorial UX redesign + moodboard visual guide + add-on experiência visual |
| #15 | Site Inteligente Camadas 1+2 (SmartCTA, ContextProvider, decisionEngine) |
| #16 | Camada 3: hero personalizado, banner retorno, SoliciteProposta introLabel, blog artigos sugeridos |
| #17 | Camada 5: NextBestActionPanel, getNBAScore, inferStage, stage-aware actions, 41 testes, userContext.js |

### PR aberto
| PR | Branch | Descrição |
|---|---|---|
| #18 | feat/auditoria-editorial-region-smartcta | sectionTitle PHASE1 completo + SmartCTA RegionTemplate |

---

## Site Inteligente — Camadas implementadas

### Camada 1 — Site Guiado
`decisionEngine.js` → rota → intenção → CTA dinâmico. SmartCTA em páginas de serviço e artigos do blog.

### Camada 2 — Contexto do Usuário
`ContextProvider.jsx` persiste contexto em localStorage (`wg_context_v1`). `ContextTracker.jsx` acumula paginas[], rastreia signals e infere tipoImovel a cada navegação.

Contexto canônico:
```ts
{
  interesse: 'obra' | 'marcenaria' | 'design' | 'investimento' | null,
  tipoImovel: 'apartamento' | 'casa' | 'corporativo' | 'interiores' | null,
  faixaValor: string | null,
  estagio: 'exploracao' | 'decisao' | 'acao',
  origem: string | null,
  paginas: string[],
  lastPath: string,
  signals: { viewedProposal, usedMoodboard, viewedInvestment, viewedObraEasy, viewedEasyRealState },
  recommendedAction: { label, href, intent, stage, score } | null,
}
```

### Camada 3 — Personalização
- `Home.jsx`: hero copy dinâmico, banner de retorno (≥3 páginas), reordenação de núcleos
- `SoliciteProposta.jsx`: introLabel contextual por intent/context params
- `Blog.jsx`: artigos sugeridos filtrados por intenção

### Camada 4 — Integração com Sistemas
`ACTION_LIBRARY` por estágio: obra→ObraEasy, investimento→EVF4, design→moodboard. SmartCTA suporta links externos com fallback manual.

### Camada 5 — Next Best Action
- `getNBAScore(context, pathname)`: confiança 0–100
- `inferStage(context, pathname)`: exploracao/decisao/acao considerando signals
- `ContextTracker`: promove estagio via `promoteStage` (nunca regride)
- `NextBestActionPanel`: sticky bottom, score≥40, stage badge, dismiss por rota
- 41 testes unitários em `src/__tests__/decisionEngine.test.js`

---

## Blog Editorial — Estado das Imagens

### PHASE1 (layout editorial completo com imagens inline)
Todos os 10 slugs têm `context[]` com `sectionTitle` mapeado para H2 reais (pending PR #18):
como-calcular-custo-de-obra, custo-reforma-m2-sao-paulo, evf-estudo-viabilidade-financeira,
quanto-custa-reforma-apartamento-100m2, quanto-tempo-leva-reforma-completa-alto-padrao,
quanto-valoriza-apartamento-apos-reforma, tabela-precos-reforma-2026-iccri,
custo-marcenaria-planejada, arquitetos-brasileiros-famosos-legado, marcas-luxo-internacionais-moveis-design

### Sync editorial publicado
- `api/editorial-overrides.js` grava `src/data/blogImageOverrides.generated.js` a partir das seleções do admin
- `api/_editorialOverrides.js` consolida a serialização dos uploads do admin para os arquivos publicados de blog e páginas públicas
- `AdminBlogEditorial.jsx` agora detecta disponibilidade do endpoint, sincroniza automaticamente as mudanças e oferece botão manual `Publicar overrides`
- validação local confirmada com teste controlado de escrita/restauração do arquivo de overrides
- painel de busca do admin agora unifica curadoria com `Unsplash` inline e atalhos laterais para `Google Imagens` e `Google Drive`
- cards de resultados foram estreitados e convertidos para trilho horizontal com navegação lateral, acelerando a revisão de mais imagens por slug
- o card do conteúdo agora sinaliza quando a publicação ainda está usando `banner genérico atual`

### Catálogo publicado de páginas públicas
- `src/data/publicPageImageCatalog.js` centraliza imagens principais de páginas públicas institucionais, serviços, landings e produtos
- `src/data/publicPageImageOverrides.generated.js` abre a base de overrides publicados para páginas públicas
- `AdminBlogEditorial.jsx` agora incorpora registros `kind: 'page'`, permitindo filtrar `Páginas` na mesma fila de curadoria
- o upload de páginas públicas agora usa a pasta correta `editorial/pages/<slug>` no Cloudinary
- páginas públicas críticas já passaram a ler do catálogo central: `About`, `AMarca`, `Architecture`, `ArquiteturaCorporativa`, `ArquiteturaInterioresVilaNovaConceicao`, `BuildTech`, `Carpentry`, `ConstrutoraBrooklin`, `Contact`, `EasyLocker`, `EasyRealStateLanding`, `Engineering`, `FAQ`, `ObraEasyLanding`, `ObraTurnKey`, `Process`, `ReformaApartamentoItaim`, `ReformaApartamentoJardins`, `ReformaApartamentoSP`, `RevistaEstilos` e `Testimonials`
- prova controlada confirmou escrita real em `blogImageOverrides.generated.js` e `publicPageImageOverrides.generated.js`, com restauração imediata após o teste

### Próximos candidatos para PHASE1
- `marcas-luxo-nacionais-moveis-decoracao` — tem unsplashManifest entry, falta sectionTitle + PHASE1
- `custo-reforma-apartamento-alto-padrao-sp`
- `reforma-cozinha-planejada-guia-completo`

---

## Arquivos críticos do sistema inteligente

```
src/
  providers/ContextProvider.jsx        — persistência, normalização, DEFAULT_USER_CONTEXT
  components/ContextTracker.jsx        — signals, tipoImovel, estagio automático
  components/SmartCTA.jsx              — CTA primário + secundário + fallback manual + reason
  components/NextBestActionPanel.jsx   — painel sticky bottom Camada 5
  hooks/useNextBestAction.js           — contrato único: action + score + stage
  lib/decisionEngine.js                — ACTION_LIBRARY, inferStage, getNBAScore, inferPropertyType
  lib/userContext.js                   — STAGE_RANK, DEFAULT_USER_CONTEXT, promoteStage
  __tests__/decisionEngine.test.js     — 41 testes unitários (vitest)
  data/blogImageManifest.js            — context[] com sectionTitle para PHASE1
  data/publicPageImageCatalog.js       — catálogo central de imagens publicadas das páginas públicas
  data/publicPageImageOverrides.generated.js — base para overrides publicados de páginas públicas
  pages/regions/RegionTemplate.jsx     — SmartCTA inteligente nas 14 páginas de bairro
  docs/AGENTES-OBRIGATORIOS-SITE-E-MOODBOARD.md — contrato de arquitetura
```

---

## Regras de arquitetura

1. Toda frente nova responde: **"qual é o próximo passo ideal para este usuário neste momento?"**
2. Toda ação recomendada tem fallback manual (`action.manual`)
3. Estagio só promove, nunca regride (`promoteStage`)
4. Score >= 40 para mostrar NextBestActionPanel
5. Nunca depender exclusivamente de IA — sempre oferecer caminho humano

---

## Pendências conhecidas

- **PR #18** aguarda CI → merge → sectionTitle PHASE1 + SmartCTA bairros em produção
- **SVGs de estilos** 4–5MB comprimidos (japandi, boho, glam) — candidatos a WebP/AVIF
- **marcas-luxo-nacionais-moveis-decoracao** ainda não no PHASE1
- **estagio "acao"** pode ser incrementado com trigger no submit do OrcadorInteligente
- **sync editorial em Vite puro** depende de endpoint `/api`; fluxo completo local com API requer ambiente que sirva `api/` ou deploy/Vercel
- **curadoria unificada de imagens para todas as páginas públicas** avançou no catálogo central e na publicação via admin, mas ainda faltam páginas secundárias e módulos internos fora da fila principal
