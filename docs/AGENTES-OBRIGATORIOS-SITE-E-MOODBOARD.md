# Agentes Obrigatorios - Site e Moodboard WG

Este documento formaliza os agentes-base que agora precisam existir nos projetos novos e nas evolucoes do `site-wgalmeida`.

## 1. Site inteligente orientado por contexto

Objetivo:
- entender a intencao do usuario
- classificar o estagio da jornada
- recomendar o proximo passo ideal
- manter sempre um caminho manual

Implementacao atual:
- `src/providers/ContextProvider.jsx`
  - persiste contexto global do usuario
- `src/components/ContextTracker.jsx`
  - captura rota, query string, sinais e atualiza contexto
- `src/lib/decisionEngine.js`
  - resolve interesse, tipo de imovel, estagio e next best action
- `src/components/SmartCTA.jsx`
  - exibe CTA principal, CTA secundario e fallback manual
- `src/hooks/useNextBestAction.js`
  - contrato unico para telas que precisem da recomendacao

Campos canonicos do contexto:
- `interesse`
- `tipoImovel`
- `faixaValor`
- `estagio`
- `origem`
- `paginas`
- `signals`
- `recommendedAction`

Regra:
- toda frente nova deve responder: `qual e o proximo passo ideal para este usuario neste momento?`

## 2. Integração com produtos WG

Objetivo:
- sair de CTA generico
- conectar site com execucao real

Destinos atuais:
- `ObraEasy`
- `Easy Real State`
- `Solicite Proposta`
- `WhatsApp` como fallback manual

Regra:
- IA nao pode ser o unico caminho
- toda recomendacao automatica precisa manter rota assistida/manual

## 3. Moodboard como sistema profissional

Objetivo:
- transformar gosto visual em direcao organizada
- levar a jornada ate documento, pagina publica e proposta

Implementacao atual:
- `src/pages/MoodboardGenerator.jsx`
  - selecao visual de estilo
  - referencias vivas com Unsplash
  - geracao de guia
  - pagina publica compartilhavel
  - sincronizacao do uso do moodboard com o contexto global

Regra:
- uso do moodboard deve promover o usuario pelo menos para `decisao`
- geracao de guia/publicacao deve promover para `acao`

## 4. Gestao editorial de imagens por slot

Objetivo:
- o editor escolhe a imagem
- o sistema resolve a origem sem expor complexidade

Estado unificado por slot:
- `pendente`
- `definida`

Slots canonicos:
- blog: `hero`, `card`, `context1`, `context2`, `context3`, `context4`
- guias de estilo: `cover`

Implementacao atual:
- `src/pages/AdminBlogEditorial.jsx`
  - fila editorial
  - preview por slot
  - busca Unsplash
  - upload Cloudinary
  - URL externa
  - snippets de manifesto

Regra:
- a interface publica do editor deve mostrar o estado final do slot, nao a complexidade interna da origem

## 5. Regra de continuidade

Toda nova entrega desse projeto deve validar:
1. contexto do usuario atualizado
2. CTA dinamico funcional
3. caminho manual presente
4. integracao com produto WG ou proposta
5. se envolver imagens editoriais, estado por slot coerente e visivel
