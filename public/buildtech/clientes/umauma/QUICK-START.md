# 🚀 EventOS — Quick Start Guide

**Tempo estimado:** 2 minutos para rodar localmente

---

## 1️⃣ Acessar o Projeto

```bash
cd C:\Users\Atendimento\Documents\_WG_build.tech\Em-Desenvolvimento\20260310-Grupo_UmaUma
```

## 2️⃣ Rodar Servidor Local

### Opção A: HTTP Server (Recomendado - Já Rodando)
```bash
npx http-server -p 8000 -c-1
```
**Acesso:** http://localhost:8000 ✅

### Opção B: Python (Alternativa)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Opção C: Desenvolvimento com React/Vite
```bash
# Instalar
npm install

# Rodar dev server
npm run dev

# Build produção
npm run build
```

---

## 3️⃣ O Que Você Encontra

### 📄 Landing Page
**URL:** http://localhost:8000

Mostra:
- Logo UMAUMA oficial
- 3 seções principais (Pitch, Demo, Requisitos)
- Design tokens aplicados
- Cores corporativas

### 📊 Demo Interativo
**Arquivo:** `EventOS-Demo-Completo.jsx`

5 telas funcionais:
- ✅ Dashboard (visão geral)
- ✅ Kanban (projetos em workflow)
- ✅ Gantt (timeline de eventos)
- ✅ Equipe (alocação de recursos)
- ✅ Financeiro (receitas/custos)

### 🎨 Design Tokens
**Arquivo:** `design-tokens.css`

Contém:
- Cores do Grupo UMAUMA
- 14 cores das agências
- Tipografia corporativa
- Spacing system
- Shadows e borders

---

## 📋 Estrutura de Pastas

```
📁 20260310-Grupo_UmaUma
  ├─ 📄 index.html                 ← Landing page (começa aqui!)
  ├─ 🎨 design-tokens.css         ← Cores e estilos
  ├─ 📊 EventOS-Demo-Completo.jsx ← Demo funcional
  ├─ 📦 package.json              ← Dependências
  ├─ ⚙️ vite.config.js            ← Config dev
  ├─ 📚 LOCAL-SETUP.md            ← Setup detalhado
  ├─ 📖 README.md                 ← Documentação
  └─ ✅ PROJETO-FINALIZADO.md     ← Resumo do que foi feito
```

---

## 🎨 Cores do Projeto

### Brand UMAUMA
| Nome | Código | Uso |
|------|--------|-----|
| Azul Primário | `#046bd2` | Botões, links, headings |
| Azul Escuro | `#045cb4` | Hover, estados |
| Orange | `#FF5722` | Ênfase, alertas |
| Fundo Claro | `#F0F5FA` | Backgrounds |

### Agências (Exemplo)
| Agência | Cor |
|---------|-----|
| Haute | `#C9A96E` |
| Fishfire | `#FF6B35` |
| Briefing | `#E8475F` |
| Efeito | `#FF47D1` |
| Super Sounds | `#1DB954` |

---

## ⚡ Comandos Úteis

```bash
# Instalar dependências (primeira vez)
npm install

# Rodar desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview build local
npm run preview

# Rodar server estático
npm run serve

# Ou direto
npx http-server -p 8000 -c-1
```

---

## 🔍 Troubleshooting

### ❌ Servidor não carrega
```bash
# Verificar porta
lsof -i :8000
# ou
netstat -ano | findstr :8000

# Kill processo
taskkill /PID <PID> /F

# Reiniciar
npx http-server -p 8000 -c-1
```

### ❌ Cores não aparecem
1. Verificar se `design-tokens.css` está carregado
2. Abrir DevTools: `F12`
3. Ir para `Elements` → procurar `design-tokens.css`
4. Limpar cache: `Ctrl+Shift+Delete`

### ❌ React não funciona
1. Se for usar JSX, precisa de build step (`npm run dev`)
2. Ou importar React via CDN
3. Arquivos `.jsx` sozinhos não rodam sem compilação

---

## 📞 Próximos Passos

### Curto Prazo (Hoje)
- ✅ Rodar localmente ← **VOCÊ ESTÁ AQUI**
- ⏳ Explorar demo existente
- ⏳ Revisar design tokens

### Médio Prazo (Esta Semana)
- [ ] `npm install`
- [ ] Estruturar componentes React
- [ ] Implementar Pitch interativo
- [ ] Melhorar Dashboard

### Longo Prazo (Próximas Semanas)
- [ ] Setup Supabase (vyxscnevgeubfgfstmtf)
- [ ] Autenticação
- [ ] Backend APIs
- [ ] Deploy Vercel

---

## 🎯 Objetivo do EventOS

**Plataforma integrada de gestão para 14 agências:**
- Haute, Fishfire, Briefing, Cigarra, Efeito, Hush
- Nowa9, New Blood, Nozy, Rancho, Stage
- Sounds Food, Super Sounds, Tunnel

**Funcionalidades principais:**
- Dashboard unificado
- Gestão de projetos (Kanban/Gantt)
- Alocação de equipe
- Financeiro (receitas/custos)
- Comunicação integrada

---

## 💾 Salvar Logo UMAUMA Localmente (Opcional)

```bash
# Baixar logo
curl -o logo-umauma.svg "https://umauma.com.br/wp-content/uploads/2024/09/Group-2.svg"

# Depois usar local no HTML
<img src="logo-umauma.svg" alt="UMAUMA Logo">
```

---

## 🚀 Resumo em Uma Linha

**Servidor rodando?**
```bash
http://localhost:8000 ✅
```

**Pronto para desenvolver!** 🎉

---

**Criado:** Março 2026
**Para:** Grupo UMAUMA
**Desenvolvido por:** WG build.tech
