# UI Bugs And Fixes

Atualizado: 06/04/2026

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

## Regra operacional para novos bugs visuais

Sempre que um bug visual tiver causa confirmada:

1. registrar sintoma
2. registrar causa real
3. registrar solução aplicada
4. registrar arquivos alterados
5. registrar padrão para evitar recorrência

Esse documento deve crescer como base viva de decisões visuais do projeto.
