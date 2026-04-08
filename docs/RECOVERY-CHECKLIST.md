# RECOVERY-CHECKLIST

## Objetivo

Checklist operacional para recuperar o acervo visual do site WG Almeida e alinhar a linguagem visual do front com a diretriz:

- luxo com elegancia
- menos peso visual
- sem negrito em textos corridos

## Regra visual global

### Diretriz aprovada

- remover negritos de textos corridos em todas as paginas
- evitar `strong`, `b`, `font-bold`, `font-extrabold` e `font-black` em paragrafos, descricoes, quotes e blocos editoriais
- manter hierarquia por:
  - tamanho
  - espacamento
  - contraste
  - caixa alta controlada
  - `font-medium` apenas quando realmente necessario

### O que ainda pode manter peso

- numeracao de etapas
- badges funcionais
- preco em loja, se a loja continuar ativa
- labels tecnicos de interface
- botoes e CTAs, desde que sem agressividade visual

### Onde o problema apareceu com clareza

- `src/i18n/locales/pt-BR.json`
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`
- `src/pages/AMarca.jsx`
- `src/pages/Home.jsx`
- `src/components/home/SanfonaHero.jsx`
- varios componentes e paginas com `font-semibold` e `font-bold`
- override global em `src/index.css`

### Acoes de tipografia

- [ ] auditar e remover `<strong>` e `<b>` dos textos editoriais e institucionais
- [ ] revisar `font-semibold`, `font-bold`, `font-extrabold` e `font-black` em titulos, cards e CTAs
- [ ] manter titulos elegantes com peso moderado
- [ ] revisar Home, A Marca, Sobre, landings e blog hero primeiro
- [ ] definir regra visual unica para emphasis:
  - preferir cor, espacamento e italico leve em vez de negrito

## Fase 1. Recuperar o que esta faltando no runtime

### Pasta ausente 1

- `public/images/imagens`

Estado:

- ausente no runtime atual

Impacto:

- quebra portfolio historico
- quebra galerias e antes/depois
- quebra varios blocos de prova visual

Acoes:

- [ ] criar novamente `public/images/imagens`
- [ ] recuperar acervo a partir do Drive sincronizado e fontes auxiliares
- [ ] exportar em `webp`
- [ ] manter nomes compatveis com o codigo atual para acelerar restauracao

Arquivos faltantes confirmados por nome:

- [ ] `ARQ-VILANOVACONCEICAO (1).webp`
- [ ] `ARQ-VILANOVACONCEICAO (2).webp`
- [ ] `ARQ-VILANOVACONCEICAO (3).webp`
- [ ] `ARQ-VILANOVACONCEICAO (4).webp`
- [ ] `ARQ-ENG-MARC-BOORKLIN (1).webp`
- [ ] `ARQ-ENG-MARC-BOORKLIN (2).webp`
- [ ] `ARQ-ENG-MARC-BOORKLIN (3).webp`
- [ ] `ARQ-ENG-MARC-BOORKLIN (4).webp`
- [ ] `ARQ-ENG-MARC-BOORKLIN (5).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (1).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (2).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (3).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (4).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (5).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (6).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (7).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (8).webp`
- [ ] `ARQ-ENG-MARC-CORPORATIVO- ALPHAVILLE (9).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (1).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (2).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (3).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (4).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (5).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (6).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (7).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (8).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (9).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (10).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (11).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (14).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (15).webp`
- [ ] `CASAHOMERESORT-ACAPULCO-GURARUJA (16).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (2).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (3).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (4).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (5).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (11).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (12).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (13).webp`
- [ ] `ARQ-COND-POTADOSOL-MARINQUE (14).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (10).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (11).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (12).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (13).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (14).webp`
- [ ] `ENG-COND-POTADOSOL-MARINQUE (15).webp`
- [ ] `01 Antes 01.webp`
- [ ] `01 Depois 01.webp`
- [ ] `02 Antes 02.webp`
- [ ] `02 Depois 02 .webp`
- [ ] `03 Antes.webp`
- [ ] `03 Depois .webp`
- [ ] `04 Antes.webp`
- [ ] `04 Depois.webp`
- [ ] `BANNERITTAIM-ENGENHARIA.webp`
- [ ] `3.webp`
- [ ] `7.webp`
- [ ] `8.webp`
- [ ] `9.webp`
- [ ] `10.webp`
- [ ] `11.webp`
- [ ] `12.webp`

### Pasta ausente 2

- `public/images/projects`

Estado:

- ausente no runtime atual

Impacto:

- quebra carousel e intro cinematografica de projetos

Acoes:

- [ ] criar novamente `public/images/projects`
- [ ] recuperar estrutura por pasta de projeto
- [ ] manter padrao de nomes e subpastas

Subpastas e arquivos confirmados por referencia no codigo:

- [ ] `casa-resort-acapulco/01_11---Photo.webp`
- [ ] `apartamento-alameda-alphaville/10areaservio_01_27206612818_o.webp`
- [ ] `apartamento-alameda-alphaville/3sala_03_39270011980_o.webp`
- [ ] `cobertura-les-champs-osasco/2022-03-11 13.30.30.webp`
- [ ] `lumenit-corporativo/lumenit_27476900773_o.webp`
- [ ] `apartamento-grand-panamby/2021-05-24 12.02.11.webp`
- [ ] `apartamento-square-santo-amaro/Humanizada.webp`
- [ ] `apartamento-square-santo-amaro/sala01.webp`
- [ ] `casa-gaivota-moema/1.webp`
- [ ] `casa-porta-do-sol-mairinque/2021-12-10 12.53.24.webp`
- [ ] `condominio-paulistano-monte-kemel/original100.webp`
- [ ] `consultorio-cure-dent-cotia/2020-10-06 13.39.14.webp`
- [ ] `galpao-surubiju-alphaville/1.webp`

### Pasta ausente 3

- `public/videos/hero`

Estado:

- ausente no runtime atual

Impacto:

- afeta hero cinematografico
- afeta experiencia premium inicial

Acoes:

- [ ] criar `public/videos/hero`
- [ ] recuperar ou substituir:
  - `VERTICAL_compressed.mp4`
  - `HORIZONTAL_compressed.mp4`
  - `descricao.vtt`
- [ ] gerar poster leve definitivo
- [ ] garantir video otimizado para web

## Fase 2. Substituir imagens externas

### Paginas regionais

Hoje todas usam Unsplash no `heroImage`.

Acoes:

- [ ] criar biblioteca local `public/images/regions`
- [ ] publicar um hero proprio por bairro
- [ ] trocar referencias externas por assets locais ou CDN propria

Paginas afetadas:

- [ ] `Aclimacao`
- [ ] `AltoDePinheiros`
- [ ] `Brooklin`
- [ ] `CampoBelo`
- [ ] `CidadeJardim`
- [ ] `Higienopolis`
- [ ] `Itaim`
- [ ] `Jardins`
- [ ] `Moema`
- [ ] `Mooca`
- [ ] `Morumbi`
- [ ] `Paraiso`
- [ ] `Perdizes`
- [ ] `Pinheiros`
- [ ] `VilaMariana`
- [ ] `VilaNovaConceicao`

### Landings e componentes com imagem externa

- [ ] `ConstrutoraAltoPadraoSP.jsx`
- [ ] `ConstrutoraBrooklin.jsx`
- [ ] `ReformaApartamentoItaim.jsx`
- [ ] `ReformaApartamentoJardins.jsx`
- [ ] `Engineering.jsx`
- [ ] `Process.jsx`
- [ ] `Store.jsx`
- [ ] `components/home/SanfonaHero.jsx`
- [ ] `components/home/HomeColorTransformer.jsx`
- [ ] `components/moodboard/ColorTransformer.jsx`
- [ ] `components/moodboard/InteractivePreview.jsx`
- [ ] `components/moodboard-generator/CoverPage.jsx`

## Fase 3. Consolidar fontes auxiliares

Acoes:

- [ ] cruzar `public/images` com `site-wglmeida-blog-imagens/images`
- [ ] cruzar banners em `..\banners`
- [ ] cruzar material visual em `..\Post Instragram WG`
- [ ] verificar acervo mestre no Google Drive sincronizado
- [ ] usar Git e Vercel apenas como referencia historica complementar

## Fase 4. Padrao tecnico de entrega

### Imagens

- [ ] publicar em `webp` ou `avif`
- [ ] gerar variantes responsivas
- [ ] usar `srcset`
- [ ] definir largura e altura
- [ ] lazy load fora da dobra
- [ ] `alt` descritivo e consistente com SEO

### Videos

- [ ] mp4 otimizado para web
- [ ] poster leve
- [ ] VTT para acessibilidade
- [ ] preload controlado
- [ ] autoplay so quando fizer sentido real

### Origem e publicacao

- [ ] manter originais no Google Drive sincronizado
- [ ] organizar pipeline interno WG para tratamento
- [ ] publicar assets finais em URL publica otimizada
- [ ] nao servir assets finais direto do Google Drive

## Fase 5. Coerencia de marca e links

- [ ] substituir `grupowgalmeida.com.br` por `wgalmeida.com.br` onde for legado incorreto
- [ ] consolidar Instagram oficial
- [ ] revisar perfis antigos `grupowgalmeida`
- [ ] revisar links internos antigos e redirects

## Ordem de execucao recomendada

### Primeiro

- [ ] recuperar `images/projects`
- [ ] recuperar `images/imagens`
- [ ] recuperar `videos/hero`

### Segundo

- [ ] substituir Unsplash nas regionais
- [ ] substituir imagens externas nas landings

### Terceiro

- [ ] executar limpeza tipografica de negritos
- [ ] suavizar CTAs e destaques
- [ ] revisar visual final com foco em elegancia

## Definicao de pronto

O trabalho so deve ser considerado fechado quando:

- [ ] o runtime possuir novamente `images/imagens`
- [ ] o runtime possuir novamente `images/projects`
- [ ] o runtime possuir novamente `videos/hero`
- [ ] paginas regionais nao dependerem mais de Unsplash
- [ ] textos corridos nao usarem negrito como recurso padrao
- [ ] o site consumir apenas assets publicos otimizados
