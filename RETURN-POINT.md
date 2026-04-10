# RETURN-POINT — site-wgalmeida
**Atualizado:** 10/04/2026 (sessão continuação - galerias Cloudinary + revisão final pré-deploy)
**Deploy:** wgalmeida.com.br ✅ EM PRODUÇÃO — último deploy 08/04

---

## Estado atual

- Deploy ao vivo: wgalmeida.com.br (Vercel) — versão de 07/04 noite
- Projeto Vercel: site-wgalmeida-repo-fixed (prj_c5G5oZHW6QP3d9kub156RcrFVHVt)
- Preview local: `npx serve -s dist -l 3010` → http://localhost:3010

## Ponto de retorno NOC / DevOps

- Runner ativo: `noc-tools/noc-quarantine-batch.mjs`
- Última execução com move: `noc-2026-04-09T213426085Z`
- Última execução de aprendizado: `learn-2026-04-09T220250223Z`
- Quarentena: `C:\Users\Atendimento\.codex\quarantine`
- Rollback da última execução com move:
  - `cmd /c node noc-tools\noc-quarantine-batch.mjs --rollback --transaction noc-2026-04-09T213426085Z`
- Regras ativas de proteção:
  - bloquear `WGEasy`, `wgeasy-dev`, `WG_AUTOMATION` e `ROOT_RUNTIME_LOGS`
  - bloquear nomes contendo `wgeasy`, `vite`, `dev-server`
  - classificar antes de selecionar lote: `ACTIVE_RUNTIME`, `STALE_RUNTIME`, `SAFE_TO_CLEAN`
- Artefatos da última rodada adaptativa:
  - `C:\Users\Atendimento\.codex\quarantine\learn-2026-04-09T220250223Z\adaptive-rules.json`
  - `C:\Users\Atendimento\.codex\quarantine\learn-2026-04-09T220250223Z\adaptive-recommendations.json`
  - `C:\Users\Atendimento\.codex\quarantine\learn-2026-04-09T220250223Z\runtime-patterns-detected.json`
  - `C:\Users\Atendimento\.codex\quarantine\learn-2026-04-09T220250223Z\learning-report.json`
- Observação operacional:
  - arquivos antigos de runtime já movidos em `noc-2026-04-09T213426085Z` não foram restaurados automaticamente; revisar antes do próximo lote

## Fonte institucional obrigatória antes de alterar conteúdo

- `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\00_CORE\05_MARCA_E_MARKETING\_I`

---

## Correções aplicadas em 08/04

### Continuação 08/04 — Produção, governança e performance
- `api/claude.js` criado para suportar o uso real do Claude no Admin
- `package.json` e `vercel.json` padronizados em npm
- `.env.example` atualizado com `CLAUDE_API_KEY` e `CLAUDE_MODEL`
- `build-seo-routes.mjs` corrigido para não publicar imagem quebrada de estilos no SEO estático
- Código morto removido:
  - `src/lib/openaiClient.js`
  - `src/components/LizAssistant.jsx`
  - `src/components/ClaudeAssistant.jsx`
- `PROJECT_GOVERNANCE.md` reforçado com lições reais da auditoria
- `AUDITORIA-PRODUCAO-2026-04-08.md` criado como registro formal dos erros corrigidos
- Pasta `tools/` restaurada com scripts reais para:
  - auditoria de SEO
  - validação de `dist`
  - relatório de assets
  - geração de `.webp` a partir dos SVGs de estilos
  - recompressão de imagens críticas
- `.gitignore` ajustado para não bloquear mais a pasta `tools/` nem os `.webp` de `public/images/estilos`, mantendo os `.svg` legados fora do versionamento

### Fotos reais de obra — Banners do blog e guia de estilos
- 7 fotos reais copiadas de `Imagens/banners/` → `public/images/banners/foto-obra-{1-7}.jpg`
- `ALL_BLOG_BANNERS` (Blog.jsx), `STYLE_BANNERS` (styleCatalog.js) e `BANNERS` (ResponsiveWebpImage.jsx) atualizados para usar as fotos reais como primeiras opções do hash
- Foto do CEO copiada: `public/images/about/william-almeida.png`

### Sitemap — Estilos indexados
- 31 páginas `/estilos/:slug` adicionadas ao sitemap.xml (estavam ausentes — nunca indexadas)
- `/revista-estilos` também adicionada
- Sitemap dinâmico do build gerou 145 rotas totais

### SEO crítico — Meta descriptions específicas por artigo/estilo
- `build-seo-routes.mjs`: `getSEOConfig()` retornava descrição genérica para TODOS os artigos
- Adicionado `resolveSEO(route)` que lê frontmatter do markdown para `/blog/:slug` e `/estilos/:slug`
- Blog: usa `title` + `excerpt` + `image` do frontmatter
- Estilos: usa `title` + `excerpt` do .md; fallback descritivo específico por slug
- Resultado: cada artigo agora tem og:title, og:description e meta description únicos no HTML pré-renderizado
- Impacto: Google lê meta tags corretas no crawl sem precisar executar JavaScript

### vercel.json — Rotas pré-renderizadas servidas corretamente (CRÍTICO)
- Diagnóstico: catch-all `/(.*) → /index.html` interceptava `/blog/slug` e `/estilos/slug`
- Vercel servia o `index.html` raiz (genérico) em vez do HTML pré-renderizado em `dist/blog/slug/index.html`
- Causa dos 181 "Google e usuário selecionaram canônica diferente": Google via 2 versões — raiz genérico vs pré-renderizado
- Fix: adicionado rewrite explícito antes do catch-all:
  `"/blog/:slug" → "/blog/:slug/index.html"`
  `"/estilos/:slug" → "/estilos/:slug/index.html"`
- Agora Google lê HTML com meta tags específicas diretamente

### Deploy 08/04 (3 deploys — versão final)
- Build OK · 145 rotas · Deploy Vercel prod ✅

### Continuação 08/04 — Registro e validação da rodada seguinte
- `npm run assets:prepare` passou a gerar 31 arquivos `.webp` reais em `public/images/estilos/`
- `npm run assets:prune:dist` remove SVGs redundantes do artefato final quando existe `.webp` correspondente
- `npm run seo:audit` validou frontmatter e assets sem faltas
- `npm run seo:validate:dist` confirmou a saída final pós-build
- `npm run perf:assets` confirmou que os gargalos principais agora são:
  - vídeos `hero-mobile.mp4` e `hero-desktop.mp4`
  - `images/about/william-almeida.png`
- `npm run perf:images` permanece manual e fora do build por instabilidade de lock/rename em Windows
- Ganho medido da poda no `dist`: 93 artefatos removidos e 84.896.525 bytes eliminados
- Cloudinary `Projetos-Portfolio` foi auditado por API e mapeado contra a pasta local de imagens
- Inventário salvo em `CLOUDINARY-PROJETOS-PORTFOLIO-MAP-2026-04-08.md`
- Mapa máquina salvo em `cloudinary-projetos-portfolio-map-2026-04-08.json`
- Os 3 casos “ambíguos” foram resolvidos como duplicados binários idênticos por `etag`/`MD5`
- `src/components/ProjectGallery.jsx` passou a consumir `src/utils/cloudinaryProjectPortfolio.js`
- A galeria agora usa URLs transformadas do Cloudinary (`f_auto`, `q_auto:good`, `dpr_auto`) para thumbnails e zoom
- Resultado: menos payload local no portfólio e melhor base para LCP/CLS na seção de projetos, mantendo fallback local apenas para itens ainda não mapeados no Cloudinary
- `src/components/HeroVideo.jsx` saiu de embed do YouTube e passou para vídeo HTML5 com entrega Cloudinary otimizada
- O hero agora usa `src/utils/cloudinaryMedia.js` com versões mobile/desktop em `f_auto`, `q_auto:good` e `vc_auto`
- `public/videos/hero/*.mp4` continuam como origem local, mas deixaram de ir para o `dist`
- `tools/generate-about-webp.mjs` passou a gerar derivados otimizados da foto do William em `public/images/about/`
- `src/pages/About.jsx` agora usa `william-almeida-800.webp` e `william-almeida-1200.webp` na seção do CEO
- `tools/prune-unused-public-media.mjs` remove do artefato final a pasta `dist/videos/hero/` e o PNG legado `dist/images/about/william-almeida.png`
- Ganho medido desta rodada de mídia: 326.026.417 bytes removidos do `dist`
- Após a rodada, `npm run perf:assets` caiu para apenas 2 assets acima de 500 KB

---

## Correções aplicadas em 07/04 — NOITE

### Fontes — Footer
- `font-poppins` → `font-suisse font-light` em todos os títulos de seção do Footer.jsx

### Blog — Imagens variadas
- `resolveBlogImage` atualizado: cada artigo recebe banner determinístico por hash do slug (7 banners disponíveis)
- `getBlogFallbackImage(category, slug)` agora usa hash do slug para variedade
- onError handlers em Blog.jsx passam o slug para escolha variada
- Resultado: artigos da mesma categoria mostram imagens diferentes

### Guia de Estilos — Banners reais
- `getStyleCoverPath(slug)` agora retorna banner real (hash de 7 banners) em vez de SVG gradiente preto
- SVGs eram gradientes simples sem valor visual — substituídos por fotos reais dos banners
- `ResponsiveWebpImage`: fallback de estilos agora usa hash variado (não mais MARCENARIA fixo)

### Borda amarela — Focus ring global
- Adicionado ao `index.css`: `*:focus { outline: none }` e `*:focus-visible { outline: 2px solid rgba(43,69,128,0.5) }`
- Remove o ring laranja/amarelo do browser em TODOS os elementos
- Mantém acessibilidade com focus-visible apenas (azul discreto WG)

### EstiloDetail — Estrutura de leitura (aplicado em 06/04)
- hero-under-header aplicado
- TOC (índice de seções) adicionado
- Reader guide card no topo do artigo
- Conteúdo seccionado igual ao blog

### EcommerceApi — Filtro de produtos sem imagem (aplicado em 07/04 manhã)
- Supabase path: filtra `comImagem` antes de retornar
- Hostinger path: mesmo filtro
- Loja e produtos relacionados do blog só mostram itens com imagem real

---

## Correções aplicadas em 06/04

### Vite 8 / Módulo glob (CRÍTICO)
- `styleCatalog.js`: `const rawString = typeof raw === 'string' ? raw : (raw?.default || '')`
- `Blog.jsx`: mesma correção no map de posts
- Causa: Vite 8 (rolldown) retorna objetos `{default: string}` ao invés de string direta com `{ as: 'raw', eager: true }`
- Resultado: estilos e blog agora carregam conteúdo corretamente

### Menu — Unidades → Núcleos / Processo → Timeline
- pt-BR.json: `unitsLabel: "Núcleos"`, `nav.process: "Timeline"`
- en.json + es.json: `nav.process: "Timeline"`
- Header.jsx mobile: label usa `t('header.unitsLabel')` (não mais hardcoded)
- Sanfona do menu mobile removida — sub-items de Núcleos são links planos

### Blog
- Banner: `min-h-[50vh]` → `h-[50vh]` (igual demais páginas)
- Banner artigo individual: mesmo fix

### Process/Timeline
- Fonte do selectorTitle reduzida: `text-xl md:text-2xl lg:text-3xl whitespace-nowrap text-ellipsis`

### cloudinaryAI.js
- Fallback `|| 'demo'` adicionado para VITE_CLOUDINARY_CLOUD_NAME

---

## PENDENTE — PRÓXIMA SESSÃO

### P1 — Imagens do blog (19 específicas deployadas, 49 ainda usam banners)
- 19 artigos têm `/images/blog/SLUG.webp` em `public/images/blog/` — funcionam
- 49 artigos usam banner hash variado com fotos reais (foto-obra-1 a 7) — OK para agora
- **Ideal:** subir fotos reais para Cloudinary e atualizar frontmatter
- Cloud: `dwukfmgrd` · preset `wg_unsigned`

### P2 — Vídeos do hero (NÃO no Vercel — excluídos do deploy)
- `/public/videos/hero/` está em `.vercelignore` (limite 100MB)
- `HeroVideo.jsx` configurado mas sem mídia
- **Ação:** subir ao Cloudinary e atualizar src em HeroVideo.jsx
- Vídeos locais: `videohorizontal60segundos.mp4` (desktop), `videovertical.mp4` (mobile)

### P2.1 — Performance dos vídeos do hero
- Resolvido nesta rodada com entrega Cloudinary e poda do `dist`
- Próxima melhoria opcional:
  - testar HLS/DASH se a operação quiser streaming adaptativo avançado
  - revisar LCP real em produção com PageSpeed/Lighthouse

### P3 — Fotos de projetos do portfólio
- Fotos disponíveis em `Imagens/IMAGENS-INSTAGRAM-COM MOLDURA - SITE WG/` (180 fotos)
- Organizar por categoria (ARQ, ENG, MARC) → `public/images/projects/`
- Remover espaços e acentos dos nomes de arquivo
- Continuação imediata: migrar os demais blocos de projetos para o mesmo padrão do `ProjectGallery` com `public_id` nomeado e transformações do Cloudinary

### P3.1 — SVGs legados dos estilos
- Os `.webp` otimizados já existem, mas os `.svg` originais continuam pesados como fonte histórica
- Próxima rodada deve decidir entre:
  - manter os `.svg` apenas como origem local e servir `.webp`
  - substituir gradualmente o consumo dos `.svg`
  - normalizar pipeline para não depender de SVG com payload raster embutido

### P3.2 — Foto institucional William Almeida
- Resolvido nesta rodada
- Derivados gerados:
  - `public/images/about/william-almeida-800.webp`
  - `public/images/about/william-almeida-1200.webp`
- O PNG original permanece como fonte local, mas não vai mais para o `dist`

### P4 — Conteúdo institucional William Almeida
- Foto: `public/images/about/william-almeida.png` ✅ copiada
- Criar artigo de blog sobre história do Grupo WG Almeida
- Usar material das pastas: `_I/03_STORYTELLING_E_COMERCIAL/`, `William-Almeida_PESSOAL/`

### P5 — Google Search Console
- Submeter sitemap: `https://wgalmeida.com.br/sitemap-index.xml`
- Verificar indexação das 145 páginas (31 estilos eram inéditas)
- Verificar Core Web Vitals após deploy com fotos reais

---

## Regras da marca (imutáveis)

| Regra | Correto | Errado |
|-------|---------|--------|
| Nome | Grupo WG Almeida | WG Almeida Group |
| Menu Núcleos | Núcleos | Unidades |
| Menu Timeline | Timeline | Processo |
| Títulos | `font-inter font-light` | `font-bold`, `font-semibold` |
| Body | `font-suisse font-light` | `font-poppins`, `font-bold` |
| Citações | `font-playfair italic` | qualquer outro uso |
| Separador | ` · ` (ponto médio) | `—` (travessão) |
| Acentuação | tradição, padrão, etc. | tradicao, padrao |
| Fontes bold/semibold | `font-weight: 300 !important` (global) | qualquer peso acima de light |
| Focus ring | `*:focus { outline: none }` + focus-visible azul | ring laranja/amarelo |

---

## Como rodar local

```bash
cd "C:/Users/Atendimento/Documents/_WG_ALMEIDA_GROUPO/01_APPS/02_BUILDTECH/04_OPERACIONAL/02_20260310_Projetos/02_20260310_Desenvolvimento/_Grupo_WG_Almeida/site-wgalmeida/site-wgalmeida"
npm run build
npx serve -s dist -l 3010
# Acesse: http://localhost:3010
```

**ATENÇÃO:** Vite dev server NÃO funciona com Node v24 (erro estree-walker). Sempre usar build + serve.

## Como fazer deploy (só após aprovação)

```bash
npx vercel --prod --yes
```

---

## Erros conhecidos e soluções

| Erro | Causa | Solução |
|------|-------|---------|
| Conteúdo vazio em estilos/blog | Vite 8 glob retorna `{default:string}` | `typeof raw === 'string' ? raw : raw?.default` |
| Imagens iguais no blog | Fallback só por categoria (6 banners) | Hash do slug → 7 banners variados |
| Focus ring amarelo | `--ring: 16 88% 53%` (laranja) | `*:focus { outline: none }` global |
| SVG estilos sem foto | SVGs eram gradientes pretos | Hash de 7 banners reais |
| Footer com Poppins | `font-poppins` não da marca | `font-suisse font-light` |
| Vite dev server crash | Node v24 + estree-walker incompatível | Usar sempre `build + serve` |
| Produtos sem imagem na loja | pricelist_itens sem imagem_url | Filtro `comImagem` na API |
| Galeria Instagram com thumbnails repetidas | endpoint público `/media/?size=l` instável | thumbnails reais congeladas em `public/images/instagram/` via `tools/fetch-instagram-thumbnails.mjs` |
| Métrica `+3mil` na home | compactação excessiva do contador | exibir valor completo `3.898` no bloco principal |
| Visual antigo de sanfona | componente legado sem aderência à direção atual | remoção do sanfona e substituição por 3 cards estáticos em `src/pages/SanfonaEntry.jsx` |
| FAQ com textos em negrito | pesos `600` no CSS local | reduzir para `300` em `src/pages/faq.css` |
| Timeline parecendo dado real do WG Easy | arrays estáticos + fórmula local sem aviso explícito | transparência textual em `src/pages/Process.jsx` + correção do WhatsApp real |

## Estado real dos dados

- `pricelist_itens`: confirmado com resposta real do Supabase/WG Easy
- `contratos` e `contratos_itens`: acessíveis, mas sem registros retornados na leitura atual do front
- `contacts` e `propostas_solicitadas`: acessíveis, mas vazios na leitura atual
- `Process.jsx`: simulação local, não sincronizada com WG Easy

## Regra para imagens antes da validação final

- Blog:
  preencher `src/data/blogImageManifest.js` e então rebuildar
- Guia de estilos:
  decidir se manter fallback atual ou migrar capas reais por manifesto
- Moodboard:
  validar preset Cloudinary operacional fora do modo demonstração antes da aprovação final

## Continuação 08/04 — FAQ, Cloudinary editorial e share landing

- `src/pages/FAQ.jsx` foi refeito para um FAQ orientado à estratégia de SEO do projeto
- `src/pages/faq.css` ganhou nova diagramação editorial
- `tools/sync-cloudinary-editorial-assets.mjs` foi criado e executado
- `cloudinary-editorial-sync-2026-04-08.json` registra 57 uploads editoriais
- `src/data/blogImageManifest.js` agora tem `public_id` reais para a primeira camada de blog
- `src/data/styleImageManifest.js` cobre os 31 estilos com `public_id` semântico
- `src/pages/Blog.jsx`, `src/utils/styleCatalog.js` e `build-seo-routes.mjs` já estão consumindo Cloudinary
- `src/pages/MoodboardShare.jsx` foi criado
- `src/utils/moodboardShare.js` centraliza o payload compartilhável
- `src/components/moodboard/ColorTransformer.jsx` deixou de compartilhar o link cru do Cloudinary
- preview local validado em:
  - `/faq`
  - `/blog`
  - `/estilos/boho`
  - `/moodboard/share?data=...`

## Continuação 08/04 — links e navegação

- `tools/audit-links.mjs` foi refinado para auditar links internos reais do app
- `LINK-AUDIT-2026-04-08.md` e `link-audit-2026-04-08.json` passaram a registrar a verificação
- CTAs internos foram migrados para `Link` em:
  - `src/pages/Moodboard.jsx`
  - `src/pages/Process.jsx`
  - `src/pages/RoomVisualizer.jsx`
  - `src/pages/Testimonials.jsx`
  - `src/components/moodboard/MoodboardExport.jsx`
  - `src/components/room-visualizer/MoodboardImporter.jsx`
  - `src/components/OrcadorInteligente.jsx`
  - `src/components/layout/Header.jsx`
- rotas dinâmicas como `/estilos/:slug` foram reconhecidas corretamente
- resultado final da auditoria:
  - `63` rotas mapeadas
  - `128` referências internas auditadas
  - `0` links inválidos
  - `0` hard navigations internas
- validação concluída com:
  - `node .\\tools\\audit-links.mjs`
  - `npm run lint`
  - `npm run build`

## Continuação 09/04 — retomada das galerias de projetos

- `src/utils/cloudinaryProjectPortfolio.js` passou a centralizar overrides confiáveis do portfólio com assets já auditados no Cloudinary
- `src/pages/Projects.jsx` agora normaliza os projetos `1` a `4` com mídia real, sem depender da pasta legada `public/images/imagens/`
- `src/pages/Architecture.jsx` e `src/pages/Carpentry.jsx` deixaram de apontar para caminhos mortos de imagens e passaram a usar destaques reais do portfólio
- `src/components/ProjectGallery.jsx` voltou a exibir apenas mídia válida no carrossel principal, substituindo os placeholders quebrados que ainda vinham de `images/imagens`
- Validação executada em 09/04: `cmd /c npm run build` → OK

## Continuação 09/04 — editorial Cloudinary + Amsterdam

- pesquisa confirmada nas docs oficiais do Cloudinary:
  - `Upload Widget` aceita a source `unsplash`
  - `Upload Widget` aceita `image_search` com filtro de direitos via Google Custom Search (`searchByRights`)
- `tools/sync-cloudinary-editorial-assets.mjs` passou a aceitar subpastas recursivas em `public/images/blog` e `public/images/estilos`
- criada a pasta `public/images/blog/amsterdam/` com duas imagens editoriais em `.webp` e `README.md` de créditos
- `src/content/blog/arquitetura-amsterdam-holanda.md` agora usa imagem principal específica e duas imagens inline com crédito no corpo
- `src/data/blogImageManifest.js` recebeu o slug `arquitetura-amsterdam-holanda` apontando para o asset principal no Cloudinary
- sincronização executada com sucesso:
  - `node .\\tools\\sync-cloudinary-editorial-assets.mjs`
  - novos public IDs:
    - `editorial/blog/amsterdam/canal-amsterdam-nikolai-kolosov`
    - `editorial/blog/amsterdam/gables-amsterdam-vik-molina`

## Continuação 09/04 — telefone + normalização editorial do blog

- o telefone visível do site foi padronizado para `+55 (11) 98465-0002` e os campos técnicos/schema passaram para `+5511984650002`
- os posts com telefone legado `94077-9181` foram corrigidos e o fechamento do artigo de Amsterdam foi reescrito com CTA menos carregado de negrito
- `src/pages/Blog.jsx` passou a tratar imagem de `hero`, `card` e `seo` separadamente, permitindo usar um asset diferente no banner da matéria e outro no card/listagem
- `src/data/blogImageManifest.js` agora aceita overrides por variante, não só um único `public_id` por slug
- criada a automação `tools/generate-blog-editorial-queue.mjs`
  - lê os posts do blog
  - conta excesso de negrito (`boldCount`)
  - verifica quantas imagens inline cada matéria já tem
  - monta 2 slots editoriais por postagem (`hero` e `card`)
  - gera queries temáticas para busca
  - se houver `UNSPLASH_ACCESS_KEY`, pode enriquecer a fila com candidatos do Unsplash sem baixar/re-hospedar automaticamente
- comando disponível:
  - `npm run blog:editorial:queue`
- artefato gerado:
  - `blog-editorial-queue-2026-04-09.json` com `71` posts mapeados

## Continuação 09/04 — loja / cards

- `src/components/ProductsList.jsx` agora remove prefixos que repetem o título dentro do subtítulo antes de decidir exibir o texto secundário
- a deduplicação foi endurecida com stopwords e sobreposição de tokens, escondendo descrições que continuam praticamente iguais ao nome do produto
- o bloco visual da descrição foi padronizado em 2 linhas, `13px`, peso light e altura mínima estável para reduzir desalinhamento entre cards
- validação executada em 09/04: `cmd /c npm run build` → OK

### Próxima pendência real do site

- revisar se vale simplificar os fallbacks legados de `OptimizedImage.jsx` e `ResponsiveWebpImage.jsx` quando o acervo local antigo de projetos deixar de ser relevante
- acelerar a curadoria editorial em `/admin/blog-editorial`, começando pelos posts com `needsCopyNormalization = true`

## Continuação 10/04 — mídia de projetos consolidada

- `src/utils/cloudinaryProjectPortfolio.js` passou a centralizar também:
  - `PREMIUM_INTRO_PORTFOLIO_IMAGES`
  - `PROJECT_CAROUSEL_IMAGES`
- `src/components/PremiumCinematicIntro.jsx` deixou de depender de caminhos locais de `public/images/projects` no flash de portfólio
- `src/components/ProjectCarousel.jsx` deixou de apontar para imagens locais de `public/images/projects` e passou a consumir a lista centralizada do Cloudinary
- `src/components/PhotoGallery.jsx` e `src/components/ProjectGallery.jsx` ganharam fallback explícito para `PROJETOS.webp` no grid e no lightbox
- `src/components/OptimizedImage.jsx` passou a aceitar `fallbackSrc`, evitando cair em placeholder genérico quando a mídia de projetos falha
- validação executada nesta rodada:
  - `cmd /c npm run build` → OK
  - `cmd /c npm run lint` → OK
- estado real após a rodada:
  - não restaram referências ativas a `public/images/projects` nos componentes montados da home e de `/projetos`
  - as únicas menções restantes no código ficam restritas às regras de fallback e documentação histórica

## Continuação 10/04 — galerias Cloudinary finalizadas

- `src/utils/cloudinaryProjectPortfolio.js` foi ajustado para expor `thumbSrc` e `fullSrc` por item, evitando usar a imagem ampliada também na grade
- `src/pages/Projects.jsx` e `src/components/PhotoGallery.jsx` passaram a consumir:
  - `thumbSrc` no grid
  - `fullSrc` no lightbox
- `src/components/OptimizedImage.jsx` e `src/components/ResponsiveWebpImage.jsx` deixaram de tratar `images/imagens` como fallback ativo
- o legado `images/projects` foi mantido apenas onde ainda existe consumo real (`ProjectCarousel`)
- os projetos `5` e `6` do portfólio foram alinhados com o inventário real do Cloudinary:
  - projeto `5` → `ENG-OBRA EM ANDAMENTO - PERDIZES - 127M²-21`
  - projeto `6` → `ENG-MORUMBI-160M²-93-95`
- `src/i18n/locales/pt-BR.json`, `src/i18n/locales/en.json` e `src/i18n/locales/es.json` foram corrigidos para refletir:
  - título
  - localização
  - metragem
  - status/duração
  - descrições e labels das imagens
- validações executadas nesta continuação:
  - `cmd /c npm run build` → OK
  - `cmd /c npm run lint` → OK
  - `cmd /c npm run seo:validate:dist` → OK
  - `node .\tools\smoke-console.mjs --routes=/projetos,/arquitetura,/marcenaria` → OK
  - `node .\tools\smoke-console.mjs --routes=/projetos` → OK
  - `node .\tools\smoke-console.mjs` → OK
- estado real após o fechamento:
  - `/projetos` ficou coerente com o mapeamento Cloudinary já auditado
  - grid e lightbox usam derivadas corretas de mídia
  - revisão final pré-deploy terminou sem ocorrências relevantes no smoke

---

## Estrutura de código

```
site-wgalmeida/
  site-wgalmeida/    ← CÓDIGO CANÔNICO
    src/
      pages/
        Blog.jsx         ← lista + artigo individual (hash-varied banners)
        Process.jsx      ← Timeline (nome atualizado, fonte reduzida)
        EstiloDetail.jsx ← leitura estruturada estilo blog
      components/
        layout/
          Header.jsx     ← Núcleos (era Unidades), sem sanfona mobile
          Footer.jsx     ← font-suisse font-light (era font-poppins)
        ResponsiveWebpImage.jsx  ← fallback hash variado
      utils/
        styleCatalog.js  ← getStyleCoverPath usa banner real (hash)
        frontmatter.js   ← parseFrontmatter aceita string ou módulo Vite 8
      api/
        EcommerceApi.js  ← filtra produtos sem imagem em ambos os paths
      index.css          ← *:focus outline-none global
    public/
      images/banners/   ← 7 banners reais deployados
      images/blog/      ← 19 webps específicos deployados
      images/estilos/   ← SVGs (não usados como hero — substituídos por hash)
    api/                ← Vercel functions
    RETURN-POINT.md     ← este arquivo
```

---

## Continuação 09/04 - admin editorial hero/card

### O que foi retomado agora

- a fila editorial do blog passou a gerar também `src/data/blogEditorialQueue.generated.json`, além do JSON de auditoria na raiz
- o script `tools/generate-blog-editorial-queue.mjs` agora cruza o que já existe em `src/data/blogImageManifest.js`
- com isso, a fila identifica melhor:
  - `hasCloudinaryHero`
  - `hasCloudinaryCard`
  - `hasLocalHero`
  - `hasLocalCard`
  - `readyForTwoSlotEditorial`

### Nova área interna criada

- rota protegida adicionada:
  - `/admin/blog-editorial`
- página nova:
  - `src/pages/AdminBlogEditorial.jsx`
- objetivo:
  - listar os `71` posts do blog
  - mostrar query automática por tema para `hero` e `card`
  - abrir busca pronta do Unsplash e Google Imagens
  - subir o asset direto no Cloudinary via Upload Widget
  - guardar override local da sessão e montar snippet pronto para colar no manifesto

### Fluxo esperado daqui para frente

- abrir `/admin/blog-editorial`
- filtrar os posts pendentes
- para cada artigo:
  - escolher a imagem do `hero`
  - escolher a imagem do `card`
  - copiar o snippet gerado para `src/data/blogImageManifest.js`
- depois da curadoria, o blog passa a usar automaticamente:
  - uma imagem no hero
  - outra no card
  - e mantém a base pronta para inserir as mesmas imagens durante a matéria

### Próximo passo recomendado

- preencher em lote os primeiros `10` posts prioritários do filtro `pendentes`
- começar pelos que também têm `needsCopyNormalization = true`, porque assim resolvemos imagem e peso visual do texto no mesmo ciclo
