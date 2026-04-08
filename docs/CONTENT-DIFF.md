# Diff de Conteudo do Site WG Almeida

Atualizado em: 06/04/2026
Projeto: `site-wgalmeida`

## Resumo executivo

O blog atual e o snapshot HTML local estao muito proximos.

Resultado da comparacao:

- 64 posts existem em `src/content/blog` e tambem em `site-wglmeida-blog-imagens/blog`
- 4 posts existem apenas no Markdown atual
- 0 posts foram encontrados apenas no snapshot HTML local

Conclusao:

- o snapshot HTML local e uma fonte forte de restauracao
- o front atual preserva praticamente todo o acervo editorial principal
- o risco maior esta em imagens, assets e paginas institucionais, nao no texto do blog

## Fonte principal comparada

Markdown atual:

- `src/content/blog/`

Snapshot HTML local:

- `site-wglmeida-blog-imagens/blog/`

## Posts presentes nas duas fontes

Base comum confirmada:

- `acapulco-club-house-residencia-luxo`
- `arquitetos-brasileiros-famosos-legado`
- `arquitetos-internacionais-famosos-obras`
- `arquitetura-alto-padrao`
- `arquitetura-amsterdam-holanda`
- `arquitetura-barcelona-espanha`
- `arquitetura-bruges-belgica`
- `arquitetura-bruxelas-belgica`
- `arquitetura-haarlem-holanda`
- `arquitetura-lisboa-portugal`
- `arquitetura-paris-franca`
- `arquitetura-sustentavel-certificacoes`
- `automacao-residencial-2026-guia`
- `bancada-cozinha-ergonomia`
- `bim-construcao-civil-como-funciona`
- `briefing-projeto-dos-sonhos`
- `casa-cor-2026-mente-coracao`
- `closet-planejado-organizacao-otimizacao`
- `cronograma-obra-acompanhamento`
- `documentacao-obra-condominio`
- `dyson-tecnologia-design-residencial`
- `erros-comuns-reforma-como-evitar`
- `especificacoes-tecnicas-diferenca`
- `etapas-prazos-projeto-arquitetonico`
- `etapas-reforma-completa`
- `evf-estudo-viabilidade-financeira`
- `guia-estilos-ambientes-residenciais`
- `guia-estilos-decoracao`
- `harman-kardon-som-ambientes`
- `home-office-ergonomia-produtividade`
- `iluminacao-residencial-guia-completo`
- `iluminacao-tecnica-rasgo-de-luz`
- `importancia-contratar-arquiteto`
- `informe-obra-condominio`
- `le-creuset-panelas-design`
- `liz-curadoria-wg-almeida`
- `marcas-luxo-internacionais-moveis-design`
- `marcas-luxo-nacionais-moveis-decoracao`
- `marcenaria-sob-medida`
- `marcenaria-sob-medida-tendencias-2026`
- `memorial-executivo-obra`
- `moodboard-mapa-visual`
- `normas-tecnicas-representacao`
- `o-que-e-turn-key`
- `onboarding-processo-wg-almeida`
- `paleta-cores-2026-cor-do-ano`
- `plantas-interiores-purificam-ar`
- `profissionais-capacitados-obra`
- `projeto-executivo-o-que-e`
- `quanto-custa-reformar-apartamento-2026`
- `quanto-tempo-dura-reforma-apartamento`
- `ralo-linear-areas-molhadas`
- `reforma-banheiro-moderno-2026`
- `reforma-banheiro-pequeno-otimizacao`
- `reforma-cozinha-planejada-guia-completo`
- `scandia-home-roupa-cama-luxo`
- `sistema-easy-metodologia-wg-almeida`
- `steel-frame-vs-alvenaria-qual-escolher`
- `sustentabilidade-construcao-civil-2026`
- `tendencias-construcao-civil-2026`
- `tendencias-decoracao-interiores-2026`
- `termo-responsabilidade-nbr16280`
- `varanda-gourmet-planejamento`
- `williams-sonoma-cozinha-luxo`

## Posts encontrados apenas no Markdown atual

Esses 4 nao apareceram no snapshot HTML local:

- `calculadora-preco-m2-corretores-imobiliarias`
- `custo-construcao-reforma-2026-guia-tecnico-completo`
- `obraeasy-como-funciona-para-clientes-finais`
- `obraeasy-para-parceiros-imobiliarias-corretores`

Leitura operacional:

- esses quatro parecem ser conteudo mais recente ou mais estrategico
- dois sao claramente voltados ao ecossistema de produto WG
- nao ha sinal de perda deles no snapshot porque provavelmente foram adicionados depois

## Posts encontrados apenas no snapshot HTML

Nenhum localizado no diff atual.

Leitura operacional:

- o snapshot HTML local nao revelou posts "perdidos" do blog que tenham sumido do Markdown
- o problema principal nao esta no texto-base do blog

## Achados complementares

### CTA e links institucionais

O blog atual referencia de forma recorrente:

- `https://wgalmeida.com.br/solicite-proposta`
- `contato@wgalmeida.com.br`

Achado pontual:

- `obraeasy-como-funciona-para-clientes-finais.md` ainda usa `https://wgalmeida.com.br/solicite-sua-proposta`
- hoje a aplicacao redireciona essa rota em `src/App.jsx`

### Vercel local

A arvore atual esta vinculada ao projeto:

- `projectId: prj_c5G5oZHW6QP3d9kub156RcrFVHVt`
- `projectName: site-wgalmeida-repo-fixed`

Arquivos observados:

- `.vercel/project.json`
- `.vercel/output/builds.json`
- `.vercel/output/config.json`
- `.vercel/output/diagnostics/cli_traces.json`

Achado importante:

- o ultimo `vercel build` local registrado em `.vercel/output/builds.json` falhou em `npm install`
- isso confirma historico local de build, mas nao adiciona conteudo recuperavel por si so

### Git arquivado

Existe copia arquivada em:

- `99_ARQUIVO_MORTO/site-wgalmeida-descartadas-20260406/site-wgalmeida-repo-clean`

Achados:

- preserva `.git`
- remoto: `https://github.com/almeidawg/site-wgalmeida.git`
- branch principal: `main`

Restricao:

- essa copia esta em `99_ARQUIVO_MORTO`, entao nao deve ser usada como base de desenvolvimento
- pode ser usada apenas como referencia auxiliar se precisarmos abrir commits antigos ou comparar arquivos especificos

## Interpretacao pratica

O que esta preservado com boa confianca:

- estrutura editorial principal do blog
- slugs
- CTAs
- grande parte das rotas institucionais
- snapshot HTML de validacao local

O que continua sob risco ou exige restauracao:

- imagens proprietarias finais
- banners e midia local substituida por Unsplash
- hero videos
- acervo de projetos reais
- possiveis diferenças finas entre layout atual e snapshots

## Prioridade recomendada

1. Reconstruir mapa de imagens e banners ausentes
2. Identificar paginas que ainda dependem de Unsplash
3. Cruzar snapshots de paginas institucionais com screenshots do portfolio
4. Revisar o Git arquivado apenas quando houver lacuna especifica que o snapshot local nao cobre
