# Plano de Rollout do Padrao Editorial

Data: 2026-04-15
Projeto: `site-wgalmeida`
Base homologada: `/blog/como-calcular-custo-de-obra`

## Objetivo

Planejar a replicacao controlada do padrao aprovado no piloto para:
- blog
- guias de estilos
- blocos editoriais relacionados

## Inventario

- Blog: `78` materias markdown
- Guias de estilos: `31` paginas markdown

## Leitura do acervo

### Grupo A — replicacao direta do sistema aprovado

Paginas que ja possuem estrutura de leitura orientada, FAQ ou secao de decisao proxima do piloto:
- `custo-marcenaria-planejada.md`
- `custo-reforma-apartamento-alto-padrao-sp.md`
- `custo-reforma-m2-sao-paulo.md`
- `etapas-reforma-completa.md`
- `evf-estudo-viabilidade-financeira.md`
- `obraeasy-como-funciona-para-clientes-finais.md`
- `obraeasy-para-parceiros-imobiliarias-corretores.md`
- `quanto-custa-reforma-apartamento-100m2.md`
- `quanto-tempo-leva-reforma-completa-alto-padrao.md`
- `quanto-valoriza-apartamento-apos-reforma.md`
- `tabela-precos-reforma-2026-iccri.md`
- `vale-a-pena-contratar-arquiteto-turn-key.md`

Critico porque:
- possuem `Perguntas Frequentes` ou estrutura de decisao equivalente
- conversam com EVF, ICCRI, custo, prazo ou valor
- sao as mais proximas do piloto homologado

### Grupo B — adaptacao editorial forte, mas sem o mesmo sistema inteiro

Materias com densidade de H2 alta e leitura longa, candidatas a aplicar:
- tipografia
- bullets
- FAQ quando existir
- blocos de destaque suaves
- imagem integrada por secao quando fizer sentido editorial

Exemplos levantados:
- `tendencias-decoracao-interiores-2026.md`
- `arquitetos-internacionais-famosos-obras.md`
- `arquitetura-bruges-belgica.md`
- `onboarding-processo-wg-almeida.md`
- `arquitetura-haarlem-holanda.md`
- `varanda-gourmet-planejamento.md`
- `casa-cor-2026-mente-coracao.md`
- `marcenaria-sob-medida-tendencias-2026.md`
- `paleta-cores-2026-cor-do-ano.md`
- `plantas-interiores-purificam-ar.md`
- `quanto-tempo-dura-reforma-apartamento.md`
- `closet-planejado-organizacao-otimizacao.md`
- `iluminacao-residencial-guia-completo.md`
- `home-office-ergonomia-produtividade.md`
- `custo-construcao-reforma-2026-guia-tecnico-completo.md`

### Grupo C — guias de estilos

Os `31` guias usam `EstiloDetail.jsx`, o que abre uma vantagem:
- a padronizacao estrutural pode ser centralizada no template
- parte do rollout dos guias nao exige 31 refactors individuais no componente

Guias com maior densidade de H2 e melhor retorno para validar o template:
- `maximalista.md`
- `tulum.md`
- `shabby-chic.md`
- `mid-century.md`
- `ecletico.md`
- `wabi-sabi.md`
- `transitional.md`
- `hampton.md`
- `industrial.md`
- `rustico.md`
- `provencal.md`
- `mediterraneo.md`

## O que replica direto

Replica sem reinterpretacao:
- regua tipografica leve
- neutralizacao de `strong`
- bullets menores e na cor da materia
- FAQ com mini-cards e `↳`
- bloco `DESTAQUE` suave
- hero meta sem negrito
- `Leitura Guiada`
- bloco `Liz`
- bloco `ICCRI`
- footer leve

## O que replica com adaptacao

Adaptar por contexto:
- blocos integrados com imagem por secao
- uso de `Passo a passo` e `Onde entra o EVF`
- `Simule agora`
- `Veja Também`
- cards de apoio especificos de custo/prazo/valor

## Regras de rollout

### Fase 1

Aplicar o sistema homologado nas materias de custo, prazo, EVF e ICCRI:
- `custo-marcenaria-planejada.md`
- `custo-reforma-m2-sao-paulo.md`
- `quanto-custa-reforma-apartamento-100m2.md`
- `quanto-tempo-leva-reforma-completa-alto-padrao.md`
- `quanto-valoriza-apartamento-apos-reforma.md`
- `evf-estudo-viabilidade-financeira.md`
- `tabela-precos-reforma-2026-iccri.md`

Regra canonica da Fase 1:
- usar `/blog/como-calcular-custo-de-obra` como base obrigatoria de rollout para os proximos conteudos de custo, prazo e processo
- manter separacao explicita entre:
  - referencia editorial
  - simulacao
  - motor ativo
- nao misturar narrativa de conteudo com promessa de leitura live quando a pagina ainda estiver em camada editorial
- preservar centralizacao de URLs de produtos e CTAs para evitar drift nas proximas replicacoes

### Fase 2

Aplicar nas materias operacionais/comerciais do ecossistema:
- `etapas-reforma-completa.md`
- `obraeasy-como-funciona-para-clientes-finais.md`
- `obraeasy-para-parceiros-imobiliarias-corretores.md`
- `vale-a-pena-contratar-arquiteto-turn-key.md`

### Fase 3

Padronizacao do template dos guias de estilos via `EstiloDetail.jsx`

Aplicar centralmente:
- tipografia leve
- neutralizacao de negrito
- sistema de blocos equivalentes ao blog quando houver secao comparavel
- regras consistentes para imagens e legenda
- eventual integracao com imagem por bloco via admin editorial

### Fase 4

Rodada de conteudo longo e editorial aspiracional com adaptacao manual por materia

## Regras de decisao para imagem por bloco

Ao replicar:
- primeira imagem integrada: esquerda
- segunda: direita
- terceira: esquerda
- quarta: direita

Se a imagem for:
- horizontal: uma imagem
- vertical: duas imagens no bloco quando a composicao pedir

## Regras de aprovacao

Cada pagina deve ser avaliada em:
- desktop
- tablet
- mobile
- troca de idioma quando aplicavel

Validar:
- hero
- card abaixo do hero
- listas
- bloco destaque
- FAQ
- CTA
- ICCRI/Liz quando houver
- footer

## Regras de implementacao

- priorizar alteracoes no template compartilhado quando existir
- so tocar no markdown quando:
  - houver erro textual
  - acento incorreto
  - `m2` precisar virar `m²`
  - heading/estrutura precisar casar com o sistema aprovado
- em materias de custo, prazo e processo, revisar sempre se o texto distingue com clareza:
  - conteudo de orientacao
  - simulacao guiada
  - motor ou dado ativo do ecossistema WG

## Entregaveis obrigatorios do rollout

- auditoria consolidada
- plano de rollout
- evidencias no `RETURN-POINT.md`
- validacao com:
  - `check:imports`
  - `audit:consistency`
  - `audit:consistency:strict`
  - `build`

## Conclusao

O piloto esta fechado.

O caminho mais eficiente e com menor risco agora e:
1. replicar primeiro na familia de custo/prazo/EVF/ICCRI
2. centralizar o maximo possivel dos guias em `EstiloDetail.jsx`
3. so depois expandir para o acervo editorial mais longo
