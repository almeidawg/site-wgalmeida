# Manual de SEO & Performance - Grupo WG Almeida

> Documento de referencia para otimizacao de SEO e Performance do site do Grupo WG Almeida.
> Baseado no Google SEO Starter Guide, Lighthouse, web.dev e WCAG 2.1.
> Atualizado em: Fevereiro 2026

---

## Indice

1. [Visao Geral do Stack](#1-visao-geral-do-stack)
2. [SEO On-Page](#2-seo-on-page)
3. [Performance (Core Web Vitals)](#3-performance-core-web-vitals)
4. [Imagens](#4-imagens)
5. [CSS e JavaScript](#5-css-e-javascript)
6. [Acessibilidade (Contraste)](#6-acessibilidade-contraste)
7. [Dados Estruturados (JSON-LD)](#7-dados-estruturados-json-ld)
8. [Rastreabilidade e Indexacao](#8-rastreabilidade-e-indexacao)
9. [Internacionalizacao](#9-internacionalizacao)
10. [Checklist de Auditoria](#10-checklist-de-auditoria)
11. [Comandos Uteis](#11-comandos-uteis)
12. [Fontes e Referencias](#12-fontes-e-referencias)

---

## Acessos Google (Search/Ads/API)

| Ferramenta | Tipo | Chave / Observacao |
|---|---|---|
| Google Search / Search Console | API key | [REVOKED_ROTATE_IMMEDIATELY] |
| Google Ads | API key (mesma) | [REVOKED_ROTATE_IMMEDIATELY] |

> Guardar esta chave com sigilo; nao compartilhar fora do time de marketing/SEO.

---

## 1. Visao Geral do Stack

| Tecnologia | Funcao |
|---|---|
| **Vite 4** | Bundler com code splitting, tree-shaking, esbuild minify |
| **React 18** | SPA com React Router, React.lazy() para rotas |
| **Tailwind CSS 3** | CSS com purge automatico via `content` config |
| **Framer Motion** | Animacoes (vendor chunk separado) |
| **react-helmet-async** | Meta tags dinamicas por rota |
| **Vercel** | Hosting com cache headers e redirects |
| **Cloudinary** | CDN de imagens com `q_auto,f_auto` |
| **Supabase** | Backend (lazy-loaded) |

### Ferramentas de Build Configuradas

| Ferramenta | Funcao | Script |
|---|---|---|
| `vite-plugin-compression2` | Gzip + Brotli de assets | Automatico no build |
| `rollup-plugin-visualizer` | Analise visual do bundle | `npm run analyze` |
| `sharp` (via script) | Geracao e recompressao de imagens | `npm run assets:prepare` / `npm run perf:images` |
| `prune-unused-style-svg` | Remove SVGs redundantes dos estilos no `dist` | Automatico no build |

---

## 2. SEO On-Page

### 2.1 Title Tags

**Regra:** Cada pagina deve ter um `<title>` unico, descritivo e conciso.

```
Bom: "Arquitetura de Interiores Alto Padrao SP | Grupo WG Almeida"
Ruim: "Pagina Inicial"
Ruim: "Arquitetura Arquitetura Arquitetura SP" (keyword stuffing)
```

**Implementacao no projeto:**
- O componente `src/components/SEO.jsx` injeta `<title>` via react-helmet-async
- O `seoConfig` centraliza titulos por rota
- Incluir nome da empresa no final: `| Grupo WG Almeida`

**Fonte:** [Google SEO Starter Guide - Titles](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=pt_BR)

### 2.2 Meta Descriptions

**Regra:** Cada pagina deve ter uma meta description unica, de 1-2 frases curtas.

- Resumir o conteudo mais relevante da pagina
- Evitar descricoes genericas repetidas
- NAO usar `<meta name="keywords">` (Google ignora completamente)

**Implementacao:** `SEO.jsx` linha 40 injeta `<meta name="description">` por rota.

### 2.3 Headings (h1-h6)

**Regra:** Hierarquia semantica correta, sem pular niveis.

```
h1 > h2 > h3 (correto)
h1 > h3 (incorreto - pulou h2)
```

- Cada pagina deve ter exatamente **1 h1**
- Usar headings para estruturar o conteudo, nao para estilizar

### 2.4 URLs

**Regra:** URLs descritivas com palavras significativas.

```
Bom:  /arquitetura-interiores-vila-nova-conceicao
Ruim: /pg123?id=456
```

**Implementado:**
- `vercel.json` redireciona trailing slashes (301)
- `vercel.json` redireciona www para non-www (301)

### 2.5 Canonical URLs

**Regra:** Cada conteudo acessivel por apenas uma URL. Usar `rel="canonical"`.

**Implementado:**
- `SEO.jsx` injeta canonical dinamico por rota
- `index.html` tem fallback canonical via script inline

### 2.6 Links Internos

**Regra:** Texto ancora (anchor text) deve ser descritivo.

```
Bom:  <a href="/processo">Veja nosso processo de trabalho</a>
Ruim: <a href="/processo">Clique aqui</a>
```

- Usar `rel="nofollow"` em links externos nao confiaveis
- Links internos estrategicos entre paginas relacionadas

---

## 3. Performance (Core Web Vitals)

### 3.1 LCP (Largest Contentful Paint)

**Meta:** <= 2.5s | **Metrica:** Tempo ate o maior elemento visivel renderizar

**O que fazer:**
- Preload do hero image no `<head>` (`<link rel="preload">`)
- Compressao de imagens (WebP, quality 80)
- Evitar CSS e JS bloqueantes no caminho critico
- Fontes com `font-display: swap` e preconnect

**Implementado no projeto:**
- Hero poster com preload
- Fontes async via `media="print"` hack
- Analytics deferidos ate interacao do usuario

### 3.2 CLS (Cumulative Layout Shift)

**Meta:** <= 0.1 | **Metrica:** Estabilidade visual da pagina

**Fonte:** [Optimize CLS - web.dev](https://web.dev/articles/optimize-cls)

**Causas comuns e solucoes:**

| Causa | Solucao |
|---|---|
| Imagens sem dimensoes | Adicionar `width` e `height` em TODOS os `<img>` |
| Web fonts | `font-display: swap` + preload |
| Conteudo inserido dinamicamente | Reservar espaco com `min-height` ou `aspect-ratio` |
| Animacoes que mudam layout | Usar apenas `transform` e `opacity` (nunca `top/left/width/height`) |

**Regra para o projeto:**
```jsx
// CORRETO - imagem com dimensoes
<img src="foto.webp" width="800" height="600" alt="Sala de estar" loading="lazy" />

// CORRETO - aspect-ratio via CSS
<div className="aspect-[4/3]">
  <img src="foto.webp" alt="Sala de estar" className="w-full h-full object-cover" />
</div>

// ERRADO - sem dimensoes
<img src="foto.webp" alt="Sala de estar" />
```

### 3.3 INP (Interaction to Next Paint)

**Meta:** <= 200ms | **Metrica:** Responsividade a interacao

**O que fazer:**
- Evitar tarefas longas no main thread
- Code splitting para carregar apenas o necessario
- Defer scripts nao essenciais

### 3.4 Peso Total da Pagina (Total Byte Weight)

**Fonte:** [Total Byte Weight - Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/)

**Meta:** < 1.600 KiB por pagina | **Alerta Lighthouse:** > 5.000 KiB

**Regras:**
- Comprimir todos os assets com Gzip/Brotli (configurado via `vite-plugin-compression2`)
- Code splitting por rota (configurado no `vite.config.js`)
- Lazy loading de imagens abaixo do fold
- Cache agressivo para assets com hash (`assets/[name]-[hash].js`)

### 3.5 Cadeia de Requisicoes Criticas

**Fonte:** [Critical Request Chains - Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/)

**Regra:** Minimizar profundidade de dependencias sequenciais.

**O que fazer:**
1. Preload de recursos criticos: `<link rel="preload" as="font" href="..." crossorigin>`
2. Preconnect para dominios externos: `<link rel="preconnect" href="https://fonts.googleapis.com">`
3. Nao encadear: HTML -> CSS -> Font -> Render (use preload para paralelizar)

### 3.6 Caminho Critico de Renderizacao

**Fonte:** [Critical Rendering Path - web.dev](https://web.dev/learn/performance/understanding-the-critical-path)

**Sequencia do navegador:**
1. Constroi DOM (HTML)
2. Constroi CSSOM (CSS) -- **bloqueante**
3. Executa JS -- **bloqueante se nao async/defer**
4. Render tree -> Layout -> Paint

**Regras para o projeto:**
- Scripts com `type="module"` (Vite ja faz)
- CSS critico inline no `<head>` (above-the-fold)
- Fontes e analytics nao bloqueiam render (ja implementado)

---

## 4. Imagens

### 4.1 Formato e Compressao

**Fonte:** [Optimized Images - Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/)

| Regra | Detalhe |
|---|---|
| Formato preferido | **WebP** (ou AVIF para navegadores compatíveis) |
| Qualidade JPEG | 80-85 (diminishing returns acima disso) |
| Qualidade WebP | 80 com effort 6 |
| Limiar Lighthouse | Sinaliza se economia potencial >= 4 KiB |

### 4.2 Lazy Loading

```jsx
// Imagens abaixo do fold
<img src="foto.webp" loading="lazy" width="800" height="600" alt="Descricao" />

// Imagem hero (acima do fold) - NAO usar lazy, usar preload
<link rel="preload" as="image" href="/images/hero-poster-960-opt.webp" />
<img src="/images/hero-poster-960-opt.webp" width="960" height="540" alt="Hero" />
```

### 4.3 Responsive Images

```html
<picture>
  <source srcset="foto-640.webp 640w, foto-960.webp 960w, foto-1280.webp 1280w" type="image/webp" />
  <img src="foto-960.webp" width="960" height="540" alt="Sala de estar moderna" loading="lazy" />
</picture>
```

### 4.4 Alt Text

**Regra:** TODA imagem deve ter alt text descritivo e contextual.

```
Bom:  alt="Sala de estar com marcenaria sob medida em carvalho - Projeto Vila Nova Conceicao"
Ruim: alt="imagem"
Ruim: alt="" (vazio)
OK:   alt="" apenas para imagens puramente decorativas (icones, separadores)
```

### 4.5 Compressao Automatica no Build

Os scripts `tools/generate-style-webp-from-svg.mjs` e `tools/recompress-critical-images.mjs` tratam ativos pesados:
- Geram `.webp` reais a partir de SVGs com imagem embutida em base64
- Comprime JPG (mozjpeg quality 80)
- Comprime PNG (palette, compression 9)
- Comprime WebP (quality 80, effort 6)
- Pula arquivos < 2 KB
- So reescreve se economizar > 5%

### 4.6 Regra para Frontmatter e Assets

- Nunca publicar frontmatter com `image` apontando para arquivo inexistente
- Validar assets com `npm run seo:audit` antes de concluir uma rodada
- Quando um SVG carregar foto em base64, tratar como imagem raster e gerar ativo otimizado separado
- Versionar os derivados otimizados necessários para produção sem abrir versionamento de fontes legadas desnecessárias

---

## 5. CSS e JavaScript

### 5.1 CSS Nao Utilizado

**Fonte:** [Unused CSS Rules - Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/)

**Limiar:** Lighthouse sinaliza folhas de estilo com >= 2 KiB nao usado

**Implementado no projeto:**
- Tailwind CSS com purge automatico via `content` no `tailwind.config.js`
- Escaneia `./src/**/*.{js,jsx}` para classes usadas
- Em producao, apenas classes referenciadas sao incluidas

**Verificacao:** Use a aba Coverage do Chrome DevTools para auditoria.

### 5.2 JavaScript Nao Utilizado

**Fonte:** [Unused JavaScript - Lighthouse](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/)

**Limiar:** Lighthouse sinaliza arquivos com >= 20 KiB nao utilizado

**Regras:**
- Todas as paginas devem usar `React.lazy()` + `Suspense`
- Framer Motion: usar `LazyMotion` + `m` em vez de `motion` para reduzir bundle
- Tree-shaking automatico pelo Vite em producao
- Supabase e-loaded como vendor chunk separado

**Analise de bundle:** `yarn analyze` gera `stats.html` com visualizacao interativa.

### 5.3 Code Splitting (vite.config.js)

```
vendor-react     React, React DOM, React Router (critico)
vendor-ui        Radix UI (componentes de interface)
vendor-supabase  Supabase (lazy-loaded)
vendor-motion    Framer Motion (deferido)
vendor-icons     Lucide icons (separado)
```

---

## 6. Acessibilidade (Contraste de Cores)

**Fonte:** [Color Contrast - axe/WCAG](https://dequeuniversity.com/rules/axe/4.11/color-contrast)

### 6.1 Requisitos WCAG 2.1 AA

| Tipo de texto | Ratio minimo |
|---|---|
| Texto normal (< 18pt ou < 14pt bold) | **4.5:1** |
| Texto grande (>= 18pt ou >= 14pt bold) | **3:1** |

### 6.2 Paleta WG Almeida - Verificacao de Contraste

| Cor | Hex | Sobre branco | Sobre preto (#2E2E2E) |
|---|---|---|---|
| wg-orange | #F25C26 | 3.5:1 (falha p/ texto pequeno) | 4.0:1 |
| wg-green | #5E9B94 | 3.0:1 (falha) | 4.7:1 |
| wg-blue | #2B4580 | 7.3:1 (passa) | 1.9:1 (falha) |
| wg-black | #2E2E2E | 11.6:1 (passa) | - |
| wg-gray | #4C4C4C | 7.5:1 (passa) | - |

### 6.3 Regras Praticas

- **Texto sobre hero escuro:** Usar `text-white` (21:1 contra preto)
- **Botoes CTA:** Branco com texto escuro (maximo contraste) ou wg-blue (#2B4580) com branco
- **Texto sobre imagens:** Sempre usar overlay escuro (`bg-black/50`) ou `text-shadow`
- **Evitar:** wg-orange ou wg-green como cor de fundo com texto branco (falha WCAG)

### 6.4 Botao Primario (Hero)

**Antes:** Fundo amarelo/laranja com texto branco (falha contraste)
**Depois:** Fundo branco com texto escuro (#2E2E2E) - ratio 21:1 (maximo)

```css
.wg-btn-pill-primary {
  @apply bg-white text-wg-black shadow-lg hover:bg-gray-100 hover:text-wg-black;
}
```

---

## 7. Dados Estruturados (JSON-LD)

### 7.1 Schemas Implementados

| Schema | Local | Funcao |
|---|---|---|
| Organization | `index.html` | Informacoes da empresa, logo, redes sociais |
| ProfessionalService | `index.html` | SEO local com areas atendidas por bairro |
| BreadcrumbList | `index.html` | Navegacao estruturada |
| FAQPage | `index.html` | Perguntas/respostas nos SERPs |
| Article | `SEO.jsx` | Rich results para posts do blog |
| Service | `SEO.jsx` | Descricao de servicos |

### 7.2 Validacao

Sempre validar schemas em: https://search.google.com/test/rich-results

### 7.3 Pendencia

O BreadcrumbList no `index.html` e estatico. Idealmente deve ser gerado dinamicamente por rota no `SEO.jsx`.

---

## 8. Rastreabilidade e Indexacao

### 8.1 robots.txt

**Local:** `public/robots.txt`
- Allow para Googlebot nas areas publicas
- Disallow para `/admin`, `/account`, `/login`
- Crawl-delay diferenciado por bot

### 8.2 Sitemap XML

**Local:** `public/sitemap.xml`
- 40+ URLs organizadas por categoria
- Referenciado no `robots.txt`
- Gerado/atualizado pelo script `build-seo-routes.mjs`

**Pendencia:** Incluir TODOS os posts de blog individuais no sitemap.

### 8.3 Pre-rendering (SPA)

O projeto usa `vite-plugin-prerender` com Puppeteer para gerar HTML estatico das rotas principais no build. Isso resolve o problema de SPAs com Googlebot.

**Importante:** A variavel `ENABLE_LEGACY_PRERENDER=true` deve estar ativa em producao.

### 8.4 Erros no Console

**Fonte:** [Errors in Console - Lighthouse](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)

**Regra:** Zero erros no console em producao.

- Todas as chamadas Supabase devem ter `try/catch`
- Verificar que imagens referenciadas existem (evitar 404s)
- `useEffect` com fetch devem ter cleanup e tratamento de erro
- Componentes `claudeClient.js` e `emailService.js` devem tratar falhas de API

---

## 9. Internacionalizacao

### 9.1 hreflang (PENDENTE - ALTA PRIORIDADE)

O projeto tem conteudo em 3 idiomas (`pt-BR`, `en`, `es`) mas falta implementar tags `hreflang`.

**O que fazer:** Adicionar no `SEO.jsx`:

```html
<link rel="alternate" hreflang="pt-BR" href="https://grupowgalmeida.com.br/blog/briefing-projeto" />
<link rel="alternate" hreflang="en" href="https://grupowgalmeida.com.br/blog/en/briefing-projeto" />
<link rel="alternate" hreflang="es" href="https://grupowgalmeida.com.br/blog/es/briefing-projeto" />
<link rel="alternate" hreflang="x-default" href="https://grupowgalmeida.com.br/blog/briefing-projeto" />
```

### 9.2 Atributo lang

**Implementado:** `<html lang="pt-BR">` no `index.html` e atualizado via Helmet por idioma.

---

## 10. Checklist de Auditoria

### Antes de Cada Deploy

- [ ] Build sem erros (`npm run build`)
- [ ] `npm run seo:audit` sem arquivos ausentes
- [ ] Zero erros no console do navegador
- [ ] Smoke test em preview local do build concluído
- [ ] Lighthouse Performance >= 90
- [ ] Lighthouse Accessibility >= 90
- [ ] Lighthouse SEO >= 95
- [ ] Lighthouse Best Practices >= 90

### Ao Criar Nova Pagina

- [ ] Title unico e descritivo
- [ ] Meta description unica (1-2 frases)
- [ ] Canonical URL configurada
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Schema JSON-LD se aplicavel
- [ ] h1 unico e relevante
- [ ] Imagens com alt text, width, height
- [ ] Imagens em WebP
- [ ] Rota adicionada ao sitemap
- [ ] Links internos para/de paginas relacionadas

### Ao Adicionar Imagens

- [ ] Formato WebP (preferido) ou JPEG comprimido
- [ ] `width` e `height` definidos
- [ ] `alt` descritivo e contextual
- [ ] `loading="lazy"` se abaixo do fold
- [ ] Tamanho maximo: 200 KB para thumbnails, 500 KB para full-size
- [ ] Versoes responsivas se hero/banner (640, 960, 1280)

### Ao Criar Post de Blog

- [ ] URL slug descritiva em portugues
- [ ] Schema Article com author, datePublished, image
- [ ] Imagem de capa em WebP (1280x720 minimo)
- [ ] Versoes em EN e ES com hreflang correto
- [ ] Links internos para servicos relacionados
- [ ] Post adicionado ao sitemap

---

## 11. Comandos Uteis

```bash
# Preparar assets de estilos (.webp a partir de SVG)
npm run assets:prepare

# Build completo (assets + OG images + Vite + image optimization + SEO routes)
npm run build

# Analise visual do bundle
npm run analyze

# Auditoria SEO
npm run seo:audit

# Validar dist após build
npm run seo:validate:dist

# Relatório de assets pesados
npm run perf:assets

# Recompressão manual da saída
npm run perf:images

# Preview local do build
npm run preview

# Testes
npm run test:run
```

**Observação operacional:** `npm run perf:images` não faz parte do build obrigatório. Em Windows, a recompressão sobre `dist` pode sofrer lock/rename temporário; usar apenas como etapa manual e validada.

**Observação operacional 2:** o build principal já executa a poda segura de SVGs redundantes em `dist/images/estilos/` quando existe `.webp` correspondente. Essa poda reduz peso de deploy sem apagar os arquivos-fonte em `public`.

---

## 12. Fontes e Referencias

### Google

- [Google SEO Starter Guide (pt-BR)](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=pt_BR)
- [Google Search Console](https://search.google.com/search-console)
- [Rich Results Test](https://search.google.com/test/rich-results)

### Lighthouse / Chrome DevTools

- [Unused CSS Rules](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/)
- [Unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/)
- [Total Byte Weight](https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/)
- [Optimized Images](https://developer.chrome.com/docs/lighthouse/performance/uses-optimized-images/)
- [Critical Request Chains](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/)
- [Errors in Console](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)

### web.dev

- [Optimize CLS](https://web.dev/articles/optimize-cls)
- [Understanding the Critical Path](https://web.dev/learn/performance/understanding-the-critical-path)

### Acessibilidade

- [Color Contrast (axe 4.11)](https://dequeuniversity.com/rules/axe/4.11/color-contrast)
- [WCAG 2.1 - Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## Gaps Identificados (Prioridade)

| Prioridade | Gap | Status |
|---|---|---|
| **ALTA** | Implementar tags `hreflang` para blog multilingual | Pendente |
| **ALTA** | BreadcrumbList dinamico por pagina (nao estatico) | Pendente |
| **MEDIA** | Alt text vazio no HeroVideo e PremiumCinematicIntro | Pendente |
| **MEDIA** | Remover `<meta name="keywords">` do index.html | Pendente |
| **MEDIA** | Revisar peso dos vídeos do hero e trocar estratégia de entrega | Pendente |
| **MEDIA** | Verificar pre-rendering ativo em producao | Verificar |
| **MEDIA** | Reduzir dependência de SVGs com payload raster embutido | Pendente |
| **BAIXA** | `lastmod` correto por pagina no sitemap | Pendente |
| **BAIXA** | Auditoria completa de anchor texts internos | Pendente |

---

*Este documento deve ser atualizado conforme novas melhorias sao implementadas.*
