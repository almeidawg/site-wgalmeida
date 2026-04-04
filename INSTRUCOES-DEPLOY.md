# 🚀 Instruções de Deploy - Grupo WG Almeida

**Data do Build:** 11 de Dezembro de 2025
**Status:** ✅ Pronto para Deploy

---

## ✨ O que foi implementado

### 1. Sistema de Vídeo Responsivo
- ✅ Componente `HeroVideo` criado
- ✅ Substitui vídeo do YouTube por vídeos locais
- ✅ Alterna automaticamente entre horizontal (desktop) e vertical (mobile)
- ✅ Detecção inteligente de orientação

### 2. Sistema de Imagens Local
- ✅ Todas imagens do Unsplash substituídas
- ✅ Estrutura de pastas organizada
- ✅ Paths configurados no código

### 3. Estrutura de Pastas
- ✅ `/videos/hero/` - Vídeos de abertura
- ✅ `/images/projects/` - Imagens dos projetos
- ✅ `/images/about/` - Imagens institucionais
- ✅ `/images/gallery/` - Galeria de fotos

---

## 📋 ANTES DE FAZER UPLOAD

### ⚠️ PASSO OBRIGATÓRIO: Adicionar os Arquivos de Mídia

**Você DEVE adicionar os seguintes arquivos ANTES de fazer upload:**

#### Vídeos de Abertura (OBRIGATÓRIO)
📁 Local: `dist/videos/hero/`

1. **hero-desktop.mp4**
   - Vídeo horizontal para computador
   - Formato: 16:9 (ex: 1920x1080)
   - Tamanho máximo: 20 MB

2. **hero-mobile.mp4**
   - Vídeo vertical para celular
   - Formato: 9:16 (ex: 1080x1920)
   - Tamanho máximo: 10 MB

#### Imagens dos Projetos (OBRIGATÓRIO)
📁 Local: `dist/images/projects/`

1. **acapulco-1.jpg** - Home Resort Acapulco
2. **brooklin-1.jpg** - Espaço Gourmet Casa Brooklin
3. **lobby-1.jpg** - Lobby Signature & Marcenaria

Especificações:
- Formato: JPG
- Resolução: 1200x800 ou maior
- Tamanho: 300-500 KB cada

#### Imagem Institucional (OBRIGATÓRIO)
📁 Local: `dist/images/about/`

1. **company-1.jpg** - Imagem da seção "Sobre"

Especificações:
- Formato: JPG
- Resolução: 1200x800 ou maior
- Tamanho: 300-500 KB

#### Galeria (OPCIONAL)
📁 Local: `dist/images/gallery/`

Organize por subpastas:
- `arquitetura/`
- `engenharia/`
- `marcenaria/`

---

## 🎬 Como Preparar os Vídeos

### Converter/Comprimir Vídeos:

**Opção 1: Handbrake (Gratuito, Windows/Mac/Linux)**
1. Baixe: https://handbrake.fr/
2. Abra seu vídeo
3. Preset: "Fast 1080p30" (desktop) ou "Fast 720p30" (mobile)
4. Format: MP4
5. Video Codec: H.264
6. Quality: RF 22-24
7. Clique em "Start"

**Opção 2: FFmpeg (Linha de comando)**
```bash
# Desktop (horizontal)
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 -preset medium -an hero-desktop.mp4

# Mobile (vertical)
ffmpeg -i input.mp4 -vf scale=1080:1920 -c:v libx264 -crf 23 -preset medium -an hero-mobile.mp4
```

**Opção 3: Online**
- CloudConvert: https://cloudconvert.com/
- FreeConvert: https://www.freeconvert.com/

### Dicas importantes:
- Remova o áudio (não é necessário)
- Comprima ao máximo sem perder qualidade
- Teste o vídeo antes de fazer upload

---

## 🖼️ Como Preparar as Imagens

### Otimizar Imagens:

**Opção 1: TinyPNG (Online, mais fácil)**
1. Acesse: https://tinypng.com/
2. Arraste suas imagens
3. Baixe as versões otimizadas

**Opção 2: ImageOptim (Mac)**
1. Baixe: https://imageoptim.com/
2. Arraste as imagens
3. Automático

**Opção 3: Squoosh (Online, Google)**
1. Acesse: https://squoosh.app/
2. Arraste a imagem
3. Configure qualidade (80-90%)
4. Baixe

### Redimensionar (se necessário):
- Use Photoshop, GIMP, ou online (Pixlr, Photopea)
- Largura ideal: 1200-1600px
- Mantenha proporção 3:2 ou 4:3

---

## 📤 PASSO A PASSO DO DEPLOY

### 1️⃣ Adicione os Arquivos de Mídia

```bash
# Estrutura final da pasta dist:
dist/
├── .htaccess
├── index.html
├── assets/          (já está pronto)
├── videos/
│   └── hero/
│       ├── hero-desktop.mp4  ← VOCÊ ADICIONA
│       └── hero-mobile.mp4   ← VOCÊ ADICIONA
└── images/
    ├── projects/
    │   ├── acapulco-1.jpg    ← VOCÊ ADICIONA
    │   ├── brooklin-1.jpg    ← VOCÊ ADICIONA
    │   └── lobby-1.jpg       ← VOCÊ ADICIONA
    ├── about/
    │   └── company-1.jpg     ← VOCÊ ADICIONA
    └── gallery/              ← OPCIONAL
```

### 2️⃣ Verifique os Arquivos

Checklist antes de fazer upload:

- [ ] `hero-desktop.mp4` em `dist/videos/hero/`
- [ ] `hero-mobile.mp4` em `dist/videos/hero/`
- [ ] `acapulco-1.jpg` em `dist/images/projects/`
- [ ] `brooklin-1.jpg` em `dist/images/projects/`
- [ ] `lobby-1.jpg` em `dist/images/projects/`
- [ ] `company-1.jpg` em `dist/images/about/`
- [ ] Todos os arquivos estão otimizados
- [ ] Nomes dos arquivos estão corretos (minúsculas, sem espaços)

### 3️⃣ Faça Backup do Site Atual (Hostinger)

1. Acesse o painel do Hostinger
2. Vá em **File Manager**
3. Selecione todo conteúdo de `public_html/`
4. Clique em **Compress** para criar um backup
5. Baixe o arquivo `.zip` de backup

### 4️⃣ Limpe a Pasta public_html

1. No File Manager do Hostinger
2. Entre na pasta `public_html/`
3. **Selecione TODOS os arquivos** (Ctrl+A)
4. Clique em **Delete**
5. Confirme a exclusão

### 5️⃣ Faça Upload dos Novos Arquivos

**Importante:** Você vai fazer upload do CONTEÚDO da pasta `dist/`, NÃO da pasta em si.

**Método 1: File Manager (Hostinger)**
1. Entre em `public_html/` (vazia)
2. Clique em **Upload**
3. Selecione TODOS os arquivos de dentro de `dist/`
4. Aguarde o upload completar
5. Verifique se todas as pastas foram criadas

**Método 2: FTP (FileZilla)**
1. Conecte no servidor via FTP
2. Navegue até `public_html/`
3. Arraste o conteúdo de `dist/` para `public_html/`
4. Aguarde transferência
5. Verifique estrutura

### 6️⃣ Verifique a Estrutura no Servidor

Após upload, `public_html/` deve ter:
```
public_html/
├── .htaccess          ✓
├── index.html         ✓
├── assets/            ✓
├── videos/
│   └── hero/
│       ├── hero-desktop.mp4
│       └── hero-mobile.mp4
└── images/
    ├── projects/
    ├── about/
    └── gallery/
```

### 7️⃣ Teste o Site

1. Limpe o cache do navegador (Ctrl+Shift+Delete ou Ctrl+F5)
2. Acesse seu domínio
3. Teste em diferentes dispositivos:
   - [ ] Desktop: Vídeo horizontal aparece?
   - [ ] Mobile: Vídeo vertical aparece?
   - [ ] Imagens dos projetos carregam?
   - [ ] Imagem "Sobre" carrega?
4. Gire o celular: Vídeo alterna?
5. Navegue pelas páginas
6. Verifique console do navegador (F12) por erros

---

## 🔧 Resolução de Problemas

### Vídeo não aparece
- ✅ Verifique se os arquivos estão em `public_html/videos/hero/`
- ✅ Nomes devem ser EXATOS: `hero-desktop.mp4` e `hero-mobile.mp4`
- ✅ Formato deve ser MP4 (H.264)
- ✅ Limpe o cache do navegador

### Imagens não aparecem
- ✅ Verifique estrutura de pastas: `public_html/images/projects/`
- ✅ Nomes devem ser exatos (minúsculas, com hífen)
- ✅ Formato JPG ou PNG
- ✅ Verifique permissões dos arquivos (644)

### Página em branco
- ✅ Verifique se `.htaccess` foi enviado
- ✅ Limpe cache do navegador
- ✅ Verifique console (F12) por erros
- ✅ Confirme que `index.html` está em `public_html/`

### Erro 404 ao navegar
- ✅ Arquivo `.htaccess` está presente?
- ✅ Rewrite do Apache está ativado no servidor?
- ✅ Entre em contato com suporte Hostinger se persistir

---

## 📊 Informações Técnicas

### Build Info:
- **Data:** 11/12/2025
- **Vite versão:** 4.5.5
- **Total de módulos:** 1841
- **Tempo de build:** 5.68s
- **Assets gerados:** 29 arquivos

### Arquivos Principais:
- `index.html` - 4.28 KB
- `assets/index-ec103d24.js` - 522.43 KB (principal)
- `assets/index-0fdbfc97.css` - 43.08 KB
- `.htaccess` - 838 bytes (configuração Apache)

### Componentes Novos:
- `HeroVideo.jsx` - Gerencia vídeos responsivos
- Estrutura de mídia organizada

### Componentes Modificados:
- `Home.jsx` - Usa HeroVideo e imagens locais
- `ProjectCarousel.jsx` - Usa imagens locais

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique a documentação:**
   - `ESTRUTURA-MIDIA.md` - Detalhes sobre arquivos de mídia
   - READMEs nas pastas de imagens/vídeos

2. **Verifique o console:**
   - Abra o site
   - Pressione F12
   - Veja erros na aba "Console"

3. **Teste localmente primeiro:**
   ```bash
   npm run dev
   ```
   Se funcionar local mas não no servidor, é problema de configuração do servidor.

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Todos os vídeos adicionados e testados
- [ ] Todas as imagens adicionadas e testadas
- [ ] Site abre normalmente no desktop
- [ ] Site abre normalmente no mobile
- [ ] Vídeos alternam ao girar o celular
- [ ] Todas as páginas navegam corretamente
- [ ] Sem erros no console do navegador
- [ ] Performance está boa (carregamento rápido)

---

**Boa sorte com o deploy! 🚀**
