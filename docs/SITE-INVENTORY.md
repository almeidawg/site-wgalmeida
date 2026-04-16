# Inventario do Site WG Almeida

Atualizado em: 06/04/2026
Projeto: `site-wgalmeida`
Fonte canonica: `site-wgalmeida/site-wgalmeida`

## Fonte principal

Codigo ativo:

- `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\_Grupo_WG_Almeida\site-wgalmeida\site-wgalmeida`

Referencias de governanca:

- `_README_ONBOARDING\FONTE-UNICA-OPERACIONAL.md`
- `site-wgalmeida\site-wgalmeida\RETURN-POINT.md`

Observacao:

- A pasta `site-wgalmeida\site-wgalmeida` e a arvore de runtime/deploy local com `src`, `public`, `.vercel`, `dist` e `package.json`.
- Existem sinais documentados de variantes `repo-clean` e `repo-fixed`, mas a base operacional atual encontrada no disco e esta arvore.

## Estrutura interna do projeto

Diretorios principais:

- `src/`
- `public/`
- `api/`
- `dist/`
- `screenshots/`
- `site-wglmeida-blog-imagens/`
- `plugins/`

Blocos de codigo relevantes:

- `src/pages/` paginas e landings
- `src/components/` componentes institucionais, galerias, hero, SEO e widgets
- `src/content/` conteudo editorial
- `src/data/` SEO, schema e dados auxiliares
- `src/i18n/` textos estruturados
- `src/services/` integracoes como Cloudinary, Stability e fluxos auxiliares
- `api/` funcoes Vercel para leads, analytics, campanhas e reviews

## Paginas encontradas

Paginas institucionais e comerciais em `src/pages/`:

- `Home.jsx`
- `About.jsx`
- `AMarca.jsx`
- `Architecture.jsx`
- `Engineering.jsx`
- `Carpentry.jsx`
- `Projects.jsx`
- `Process.jsx`
- `Contact.jsx`
- `FAQ.jsx`
- `Testimonials.jsx`
- `Blog.jsx`
- `RevistaEstilos.jsx`
- `SoliciteProposta.jsx`
- `ObraTurnKey.jsx`
- `ConstrutoraAltoPadraoSP.jsx`
- `ConstrutoraBrooklin.jsx`
- `ReformaApartamentoSP.jsx`
- `ReformaApartamentoItaim.jsx`
- `ReformaApartamentoJardins.jsx`
- `MarcenariaSobMedidaMorumbi.jsx`
- `ArquiteturaInterioresVilaNovaConceicao.jsx`

Ferramentas e modulos internos:

- `Moodboard.jsx`
- `MoodboardGenerator.jsx`
- `RoomVisualizer.jsx`
- `Store.jsx`
- `Admin.jsx`
- `Account.jsx`
- `Login.jsx`
- `Register.jsx`

Landing pages regionais em `src/pages/regions/`:

- `Aclimacao`
- `AltoDePinheiros`
- `Brooklin`
- `CampoBelo`
- `CidadeJardim`
- `Higienopolis`
- `Itaim`
- `Jardins`
- `Moema`
- `Mooca`
- `Morumbi`
- `Paraiso`
- `Perdizes`
- `Pinheiros`
- `VilaMariana`
- `VilaNovaConceicao`

## Conteudo editorial preservado

Blog em `src/content/blog/`:

- 68 artigos Markdown ativos
- Exemplos:
  - `arquitetura-alto-padrao.md`
  - `automacao-residencial-2026-guia.md`
  - `bim-construcao-civil-como-funciona.md`
  - `o-que-e-turn-key.md`
  - `projeto-executivo-o-que-e.md`
  - `quanto-custa-reformar-apartamento-2026.md`
  - `sustentabilidade-construcao-civil-2026.md`
  - `tendencias-construcao-civil-2026.md`
  - `tendencias-decoracao-interiores-2026.md`
  - `obraeasy-como-funciona-para-clientes-finais.md`
  - `obraeasy-para-parceiros-imobiliarias-corretores.md`
  - `liz-curadoria-wg-almeida.md`

Guias de estilo em `src/content/estilos/`:

- 31 arquivos Markdown
- Exemplos:
  - `art-deco.md`
  - `classico.md`
  - `escandinavo.md`
  - `industrial.md`
  - `japandi.md`
  - `minimalismo.md`
  - `moderno.md`
  - `wabi-sabi.md`

Observacao:

- Parte do blog tambem existe em versoes `es/` dentro do conteudo, indicando camada editorial multilingue parcial.

## Assets ativos do site

Pasta principal:

- `public/images/`

Subpastas localizadas:

- `public/images/banners/`
- `public/images/blog/`
- `public/images/estilos/`

Assets base importantes:

- `public/images/logo.png`
- `public/images/logo.webp`
- `public/images/logo-96.webp`
- `public/images/logo-192.webp`
- `public/images/icone.png`
- `public/images/icone.webp`
- `public/images/hero-poster.webp`
- `public/images/hero-poster-640.webp`
- `public/images/hero-poster-960.webp`
- `public/images/hero-poster-960-opt.webp`
- `public/images/hero-poster-1280.webp`
- `public/images/hero-region.webp`
- `public/images/og-image.webp`
- `public/images/placeholder.webp`
- `public/images/placeholder-product.webp`
- `public/images/wg-bullet.svg`

Outros assets relevantes:

- `public/data/google-reviews.json`
- `public/og-*.jpg`
- `public/sitemap.xml`
- `public/sitemap-index.xml`
- `public/video-sitemap.xml`
- `public/robots.txt`

## Reservatorios paralelos para recuperacao

### 1. Snapshot estatico do site

Pasta:

- `site-wgalmeida\site-wgalmeida\site-wglmeida-blog-imagens`

O que existe ali:

- 64 diretorios de rotas e conteudos estaticos
- snapshots HTML de seções e paginas do site
- copia de assets em `images/`, `Logos/` e `data/`

Rotas HTML encontradas:

- `blog/`
- `faq/`
- `contato/`
- `engenharia/`
- `marcenaria/`
- `depoimentos/`
- `itaim/`
- `jardins/`
- `moema/`
- `higienopolis/`
- `easylocker/`

Posts HTML estaticos encontrados:

- `automacao-residencial-2026-guia`
- `bancada-cozinha-ergonomia`
- `bim-construcao-civil-como-funciona`
- `erros-comuns-reforma-como-evitar`
- `etapas-prazos-projeto-arquitetonico`
- `etapas-reforma-completa`
- `iluminacao-residencial-guia-completo`
- `iluminacao-tecnica-rasgo-de-luz`
- `importancia-contratar-arquiteto`
- `informe-obra-condominio`
- `memorial-executivo-obra`
- `moodboard-mapa-visual`
- `normas-tecnicas-representacao`
- `o-que-e-turn-key`
- `paleta-cores-2026-cor-do-ano`
- `plantas-interiores-purificam-ar`
- `projeto-executivo-o-que-e`
- `quanto-custa-reformar-apartamento-2026`
- `quanto-tempo-dura-reforma-apartamento`

Uso recomendado:

- recuperar markup, textos antigos, slugs e assets que nao estejam mais no front atual

### 2. Pasta externa de banners

Pasta:

- `site-wgalmeida\banners`

Uso recomendado:

- comparar com `public/images/banners/`
- verificar artes nao incorporadas ao projeto atual

### 3. Pasta externa de posts para Instagram

Pasta:

- `site-wgalmeida\Post Instragram WG`

Uso recomendado:

- reaproveitar criativos, copies e temas para blog, social e paginas comerciais

### 4. Screenshots documentais

Pasta:

- `23_20260314_Portfolio-Docs\screenshots\site-wgalmeida`

Capturas encontradas:

- `01_01_home_topo.png`
- `02_02_hero_scroll.png`
- `03_03_servicos_section.png`
- `04_04_sobre_section.png`
- `05_05_projetos_section.png`
- `06_06_depoimentos_section.png`
- `07_07_contato_section.png`
- `08_08_footer.png`
- `09_09_mobile_view.png`
- `10_10_tablet_view.png`

Uso recomendado:

- reconstruir layout, ordem de seções e estados antigos do front

### 5. Documento de portfolio

Arquivo:

- `23_20260314_Portfolio-Docs\docs\03_site-wgalmeida.md`

Uso recomendado:

- recuperar discurso institucional, escopo, funcionalidades e framing comercial do projeto

## Links e integracoes identificados

Dominio principal:

- `https://wgalmeida.com.br`

Links institucionais e sociais localizados:

- Instagram: `https://www.instagram.com/wgalmeida.arq`
- Facebook: `https://www.facebook.com/wgalmeidaarquitetura`
- LinkedIn: `https://www.linkedin.com/company/wgalmeida`
- WhatsApp institucional usado em paginas: `https://wa.me/5511984650002`
- Email institucional localizado: `contato@wgalmeida.com.br`

Integracoes tecnicas vistas no codigo:

- Supabase
- Cloudinary
- Google Analytics
- Google Reviews
- Google Tag Manager
- Pinterest Ads
- Meta Ads
- Stability AI
- EmailJS

## Achados de risco ou inconsistencia

- Varias paginas regionais usam imagens externas do Unsplash em vez de acervo proprio.
- `HeroVideo` esta preparado, mas o `RETURN-POINT` registra ausencia dos videos finais.
- O snapshot `site-wglmeida-blog-imagens` pode conter material util que nao esta mais conectado ao front atual.
- O componente `GoogleReviewsBadge` ainda referencia `https://www.grupowgalmeida.com.br`, o que merece revisao de consistencia.
- Ha conteudo comercial cruzado de outros produtos WG dentro do site, como `ObraEasy`, `EasyRealState`, `EasyLocker` e `Wno Mas`.

## Prioridade de recuperacao

1. Cruzar `src/content/blog` com `site-wglmeida-blog-imagens/blog`
2. Cruzar `public/images/banners` com `site-wgalmeida\banners`
3. Cruzar `public/images` com `site-wglmeida-blog-imagens/images`
4. Revisar paginas regionais que usam Unsplash
5. Revisar `Post Instragram WG` para reaproveitamento de temas e artes
6. Revisar screenshots do portfolio para conferir estrutura visual historica

## Proximo passo recomendado

Gerar um segundo inventario orientado a restauracao com quatro tabelas:

- pagina -> componentes -> assets
- post -> slug -> imagem -> links internos
- asset -> origem atual -> origem paralela
- inconsistencias -> impacto -> acao de correcao
