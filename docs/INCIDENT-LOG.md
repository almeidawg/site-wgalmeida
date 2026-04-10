# INCIDENT-LOG

Atualizado: 10/04/2026

## Objetivo

Registro cronologico de incidentes de produto/operacao com:
- sintoma real observado
- causa raiz confirmada
- correcao aplicada
- evidencias de validacao
- prevencao para evitar recorrencia

Este log complementa:
- `docs/UI-BUGS-AND-FIXES.md` (playbook por tipo de problema)
- `RETURN-POINT.md` (contexto operacional da sessao)

## Fluxo padrao por incidente

1. Registrar o sintoma com ambiente e URL exata.
2. Confirmar causa raiz com evidencia tecnica (DOM, processo, build, logs).
3. Aplicar correcao cirurgica.
4. Validar no mesmo endpoint de homologacao usado pelo time.
5. Salvar evidencia em `.monitor-data/`.
6. Registrar neste arquivo e atualizar o playbook especifico.

## Template

Copiar este bloco para novos incidentes:

```md
## [INC-YYYYMMDD-XX] Titulo curto

- Data: YYYY-MM-DD
- Status: Open | Monitoring | Resolved
- Severidade: Low | Medium | High
- Ambiente: dev | preview | prod
- URL(s):
  - ...
- Sintoma:
  - ...
- Causa raiz:
  - ...
- Correcao:
  - ...
- Validacao:
  - ...
- Evidencias:
  - ...
- Prevencao:
  - ...
- Arquivos alterados:
  - ...
```

## Incidentes

## [INC-20260410-01] Card de Barcelona com imagem editorial ambigua

- Data: 2026-04-10
- Status: Resolved
- Severidade: Medium
- Ambiente: preview
- URL(s):
  - `http://localhost:3011/blog/arquitetura-barcelona-espanha`
- Sintoma:
  - Hero correto de Barcelona.
  - Card "Leitura Guiada" com imagem ambigua (arco), gerando leitura de cidade incorreta.
- Causa raiz:
  - `vite preview` estava servindo `dist` desatualizado em parte da validacao.
  - Mapeamento local aceitava `.../barcelona/card` separado do `hero`.
  - Metadados alt de alguns slugs sem referencia geografica forte.
- Correcao:
  - Fallback seguro em `src/data/blogImageManifest.js` para Barcelona (`card/thumb/square -> hero`).
  - Ajustes de alt em `src/data/blogUnsplashSelection.json`.
  - Auditoria reforcada em `tools/audit-blog-unsplash-selection.mjs` (consistencia geografica + duplicidade entre slugs).
  - Rebuild completo e reinicio do preview em `:3011`.
- Validacao:
  - DOM no endpoint de homologacao passou a retornar:
    - `cardSrc = .../editorial/blog/arquitetura-barcelona-espanha/hero`
  - Creditos hero/card alinhados com `Jorge Fernandez Salas`.
- Evidencias:
  - `.monitor-data/barcelona-3011-now.png`
  - `.monitor-data/barcelona-3011-after-build.png`
  - `.monitor-data/barcelona-3011-card-after-build.png`
- Prevencao:
  - Nao aprovar ajuste de imagem somente em `dev` quando homologacao usa `preview`.
  - Sempre validar na URL real usada pelo time.
  - Rodar auditoria editorial antes de fechamento:
    - `npm run blog:editorial:audit`
    - `npm run unsplash:manifest:build`
    - `npm run lint`
- Arquivos alterados:
  - `src/data/blogImageManifest.js`
  - `src/data/blogUnsplashSelection.json`
  - `src/data/blogUnsplashManifest.generated.js`
  - `tools/audit-blog-unsplash-selection.mjs`
  - `docs/UI-BUGS-AND-FIXES.md`

