# UI Bugs And Fixes

Atualizado: 10/04/2026

## Caso: contorno amarelo indevido na tela `/processo`

- Contexto:
  - página: `/processo`
  - arquivo principal: `src/pages/Process.jsx`
  - suporte visual global: `src/index.css`

- Sintoma observado:
  - cards e container principal da timeline exibiam contorno amarelado
  - a leitura visual parecia erro de borda, fora da paleta WG

- Causa real identificada:
  - o problema não estava só no slider nem só na linha abaixo do header
  - os blocos principais da seção usavam `border` explícito em vários cards e no container
  - combinado com o rendering do navegador, isso produzia uma leitura amarelada dos contornos
  - o `input[type=range]` também ainda podia herdar aparência nativa do navegador

- Solução aplicada:
  - em `src/pages/Process.jsx`
    - remover `border` dos blocos principais da seção
    - remover `border` dos cards de etapas
    - trocar bordas por `shadow` e `inset shadow` neutros
    - manter destaque de núcleos por cor de fundo e ícone, não por borda forte
  - em `src/index.css`
    - neutralizar a `wg-neon-divider`
    - criar estilo próprio para `.process-range`
    - remover dependência de cor nativa do navegador no slider

- Regra derivada:
  - para UI editorial/luxo da WG, evitar `border` colorido ou `border` genérico em blocos grandes
  - preferir:
    - `shadow` neutro
    - `inset shadow` neutro
    - contraste por fundo, tipografia e espaçamento

- Verificação:
  - `npm run build`
  - validação visual em `http://127.0.0.1:3010/processo`

## Caso: contornos quentes indevidos na tela `/blog`

- Contexto:
  - página: `/blog`
  - arquivo principal: `src/pages/Blog.jsx`

- Sintoma observado:
  - filtros, bordas ativas, divisórias, links e CTAs do blog exibiam laranja forte
  - a leitura geral parecia contorno amarelo/quente fora do padrão mais sóbrio já aprovado no restante do site

- Causa real identificada:
  - o problema não era do navegador
  - o próprio `Blog.jsx` ainda carregava vários estados ativos em `wg-orange`
  - isso aparecia em:
    - filtros por categoria
    - cards do sumário do artigo
    - bordas ativas das seções
    - links, divisórias e CTA do hero

- Solução aplicada:
  - em `src/pages/Blog.jsx`
    - trocar contornos e estados ativos principais de `wg-orange` para `wg-blue` ou neutros
    - suavizar pills, filtros e links
    - neutralizar a barra decorativa do hero
    - manter o terracota apenas como acento eventual, não como estrutura dominante

- Regra derivada:
  - no blog, evitar usar terracota/laranja como cor estrutural de:
    - borda
    - estado ativo
    - separador
    - CTA principal recorrente
  - preferir:
    - azul WG para interação
    - verde WG para acento editorial secundário
    - cinzas e branco para base

- Verificação:
  - `npm run build`
  - validação visual em `http://127.0.0.1:3010/blog`

## Caso: imagem de Bruxelas aplicada no card da materia de Barcelona

- Contexto:
  - pagina: `/blog/arquitetura-barcelona-espanha`
  - ambiente de validacao: `http://localhost:3011` (vite preview)
  - arquivos principais:
    - `src/data/blogImageManifest.js`
    - `src/data/blogUnsplashSelection.json`
    - `tools/audit-blog-unsplash-selection.mjs`

- Sintoma observado:
  - hero de Barcelona correto
  - card "Leitura Guiada" exibindo imagem ambigua (arco) associada ao erro editorial de cidade
  - sensacao visual de "Bruxelas" na materia de "Barcelona"

- Causa real identificada:
  - o `preview` em `:3011` servia `dist` antigo em alguns ciclos, mesmo com alteracoes no codigo-fonte
  - o mapeamento de Barcelona em Cloudinary ainda aceitava `.../card` separado
  - a selecao editorial tinha alt pouco especifico para geografia em alguns slugs

- Solucao aplicada:
  - em `src/data/blogImageManifest.js`
    - forcar Barcelona para usar `hero` tambem em `card/thumb/square`
  - em `src/data/blogUnsplashSelection.json`
    - ajustar alt de Barcelona e Bruges com referencia geografica explicita
  - em `tools/audit-blog-unsplash-selection.mjs`
    - manter checagem de duplicidade entre slugs
    - adicionar regra de consistencia geografica minima em `hero/card alt`
  - operacional:
    - rebuild completo: `npm run build`
    - reiniciar `preview` na porta de validacao
    - revalidar no mesmo endpoint (`localhost:3011`)

- Verificacao:
  - em `localhost:3011`, card de Barcelona deve apontar para:
    - `.../editorial/blog/arquitetura-barcelona-espanha/hero`
  - creditos de hero e card devem convergir para:
    - `Jorge Fernandez Salas` via Unsplash

- Regra derivada:
  - nunca aprovar ajuste de imagem no blog apenas por `dev` quando a homologacao usa `preview`
  - sempre validar no mesmo endpoint que o time usa para revisao
  - toda imagem de cidade no cluster "arquitetura-<cidade>-<pais>" precisa de alt com referencia geografica explicita
  - quando houver ambiguidade editorial de imagem:
    - congelar fallback no manifesto para evitar rotacao errada
    - abrir tarefa separada para substituir asset definitivo no Cloudinary

- Playbook rapido se voltar a acontecer:
  1. confirmar no DOM de homologacao (`localhost:3011`) o `src` real do card e do hero
  2. checar qual processo esta na porta (`Get-NetTCPConnection -LocalPort 3011`)
  3. rebuildar (`npm run build`) e reiniciar `vite preview` na mesma porta
  4. se persistir, corrigir `src/data/blogImageManifest.js` para fallback seguro no slug afetado
  5. atualizar `src/data/blogUnsplashSelection.json` (alt + id) e rodar:
     - `npm run blog:editorial:audit`
     - `npm run unsplash:manifest:build`
     - `npm run lint`
  6. validar novamente no endpoint de homologacao e salvar evidencias em `.monitor-data/`

## Regra operacional para novos bugs visuais

Sempre que um bug visual tiver causa confirmada:

1. registrar sintoma
2. registrar causa real
3. registrar solução aplicada
4. registrar arquivos alterados
5. registrar padrão para evitar recorrência

Esse documento deve crescer como base viva de decisões visuais do projeto.
Registro cronologico de incidentes: `docs/INCIDENT-LOG.md`.
