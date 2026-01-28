# 📸 Estrutura de Mídia do Site - Grupo WG Almeida

Guia completo de onde colocar vídeos e imagens do site.

---

## 📁 Estrutura de Pastas Criada

```
public/
├── videos/
│   └── hero/
│       ├── hero-desktop.mp4    ← Vídeo horizontal (computador)
│       └── hero-mobile.mp4     ← Vídeo vertical (celular)
│
└── images/
    ├── projects/
    │   ├── acapulco-1.jpg      ← Projeto 1 - Home Resort Acapulco
    │   ├── brooklin-1.jpg      ← Projeto 2 - Espaço Gourmet Casa Brooklin
    │   └── lobby-1.jpg         ← Projeto 3 - Lobby Signature & Marcenaria
    │
    ├── about/
    │   └── company-1.jpg       ← Imagem da seção "Sobre"
    │
    └── gallery/
        ├── arquitetura/        ← Fotos de projetos de arquitetura
        ├── engenharia/         ← Fotos de obras de engenharia
        └── marcenaria/         ← Fotos de móveis/marcenaria
```

---

## 🎬 Vídeos de Abertura

### Local:
`public/videos/hero/`

### Arquivos necessários:

#### 1. hero-desktop.mp4
- **Uso:** Tela de abertura em computadores e tablets (modo landscape)
- **Orientação:** Horizontal (16:9)
- **Resolução:** 1920x1080 ou 1280x720
- **Formato:** MP4 (H.264)
- **Tamanho máximo:** 10-20 MB
- **Características:** Mudo, loop automático

#### 2. hero-mobile.mp4
- **Uso:** Tela de abertura em celulares (modo portrait)
- **Orientação:** Vertical (9:16)
- **Resolução:** 1080x1920 ou 720x1280
- **Formato:** MP4 (H.264)
- **Tamanho máximo:** 5-10 MB
- **Características:** Mudo, loop automático

### ✨ Funcionalidades:
- **Detecção automática:** O site escolhe automaticamente qual vídeo exibir
- **Responsivo:** Alterna entre vídeos ao girar o celular
- **Sem YouTube:** Vídeos hospedados localmente para melhor performance

---

## 📸 Imagens dos Projetos (Carrossel)

### Local:
`public/images/projects/`

### Arquivos necessários:

1. **acapulco-1.jpg**
   - Projeto: Home Resort Acapulco
   - Residencial de alto padrão

2. **brooklin-1.jpg**
   - Projeto: Espaço Gourmet Casa Brooklin
   - Interiores corporativos

3. **lobby-1.jpg**
   - Projeto: Lobby Signature & Marcenaria
   - Comercial e hospitality

### Especificações:
- **Formato:** JPG ou PNG
- **Resolução:** 1200x800 ou superior
- **Proporção:** 3:2 (landscape)
- **Tamanho:** 300-500 KB (otimizado)
- **Qualidade:** 80-90%

---

## 🏢 Imagens da Seção "Sobre"

### Local:
`public/images/about/`

### Arquivos necessários:

1. **company-1.jpg**
   - Imagem principal da empresa
   - Aparece na seção "TÉCNICA NO TRAÇO. LUXO NO SILÊNCIO."

### Especificações:
- **Formato:** JPG ou PNG
- **Resolução:** 1200x800 ou superior
- **Proporção:** 3:2 ou 4:3
- **Tamanho:** 300-500 KB
- **Estilo:** Profissional, representando a empresa

---

## 🎨 Galeria de Imagens

### Local:
`public/images/gallery/`

### Organização sugerida:

Crie subpastas por categoria:

```
gallery/
├── arquitetura/
│   ├── projeto-01.jpg
│   ├── projeto-02.jpg
│   └── ...
├── engenharia/
│   ├── obra-01.jpg
│   ├── obra-02.jpg
│   └── ...
└── marcenaria/
    ├── mobiliario-01.jpg
    ├── mobiliario-02.jpg
    └── ...
```

### Especificações:
- **Formato:** JPG
- **Resolução:** 1200x800 ou superior
- **Tamanho:** 300-800 KB
- **Nomeação:** Descritiva e numerada

---

## 🛠️ Alterações Realizadas no Código

### 1. Componente HeroVideo (NOVO)
**Arquivo:** `src/components/HeroVideo.jsx`
- Substitui iframe do YouTube
- Alterna automaticamente entre vídeo horizontal e vertical
- Detecta orientação do dispositivo
- Suporta autoplay, loop e mute

### 2. Home.jsx (ATUALIZADO)
**Arquivo:** `src/pages/Home.jsx`
- Linha 11: Importa `HeroVideo`
- Linha 52: Usa `<HeroVideo />` ao invés de iframe
- Linha 192: Usa `/images/about/company-1.jpg` ao invés de Unsplash

### 3. ProjectCarousel.jsx (ATUALIZADO)
**Arquivo:** `src/components/ProjectCarousel.jsx`
- Linhas 11, 19, 27: Usa imagens locais:
  - `/images/projects/acapulco-1.jpg`
  - `/images/projects/brooklin-1.jpg`
  - `/images/projects/lobby-1.jpg`

---

## ✅ Checklist para Deploy

Antes de fazer o build e upload para o Hostinger:

### Vídeos:
- [ ] `hero-desktop.mp4` colocado em `public/videos/hero/`
- [ ] `hero-mobile.mp4` colocado em `public/videos/hero/`
- [ ] Vídeos testados (reproduzem corretamente)
- [ ] Vídeos otimizados (tamanho adequado)

### Imagens dos Projetos:
- [ ] `acapulco-1.jpg` em `public/images/projects/`
- [ ] `brooklin-1.jpg` em `public/images/projects/`
- [ ] `lobby-1.jpg` em `public/images/projects/`

### Imagens Sobre:
- [ ] `company-1.jpg` em `public/images/about/`

### Galeria (opcional):
- [ ] Imagens organizadas em `public/images/gallery/`
- [ ] Subpastas criadas (arquitetura, engenharia, marcenaria)

### Build:
- [ ] Executar `npm run build`
- [ ] Verificar pasta `dist/` gerada
- [ ] Fazer upload de TODO conteúdo de `dist/` para Hostinger

---

## 📝 Observações Importantes

1. **Nomes de arquivos:**
   - Devem ser exatamente como especificado acima
   - Sem espaços, acentos ou caracteres especiais
   - Use hífen (-) para separar palavras

2. **Otimização:**
   - SEMPRE otimize imagens antes de colocar (use TinyPNG, ImageOptim, etc.)
   - Vídeos devem ser comprimidos (use Handbrake, FFmpeg, etc.)
   - Arquivos grandes = site lento

3. **Teste local:**
   - Após adicionar os arquivos, execute `npm run dev`
   - Teste em diferentes tamanhos de tela
   - Verifique se as imagens carregam corretamente

4. **Placeholders temporários:**
   - Se não tiver os arquivos prontos, use imagens/vídeos temporários com os mesmos nomes
   - O site funcionará com qualquer arquivo nos locais especificados

---

## 🚀 Próximos Passos

1. **Adicionar seus arquivos** nas pastas criadas
2. **Testar localmente** com `npm run dev`
3. **Fazer build** com `npm run build`
4. **Upload no Hostinger** do conteúdo de `dist/`

**Documentação completa em cada pasta:** Cada pasta tem um arquivo README.md com instruções específicas.
