# Local Source Of Truth: EasyRealState + ObraEasy

Atualizado em `2026-04-10`.

## Objetivo

Este documento existe para eliminar ambiguidade sobre:

- onde cada projeto realmente esta
- qual pasta deve ser usada para desenvolvimento local
- quais pastas sao piloto, copia, embed ou arquivo morto
- como subir os projetos localmente antes de abrir tuneis

## Fonte oficial atual

### ObraEasy

- Pasta oficial para desenvolvimento local:
  `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\03_SaaS\ObraEasy`
- Remote Git identificado:
  `https://github.com/almeidawg/obra-easy.git`
- Estrutura real encontrada:
  - `frontend`
  - `backend`
  - `database`
- Status operacional:
  - projeto executavel localmente
  - backend e frontend separados
  - banco baseado em Supabase

### EasyRealState

- Pasta oficial para desenvolvimento local:
  `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\04_20260310_Prod\easy-realstate`
- Remote Git identificado:
  `https://github.com/almeidawg/easyrealstate.git`
- Estrutura real encontrada:
  - app Next.js unica
  - `app`
  - `components`
  - `lib`
- Status operacional:
  - projeto executavel localmente
  - frontend Next.js
  - integracoes com Supabase

## Pastas encontradas que NAO devem ser tratadas como fonte principal

### EasyRealState piloto e documentacao

- Pasta:
  `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\03_SaaS\clientes\001_Capadocia-Brokers\EasyRealState_Piloto_20260331`
- Uso correto:
  - referencia de produto
  - piloto
  - documentacao
- Nao usar como raiz principal de desenvolvimento continuo do produto.

### Espelhos, embeds e referencias dentro de outros projetos

Foram encontradas referencias de `EasyRealState` e `ObraEasy` dentro de:

- `site-wgalmeida`
- `WGEasy`
- `04_20260310_Prod\wgeasy`
- `_Grupo_WG_Almeida\EasyRealState`
- `_WG_build.tech\...assets\...`

Uso correto dessas ocorrencias:

- landing pages
- copias de producao
- componentes compartilhados
- codigo embutido em outros apps

Nao usar essas pastas como origem principal sem justificativa explicita.

### Arquivo morto

Tambem existem copias em `99_ARQUIVO_MORTO`.

Regra:

- nunca iniciar trabalho novo a partir de `99_ARQUIVO_MORTO`
- usar apenas para consulta historica, se necessario

## Regra operacional de trabalho

Quando a conversa mencionar os projetos abaixo, assumir estas pastas por padrao:

### "ObraEasy"

Usar:

`C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\03_SaaS\ObraEasy`

### "EasyRealState"

Usar:

`C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\04_20260310_Prod\easy-realstate`

Se aparecer outra pasta com o mesmo nome, validar antes de editar.

## Como rodar localmente

### ObraEasy

Backend:

```powershell
cd C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\03_SaaS\ObraEasy\backend
npm install
copy .env.example .env
npm run check:env
npm run dev
```

Frontend:

```powershell
cd C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\03_SaaS\ObraEasy\frontend
npm install
copy .env.example .env
npm run dev
```

Portas esperadas:

- backend: `3010`
- frontend: `5173` por padrao do Vite

Validacao minima:

```powershell
curl http://localhost:3010/health
curl http://localhost:3010/iccri/stats
```

### EasyRealState

```powershell
cd C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\04_20260310_Prod\easy-realstate
npm install
copy .env.local.example .env.local
npm run dev
```

Porta esperada:

- frontend Next.js: `3000`

Validacao minima:

- abrir `http://localhost:3000`
- confirmar carregamento da home e das rotas principais

## Regra antes de abrir tuneis

So criar `ngrok` ou `cloudflared` depois de validar:

- projeto sobe sem erro
- porta correta esta respondendo
- `.env` esta alinhado com a URL local certa
- CORS esta coerente entre frontend e backend

## Validacao local executada em 2026-04-10

### ObraEasy

- `backend` validado com `npm run validate`
- `frontend` validado com `npm run build`
- backend respondendo em `http://localhost:3010/health`
- backend respondendo em `http://localhost:3010/iccri/stats`
- frontend respondendo em `http://localhost:5173`

### EasyRealState

- build validado com `npm run build`
- uma instancia `next dev` ja estava ativa na mesma raiz e segurando o lock de `.next/dev/lock`
- instancia ativa respondendo em `http://localhost:3100`

### Implicacao pratica

Antes de iniciar outra instancia do `EasyRealState`, verificar se ja existe um `next dev` rodando na mesma pasta.

Se quiser iniciar manualmente em uma porta nova:

```powershell
cd C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\04_20260310_Prod\easy-realstate
npm run dev -- --port 4100
```

Se houver erro de lock, primeiro encerrar a instancia ja existente da mesma raiz.

## Checklist rapido

- confirmar pasta oficial do projeto
- confirmar se nao esta dentro de piloto, copia ou arquivo morto
- confirmar `node_modules`
- subir local
- validar portas
- so depois abrir tunel publico
