# RETURN-POINT — site-wgalmeida
**Atualizado:** 08/04/2026 (sessão continuação)
**Deploy:** wgalmeida.com.br ✅ EM PRODUÇÃO — último deploy 08/04

---

## Estado atual

- Deploy ao vivo: wgalmeida.com.br (Vercel) — versão de 07/04 noite
- Projeto Vercel: site-wgalmeida-repo-fixed (prj_c5G5oZHW6QP3d9kub156RcrFVHVt)
- Preview local: `npx serve -s dist -l 3010` → http://localhost:3010

## Fonte institucional obrigatória antes de alterar conteúdo

- `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\00_CORE\05_MARCA_E_MARKETING\_I`

---

## Correções aplicadas em 08/04

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

### P3 — Fotos de projetos do portfólio
- Fotos disponíveis em `Imagens/IMAGENS-INSTAGRAM-COM MOLDURA - SITE WG/` (180 fotos)
- Organizar por categoria (ARQ, ENG, MARC) → `public/images/projects/`
- Remover espaços e acentos dos nomes de arquivo

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
