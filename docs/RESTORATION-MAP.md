# Mapa de Restauracao do Site WG Almeida

Atualizado em: 06/04/2026
Projeto: `site-wgalmeida`

## Objetivo

Este arquivo organiza a restauracao do site em quatro frentes:

- rotas e paginas
- conteudo editorial
- assets e imagens
- inconsistencias e riscos

Referencia complementar:

- `docs/SITE-INVENTORY.md`

## 1. Rotas principais do site

Rotas carregadas em `src/App.jsx`:

- `/`
- `/sobre`
- `/a-marca`
- `/arquitetura`
- `/engenharia`
- `/marcenaria`
- `/projetos`
- `/processo`
- `/depoimentos`
- `/contato`
- `/solicite-proposta`
- `/solicite-sua-proposta` -> redirect
- `/blog`
- `/blog/:slug`
- `/faq`
- `/revista-estilos`
- `/estilos/:slug`
- `/moodboard`
- `/moodboard-generator`
- `/gerador-moodboard` -> redirect
- `/room-visualizer`
- `/visualizador-ambientes` -> redirect

Landings comerciais:

- `/construtora-alto-padrao-sp`
- `/reforma-apartamento-sp`
- `/arquitetura-corporativa`
- `/obra-turn-key`
- `/reforma-apartamento-itaim`
- `/reforma-apartamento-jardins`
- `/construtora-brooklin`
- `/marcenaria-sob-medida-morumbi`
- `/arquitetura-interiores-vila-nova-conceicao`

Landings regionais:

- `/brooklin`
- `/vila-nova-conceicao`
- `/itaim`
- `/jardins`
- `/cidade-jardim`
- `/morumbi`
- `/vila-mariana`
- `/mooca`
- `/alto-de-pinheiros`
- `/moema`
- `/campo-belo`
- `/higienopolis`
- `/pinheiros`
- `/perdizes`
- `/paraiso`
- `/aclimacao`

Produtos do ecossistema WG no mesmo site:

- `/easylocker`
- `/buildtech`
- `/obraeasy`
- `/easyrealstate`

## 2. Mapa de recuperacao por area

### Home

Arquivos principais:

- `src/pages/Home.jsx`
- `src/components/home/SanfonaHero.jsx`
- `src/components/home/HomeColorTransformer.jsx`

Fontes paralelas de recuperacao:

- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/01_01_home_topo.png`
- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/02_02_hero_scroll.png`
- `site-wglmeida-blog-imagens/index.html`

Riscos encontrados:

- `SanfonaHero.jsx` usa imagens externas do Unsplash
- `HomeColorTransformer.jsx` usa imagens externas do Unsplash

### Sobre e marca

Arquivos principais:

- `src/pages/About.jsx`
- `src/pages/AMarca.jsx`

Fontes paralelas:

- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/04_04_sobre_section.png`
- `site-wglmeida-blog-imagens/sobre` se existir no snapshot consolidado

### Projetos

Arquivos principais:

- `src/pages/Projects.jsx`
- `src/components/ProjectGallery.jsx`
- `src/components/ProjectCarousel.jsx`

Fontes paralelas:

- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/05_05_projetos_section.png`
- `site-wglmeida-blog-imagens/projetos_mobile.png` e `projetos_desktop.png` no projeto

Risco:

- `RETURN-POINT.md` registra falta de acervo real em `/images/projects/`

### Depoimentos

Arquivos principais:

- `src/pages/Testimonials.jsx`
- `src/components/GoogleReviewsBadge.jsx`

Fontes paralelas:

- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/06_06_depoimentos_section.png`
- `site-wglmeida-blog-imagens/depoimentos/index.html`
- `public/data/google-reviews.json`
- `site-wglmeida-blog-imagens/data/google-reviews.json`

Risco:

- `GoogleReviewsBadge.jsx` ainda referencia `https://www.grupowgalmeida.com.br`

### Contato

Arquivos principais:

- `src/pages/Contact.jsx`
- `src/components/layout/Footer.jsx`

Fontes paralelas:

- `23_20260314_Portfolio-Docs/screenshots/site-wgalmeida/07_07_contato_section.png`
- `site-wglmeida-blog-imagens/contato/index.html`

Dados localizados:

- WhatsApp recorrente: `5511984650002`
- E-mail recorrente: `contato@wgalmeida.com.br`

### FAQ

Arquivos principais:

- `src/pages/FAQ.jsx`

Fontes paralelas:

- `site-wglmeida-blog-imagens/faq/index.html`

### Engenharia e marcenaria

Arquivos principais:

- `src/pages/Engineering.jsx`
- `src/pages/Carpentry.jsx`

Fontes paralelas:

- `site-wglmeida-blog-imagens/engenharia/index.html`
- `site-wglmeida-blog-imagens/marcenaria/index.html`

Risco:

- `Engineering.jsx` usa imagem externa do Unsplash

## 3. Conteudo editorial

### Blog Markdown ativo

Fonte principal:

- `src/content/blog/`

Total:

- 68 posts

Posts com alto valor comercial ou institucional:

- `o-que-e-turn-key.md`
- `projeto-executivo-o-que-e.md`
- `memorial-executivo-obra.md`
- `etapas-reforma-completa.md`
- `quanto-custa-reformar-apartamento-2026.md`
- `quanto-tempo-dura-reforma-apartamento.md`
- `marcenaria-sob-medida.md`
- `marcenaria-sob-medida-tendencias-2026.md`
- `obraeasy-como-funciona-para-clientes-finais.md`
- `obraeasy-para-parceiros-imobiliarias-corretores.md`
- `liz-curadoria-wg-almeida.md`
- `onboarding-processo-wg-almeida.md`

### Snapshot HTML do blog

Fonte paralela:

- `site-wglmeida-blog-imagens/blog/`

Total de diretorios HTML localizados:

- 64

Uso recomendado:

- comparar o que existe em Markdown com o snapshot HTML
- detectar posts que sumiram do front atual
- recuperar imagens, headings, CTA e estrutura antiga

## 4. Assets e imagens

### Fonte principal

- `public/images/`

Subpastas:

- `banners`
- `blog`
- `estilos`

Assets base:

- `hero-poster*.webp`
- `hero-region.webp`
- `logo*.webp`
- `logo.png`
- `icone.png`
- `icone.webp`
- `og-image.webp`
- `placeholder*.webp`

### Fontes paralelas

- `site-wglmeida-blog-imagens/images/`
- `site-wgalmeida/banners/`
- `site-wgalmeida/Post Instragram WG/`

Uso recomendado:

- comparar nome por nome com `public/images/`
- copiar apenas o que for confirmado como pertencente ao site

## 5. Dependencias externas a revisar

Dependencias externas de imagem identificadas:

- `src/pages/regions/*.jsx` usam `https://images.unsplash.com/...`
- `src/components/home/SanfonaHero.jsx` usa Unsplash
- `src/components/home/HomeColorTransformer.jsx` usa Unsplash
- `src/components/moodboard/ColorTransformer.jsx` usa Unsplash
- `src/components/moodboard/InteractivePreview.jsx` usa Unsplash
- `src/components/moodboard-generator/CoverPage.jsx` usa Unsplash
- `src/pages/ConstrutoraAltoPadraoSP.jsx` usa Unsplash
- `src/pages/ConstrutoraBrooklin.jsx` usa Unsplash
- `src/pages/ReformaApartamentoItaim.jsx` usa Unsplash
- `src/pages/ReformaApartamentoJardins.jsx` usa Unsplash
- `src/pages/Store.jsx` usa Unsplash
- `src/pages/Process.jsx` usa Unsplash
- `src/pages/Engineering.jsx` usa Unsplash

Motivo de atencao:

- se o objetivo e recuperar um acervo proprio do site, essas dependencias mascaram a falta de midia proprietaria

## 6. Inconsistencias objetivas

### Dominio divergente

Arquivo:

- `src/components/GoogleReviewsBadge.jsx`

Achado:

- URL `https://www.grupowgalmeida.com.br`

Esperado:

- `https://wgalmeida.com.br`

### CTA legado

Arquivo:

- `src/content/blog/obraeasy-como-funciona-para-clientes-finais.md`

Achado:

- usa `https://wgalmeida.com.br/solicite-sua-proposta`

Contexto:

- a rota ainda existe, mas hoje redireciona para `/solicite-proposta`

## 7. Ordem de trabalho recomendada

### Fase 1

- comparar `src/content/blog` com `site-wglmeida-blog-imagens/blog`
- identificar posts faltantes ou divergentes

### Fase 2

- comparar `public/images` com `site-wglmeida-blog-imagens/images`
- listar imagens faltantes ou variantes mais antigas

### Fase 3

- revisar cada pagina institucional principal contra screenshots do portfolio
- `home`
- `sobre`
- `projetos`
- `depoimentos`
- `contato`
- `footer`

### Fase 4

- substituir gradualmente imagens externas do Unsplash por acervo proprio recuperado

## 8. Proximo entregavel

Gerar um arquivo `CONTENT-DIFF.md` com:

- post atual
- slug
- existe no snapshot HTML: sim ou nao
- imagem atual
- CTA atual
- links internos principais
- observacao de restauracao
