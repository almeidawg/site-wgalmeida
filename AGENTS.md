# AGENTS.md — site-wgalmeida

## Heranca obrigatoria WG
Este AGENTS deve ser usado em conjunto com:
- C:\Users\Atendimento\AGENTS.md
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

## REGRAS
- Proibido hardcode de dominios de produtos (easy/obraeasy/easyrealstate/buildtech).
- Contatos institucionais devem sair de `src/data/company.js`.
- Strict mode e build sao bloqueadores de deploy.
- Antes de alterar conteudo tecnico, validar impacto em SEO + schema + rotas.

## ROLLBACK
- Deploy: rollback pelo painel Vercel.
- Codigo: reverter commit e rerodar validacoes obrigatorias.
- SEO/rotas: rebuild completo e revalidacao de sitemap.

## CONTEXTO RAPIDO
Site institucional e camada de aquisicao do ecossistema WG, integrado com produtos SaaS e SEO tecnico. Projeto com baseline zerado e governanca anti-drift ativa.

## FLUXO OPERACIONAL
1. Ler `RETURN-POINT.md`.
2. Definir alteracao por bloco.
3. Implementar sem duplicar fonte de dados.
4. Rodar check/imports + audit strict + build.
5. Registrar evidencias no `RETURN-POINT.md`.
