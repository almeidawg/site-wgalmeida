# Auditoria de Produção — 08/04/2026

## Status atual

- Status geral: quase pronto para produção
- Build: ok
- Lint: ok
- Testes automatizados: ok (35/35)
- Smoke test local do preview: ok

## Erros encontrados e corrigidos

### 1. Chave da Stability AI exposta no frontend
- Classificação: crítico
- Causa raiz: segredo server-side modelado como variável `VITE_*`
- Correção aplicada:
  - proxy criado em `api/stability.js`
  - cliente ajustado em `src/services/stabilityAI.js`
  - documentação atualizada em `.env.example`
- Resultado: segredo removido do navegador

### 2. Endpoint do Claude inexistente com uso ativo no Admin
- Classificação: alto
- Causa raiz: frontend chamava `/api/claude`, mas a função serverless não existia
- Correção aplicada:
  - endpoint criado em `api/claude.js`
  - `.env.example` atualizado com `CLAUDE_API_KEY` e `CLAUDE_MODEL`
- Resultado: fluxo do Admin deixou de depender de rota ausente

### 3. Código morto da Liz/OpenAI
- Classificação: médio
- Causa raiz: feature desativada visualmente, mas componentes e client continuavam no repositório sem backend correspondente
- Correção aplicada:
  - removidos `src/lib/openaiClient.js`
  - removidos `src/components/LizAssistant.jsx`
  - removidos `src/components/ClaudeAssistant.jsx`
  - removidos comentários órfãos em `src/App.jsx` e `src/pages/Home.jsx`
- Resultado: menor risco de reativação quebrada e menos ruído técnico

### 4. Inconsistência de package manager
- Classificação: alto
- Causa raiz: `package.json` apontava para Yarn, enquanto deploy e lockfile operavam com npm
- Correção aplicada:
  - `packageManager` padronizado para `npm@11.6.1`
  - `vercel.json` alinhado para `npm ci`
  - documentação de comandos passou a usar npm
- Resultado: ambiente local, build e deploy ficaram consistentes

### 5. SEO de estilos apontando para imagens inexistentes
- Classificação: alto
- Causa raiz: frontmatter dos estilos referenciava `.webp` que não existiam
- Correção aplicada:
  - `build-seo-routes.mjs` deixou de publicar essas URLs quebradas no SEO estático
  - gerador de `.webp` real criado em `tools/generate-style-webp-from-svg.mjs`
  - auditoria automatizada criada em `tools/seo-audit.mjs`
- Resultado: SEO estático não publica mais imagem ausente e o projeto ganhou validação preventiva

### 6. Scripts referenciados no package sem pasta `tools/`
- Classificação: médio
- Causa raiz: `package.json` apontava para scripts inexistentes e `.gitignore` bloqueava a própria pasta `tools/`
- Correção aplicada:
  - pasta `tools/` recriada com utilitários reais
  - `.gitignore` ajustado para permitir versionamento dos scripts
- Resultado: comandos documentados agora existem e podem ser validados em CI/local

## Ferramentas adicionadas nesta rodada

- `tools/generate-style-webp-from-svg.mjs`
- `tools/recompress-critical-images.mjs`
- `tools/perf-assets-report.mjs`
- `tools/prune-unused-style-svg.mjs`
- `tools/seo-audit.mjs`
- `tools/seo-validate-dist.mjs`

## Validacoes executadas

- `npm run seo:audit`: ok
- `npm run lint`: ok
- `npm run test:run`: ok (35/35)
- `npm run build`: ok
- `npm run seo:validate:dist`: ok

## Resultados concretos desta rodada

- `src/components/layout/Footer.jsx` teve a malha ajustada para corrigir a distribuição da coluna `Onde Atuamos`
- `src/components/InstagramGallery.jsx` foi realinhado para a identidade WG, com fallback visual mais coerente e sem gradiente genérico fora da marca
- `src/components/BrandStar.jsx` ganhou `BrandRating` para substituir estrelas padrão nos blocos institucionais
- `src/components/GoogleReviewsBadge.jsx` e `src/pages/Testimonials.jsx` deixaram de usar `Star` como elemento visual principal
- `src/pages/ObraEasyLanding.jsx`, `src/pages/EasyRealStateLanding.jsx`, `src/pages/BuildTech.jsx` e `src/pages/AMarca.jsx` foram limpos para reduzir pesos tipográficos e textos destacados fora do padrão da marca
- `src/data/blogImageManifest.js` foi criado para preparar o fallback editorial com Cloudinary por `slug`/categoria
- `src/pages/Blog.jsx` e `build-seo-routes.mjs` passaram a ler o manifesto Cloudinary antes do fallback local
- 31 arquivos `.webp` reais foram gerados em `public/images/estilos/`
- O pipeline de build passou a preparar esses assets antes do `vite build`
- O repositório foi ajustado para versionar os `.webp` gerados sem expor os `.svg` legados como ruído no Git
- A validação de SEO agora cobre tanto frontmatter quanto saída final em `dist`
- O build passou a remover SVGs redundantes dos estilos no artefato final (`dist`)
- Ganho medido: 93 artefatos redundantes removidos e 84.896.525 bytes eliminados do `dist`
- Após a poda, o relatório de assets caiu para apenas 5 arquivos acima de 500 KB
- `src/components/ProjectGallery.jsx` deixou de depender só de imagens locais pesadas para parte do portfólio
- `src/utils/cloudinaryProjectPortfolio.js` centraliza os `public_id` já auditados e gera URLs transformadas do Cloudinary para thumb e visualização ampliada
- A galeria agora entrega imagens com `f_auto`, `q_auto:good`, `dpr_auto` e limites de tamanho, reduzindo payload sem sacrificar qualidade visual
- `src/components/HeroVideo.jsx` migrou para vídeo HTML5 com mídia servida pelo Cloudinary, substituindo o embed do YouTube
- `src/utils/cloudinaryMedia.js` centraliza as URLs otimizadas do hero e o helper genérico de mídia Cloudinary
- `tools/generate-about-webp.mjs` passou a gerar dois derivados otimizados da foto institucional do William
- `src/pages/About.jsx` deixou de usar `hero-poster` na área do CEO e passou a usar a foto correta em `.webp`
- `tools/prune-unused-public-media.mjs` remove do artefato final os vídeos legados do hero e o PNG bruto do William
- Ganho medido nesta rodada: 326.026.417 bytes removidos do `dist`
- Após a rodada, o relatório caiu para apenas 2 assets acima de 500 KB

## Resultados concretos da rodada atual

- `src/pages/Home.jsx` removeu o import morto do antigo `SanfonaHero`
- `src/pages/Home.jsx` corrigiu a faixa de métricas para mostrar `3.898` em vez de `3mil` em `metrosRevestimentos`
- `src/hooks/useEstatisticasWG.js` alinhou a base histórica mínima de `metrosRevestimentos` para `3898`
- `src/pages/Home.jsx` trocou o destaque marrom visível desse bloco por cinza escuro da marca
- `src/pages/Home.jsx` reduziu pesos tipográficos visíveis ainda fora do padrão anti-negrito
- `src/components/layout/Footer.jsx` recebeu nova redistribuição para a coluna `Onde Atuamos`
- `src/pages/SanfonaEntry.jsx` deixou de usar efeito sanfona e foi refeito como vitrine estática de 3 cards
- `src/components/home/SanfonaHero.jsx` foi removido como código legado
- `tools/fetch-instagram-thumbnails.mjs` foi criado para capturar `og:image` público dos posts e congelar as miniaturas localmente
- `public/images/instagram/` passou a armazenar as thumbnails reais da galeria
- `src/components/InstagramGallery.jsx` deixou de depender do endpoint frágil `/media/?size=l`

## Validacoes desta rodada

- `npm run lint`: ok
- `npm run build`: ok
- `npm run seo:validate:dist`: ok

## Diagnóstico adicional de dados WG Easy

- `src/pages/Process.jsx` não consome dados live do WG Easy
- a timeline exibida no print é calculada localmente com:
  - arrays de etapas
  - `baseWeeks`
  - fórmula por metragem em `areaProfile`
- por isso a UI foi ajustada para deixar explícito que se trata de simulação orientativa

- `src/api/EcommerceApi.js` segue como integração real com Supabase/WG Easy
- validação manual via REST confirmou:
  - `pricelist_itens`: respondeu `200` com dados reais
  - `contratos`: respondeu `200`, mas sem registros retornados na leitura atual
  - `contratos_itens`: respondeu `200`, mas sem registros retornados na leitura atual
  - `contacts`: respondeu `200`, sem registros retornados
  - `propostas_solicitadas`: respondeu `200`, sem registros retornados

Conclusão operacional:
- catálogo/produtos: real
- métricas da home: hoje operam em fallback histórico
- timeline da obra: simulação editorial local

## Conteúdo editorial

- Não foram encontrados arquivos `.md` vazios no blog principal
- Todos os artigos auditados possuem corpo material suficiente para renderização
- O problema de “matéria sem conteúdo” não apareceu como ausência de markdown nesta rodada; se houver casos restantes, tendem a ser:
  - imagem/capa inadequada
  - expectativa editorial diferente do conteúdo já publicado

## Gargalos de performance ainda abertos

### 1. Ainda não é garantia de nota máxima
- A migração do hero e da foto institucional corrigiu os maiores gargalos de mídia desta rodada
- Mesmo assim, a nota máxima ainda depende de fatores como JavaScript por rota, LCP real em produção, cache CDN e avaliação Lighthouse/PageSpeed em ambiente externo

### 2. SVGs legados de estilos seguem pesados
- Principais casos:
  - `boho.svg` ~6.4 MB
  - `japandi.svg` ~6.4 MB
  - `classico.svg` ~6.0 MB
  - `glam.svg` ~5.8 MB
  - `minimalismo.svg` ~5.1 MB
- Impacto: peso alto de asset-fonte e dívida técnica de mídia
- Situação atual: não vão mais para o `dist`, mas ainda existem como origem local

### 3. Galeria de projetos e mídia principal melhoraram, mas não garantem nota máxima sozinhas
- A migração parcial para Cloudinary está dentro do padrão recomendado de SEO/performance
- Mesmo assim, a nota máxima de Lighthouse/Core Web Vitals ainda depende das demais rotas críticas e do comportamento em produção
- Decisão correta: usar Cloudinary como padrão para mídia grande e manter medição real por build + smoke test + auditoria

### 4. Recompressão automática não deve rodar no build principal
- `tools/recompress-critical-images.mjs` permanece útil para laboratório/manual
- Em Windows, houve instabilidade por lock/rename em arquivos de `dist`
- Decisão aplicada: manter a ferramenta fora do pipeline obrigatório de build

## Pendências abertas

### 1. SVGs de estilos ainda são grandes demais como fonte original
- Mesmo com a nova estratégia de geração de `.webp`, os `.svg` originais seguem pesados e merecem revisão futura

### 2. Manifesto editorial do blog ainda precisa de `public_id` reais
- A infraestrutura Cloudinary já está pronta
- Falta preencher `src/data/blogImageManifest.js` com os assets finais por slug/categoria

### 3. Warnings de tooling do Vite/React
- Não quebram produção, mas devem ser tratados em outra rodada de manutenção

### 4. Documentação antiga ainda menciona práticas anteriores
- Parte dos manuais precisava de alinhamento com npm, smoke test e validação de assets
- Ajustes iniciais foram aplicados nesta rodada

## Regras reforçadas após a auditoria

- Não documentar script que não exista no repositório
- Não confiar em frontmatter sem validar arquivo físico
- Não manter integração frontend sem rota backend correspondente
- Não aceitar “build verde” como único critério de produção
- Não colocar etapa experimental de recompressão no build principal sem estabilidade operacional
- Não abrir versionamento de assets legados só para liberar novos derivados otimizados

## Continuação — FAQ, Cloudinary editorial e landing do moodboard

### FAQ estratégico para SEO
- `src/pages/FAQ.jsx` foi refeito com perguntas alinhadas à estratégia real de SEO:
  - turn key
  - custo e prazo
  - bairros premium
  - WG Easy
  - moodboard/IA
  - conversão
- `src/pages/faq.css` ganhou nova diagramação editorial e o FAQ deixou de parecer bloco genérico
- o `FAQPage` schema foi mantido

Conclusão:
- FAQ é altamente válido para este projeto quando responde buscas reais do funil
- FAQ genérico ajuda pouco
- FAQ com intenção de busca + links internos + proximidade com páginas de serviço reforça a base semântica do domínio

### Cloudinary editorial aplicado
- `tools/sync-cloudinary-editorial-assets.mjs` foi criado e executado
- `cloudinary-editorial-sync-2026-04-08.json` registra a sincronização
- 57 assets editoriais foram enviados com `public_id` semântico:
  - 20 imagens de blog
  - 31 imagens de estilos
  - 6 banners de fallback por categoria
- `src/data/blogImageManifest.js` passou a mapear slugs e categorias reais
- `src/data/styleImageManifest.js` foi criado para os 31 estilos
- `src/pages/Blog.jsx`, `src/utils/styleCatalog.js` e `build-seo-routes.mjs` agora preferem Cloudinary antes do fallback local

### Moodboard share
- `src/pages/MoodboardShare.jsx` criado
- `src/utils/moodboardShare.js` criado
- `src/components/moodboard/ColorTransformer.jsx` passou a compartilhar landing própria em `/moodboard/share?data=...`
- o link cru do Cloudinary deixou de ser a experiência principal de compartilhamento

### Validações desta continuação
- `npm run lint`: ok
- `npm run build`: ok
- smoke test local:
  - `/faq`: 200
  - `/blog`: 200
  - `/estilos/boho`: 200
  - `/moodboard/share?data=...`: 200

## Continuação — auditoria e padronização de links

### Objetivo da rodada
- validar todos os links internos do site
- remover hard reload em navegação interna
- confirmar compatibilidade das rotas reais com `src/App.jsx`

### Correções aplicadas
- links internos em páginas e CTAs foram padronizados para `Link` do React Router em:
  - `src/pages/Moodboard.jsx`
  - `src/pages/Process.jsx`
  - `src/pages/RoomVisualizer.jsx`
  - `src/pages/Testimonials.jsx`
  - `src/components/moodboard/MoodboardExport.jsx`
  - `src/components/room-visualizer/MoodboardImporter.jsx`
  - `src/components/OrcadorInteligente.jsx`
  - `src/components/layout/Header.jsx`

### Auditoria automatizada
- `tools/audit-links.mjs` refinado para:
  - ler as rotas de `src/App.jsx`
  - validar `href`, `to`, `navigate` e `window.location`
  - aceitar rotas dinâmicas como `/estilos/:slug`
  - ignorar arquivos de teste fora da navegação de produção
- relatórios gerados:
  - `LINK-AUDIT-2026-04-08.md`
  - `link-audit-2026-04-08.json`

### Resultado final
- rotas registradas: `63`
- referências internas auditadas: `128`
- links inválidos: `0`
- hard navigations internas restantes: `0`

### Validação desta rodada
- `node .\\tools\\audit-links.mjs`: ok
- `npm run lint`: ok
- `npm run build`: ok
