# RETURN-POINT — site-wgalmeida
**Atualizado:** 12/04/2026 — SSoT 100% limpo, audit OK

## Sessão 12/04/2026 (3) — SSoT completo: contato + URLs + redes sociais ✅

### O que foi feito
- `company.js` ampliado: adicionados `pinterest` e `homify`
- `Footer.jsx`: todos os links (redes sociais, Ferramentas Digitais, bottom WGEasy) → SSoT
- `Header.jsx`: WG_EASY_URL e OBRA_EASY_URL → `PRODUCT_URLS`
- `SEO.jsx`: meta contact, telephone e email em localBusiness → `COMPANY`
- `schemaConfig.js`: todos os emails e telefones → `COMPANY.email` / `COMPANY.phoneRaw`
- 14 páginas SEO (ArquiteturaCorporativa, ConstrutoraBrooklin, Contact, etc.) → `COMPANY`
- 8 componentes (App, ICCRILinksBlock, LizAssistant, WGEasyLoginModal, Home, ICCRI, etc.) → `PRODUCT_URLS`
- **Audit limpo**: site-wgalmeida OK, ObraEasy OK, WGEasy OK — sem regressão
- Commit `786852e`, push para https://github.com/almeidawg/site-wgalmeida

### Arquivos criados/modificados
| Arquivo | Caminho completo |
|---------|-----------------|
| company.js | `C:\...\site-wgalmeida\src\data\company.js` |
| Footer.jsx | `C:\...\site-wgalmeida\src\components\layout\Footer.jsx` |
| Header.jsx | `C:\...\site-wgalmeida\src\components\layout\Header.jsx` |
| SEO.jsx | `C:\...\site-wgalmeida\src\components\SEO.jsx` |
| schemaConfig.js | `C:\...\site-wgalmeida\src\data\schemaConfig.js` |
| 22 arquivos | páginas e componentes — ver git diff 786852e |

### Estado atual
- SSoT 100% limpo — nenhum preço, email, telefone ou URL de produto hardcoded fora do SSoT
- Audit passa OK nos 3 projetos
- Produção: https://wgalmeida.com.br (Vercel autodeploy ativo)

### Próximo passo
- (2) Storage RLS — bucket `obraeasy` → Private + policies via CLI
- (3) CI audit — adicionar `audit-consistency.mjs` no `.github/workflows/ci.yml`
- (4) Landing `/landing/imobiliaria` — adaptar CorretorLandingPage para imobiliárias
- (5) Cron mensal comissões parceiros (WGEasy)

## Sessão 12/04/2026 (continuação) — SSoT site + Alinhamento ✅

### O que foi feito
- `ObraEasyLanding.jsx` migrado para usar `OBRAEASY_PRECOS` e `PRODUCT_URLS` do SSoT `company.js`
- Schema.org offers gerado dinamicamente — nunca mais desatualiza
- Push para GitHub, Vercel autodeploy ativo

### Arquivos criados/modificados
| Arquivo | Caminho completo | Descrição |
|---------|-----------------|-----------|
| `ObraEasyLanding.jsx` | `C:\...\site-wgalmeida\src\pages\ObraEasyLanding.jsx` | Preços e URLs via SSoT |

### URLs e acessos
| Recurso | URL |
|---------|-----|
| Produção | https://wgalmeida.com.br |
| Página ObraEasy no site | https://wgalmeida.com.br/obraeasy |
| GitHub | https://github.com/almeidawg/site-wgalmeida |
| Vercel | https://vercel.com/william-almeidas-projects/site-wgalmeida-repo-fixed |

### Estado atual
- ✅ 0 preços hardcoded no site (audit confirmado)
- ✅ Commits `bdb5ec2` → `a95855a` publicados
- ⚠ URLs e contatos no Footer/SEO ainda hardcoded (130 avisos — baixo risco, revisão futura)

### Checklist Ecossistema
- [x] audit-consistency.mjs: 0 erros, 130 avisos (URLs/contato no footer — aceitável)
- [x] SSoT company.js sendo usado em ObraEasyLanding.jsx

---
**Atualizado:** 12/04/2026 — Alinhamento ObraEasy + Header + Parceiros
**Deploy:** wgalmeida.com.br ✅ EM PRODUÇÃO — último deploy 08/04 | **Pendente deploy das mudanças de 12/04**

## O que foi feito (12/04/2026) ✅

- [x] `src/pages/ObraEasyLanding.jsx`:
  - Link parceiros corrigido: `/landing/parceiro` → `/landing/corretor`
  - Planos atualizados: adicionados Solo (R$79,90) e Completo (R$149,90) — planos de parceiro
  - Business atualizado: inclui Diário de Obra + Análise + Financeiro
  - 3 funcionalidades novas: Diário de Obra, Módulo Financeiro, Análise de Viabilidade
  - Grid de planos: `md:grid-cols-3 xl:grid-cols-5` para suportar 5 planos
- [x] `src/components/layout/Header.jsx`:
  - Adicionado botão ObraEasy (ícone HardHat) no header desktop e mobile
  - URL: `https://obraeasy.wgalmeida.com.br`
- [x] `src/App.jsx`:
  - Adicionado `ObraEasyParceiroRedirect` (redirect externo para landing corretor)
  - Rotas `/parceiros` e `/corretor` → redirect para obraeasy/landing/corretor
- [x] Build: ✅ 0 erros, sitemap atualizado (159 rotas)

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
  - permitir também montar snippet para `src/data/blogUnsplashSelection.json` quando a escolha for hotlink editorial

### Fluxo esperado daqui para frente

- abrir `/admin/blog-editorial`
- filtrar os posts pendentes
- para cada artigo:
  - escolher a imagem do `hero`
  - escolher a imagem do `card`
  - decidir entre:
    - snippet Cloudinary para `src/data/blogImageManifest.js`
    - snippet Unsplash para `src/data/blogUnsplashSelection.json`
- depois da curadoria, o blog passa a usar automaticamente:
  - uma imagem no hero
  - outra no card
  - e mantém a base pronta para inserir as mesmas imagens durante a matéria

### Continuação 10/04 — selection JSON do Unsplash no admin

- `src/pages/AdminBlogEditorial.jsx` passou a importar `src/data/blogUnsplashSelection.json` como base do fluxo hotlinked
- a página agora salva overrides locais também para o caminho Unsplash em `localStorage`:
  - `wg_blog_editorial_unsplash_v1`
- cada slot ganhou campos para:
  - `Unsplash photo ID`
  - `alt`
- o painel agora gera dois blocos independentes:
  - snippet Cloudinary para `src/data/blogImageManifest.js`
  - snippet Unsplash para `src/data/blogUnsplashSelection.json`
- validação executada nesta continuação:
  - `cmd /c npm run build` → OK
  - `cmd /c npm run lint` → OK

### Continuação 10/04 — status unificado Cloudinary + Unsplash

- `src/pages/AdminBlogEditorial.jsx` passou a considerar cobertura editorial completa quando `hero/card` estiverem resolvidos por qualquer um dos dois caminhos:
  - manifesto Cloudinary
  - `selection JSON` do Unsplash
- com isso, os filtros `pendentes` e `prontos`, os cards de resumo e o selo do artigo deixam de depender apenas do upload Cloudinary
- o selo por slot também deixou de mostrar falso `sem upload` quando já existe `Unsplash photo ID` preenchido
- validação executada nesta continuação:
  - `cmd /c npm run build` → OK
  - `cmd /c npm run lint` → OK

### Continuação 10/04 — snippets parciais e cobertura mista por slot

- `src/pages/AdminBlogEditorial.jsx` agora gera snippet parcial por slot nos dois caminhos:
  - `src/data/blogImageManifest.js`
  - `src/data/blogUnsplashSelection.json`
- isso elimina o bloqueio antigo em que o painel só ajudava quando `hero` e `card` estavam fechados no mesmo canal
- o status `prontos` também passou a aceitar cobertura mista:
  - `hero` via Cloudinary + `card` via Unsplash
  - `hero` via Unsplash + `card` via Cloudinary
- os textos da interface foram ajustados para deixar claro que o bloco pode aparecer com apenas um slot definido
- validação executada nesta continuação:
  - `cmd /c npm run build` → OK
  - `cmd /c npm run lint` → OK

### Continuação 10/04 — páginas públicas alinhadas às regras

- bloco de SEO público padronizado com `pathname` explícito em páginas estratégicas e utilitárias:
  - `src/pages/ConstrutoraAltoPadraoSP.jsx`
  - `src/pages/ConstrutoraBrooklin.jsx`
  - `src/pages/ArquiteturaCorporativa.jsx`
  - `src/pages/ArquiteturaInterioresVilaNovaConceicao.jsx`
  - `src/pages/ObraTurnKey.jsx`
  - `src/pages/ReformaApartamentoSP.jsx`
  - `src/pages/ReformaApartamentoItaim.jsx`
  - `src/pages/ReformaApartamentoJardins.jsx`
  - `src/pages/ObraEasyLanding.jsx`
  - `src/pages/EasyRealStateLanding.jsx`
  - `src/pages/SoliciteProposta.jsx`
  - `src/pages/RoomVisualizer.jsx`
- heros públicos que ainda dependiam de `url('/images/...')` ou `src="/images/..."` passaram a usar `withBasePath(...)` nos pontos revisados
- copy pública corrigida em `src/pages/ConstrutoraBrooklin.jsx`, removendo o trecho em inglês `Proximity to Berrini` do SEO/schema
- tipografia pública aproximada das regras da marca em:
  - `src/pages/EasyLocker.jsx`
  - `src/pages/Engineering.jsx`
  - `src/pages/MarcenariaSobMedidaMorumbi.jsx`
- limpeza residual de mídia/fallback em:
  - `src/pages/Projects.jsx`
  - `src/pages/RevistaEstilos.jsx`
- observação: `src/pages/Blog.jsx` não precisou de ajuste neste bloco porque já estava resolvendo fallback local via helper central
- validação executada nesta continuação:
  - `cmd /c npm run lint` → OK
  - `cmd /c npm run build` → OK

### Próximo passo recomendado

- preencher em lote os primeiros `10` posts prioritários do filtro `pendentes`
- começar pelos que também têm `needsCopyNormalization = true`, porque assim resolvemos imagem e peso visual do texto no mesmo ciclo

### Continuação 10/04 — blog cidades e hero full-screen

- confirmado desvio real no editorial Unsplash:
  - `arquitetura-barcelona-espanha`
  - `arquitetura-bruxelas-belgica`
  - ambos estavam reutilizando os mesmos IDs para `hero` e `card`
- ajuste aplicado em `src/data/blogUnsplashSelection.json` para remover a duplicação exata de Bruxelas em relação a Barcelona
- refinamento adicional aplicado para não deixar repetição direta de `hero/card` entre as matérias internacionais mapeadas nesta rodada
- manifesto regenerado em:
  - `src/data/blogUnsplashManifest.generated.js`
- observação importante:
  - a coleção local `unsplash-collection-yU-ii4hFjlg.json` ainda é pequena e não garante correspondência forte para todas as cidades
  - Paris e Lisboa estão mais bem resolvidas
  - Barcelona e Bruxelas continuam pedindo uma nova rodada de sourcing para ficarem realmente específicas por cidade
- diagnóstico de peso tipográfico no blog:
  - os `.md` ainda carregam muitos `**...**`
  - mas `src/pages/Blog.jsx` já força `strong` para peso leve na renderização
  - portanto o problema principal visto nesse bloco era o vínculo de imagem, não `semibold` visual no front
- padronização de hero full-screen aplicada no sistema base e nas páginas públicas que ainda estavam com `50vh`, `60vh`, `68vh`, `70vh` e `80vh`
- validação executada neste bloco:
  - `cmd /c npm run lint` → OK
  - `cmd /c npm run build` → OK

### Continuação 10/04 — admin editorial priorizado para P1

- `src/pages/AdminBlogEditorial.jsx` passou a normalizar categorias reais da fila antes de montar filtros e labels
- com isso, o painel deixou de depender apenas do mapa estático antigo e passou a listar corretamente grupos como:
  - `Arquitetura Internacional`
  - `Mercado Imobiliário`
  - `Sustentabilidade`
- o filtro de status ganhou a visão explícita `Pendentes + normalização`
- a página agora calcula também o volume real de pendências que acumulam os dois problemas:
  - sem `hero/card` resolvidos
  - com `needsCopyNormalization = true`
- foi criado um bloco novo de operação rápida com os `10` posts prioritários da rodada:
  - ordenados por `boldCount`
  - com CTA para filtrar só esse lote
  - com botão para copiar a lista de slugs e tocar a curadoria em sequência
- isso fecha o gargalo do próximo passo recomendado anterior, porque o `/admin/blog-editorial` agora já entrega o lote operacional para atacar `P1` e normalização no mesmo ciclo
- validação desta continuação:
  - leitura estática concluída
  - execução de `lint/build` não rodada neste turno porque o shell do ambiente falhou na sandbox (`CreateProcessWithLogonW failed: 1326`)

### Continuação 10/04 — normalização global de negrito no blog

- `src/pages/Blog.jsx` passou a neutralizar `**...**` diretamente no conteúdo markdown carregado dos posts
- a normalização agora acontece antes do `ReactMarkdown`, reduzindo o peso visual do acervo inteiro sem depender de reescrever manualmente cada `.md`
- o `tempoLeitura` também passou a ser calculado sobre o conteúdo já normalizado, mantendo a contagem coerente com o texto efetivamente exibido
- isso resolve o gargalo mais repetitivo do lote prioritário do blog enquanto a curadoria de `hero/card` continua no `/admin/blog-editorial`
- validação desta continuação:
  - leitura estática concluída
  - execução de `lint/build` não rodada neste turno porque o shell do ambiente falhou na sandbox (`CreateProcessWithLogonW failed: 1326`)

### Continuação 10/04 — navegação volta ao topo entre páginas

- `src/App.jsx` ganhou um `RouteScrollManager` na raiz do app
- a navegação entre rotas agora força abertura no topo da página em vez de preservar a posição anterior de scroll
- o histórico do navegador passou a usar `scrollRestoration = manual` enquanto a SPA está ativa
- links com hash continuam suportados:
  - o alvo é procurado após o render
  - o scroll respeita offset do header para não esconder o título da seção
- isso corrige o comportamento percebido ao abrir matérias e outras páginas internas, que antes pareciam iniciar no meio da página
- validação desta continuação:
  - leitura estática concluída
  - execução de `lint/build` não rodada neste turno porque o shell do ambiente falhou na sandbox (`CreateProcessWithLogonW failed: 1326`)

### Continuação 10/04 — validação real pós-ajustes de navegação e blog

- validação executada com acesso completo no repo canônico:
  - `cmd /c npm run lint` → OK
  - `cmd /c npm run build` → OK
- o build passou com os ajustes recentes em:
  - `src/App.jsx` (`RouteScrollManager` para abrir páginas no topo)
  - `src/pages/Blog.jsx` (normalização global de `**...**` no markdown)
  - `src/pages/AdminBlogEditorial.jsx` (lote prioritário e filtros operacionais)
- o pipeline também concluiu sem falha os passos acoplados do projeto:
  - `assets:prepare`
  - `seo:og`
  - `assets:prune:dist`
  - `media:prune:dist`
  - `seo:routes`

### Próximo passo recomendado

- voltar para `/admin/blog-editorial` com o filtro `Pendentes + normalização`
- preencher `hero/card` reais do lote dos `10` slugs priorizados pelo painel
- depois, se quisermos fechar mais um bloco técnico, rodar medição real de produção para `P2` (LCP/Core Web Vitals)

### Continuação 10/04 — P1 blog com trio pendente fechado

- concluído o preenchimento dos três slugs prioritários que ainda estavam sem seleção válida no editorial Unsplash:
  - `marcas-luxo-nacionais-moveis-decoracao`
  - `paleta-cores-2026-cor-do-ano`
  - `plantas-interiores-purificam-ar`
- a coleção local `unsplash-collection-yU-ii4hFjlg.json` foi expandida manualmente de `19` para `25` fotos com assets públicos livres do Unsplash, sem depender da chave da API neste bloco
- `src/data/blogUnsplashSelection.json` passou a apontar hero/card reais para esse trio, fechando o vazio operacional do primeiro lote prioritário
- manifesto regenerado em:
  - `src/data/blogUnsplashManifest.generated.js`
- resultado prático deste bloco:
  - o manifesto agora sobe `11` slugs com imagem resolvida
  - os três slugs novos já aparecem materializados no manifesto gerado
- observação:
  - a foto testada para `paleta-cores-2026-cor-do-ano` em `temp_unsplash_palette.html` era `Unsplash+` e foi descartada
  - foram usadas alternativas gratuitas para manter o fluxo editorial compatível com o sistema atual
- validação executada neste bloco:
  - `cmd /c npm run unsplash:manifest:build` → OK
  - `cmd /c npm run lint` → OK
  - `cmd /c npm run build` → OK

### Próximo passo recomendado

- continuar o `P1` no `/admin/blog-editorial` revisando visualmente os `hero/card` já resolvidos no lote dos `10`
- se o lote estiver coerente no front, avançar para `P2` com medição real de produção de `LCP/Core Web Vitals`

### Continuação 10/04 — governança operacional de Infra, Túneis e PM2 (sem downtime)

- sessão dedicada de operação segura para padronizar execução de túneis/processos com rastreabilidade
- nenhum processo ativo foi derrubado nesta rodada
- estado encontrado:
  - múltiplos túneis temporários ativos em `Atendimento` (cloudflared, ngrok e localtunnel)
  - conflito detectado na porta `5173` (cloudflared + ngrok em paralelo)
  - logs críticos espalhados em `%TEMP%` (drift operacional)
- documentação e base canônica criadas em:
  - `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\07_20260310_Infraestrutura\Operacao-Tuneis-PM2\RUNBOOK-OPERACAO-INFRA-TUNEIS-PM2.md`
  - `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\07_20260310_Infraestrutura\Operacao-Tuneis-PM2\TUNEIS-ATIVOS.json`
  - `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\07_20260310_Infraestrutura\Operacao-Tuneis-PM2\PORTAS-RESERVADAS.md`
- `README` de infraestrutura atualizado para apontar o novo padrão:
  - `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\07_20260310_Infraestrutura\README.md`
- manifesto inicial já registrado com túneis e riscos abertos (status real da sessão)

### Próximo passo recomendado

- consolidar o uso operacional em cima do runbook novo (diagnóstico obrigatório antes de qualquer start/stop)
- resolver o conflito de `5173` com decisão explícita de ferramenta única por porta
- migrar logs de túneis críticos para diretório canônico (fora de `%TEMP%`)

## Continuação 10/04 — correção editorial Barcelona + ponto de retorno de governança

- incidente real confirmado no endpoint de homologação usado pelo time:
  - `http://localhost:3011/blog/arquitetura-barcelona-espanha`
  - sintoma: card da matéria com imagem ambígua (leitura de cidade incorreta)
- causa raiz confirmada:
  - `vite preview` em `:3011` estava servindo `dist` desatualizado em parte do ciclo
  - mapeamento local de Barcelona ainda permitia `.../card` separado de `.../hero`
- correção aplicada:
  - `src/data/blogImageManifest.js`
    - `arquitetura-barcelona-espanha` com `card/thumb/square -> hero`
  - `src/data/blogUnsplashSelection.json`
    - alt editorial com referência geográfica explícita (Barcelona/Bruges)
  - `tools/audit-blog-unsplash-selection.mjs`
    - auditoria reforçada para consistência geográfica em `hero/card alt`
    - duplicidade entre slugs mantida como bloqueio
  - `src/data/blogUnsplashManifest.generated.js` regenerado
- validação executada no mesmo ambiente de homologação (`3011`):
  - `npm run blog:editorial:audit` → OK
  - `npm run unsplash:manifest:build` → OK
  - `npm run lint` → OK
  - `npm run build` → OK
  - DOM final em `3011`: `cardSrc` de Barcelona passou a resolver para `.../editorial/blog/arquitetura-barcelona-espanha/hero`
  - evidência visual salva em:
    - `.monitor-data/barcelona-3011-card-after-build.png`

## Continuação 10/04 — documentação operacional estruturada (novo padrão)

- criado log cronológico de incidentes:
  - `docs/INCIDENT-LOG.md`
  - primeira entrada registrada: `INC-20260410-01` (caso Barcelona)
- playbook técnico atualizado:
  - `docs/UI-BUGS-AND-FIXES.md`
  - seção adicionada: caso Barcelona (causa raiz, correção, prevenção, playbook de resposta)
- criado prompt mestre do ecossistema completo:
  - `docs/ECOSYSTEM-OPERATING-PROMPT.md`
  - cobre operação padronizada para:
    - Linux/WSL
    - `C:/IA` (espelho `C:/AI`)
    - Ollama
    - Liz
    - perfil `Servidor` (`C:/Users/Administrador`)
    - pasta `Documentos` (`C:/Users/Atendimento/Documents`)
  - inclui rotinas:
    - diária (descoberta e saúde)
    - semanal (higiene/evidência)
    - resposta rápida a incidente
    - regra objetiva de fechamento de tarefa

## Próximo passo recomendado (imediato)

- manter homologação oficial em `preview` quando a revisão do time usar `localhost:3011`
- usar `docs/INCIDENT-LOG.md` para todo incidente real novo
- iniciar cada nova rodada com o prompt de `docs/ECOSYSTEM-OPERATING-PROMPT.md`

## Continuação 10/04 — automação do diagnóstico de túneis/portas

- criada automação canônica de auditoria operacional:
  - `tools/audit-infra-tunnels.mjs`
- o script lê e cruza:
  - `Operacao-Tuneis-PM2/TUNEIS-ATIVOS.json`
  - `Operacao-Tuneis-PM2/PORTAS-RESERVADAS.md`
- validações executadas pela automação:
  - conflitos abertos no manifesto
  - duplicidade de túnel por porta
  - owner divergente da governança
  - túnel ativo fora de porta reservada
  - log ausente ou fora do diretório canônico
- integração no workflow do projeto:
  - `package.json` recebeu `npm run infra:tunnels:audit`
- estrutura de rastreabilidade criada:
  - `Operacao-Tuneis-PM2/logs/`
  - `Operacao-Tuneis-PM2/audits/`
- documentação atualizada para operação obrigatória pré start/stop:
  - `Operacao-Tuneis-PM2/RUNBOOK-OPERACAO-INFRA-TUNEIS-PM2.md`
  - `07_20260310_Infraestrutura/README.md`
- observação operacional desta rodada:
  - validação de execução do comando não foi rodada no ambiente atual porque o shell segue intermitente com `CreateProcessWithLogonW failed: 1326`

## Próximo passo recomendado (infra)

- executar `npm run infra:tunnels:audit` no repo canônico e anexar o JSON gerado em `Operacao-Tuneis-PM2/audits/`
- com base no relatório, fechar primeiro o conflito de `5173` (ferramenta única por porta)
- migrar os logs ativos de `%TEMP%` para `Operacao-Tuneis-PM2/logs/` mantendo os PIDs sem downtime

## Continuação 10/04 — execução real da estabilização de túneis (com restart controlado)

- auditoria inicial executada:
  - `npm run infra:tunnels:audit`
  - resultado inicial: `status: warning`, `7` riscos médios
- ações executadas nesta rodada:
  - desativado túnel `ngrok` duplicado da porta `5173`
  - reinicializados túneis `cloudflared` de `5173`, `3010` e `3005` para usar log canônico em:
    - `07_20260310_Infraestrutura/Operacao-Tuneis-PM2/logs/`
  - manifesto atualizado em:
    - `07_20260310_Infraestrutura/Operacao-Tuneis-PM2/TUNEIS-ATIVOS.json`
  - `localtunnel` (`8092`) e `ngrok` (`5173`) marcados como `inactive` no manifesto
  - conflitos do manifesto zerados (`conflicts: []`)
- estado final ativo após consolidação:
  - `5173` → `https://traveler-functions-holders-toll.trycloudflare.com` (PID `60364`)
  - `3010` → `https://cabinets-concepts-cylinder-enrolled.trycloudflare.com` (PID `56724`)
  - `3005` → `https://adjustment-cfr-fotos-intense.trycloudflare.com` (PID `58924`)
- auditoria final executada na mesma sessão:
  - `npm run infra:tunnels:audit`
  - resultado final: `status: ok`, `0` riscos
  - relatório: `07_20260310_Infraestrutura/Operacao-Tuneis-PM2/audits/tunnel-audit-2026-04-10T20-28-31-752Z.json`
- base operacional sincronizada nesta rodada:
  - `07_20260310_Infraestrutura/Operacao-Tuneis-PM2/PORTAS-RESERVADAS.md`

## Próximo passo recomendado (infra pós-estabilização)

- manter a decisão de ferramenta única por porta (`cloudflared`) até nova aprovação explícita
- ao abrir túnel novo, atualizar manifesto e rodar `npm run infra:tunnels:audit` antes de publicar URL para o time
- se `8092` voltar a operar, registrar novo processo/URL no manifesto antes do primeiro compartilhamento

## Continuacao 10/04 - fix SEO sem barra final em `3011`

- incidente detectado na homologacao:
  - `http://localhost:3011/sobre` e `http://localhost:3011/blog/arquitetura-barcelona-espanha`
  - sem `/` final carregava SEO da home; com `/` final carregava SEO da rota
- causa raiz:
  - o build SEO gerava apenas `dist/<rota>/index.html`
  - `vite preview` sem barra final fazia fallback para `dist/index.html`
- correcao aplicada:
  - `build-seo-routes.mjs` agora gera alias adicional `dist/<rota>.html` para todas as rotas nao raiz
  - isso permite que servidores estaticos resolvam `/rota` com o mesmo HTML prerender de `/rota/`
- validacao executada:
  - `npm run lint` -> OK
  - `npm run build` -> OK
  - confirmacao em `3011`:
    - `/sobre` == `/sobre/` (mesmo `<title>`)
    - `/blog/arquitetura-barcelona-espanha` == `/blog/arquitetura-barcelona-espanha/` (mesmo `<title>`)
- documentacao sincronizada:
  - `docs/INCIDENT-LOG.md` com entrada `INC-20260410-02`

## Continuacao 10/04 - lote prioritario de editorial (top 10) fechado

- retomada executada no bloco recomendado de `/admin/blog-editorial` com criterio `pendentes + normalizacao`
- os 10 slugs prioritarios da fila foram preenchidos com `hero/card` no selection do Unsplash:
  - `iluminacao-residencial-guia-completo`
  - `onboarding-processo-wg-almeida`
  - `arquitetos-internacionais-famosos-obras`
  - `arquitetura-sustentavel-certificacoes`
  - `profissionais-capacitados-obra`
  - `importancia-contratar-arquiteto`
  - `quanto-tempo-dura-reforma-apartamento`
  - `reforma-banheiro-pequeno-otimizacao`
  - `closet-planejado-organizacao-otimizacao`
  - `sistema-easy-metodologia-wg-almeida`
- `src/data/blogUnsplashSelection.json` atualizado com os novos pares de slots
- `unsplash-collection-yU-ii4hFjlg.json` expandido para incluir os novos assets usados no lote
- `src/data/blogUnsplashManifest.generated.js` regenerado apos o preenchimento
- evidencia da rodada salva em:
  - `temp_unsplash_top10_fill_report.json`
- validacao executada nesta continuacao:
  - `npm run blog:editorial:audit` -> OK
  - `npm run unsplash:manifest:build` -> OK
  - `npm run lint` -> OK
  - `npm run build` -> OK
- impacto operacional da rodada:
  - fila prioritaria caiu de `32` para `22` pendencias (`pendentes + normalizacao`)

## Proximo passo recomendado (editorial)

- fechar o proximo bloco de `10` slugs prioritarios restantes no mesmo fluxo
- revisar visualmente os novos `hero/card` no front antes de publicar nova rodada de curadoria

## Continuacao 10/04 - editorial prioritaria zerada (pendentes + normalizacao)

- continuacao executada no mesmo fluxo de curadoria do `/admin/blog-editorial` para os blocos seguintes
- criado utilitario reutilizavel:
  - `tools/fill-unsplash-priority-batch.py`
  - objetivo: preencher lotes de slugs prioritarios com `hero/card`, fallback por query semantica e relatorio da rodada
- rodada concluida com preenchimento do restante da fila prioritaria, incluindo os slugs que tinham falha parcial no primeiro passe
- status final da fila `pendentes + normalizacao`:
  - antes: `22`
  - depois: `0`
- `src/data/blogUnsplashSelection.json` atualizado com os novos pares de slots
- `unsplash-collection-yU-ii4hFjlg.json` expandido com os assets usados nesta rodada
- `src/data/blogUnsplashManifest.generated.js` regenerado apos consolidacao
- evidencias operacionais desta continuacao:
  - `temp_unsplash_priority_batch2_report.json`
  - `temp_unsplash_priority_batch2_retry_report.json`
  - `temp_unsplash_priority_batch3_report.json`
  - `temp_unsplash_priority_batch4_report.json`
- validacao executada nesta continuacao:
  - `npm run blog:editorial:audit` -> OK
  - `npm run unsplash:manifest:build` -> OK
  - `npm run lint` -> OK
  - `npm run build` -> OK

## Proximo passo recomendado (editorial)

- iniciar revisao visual em `/admin/blog-editorial` com filtro `prontos` para validar aderencia dos novos `hero/card`
- se houver ajustes finos de semantica visual por slug, aplicar override localizado no `blogUnsplashSelection.json` e regenerar manifesto

## Fechamento 11/04 - deploy producao site-wgalmeida

- [x] Deploy producao concluido na Vercel (`dpl_GcpD5CGemx5krydR6kCqbWrFtz1c`) em `11/04/2026`
- [x] Alias ativo e validado: `https://wgalmeida.com.br`
- [x] Runtime validado sem dependencia de `/videos/hero/*.mp4` local no intro
- [x] `robots.txt`, `sitemap.xml`, `sitemap-index.xml`, `video-sitemap.xml` respondendo `200`
- [x] Home e `/blog` com `canonical` e `meta robots=index, follow`
- [x] PageSpeed API por CLI validada com chave Google atual (`11/04/2026`): `runPagespeed` retornando `200` para `https://wgalmeida.com.br` (mobile e desktop) e `https://wgalmeida.com.br/blog` (mobile)
- [x] Endpoint legado `google.com/ping?sitemap=...` confirmado como obsoleto (`404`); validacao de indexacao mantida por sitemap/robots e Search Console

## Continuacao 11/04 - sprint SGE + autoridade citavel por IA

- [x] Grafo semantico conectado aplicado em `src/data/schemaConfig.js` com `Organization`, `Person`, `Service`, `SoftwareApplication`, `CreativeWorkSeries` e `WebSite` (`@graph`)
- [x] Home (`/`), Sobre (`/sobre`) e BuildTech (`/buildtech`) atualizados para publicar schema de knowledge graph no HTML
- [x] FAQ schema automatico ativado no blog: artigos com secao `## Perguntas frequentes` + blocos `###` agora geram `FAQPage` JSON-LD
- [x] Estrutura estrategica adicionada sem quebrar canonical: rotas `/conteudo` e `/conteudo/:slug` redirecionando para `/blog`
- [x] Estrutura de ferramentas adicionada: `/tools`, `/tools/moodboard-generator`, `/tools/room-visualizer` redirecionando para rotas canonicas
- [x] 3 artigos SGE publicados com foco em intencao de busca:
  - `custo-reforma-apartamento-alto-padrao-sp`
  - `vale-a-pena-contratar-arquiteto-turn-key`
  - `quanto-tempo-leva-reforma-completa-alto-padrao`
- [x] `public/sitemap.xml` regenerado com os novos slugs de conteudo
- [x] Validacao local completa:
  - `npm run lint`
  - `npm run test:run` (35/35)
  - `npm run build`
  - `npm run seo:validate:dist`

## Continuacao 11/04 - sprint ICCRI (pagina + cluster de conteudo)

- [x] Pagina dedicada `/iccri` publicada com:
  - H1 de entidade ICCRI
  - frase de autoridade: "indice proprietario da WG Almeida baseado em dados reais de obras"
  - simulador embutido (metragem, padrao, cidade) + CTA EVF/AVM
  - schema `Dataset` + `WebPage` + `FAQPage`
- [x] Rotas e SEO:
  - `src/App.jsx` atualizado com rota `/iccri`
  - `src/data/seoConfig.js` atualizado para `/iccri`
- [x] Blog:
  - artigo ICCRI reforcado com CTA no topo e bloco padrao de interlinking
  - novos artigos publicados:
    - `/blog/custo-reforma-m2-sao-paulo`
    - `/blog/quanto-custa-reforma-apartamento-100m2`
    - `/blog/como-calcular-custo-de-obra`
    - `/blog/custo-marcenaria-planejada`
- [x] Sitemap dinamico regenerado com `158` rotas
- [x] Validacao local:
  - `npm run lint`
  - `npm run build`

## Continuacao 12/04 - ativacao comercial (go-to-market)

- [x] Kit operacional D0-D7 criado para ativacao de corretores e uso real do EVF:
  - `docs/GO-TO-MARKET-ICCRI-EVF-D0-D7.md`
- [x] Templates de mensagem prontos para execucao imediata:
  - `docs/templates/WHATSAPP-ATIVACAO-CORRETOR-D0.md`
  - `docs/templates/WHATSAPP-CORRETOR-PARA-CLIENTE-EVF.md`
- [x] Planilha base de consolidacao diaria de metricas criada:
  - `docs/templates/METRICAS-ATIVACAO-ICCRI-EVF.csv`
- [x] Foco operacional definido sem nova feature:
  - ativar distribuicao
  - medir abertura/click/lead
  - escalar somente apos validacao de conversao
