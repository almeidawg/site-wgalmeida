# Checklist de Validacao Editorial Antes da Entrega

Data base: 2026-04-15
Projeto: `site-wgalmeida`
Escopo: blog, guias de estilos e paginas com leitura editorial longa

## Objetivo

Este checklist deve ser executado antes de considerar qualquer pagina pronta para:

- aprovacao local
- publicacao em producao
- replicacao em lote

Ele consolida o padrao aprovado a partir do slug piloto:

- `/blog/como-calcular-custo-de-obra`

e da Fase 1 de rollout:

- custo
- prazo
- EVF
- ICCRI
- marcenaria

## 1. Hero

- validar se a imagem hero abre corretamente e nao quebra
- validar se o zoom de entrada do hero esta ativo
- validar se o texto do hero nao usa negrito indevido
- validar se `Grupo WG Almeida`, data e tempo de leitura seguem `font-light`
- validar se o resumo do hero usa a escala leve aprovada
- validar se o refresh nao abre em ancora interna antiga como `#passo-a-passo`

## 2. Card abaixo do hero

- validar se o layout acompanha o padrao aprovado do piloto
- validar se `Leitura Guiada` fica na mesma altura visual do piloto
- validar se o texto principal esta centralizado corretamente no eixo vertical
- validar se as tags ficam mais abaixo, com respiro separado do texto principal
- validar se a imagem ocupa o container inteiro, sem faixa de fundo aparente
- validar se o hover da imagem do card esta ativo
- validar se a cor do hover do card segue a categoria da materia
- validar se nao ha duplicacao entre `excerpt` e `subtitle`

## 3. Tipografia e pesos

- validar se nao existe `bold` residual em:
  - paragrafos
  - listas
  - perguntas frequentes
  - blocos ICCRI e ferramentas
  - footer
- validar se `strong` nao grita visualmente
- validar se o corpo aprovado usa leitura leve:
  - `14px`
  - `font-light`
  - `leading` leve
- validar se links do corpo nao ficam em azul forte fora do padrao
- validar se links usam leitura neutra e hover discreto

## 4. Titulos de bloco

- validar se a primeira chamada editorial do bloco entra como titulo de bloco
- validar se titulos equivalentes usam a mesma escala do piloto
- validar se os titulos abaixo estao normalizados como regra:
  - `O jeito mais rápido de estimar custo de obra e reforma é usar um ponto de partida simples:`
  - `Em 2026, a marcenaria planejada deve ser lida por categoria de investimento, e não só por um intervalo amplo de mercado.`
- validar se h2 e h3 nao fogem da hierarquia homologada
- validar se o primeiro bloco do intro card nao comeca mais baixo que os demais

## 5. Corpo do artigo

- validar ortografia completa
- validar acentos
- validar uso de `m²` em vez de `m2`
- validar se nao sobrou `[` ou `]` visivel no conteudo
- validar se nao sobrou lista markdown quebrada
- validar se bullets da pagina usam a cor da categoria
- validar se os bullets estao no tamanho homologado
- validar se listas nao ficam com negrito residual em `li`, `li > p` ou `strong`

## 6. Blocos especiais

- validar bloco `DESTAQUE`
  - gradiente aprovado
  - borda apenas na esquerda
  - texto leve
  - sem bordas em cima, baixo e direita
- validar bloco `CHECKLIST`
  - mesma familia visual do `DESTAQUE`
  - sem excesso de contraste
- validar que linhas indesejadas abaixo desses blocos foram removidas
- validar que nao existe linha amarela residual dentro dos cards

## 7. Imagens intercaladas

- validar se a primeira imagem integrada entra no padrao aprovado
  - imagem esquerda
  - texto direita
- validar se a segunda entra espelhada
  - texto esquerda
  - imagem direita
- validar alternancia automatica nas seguintes
- validar que o tamanho do bloco espelhado replica o bloco-base
- validar que a imagem nao cresce mais que a moldura
- validar que o zoom sutil da imagem esta ativo
- validar que a moldura acompanha o tamanho da imagem
- validar regra:
  - imagem horizontal = 1 imagem proporcional
  - imagem vertical = 2 imagens em composicao quando aplicavel

## 8. FAQ

- validar que `Perguntas Frequentes` segue a familia dos outros blocos
- validar que perguntas usam mini-card leve
- validar que respostas usam o mesmo tamanho aprovado do corpo
- validar `↳` na frente das respostas
- validar que `↳` usa a cor da categoria da materia

## 9. ICCRI, Liz e blocos finais

- validar se `Simule agora`, `Veja Também`, ICCRI e Liz seguem a regua aprovada
- validar que os links finais nao ficam azuis fora do padrao
- validar que nao ha icones inconsistentes em alguns links e outros nao
- validar se listas finais podem ser distribuidas em colunas quando aprovado
- validar se a secao `Para quem é este conteúdo` nao parece bold

## 10. Footer

- validar se o footer nao tem negrito residual
- validar se blocos textuais do footer usam `font-light`
- validar centralizacao aprovada dos links de ferramentas digitais
- validar se efeitos estruturais do footer permanecem intactos

## 11. Cores por categoria

- validar se a pagina nao herda azul de engenharia quando nao deveria
- validar cores por tema:
  - engenharia = azul
  - marcenaria = marrom
  - categorias verdes = verde
- validar hover, bullets, FAQ arrow e marcadores com a cor certa

## 12. Admin editorial

- validar se cada slot `context1..context4` pode receber:
  - imagem
  - alt
  - legenda
  - `sectionTitle`
  - `sectionId`
- validar se a imagem vinculada por titulo de bloco entra no bloco correto
- validar se o admin esta limpo, orientado por thumbs, sem peso visual desnecessario
- validar se guias de estilos tambem entram na mesma fila editorial

## 13. Responsividade

- validar desktop
- validar tablet
- validar mobile
- validar se o header nao quebra a marca
- validar troca de idioma
- validar se o layout continua firme em `pt-BR`, `en` e `es`

## 14. Integridade tecnica

- validar que nao existe erro de runtime
- validar que anchors internas nao sequestram o carregamento
- validar se as imagens carregam
- validar se a pagina abre direto no topo quando necessario
- validar que as alteracoes nao dependem de excecao local quebrada
- validar regras de imagem em todos os caminhos de renderizacao
- se houver efeito, mascara, corte, zoom ou tratamento editorial de imagem, validar em:
  - `ContextImageCard`
  - renderer integrado por secao
- validar que `sectionTitle/sectionId` esta casando com o bloco correto
- validar que a imagem nao some por agrupamento indevido quando a materia pedir `1 imagem por secao`

## 15. Comandos obrigatorios antes da entrega

- `npm run check:imports`
- `npm run audit:consistency:strict`
- `npm run lint`
- `npm run build`

Se o bloco envolver editorial e imagens:

- `npm run blog:editorial:status`
- `npm run blog:i18n:audit`

## 16. Gate de aprovacao visual

Uma pagina so pode ser considerada pronta quando:

- layout bate com o piloto aprovado
- tipografia bate com a regua homologada
- cores batem com a categoria certa
- imagens entram no bloco certo
- nao ha negrito residual
- nao ha linhas residuais
- nao ha links gritantes
- nao ha erro de escrita
- dev local confirma leitura limpa

## 16A. Gate de deploy e publicacao

- validar se a branch local nao esta em merge incompleto antes de abrir PR ou publicar
- validar se nao ha conflito residual em arquivos criticos:
  - `src/pages/Blog.jsx`
  - `src/data/blogImageManifest.js`
  - `src/data/blogImageOverrides.generated.js`
  - `src/pages/AdminBlogEditorial.jsx`
- validar se arquivos gerados/editoriais nao introduziram:
  - chaves duplicadas sem estrategia controlada
  - variavel nao inicializada
  - iterator sem `key`
- validar PR com os checks obrigatorios do repo publico:
  - `build-and-test`
  - `deploy-gate-final`
- nao considerar `build` local suficiente quando o CI remoto tambem roda `lint`
- se a branch protection bloquear push direto, promover por PR e nunca forcar publicacao manual
- validar URLs criticas em producao com `HTTP 200` apos merge:
  - blog
  - slugs prioritarios
  - guias prioritarios
  - assets de imagem
  - sitemap

## 17. Estrategia de rollout

Antes de entregar em lote:

1. revisar slug por slug com este checklist
2. corrigir no template central primeiro
3. corrigir markdown local so quando o problema for de conteudo
4. evitar excecao isolada por slug quando a regra puder ser promovida para o template
5. registrar o que virou regra no `RETURN-POINT.md`

## 18. Regra operacional final

O melhor caminho nao e continuar corrigindo pagina por pagina em cima de excecoes.

O caminho correto e:

- leitura total do slug
- identificacao do que e conteudo
- identificacao do que e template
- promocao da regra para a malha central sempre que possivel
- uso do slug piloto como referencia obrigatoria

## 19. Erros de deploy que nao podem se repetir

- conflito de merge fechado sem revisar a malha homologada pode reintroduzir regressao visual e editorial
- confiar so em `build` local pode deixar passar erro de `lint` que bloqueia PR
- aplicar efeito ou regra visual em apenas um renderer de imagem deixa parte das paginas sem o comportamento esperado
- override editorial duplicado em arquivo gerado pode sobrescrever a entrada correta no fim do pipeline
- tratar asset remoto curado como pendencia indistinta gera leitura operacional falsa no admin
- publicar sem validar `HTTP 200` nas rotas criticas deixa deploy aparentemente verde com regressao visivel ao usuario

