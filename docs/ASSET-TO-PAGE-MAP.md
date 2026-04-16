# ASSET-TO-PAGE-MAP

## Objetivo

Relacionar as rotas principais do site WG Almeida com:

- assets locais que ja existem;
- assets referenciados no codigo que estao ausentes no runtime;
- dependencias externas temporarias;
- fontes provaveis de reposicao.

Base analisada:

- `src/App.jsx`
- `src/pages`
- `src/components`
- `public/images`
- `site-wglmeida-blog-imagens`
- `..\banners`
- `..\Post Instragram WG`

## Observacao estrutural importante

O ambiente central local de IA existe em:

- `C:\AI`

Pastas confirmadas:

- `contexto-ia`
- `Core`
- `Dashboard`
- `Knowledge`
- `Memory`
- `Scripts`
- `Projects`

Leitura pratica:

- a operacao WG ja tem infraestrutura para sincronizacao, memoria, automacao e IA local;
- isso ajuda a organizar acervo, naming e pipeline;
- mesmo assim, os assets finais do site nao devem ser servidos direto do Drive ou da camada interna de IA;
- o site deve consumir apenas URLs publicas otimizadas.

## Estado atual do runtime

Assets confirmados no runtime:

- `public/images`: existe
- `public/images/blog`: existe
- `public/images/estilos`: existe
- `public/images/banners`: existe

Assets referenciados no codigo mas ausentes no runtime:

- `public/images/imagens`: ausente
- `public/images/projects`: ausente
- `public/videos/hero`: ausente

Leitura pratica:

- parte do site ja esta sustentada por assets locais reais;
- outra parte depende de caminhos antigos que nao existem mais;
- isso afeta especialmente portfolio, galerias de projetos e hero em video.

## Mapa por area

### 1. Home

Arquivos principais:

- `src/pages/Home.jsx`
- `src/components/HeroVideo.jsx`
- `src/components/PremiumCinematicIntro.jsx`
- `src/components/home/SanfonaHero.jsx`

Assets atuais:

- poster local:
  - `/images/hero-poster-640.webp`
  - `/images/hero-poster-960-opt.webp`
  - `/images/hero-poster-1280.webp`
- banner institucional:
  - `/images/banners/PROCESSOS.webp`

Assets ausentes:

- `/videos/hero/VERTICAL_compressed.mp4`
- `/videos/hero/HORIZONTAL_compressed.mp4`
- `/videos/hero/descricao.vtt`

Dependencias externas:

- `src/components/home/SanfonaHero.jsx` ainda usa imagens externas

Fonte de reposicao recomendada:

- hero e videos aprovados devem vir do acervo interno sincronizado e ser publicados em CDN;
- enquanto isso, manter poster local e desativar dependencia em video ausente se necessario.

### 2. Sobre / Marca / Institucional

Arquivos principais:

- `src/pages/About.jsx`
- `src/pages/AMarca.jsx`
- `src/pages/Architecture.jsx`
- `src/pages/Engineering.jsx`
- `src/pages/Carpentry.jsx`
- `src/pages/Process.jsx`
- `src/pages/Testimonials.jsx`
- `src/pages/Contact.jsx`

Assets locais confirmados:

- `/images/banners/SOBRE.webp`
- `/images/banners/ARQ.webp`
- `/images/banners/ENGENHARIA.webp`
- `/images/banners/MARCENARIA.webp`
- `/images/banners/PROJETOS.webp`
- `/images/banners/DEPOIMENTOS.webp`
- `/images/banners/FALECONOSCO.webp`
- `/images/logo-192.webp`

Assets ausentes referenciados:

- `/images/imagens/ARQ-VILANOVACONCEICAO (1).webp`
- `/images/imagens/ARQ-ENG-MARC-BOORKLIN (5).webp`

Dependencias externas:

- `src/pages/Engineering.jsx`
- `src/pages/Process.jsx`

Fonte de reposicao recomendada:

- `..\banners`
- snapshot estatico `site-wglmeida-blog-imagens`
- acervo interno original da operacao

### 3. Blog

Arquivos principais:

- `src/pages/Blog.jsx`
- `src/content/blog`

Assets locais confirmados:

- `public/images/blog`
- fallbacks por categoria em `public/images/banners`

Estado:

- existe um conjunto local de imagens de blog por slug;
- o blog esta em condicao melhor que portfolio e regioes;
- `64` snapshots HTML existem no backup paralelo;
- `68` posts Markdown existem no runtime atual.

Fonte de reposicao recomendada:

- primeiro `public/images/blog`
- depois `site-wglmeida-blog-imagens/blog`
- por ultimo Git/Vercel como referencia historica

### 4. Revista de Estilos

Arquivos principais:

- `src/pages/RevistaEstilos.jsx`
- `src/pages/EstiloDetail.jsx`
- `src/content/estilos`

Assets locais confirmados:

- `public/images/estilos`
- fallback `/images/banners/MARCENARIA.webp`

Estado:

- area razoavelmente sustentada por assets locais;
- risco menor do que portfolio e regionais.

Fonte de reposicao recomendada:

- `public/images/estilos`
- eventualmente material social ou acervo de moodboards

### 5. Paginas Regionais

Arquivos principais:

- `src/pages/regions/*.jsx`
- `src/pages/regions/RegionTemplate.jsx`

Estado atual:

- todas as paginas regionais analisadas usam `heroImage` externo do Unsplash

Paginas afetadas:

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

Fallback local existente:

- `/images/hero-region.webp`

Fonte de reposicao recomendada:

- criar biblioteca local por bairro ou categoria:
  - `/images/regions/<slug>.webp`
- usar snapshot, banners, acervo original e banco de projetos aprovados

Prioridade:

- alta, porque sao paginas de SEO local e hoje ainda passam percepcao de placeholder.

### 6. Landings comerciais

Arquivos principais:

- `src/pages/ConstrutoraAltoPadraoSP.jsx`
- `src/pages/ConstrutoraBrooklin.jsx`
- `src/pages/ReformaApartamentoSP.jsx`
- `src/pages/ReformaApartamentoItaim.jsx`
- `src/pages/ReformaApartamentoJardins.jsx`
- `src/pages/MarcenariaSobMedidaMorumbi.jsx`
- `src/pages/ArquiteturaInterioresVilaNovaConceicao.jsx`
- `src/pages/ArquiteturaCorporativa.jsx`
- `src/pages/ObraTurnKey.jsx`

Assets locais confirmados:

- varias usam `/images/banners/ARQ.webp`

Dependencias externas:

- `ConstrutoraAltoPadraoSP`
- `ConstrutoraBrooklin`
- `ReformaApartamentoItaim`
- `ReformaApartamentoJardins`

Fonte de reposicao recomendada:

- `..\banners`
- snapshot da landing equivalente em `site-wglmeida-blog-imagens`
- acervo aprovado do Google Drive sincronizado, com publicacao otimizada

### 7. Portfolio / Projetos

Arquivos principais:

- `src/pages/Projects.jsx`
- `src/components/PhotoGallery.jsx`
- `src/components/ProjectGallery.jsx`
- `src/components/ProjectCarousel.jsx`

Assets referenciados:

- `/images/imagens/...`
- `/images/projects/...`

Estado atual:

- estes dois reservatorios estao ausentes no runtime;
- esta e hoje a principal lacuna de portfolio real.

Conclusao:

- o site conhece os nomes historicos dos arquivos;
- falta recuperar ou republicar o acervo correspondente.

Fonte de reposicao recomendada:

- acervo original sincronizado na operacao WG
- Google Drive como armazenamento mestre
- publicacao final em CDN com `webp/avif`, `srcset` e dimensoes definidas

Prioridade:

- altissima, porque afeta prova visual de autoridade.

## Rotas que ja estao melhores

Areas com base local mais solida:

- blog
- revista de estilos
- banners institucionais
- branding principal

## Rotas que concentram o problema

Areas com maior lacuna visual real:

- Home em video
- Portfolio
- Projetos
- Landings com foto real
- Paginas regionais

## Ordem recomendada de restauracao

### Fase 1

Consolidar assets criticos da prova visual:

- `images/projects`
- `images/imagens`
- `videos/hero`

### Fase 2

Substituir Unsplash em:

- regionais
- landings principais
- componentes de hero e transformadores visuais

### Fase 3

Padronizar publicacao de midia:

- originais no Drive sincronizado
- processamento e export em formato web
- consumo por URLs publicas otimizadas

### Fase 4

Corrigir inconsistencias de marca e links:

- `grupowgalmeida.com.br`
- perfis antigos de Instagram
- legados de `/solicite-sua-proposta`

## Padrao tecnico recomendado para novos assets

Imagens:

- `webp` ou `avif`
- versoes responsivas
- `srcset`
- `loading="lazy"` quando nao for acima da dobra
- largura e altura definidas
- `alt` consistente com SEO

Videos:

- MP4 otimizado para compatibilidade
- poster local leve
- VTT de acessibilidade
- carregar apenas quando necessario
- evitar autoplay pesado fora do hero realmente estrategico

Pipeline sugerido:

- armazenamento mestre: Google Drive sincronizado
- processamento: pipeline interno WG / ferramentas locais
- publicacao: bucket ou CDN de assets
- consumo final: apenas URLs publicas otimizadas

## Conclusao operacional

O site nao perdeu toda a base visual.

O que existe hoje:

- branding
- banners
- imagens de blog
- imagens de estilos
- parte do acervo Wno Mas
- snapshots HTML com forte valor de referencia

O que precisa ser reconstruido com prioridade:

- `projects`
- `imagens`
- `videos/hero`
- biblioteca propria para regionais e landings
