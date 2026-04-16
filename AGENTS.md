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
- `npm run check:imports`
- `npm run audit:consistency`
- `npm run audit:consistency:strict`
- `npm run build`
- Ao tocar em blog/conteudo editorial: `npm run blog:editorial:status`
- Para rodada automatica da fila/editorial: `npm run blog:editorial:auto`
- Ao tocar em i18n/blog/header responsivo: `npm run blog:i18n:audit`

## REGRAS
- Proibido hardcode de dominios de produtos (easy/obraeasy/easyrealstate/buildtech).
- Contatos institucionais devem sair de `src/data/company.js`.
- Strict mode e build sao bloqueadores de deploy.
- Antes de alterar conteudo tecnico, validar impacto em SEO + schema + rotas.
- Remocao de rota, pagina, landing ou asset publico exige limpeza no mesmo bloco de codigo, sitemap, redirects e docs de inventario/mapeamento.
- Conteudo publico com numeros, metodologia, benchmarks ou claims de produto deve ser validado contra a ferramenta e a metodologia ativa do ecossistema.
- Blog, landing e pagina institucional nao podem descrever metodologia desatualizada em relacao ao produto ativo.
- Quando houver diferenca entre benchmark externo e motor interno, registrar a diferenca e explicitar a natureza da fonte em vez de misturar os dados.
- Revisoes de blog que envolvam AVM, EVF, ROI, valorizacao, prazo, faixa ou precisao devem consultar a auditoria editorial central do EasyRealState.

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
6. Rodar check/imports + audit strict + build.
7. Registrar evidencias no `RETURN-POINT.md`.
