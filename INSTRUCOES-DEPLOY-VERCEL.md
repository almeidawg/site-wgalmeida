# 🚀 INSTRUÇÕES DE DEPLOY - VERCEL

## ✅ STATUS ATUAL

- ✅ Build de produção: **COMPLETO** (pasta `dist/`)
- ✅ Vercel CLI: **INSTALADO** (v50.4.5)
- ✅ Configuração: **PRONTA** (`vercel.json`)
- ✅ Commit Git: **REALIZADO** (commit 3c78a1e)
- ⏳ Próximo passo: **LOGIN E DEPLOY**

---

## 🔐 PASSO 1: LOGIN NA VERCEL

Abra o terminal e execute:

```bash
cd Z:\SITE_WGALMEIDA\site
vercel login
```

**O que vai acontecer:**
1. Vercel CLI abrirá seu navegador
2. Escolha método de login:
   - GitHub (recomendado)
   - GitLab
   - Bitbucket
   - Email
3. Autorize a Vercel CLI
4. Volte para o terminal

---

## 🚀 PASSO 2: DEPLOY PARA PRODUÇÃO

Após o login, execute:

```bash
vercel --prod
```

**O CLI vai perguntar:**

```
? Set up and deploy "Z:\SITE_WGALMEIDA\site"? [Y/n]
> Y

? Which scope do you want to deploy to?
> [Seu usuário/organização]

? Link to existing project? [y/N]
> N

? What's your project's name?
> grupo-wg-almeida

? In which directory is your code located?
> ./

? Want to override the settings? [y/N]
> N
```

**Deploy iniciará automaticamente!**

---

## 🌐 PASSO 3: CONFIGURAR DOMÍNIO PERSONALIZADO

### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto **grupo-wg-almeida**
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite: `wgalmeida.com.br`
6. Clique em **Add**
7. Repita para `www.wgalmeida.com.br`

### Opção B: Via CLI

```bash
vercel domains add wgalmeida.com.br --yes
vercel domains add www.wgalmeida.com.br --yes
```

### Configurar DNS

A Vercel fornecerá os nameservers. Configure no seu provedor de domínio:

**Opção 1 - Nameservers (Recomendado):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Opção 2 - Registro A:**
```
A record: @ → 76.76.21.21
CNAME: www → cname.vercel-dns.com
```

---

## 📊 APÓS O DEPLOY

### URLs Geradas:
- **Produção**: `https://grupo-wg-almeida.vercel.app`
- **Preview**: URLs únicas para cada commit
- **Domínio Personalizado**: `https://wgalmeida.com.br` (após configurar)

### Funcionalidades Incluídas:
- ✅ FAQ page em `/faq`
- ✅ Landing pages de bairros:
  - `/itaim`
  - `/jardins`
  - `/brooklin`
  - `/vila-nova-conceicao`
  - `/cidade-jardim`
  - `/morumbi`
  - `/vila-mariana` (NOVA)
  - `/mooca` (NOVA)

---

## 🔄 DEPLOYS FUTUROS

Sempre que fizer alterações:

```bash
# 1. Build local
npm run build

# 2. Deploy para produção
vercel --prod

# Ou deploy de preview
vercel
```

---

## 🛠️ SCRIPT AUTOMÁTICO

Use o script criado:

```bash
.\deploy-vercel.bat
```

Este script:
1. Verifica se há build
2. Faz login (se necessário)
3. Deploy automático
4. Mostra URL de acesso

---

## 📱 VALIDAR DEPLOY

Após deploy, teste:

1. **Home**: https://grupo-wg-almeida.vercel.app/
2. **FAQ**: https://grupo-wg-almeida.vercel.app/faq
3. **Mooca**: https://grupo-wg-almeida.vercel.app/mooca
4. **Vila Mariana**: https://grupo-wg-almeida.vercel.app/vila-mariana

---

## 🎯 COMANDOS ÚTEIS

```bash
# Ver status do projeto
vercel ls

# Ver logs
vercel logs

# Remover deployment
vercel remove [deployment-url]

# Ver domínios configurados
vercel domains ls

# Informações do projeto
vercel inspect
```

---

## 🆘 TROUBLESHOOTING

### Erro: "No existing credentials"
```bash
vercel login
```

### Erro: "Build failed"
```bash
npm run build
vercel --prod
```

### Mudar domínio
```bash
vercel domains rm wgalmeida.com.br
vercel domains add novo-dominio.com.br
```

---

## 📞 SUPORTE

- Vercel Docs: https://vercel.com/docs
- Dashboard: https://vercel.com/dashboard
- Status: https://vercel-status.com

---

**Criado em**: 18/01/2026
**Build**: dist/
**Framework**: Vite + React
**Node**: v24.11.1
