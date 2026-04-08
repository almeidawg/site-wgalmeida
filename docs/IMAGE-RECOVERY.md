# IMAGE-RECOVERY

## Objetivo

Mapear onde estao os assets visuais do site WG Almeida, quais fontes paralelas ainda existem, quais pontos do codigo dependem de imagens externas e quais inconsistencias precisam ser corrigidas durante a restauracao.

Projeto runtime canonico:

- `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\_Grupo_WG_Almeida\site-wgalmeida\site-wgalmeida`

## Reservatorios de assets localizados

### 1. Runtime atual

Pasta:

- `public/images`

Contagem:

- `84` arquivos

Tipos:

- `49` `.webp`
- `32` `.svg`
- `3` `.png`

Subpastas:

- `banners`
- `blog`
- `estilos`
- `wno-mas`

Assets base identificados:

- `logo.png`
- `logo.webp`
- `logo-96.webp`
- `logo-192.webp`
- `icone.png`
- `icone.webp`
- `og-image.webp`
- `placeholder.webp`
- `placeholder-product.webp`
- `hero-poster.webp`
- `hero-poster-640.webp`
- `hero-poster-960.webp`
- `hero-poster-960-opt.webp`
- `hero-poster-1280.webp`
- `hero-region.webp`

Leitura pratica:

- O runtime atual nao esta vazio.
- Ja existe um conjunto proprio suficiente para branding, hero, blog e estilos.
- A maior lacuna nao e ausencia total de imagem, e sim cobertura incompleta para paginas e landings.

### 2. Snapshot estatico paralelo

Pasta:

- `site-wglmeida-blog-imagens`

Estrutura relevante:

- `images`
- `assets`
- `Logos`
- `fonts`
- `data`
- varias pastas de paginas exportadas como HTML estatico

Contagens:

- `images`: `35` arquivos
- `blog`: `64` diretorios de snapshot HTML

Tipos em `images`:

- `18` `.webp`
- `10` `.png`
- `3` `.svg`
- `2` `.br`
- `2` `.gz`

Leitura pratica:

- Esta pasta e um backup visual e editorial importante.
- Serve como referencia para imagens, logos, estrutura de paginas e conteudo de SEO.
- Mesmo quando o React atual nao tiver o asset correspondente, o snapshot pode indicar nome, uso e pagina de origem.

### 3. Banners soltos

Pasta:

- `..\banners`

Contagem:

- `22` arquivos

Tipos:

- `11` `.jpg`
- `11` `.svg`

Leitura pratica:

- Boa fonte para hero, campanhas e materiais institucionais.
- Provavel reservatorio para recuperar elementos de destaque visual sem depender de banco externo.

### 4. Material social

Pasta:

- `..\Post Instragram WG`

Contagem:

- `89` arquivos

Tipo:

- `89` `.svg`

Leitura pratica:

- Material util para identidade visual, chamadas, capas e blocos de campanha.
- Nao substitui fotografia de portfolio, mas ajuda muito em social proof, destaques e chamadas comerciais.

## Fontes auxiliares alem das pastas locais

### Vercel

Existe vinculacao local em:

- `.vercel/project.json`

Achados:

- `projectName`: `site-wgalmeida-repo-fixed`
- `framework`: `vite`
- `nodeVersion`: `24.x`

Leitura pratica:

- A Vercel confirma a identidade do projeto e o nome historico do repo usado para deploy.
- Nao trouxe um acervo de imagens por si so, mas ajuda a localizar o projeto correto e diagnosticos de build.

### Git

O runtime atual nao esta em um repositorio Git ativo.

Existe copia arquivada em:

- `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\99_ARQUIVO_MORTO\site-wgalmeida-descartadas-20260406`

Achado principal:

- `site-wgalmeida-repo-clean` possui `.git`
- remoto identificado: `https://github.com/almeidawg/site-wgalmeida.git`

Leitura pratica:

- O Git pode servir como fonte auxiliar de comparacao.
- Nao deve ser tratado como base operacional atual.
- O material em `99_ARQUIVO_MORTO` precisa ser usado com criterio, apenas como referencia.

## Conteudo recuperado vs problema real

O diagnostico ate aqui aponta:

- o blog nao esta perdido;
- o snapshot HTML cobre `64` posts e o Markdown atual cobre `68`;
- `0` posts aparecem apenas no snapshot;
- `4` posts aparecem apenas no Markdown atual.

Conclusao:

- a perda principal nao esta no texto editorial;
- o risco maior esta em assets visuais proprios, hero real, imagens de projetos e substituicao de imagens externas.

## Dependencias externas ainda no codigo

Arquivos que ainda puxam Unsplash ou mantem dependencia direta de imagem externa:

- `src/lib/unsplash.ts`
- `src/pages/ConstrutoraAltoPadraoSP.jsx`
- `src/pages/ConstrutoraBrooklin.jsx`
- `src/pages/Engineering.jsx`
- `src/pages/Process.jsx`
- `src/pages/ReformaApartamentoItaim.jsx`
- `src/pages/ReformaApartamentoJardins.jsx`
- `src/pages/Store.jsx`
- `src/components/home/SanfonaHero.jsx`
- `src/components/home/HomeColorTransformer.jsx`
- `src/components/moodboard/ColorTransformer.jsx`
- `src/components/moodboard/InteractivePreview.jsx`
- `src/components/moodboard-generator/CoverPage.jsx`
- `src/pages/regions/Aclimacao.jsx`
- `src/pages/regions/AltoDePinheiros.jsx`
- `src/pages/regions/Brooklin.jsx`
- `src/pages/regions/CampoBelo.jsx`
- `src/pages/regions/CidadeJardim.jsx`
- `src/pages/regions/Higienopolis.jsx`
- `src/pages/regions/Itaim.jsx`
- `src/pages/regions/Jardins.jsx`
- `src/pages/regions/Moema.jsx`
- `src/pages/regions/Mooca.jsx`
- `src/pages/regions/Morumbi.jsx`
- `src/pages/regions/Paraiso.jsx`
- `src/pages/regions/Perdizes.jsx`
- `src/pages/regions/Pinheiros.jsx`
- `src/pages/regions/VilaMariana.jsx`
- `src/pages/regions/VilaNovaConceicao.jsx`

Leitura pratica:

- O site funciona, mas ainda depende de placeholders externos em varias paginas.
- A restauracao real precisa substituir essas referencias por assets locais ou Cloudinary proprio.

## Inconsistencias de links e perfis encontradas

### Dominio divergente

- `src/components/GoogleReviewsBadge.jsx`
  - usa `https://www.grupowgalmeida.com.br`
  - o padrao atual do projeto e `https://wgalmeida.com.br`

### Instagram divergente

Perfis encontrados no codigo:

- `https://www.instagram.com/wgalmeida.arq`
- `https://www.instagram.com/grupowgalmeida`
- placeholder antigo `https://www.instagram.com/wgalmeida`

Arquivos com `grupowgalmeida`:

- `src/components/InstagramGallery.jsx`
- `src/components/ProjectGallery.jsx`
- `src/components/layout/Footer.jsx`
- `src/pages/Admin.jsx`

Leitura pratica:

- O projeto ainda mistura perfis e dominios historicos.
- Antes de restaurar ou republicar assets, vale consolidar o perfil oficial e o dominio oficial.

### Landing antiga ainda referenciada

Ocorrencia relevante:

- `src/content/blog/obraeasy-como-funciona-para-clientes-finais.md`
  - usa `https://wgalmeida.com.br/solicite-sua-proposta`

Observacao:

- `App.jsx` ainda possui rota `/solicite-sua-proposta`, entao nao esta quebrado.
- Mesmo assim, o padrao atual do site esta convergindo para `/solicite-proposta`.

## Prioridade de restauracao visual

### Prioridade 1

Substituir assets externos nas paginas que afetam percepcao imediata:

- Home
- hero geral
- paginas regionais
- principais landings comerciais

### Prioridade 2

Cruzar `public/images` com:

- `site-wglmeida-blog-imagens/images`
- `..\banners`
- `..\Post Instragram WG`

Objetivo:

- identificar quais imagens proprias ja existem e podem substituir Unsplash;
- separar assets de branding, blog, landing e portfolio.

### Prioridade 3

Consolidar fontes oficiais de link:

- dominio principal
- Instagram oficial
- WhatsApp comercial
- paginas de proposta

### Prioridade 4

Depois da consolidacao local, usar Git e Vercel apenas como apoio de comparacao para:

- localizar nomes de arquivos antigos;
- revisar textos ou componentes perdidos;
- confirmar rotas e estrutura historica.

## Conclusao operacional

O estado atual nao indica perda total de conteudo.

O que realmente existe hoje:

- runtime funcional com acervo proprio parcial;
- snapshot estatico rico;
- banners e material social aproveitaveis;
- blog praticamente inteiro;
- referencias auxiliares de Git e Vercel para comparacao.

O gargalo principal agora e:

- organizar o inventario visual;
- substituir dependencias externas;
- restaurar assets proprios nas paginas mais importantes.
