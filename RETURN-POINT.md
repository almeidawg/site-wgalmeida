# RETURN-POINT — Site WG Almeida (wgalmeida.com.br)
**Atualizado:** 2026-03-21

---

## Repositório & Deploy
- **Git remote:** `https://github.com/almeidawg/site_grupowgalmeida.git`
- **Branch principal:** `master` → auto-deploy via Vercel
- **URL produção:** `https://wgalmeida.com.br`
- **Vercel Project:** site_grupowgalmeida

## Stack
React 18 + Vite + TailwindCSS + React Router v6 + Supabase + i18next

## Caminho do projeto
```
C:\Users\Atendimento\Documents\_WG_build.tech\02_20260310_Projetos\_Grupo-WGAlmeida_Projetos\01_site-wgalmeida\site\
```

## Comandos
```bash
# Dev local
npm run dev          # porta 3000

# Build + deploy
npm run build
npx vercel deploy --prebuilt --prod
```

---

## Arquitetura — Grupo WG Almeida (monodomain)

O site `wgalmeida.com.br` é o hub central do Grupo, com TODAS as empresas acessíveis via subpath:

| URL | Página | Arquivo | Status |
|-----|--------|---------|--------|
| `/` | Home (accordion de empresas) | `src/pages/Home.jsx` | ✅ |
| `/arquitetura` | WG Arquitetura | `src/pages/Architecture.jsx` | ✅ |
| `/engenharia` | WG Engenharia | `src/pages/Engineering.jsx` | ✅ |
| `/marcenaria` | WG Marcenaria | `src/pages/Carpentry.jsx` | ✅ |
| `/wnomas` | W Nomas Vinhos | `src/pages/Wnomas.jsx` | ✅ (adicionado 21/03) |
| `/easylocker` | WG EasyLocker | `src/pages/EasyLocker.jsx` | ✅ (adicionado 21/03) |
| `/buildtech` | WG Build Tech | proxy → buildtech.wgalmeida.com.br | ✅ (vercel rewrite) |

### Regra de ouro — Sem duplicação
- Cada empresa tem UMA página dentro deste React app
- Projetos de cliente ficam em `buildtech.wgalmeida.com.br/clientes/<slug>`
- `buildtech.wgalmeida.com.br` é projeto Vercel separado, acessível também via proxy em `/buildtech`

---

## Vercel.json — Rewrites importantes
1. `/buildtech` + `/buildtech/:path*` → proxy para `buildtech.wgalmeida.com.br` ✅
2. `/buildtech/clientes/:path*` → redirect externo ✅
3. `/buildtech/easyfood/:path*` → proxy para restaurante app ✅
4. `/sobre`, `/arquitetura`, `/engenharia`, `/marcenaria`, etc. → static HTML prerender ✅
5. `/(.*) → /index.html` → SPA catch-all (cobre /wnomas, /easylocker) ✅

**ATENÇÃO:** `/wnomas` e `/easylocker` NÃO têm rewrite estático — caem no SPA catch-all. Isso é correto, mas se precisar de prerender para SEO, adicionar:
```json
{ "source": "/wnomas", "destination": "/wnomas/index.html" },
{ "source": "/easylocker", "destination": "/easylocker/index.html" }
```

---

## Últimas sessões

### 2026-03-21
- Adicionadas rotas `/wnomas`, `/easylocker`, `/buildtech` no App.jsx
- Páginas `Wnomas.jsx`, `EasyLocker.jsx`, `BuildTech.jsx` já existiam mas sem rota
- Criado este RETURN-POINT.md
- `public/buildtech/clientes/` = pasta untracked, não deletar (pode ter conteúdo relevante)

### Antes de 2026-03-21
- Header atualizado com ícone Globe para CTA WGEasy
- Deploy completo com sucesso
- PSI Score: Mobile 79–92, Desktop 93

---

## Onde parou
- Rotas adicionadas, falta commit + push para deploy automático
- Home.jsx ainda NÃO tem o accordion de todas as empresas — próxima sessão
- Verificar se BuildTech.jsx (rota React) deve ser mantido ou removido (Vercel proxy já cobre /buildtech)
