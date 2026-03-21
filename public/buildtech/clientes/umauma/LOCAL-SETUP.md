# EventOS — Setup Local

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js v24.13.1 (ou superior)
- npm 11.8.0 (ou superior)
- Um navegador moderno (Chrome, Firefox, Safari, Edge)

### Opção 1: HTTP Server Simples (Recomendado para Demo)

```bash
# Navegar até a pasta do projeto
cd C:\Users\Atendimento\Documents\_WG_build.tech\Em-Desenvolvimento\20260310-Grupo_UmaUma

# Usar http-server do Node
npx http-server -p 8000 -c-1

# Acessar em http://localhost:8000
```

### Opção 2: Python (Se preferir)

```bash
# Python 3
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
```

### Opção 3: Desenvolvimento com Vite (Para desenvolvimento ativo)

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 📋 Estrutura do Projeto

```
20260310-Grupo_UmaUma/
├── index.html                    ← Página inicial com design tokens aplicados
├── design-tokens.css            ← Sistema de design UMAUMA (cores, tipografia, espaçamento)
├── EventOS-Demo-Completo.jsx   ← Demo interativo (5 telas)
├── README.md                    ← Documentação do projeto
│
├── 01-Pitch/                    ← Apresentação visual (9 seções)
│   └── EventOS-Pitch.html
│
├── 02-Analise-Requisitos/       ← Análise de requisitos (36 req)
│   └── Analise-Requisitos.html
│
├── 03-Demo-Produto/             ← Demo funcional (5 telas)
│   └── EventOS-Demo.html
│
├── 04-Documentos-Cliente/       ← Documentos HAUTE recebidos
├── 05-Arquitetura/              ← Arquitetura técnica do sistema
├── 06-Pesquisa-Mercado/         ← Benchmark e análise de mercado
│
├── LOCAL-SETUP.md               ← Este arquivo
├── package.json                 ← Dependências (se usar Vite)
└── vite.config.js              ← Configuração Vite (se usar)
```

---

## 🎨 Design System — Grupo UMAUMA

### Cores Primárias
- **Azul Primário:** `#046bd2` — ações principais, navegação
- **Azul Escuro:** `#045cb4` — hover, estados secundários
- **Fundo Claro:** `#F0F5FA` — backgrounds, seções
- **Texto Primário:** `#1e293b` — headings, conteúdo
- **Destaque Orange:** `#FF5722` — ênfase, alertas

### Tipografia
- **Font Stack:** System default (Segoe UI, Roboto, etc)
- **H1:** 36px | 600 weight | line-height 1.4em
- **H2:** 30px | 600 weight | line-height 1.3em
- **Corpo:** 16px | 400 weight | line-height 1.65em

### Spacing System
```
xs: 4px  | sm: 8px  | md: 12px | lg: 16px
xl: 24px | 2xl: 32px | 3xl: 40px | 4xl: 60px | 5xl: 80px | 6xl: 100px
```

### Logo
- URL: `https://umauma.com.br/wp-content/uploads/2024/09/Group-2.svg`
- Dimensões: 520×512px
- Usar em backgrounds claros preferencialmente

---

## 🏗️ Cores das Agências (Ecossistema)

```
Haute          → #C9A96E (Corporativo)
Fishfire       → #FF6B35 (Festivais)
Briefing       → #E8475F (Música)
Cigarra        → #7ED957 (Influenciadores)
Efeito         → #FF47D1 (LGBTQIAP+)
Hush           → #DAA520 (High End)
Nowa9          → #00BCD4 (Trade Marketing)
New Blood      → #FF1744 (Jovem)
Nozy           → #AA66CC (Conteúdo)
Rancho         → #8B4513 (Experiências)
Stage          → #FFD700 (Universitário)
Sounds Food    → #FF8C00 (Restaurantes)
Super Sounds   → #1DB954 (Shows)
Tunnel         → #6C63FF (Branding)
```

---

## 📦 Dependências (package.json)

Se for usar Vite + React:

```json
{
  "name": "evenos",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^7.0.0"
  }
}
```

---

## 🔄 Workflow de Desenvolvimento

### 1. Estrutura Base Pronta
- ✅ `index.html` — Landing page com design tokens
- ✅ `design-tokens.css` — Sistema de cores e tipografia
- ✅ `EventOS-Demo-Completo.jsx` — Demo funcional

### 2. Próximas Etapas
- [ ] Converter JSX em componentes React reutilizáveis
- [ ] Criar Pitch interativo (9 seções)
- [ ] Implementar análise de requisitos (36 req)
- [ ] Setup Supabase para persistência de dados
- [ ] Autenticação (login UMAUMA)

### 3. Deploy
```bash
# Vercel (recomendado)
npm run build
npx vercel --prod

# Ou host estático (Netlify, GitHub Pages, etc)
```

---

## 🐛 Troubleshooting

### Páginas não carregam
- Verificar se http-server está rodando: `http://localhost:8000`
- Limpar cache do navegador: `Ctrl+Shift+Delete`

### Cores não aparecem correto
- Verificar se `design-tokens.css` está sendo carregado
- Abrir DevTools: `F12` → Console → verificar erros

### React/JSX não funciona sem build
- Usar `npm run dev` (Vite) ou importar React via CDN
- Arquivo `.jsx` precisa de build step

---

## 📞 Contato & Suporte

- **PM:** William Almeida
- **Tech Lead:** WG build.tech
- **Repositório:** [almeidawg/evenos](https://github.com/almeidawg/evenos) (se houver)

**Data:** Março 2026 | **Status:** Em Desenvolvimento | **Confidencial: Apenas UMAUMA**
