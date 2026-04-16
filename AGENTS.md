# AGENTS.md — site-wgalmeida

## Heranca obrigatoria WG
Este AGENTS deve ser usado em conjunto com:
- C:\Users\Atendimento\AGENTS.md
- C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\IA-START-HERE-WG.md
- C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\AGENTS-BOAS-PRATICAS-WG.md

## PROJETO
- Nome: site-wgalmeida
- Responsavel: Time Marketing + BuildTech
- Status: CORE / ACTIVE

## STACK
- Frontend: React + Vite
- Backend: API serverless + integracoes
- Infra: Vercel

## DEPLOY
- URL producao: https://wgalmeida.com.br
- URL preview: Vercel Preview Deploys
- Vercel project: site-wgalmeida
- Visibilidade Git: PUBLICO

## SSoT
- company.ts: `src/data/company.js`
- planos.ts: centralizado em `src/data/company.js` (espelho de planos publicos)
- urls.ts: centralizado em `src/data/company.js`

## AUDIT
- `npm run verify:fast`
- `npm run verify:full`
- `npm run verify:deploy`
- `npm run check:imports`
- `npm run audit:consistency`
- `npm run audit:consistency:strict`
- `npm run lint`
- `npm run build`
- Ao tocar em blog/conteudo editorial: `npm run blog:editorial:status`
- Para rodada automatica da fila/editorial: `npm run blog:editorial:auto`
- Ao tocar em i18n/blog/header responsivo: `npm run blog:i18n:audit`
- Para fechar saude estrutural de imagens/editorial: `npm run editorial:health`

## REGRAS
- Proibido hardcode de dominios de produtos (easy/obraeasy/easyrealstate/buildtech).
- Contatos institucionais devem sair de `src/data/company.js`.
- Nao considerar deploy seguro se `lint` local nao foi executado.
- Ao tocar em imagem editorial do blog ou dos guias, validar sempre os dois caminhos:
  - `ContextImageCard`
  - renderer integrado por secao
- Ao tocar em manifesto/override editorial gerado, revisar duplicidade e garantir que o bloco canonico final nao sera sobrescrito por entrada antiga.
- Se a preocupacao for regressao de sumir imagem, a validacao obrigatoria minima e:
  - `npm run editorial:health`
  - `npm run blog:editorial:status`
  - `npm run blog:editorial:repetition:audit`
  - `npm run style:editorial:status`
- So considerar a regressao estrutural de imagem fechada quando o health estiver com:
  - `blogStructuralClosed: true`
  - `stylesStructuralClosed: true`
  - `editorialStructuralClosed: true`
- Strict mode e build sao bloqueadores de deploy.
- Antes de alterar conteudo tecnico, validar impacto em SEO + schema + rotas.
- Remocao de rota, pagina, landing ou asset publico exige limpeza no mesmo bloco de codigo, sitemap, redirects e docs de inventario/mapeamento.
- Conteudo publico com numeros, metodologia, benchmarks ou claims de produto deve ser validado contra a ferramenta e a metodologia ativa do ecossistema.
- Blog, landing e pagina institucional nao podem descrever metodologia desatualizada em relacao ao produto ativo.
- Quando houver diferenca entre benchmark externo e motor interno, registrar a diferenca e explicitar a natureza da fonte em vez de misturar os dados.
- Revisoes de blog que envolvam AVM, EVF, ROI, valorizacao, prazo, faixa ou precisao devem consultar a auditoria editorial central do EasyRealState.

## GIT / CI / DEPLOY
- `main` e branch protegida. Nao fazer push direto para `main`.
- Fluxo obrigatorio: criar branch curta por bloco, commitar, abrir PR contra `main`, aguardar `build-and-test` e `deploy-gate-final`, mesclar e acompanhar pipeline da `main`.
- Checks obrigatorios de protecao da `main`:
  - `build-and-test`
  - `deploy-gate-final`
- SonarCloud pode aparecer como check externo nao bloqueante enquanto nao houver baseline oficial aprovado.
- Deploy de producao e feito pela integracao Git da Vercel. Nao tratar job placeholder de GitHub Actions como fonte canonica de deploy.
- Antes de push/PR, preferir `npm run verify:full`. Para fechamento de deploy com SEO, usar `npm run verify:deploy`.
- Se um push direto para `main` falhar com `GH006`, nao alterar protecao para contornar: abrir PR e seguir o fluxo protegido.

## ROLLBACK
- Deploy: rollback pelo painel Vercel.
- Codigo: reverter commit e rerodar validacoes obrigatorias.
- SEO/rotas: rebuild completo e revalidacao de sitemap.

## CONTEXTO RAPIDO
Site institucional e camada de aquisicao do ecossistema WG, integrado com produtos SaaS e SEO tecnico. Projeto com baseline zerado e governanca anti-drift ativa.

## FLUXO OPERACIONAL
1. Ler `IA-START-HERE-WG.md`.
2. Ler `RETURN-POINT.md`.
3. Definir alteracao por bloco.
4. Implementar sem duplicar fonte de dados.
5. Em blog/i18n, validar `pt-BR`, `en` e `es` em listagem + detalhe e checar header responsivo.
6. Rodar `npm run verify:full` antes de PR/deploy.
7. Registrar evidencias no `RETURN-POINT.md`.
