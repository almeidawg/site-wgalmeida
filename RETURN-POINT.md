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
git add -A && git commit -m "msg" && git push origin master
# Auto-deploy via Vercel (NÃO usar npx vercel --prod diretamente)
```

---

## Arquitetura CORRETA — Monodomain Hub

`wgalmeida.com.br` é o HUB central. Cada empresa tem seu PRÓPRIO site Vercel
e o hub proxifica via `vercel.json`.

### Regra de ouro
> Cada empresa com site próprio = deploy separado no Vercel + proxy rewrite em vercel.json.
> Empresas sem site próprio = página React dentro do app principal.

### Mapa de subpaths

| URL | Tipo | Vercel Project | Status |
|-----|------|---------------|--------|
| `/` | React SPA (hub) | site_grupowgalmeida | ✅ |
| `/arquitetura` | React page (app principal) | site_grupowgalmeida | ✅ |
| `/engenharia` | React page (app principal) | site_grupowgalmeida | ✅ |
| `/marcenaria` | React page (app principal) | site_grupowgalmeida | ✅ |
| `/buildtech` + `/buildtech/:path*` | **Proxy** → buildtech.wgalmeida.com.br | wg-WTB-build-tech | ✅ |
| `/wnomas` + `/wnomas/:path*` | **Proxy** → unomas-vinho.vercel.app | wnomas-vinho | ✅ |
| `/wnomasvinho` + `/wnomasvinho/:path*` | **Proxy** → unomas-vinho.vercel.app | wnomas-vinho | ✅ |
| `/easylocker` + `/easylocker/:path*` | **Proxy** → wg-easylocker.vercel.app | wg-easylocker | ✅ |

### Sites de empresas — Projetos Vercel separados

| Empresa | Pasta local | Vercel project | URL pública |
|---------|------------|---------------|-------------|
| WG Build Tech | `wg-WTB-build-tech/files/` | wg-WTB-build-tech | buildtech.wgalmeida.com.br |
| W Nomas Vinhos | `wnomasvinhos/site/` | wnomas-vinho | unomas-vinho.vercel.app |
| WG EasyLocker | `wg-easylocker/01_Easy_Locker_Site/` | wg-easylocker | wg-easylocker.vercel.app |

---

## Deploy por empresa

### Hub principal (wgalmeida.com.br)
```bash
cd 01_site-wgalmeida/site
npm run build
git add -A && git commit -m "msg" && git push origin master
# → Vercel auto-deploy
```

### WG Build Tech
```bash
cd wg-WTB-build-tech
# editar arquivos em files/
git add -A && git commit -m "msg" && git push
# ou: npx vercel --prod --yes
```

### W Nomas Vinhos
```bash
cd wnomasvinhos/site
# editar HTML estático
npx vercel --prod --yes
```

### WG EasyLocker
```bash
cd wg-easylocker/01_Easy_Locker_Site
npm run build
npx vercel --prod --yes
```

---

## Como adicionar nova empresa ao hub

1. Deploy da empresa em Vercel separado → obter URL de produção
2. Adicionar rewrite em `vercel.json` do hub:
```json
{ "source": "/nova-empresa", "destination": "https://nova-empresa.vercel.app/" },
{ "source": "/nova-empresa/:path*", "destination": "https://nova-empresa.vercel.app/:path*" }
```
3. (Opcional) Criar React page em `src/pages/NovaEmpresa.jsx` como landing page SEO
4. Adicionar rota em `src/App.jsx` e item em `Header.jsx` unitsItems
5. Build + push → auto-deploy

---

## Últimas sessões

### 2026-03-21 (sessão atual)
- ✅ Deploy W Nomas Vinhos → `unomas-vinho.vercel.app`
- ✅ Deploy WG EasyLocker → `wg-easylocker.vercel.app`
- ✅ Proxy rewrites adicionados em `vercel.json` para `/wnomas`, `/wnomasvinho`, `/easylocker`
- ✅ Arquitetura documentada e corrigida (monodomain hub com proxies)
- ✅ Push feito → auto-deploy em andamento

### 2026-03-21 (sessão anterior)
- Adicionadas rotas `/wnomas`, `/easylocker`, `/buildtech` no App.jsx
- Páginas React criadas: `Wnomas.jsx`, `EasyLocker.jsx`, `BuildTech.jsx`
- Header mega menu atualizado com W Nomas e EasyLocker
- Home.jsx atualizado com 6 empresas no grid

### Antes de 2026-03-21
- Header atualizado com ícone Globe para CTA WGEasy
- Deploy completo com sucesso
- PSI Score: Mobile 79–92, Desktop 93

---

## O que está pendente
- ⚠️ Sites de wnomas e easylocker usam paths relativos — testar navegação via proxy `/wnomas` e `/easylocker`
- Se navegação quebrar (links internos), opção A: adicionar `<base href="/wnomas/">` nas páginas HTML do wnomas
- EasyLocker é Vite/React — assets em `/assets/...` podem não funcionar via proxy sem configurar `base: '/easylocker/'` no vite.config
- Considerar adicionar subdomínios customizados no Vercel: `wnomas.wgalmeida.com.br`, `easylocker.wgalmeida.com.br`
