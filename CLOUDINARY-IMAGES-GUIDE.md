# 📸 Guia: Buscar Imagens de Alta Qualidade via Cloudinary

## ✅ Sua Conta Cloudinary
- **Cloud Name:** `dkkj9mpqv`
- **Dashboard:** https://console.cloudinary.com/console/c-dkkj9mpqv
- **Media Library:** https://console.cloudinary.com/console/c-dkkj9mpqv/media_library

---

## 🎯 Opção 1: Pixabay (GRÁTIS)

### Ativar Pixabay no Cloudinary:

1. Acesse: https://console.cloudinary.com/console/c-dkkj9mpqv/addons
2. Procure por **"Pixabay"**
3. Clique em "**Add**" ou "**Enable**"
4. Confirme (é 100% gratuito!)

### Buscar e usar imagens:

1. Vá para **Media Library**
2. Clique no botão **"Add"** (canto superior direito)
3. Selecione **"From Pixabay"**
4. Digite sua busca: `luxury apartment interior`, `modern architecture`, etc.
5. Selecione a imagem
6. Clique em **"Add to Media Library"**
7. A imagem será salva em `wgalmeida/` automaticamente
8. Copie a URL otimizada

**Exemplo de URL gerada:**
```
https://res.cloudinary.com/dkkj9mpqv/image/upload/v1234/wgalmeida/blog/luxury-apartment.webp
```

---

## 💎 Opção 2: Shutterstock (Pago - Premium)

### Ativar Shutterstock:

1. Acesse: https://console.cloudinary.com/console/c-dkkj9mpqv/addons
2. Procure por **"Shutterstock"**
3. Clique em "**Add**" ou "**Enable**"
4. Escolha o plano (teste gratuito disponível)

### Vantagens:
- 450M+ imagens profissionais
- Preços com desconto via Cloudinary
- Licenciamento automático
- Qualidade editorial

### Como usar:
Igual ao Pixabay, mas no Media Library selecione **"From Shutterstock"**

---

## 🔍 Opção 3: Getty Images (Editorial Premium)

1. Mesmo processo: Ativar no painel de add-ons
2. Buscar no Media Library → "From Getty Images"
3. Ideal para artigos editoriais premium

---

## 🚀 Workflow Recomendado para Blog

### 1. Organize por pasta:

Estrutura recomendada no Cloudinary:
```
wgalmeida/
  └── blog/
      ├── architecture/
      ├── engineering/
      ├── carpentry/
      ├── trends/
      └── featured/
```

### 2. Nomeie as imagens corretamente:

**✅ BOM:**
```
luxury-apartment-interior-design.webp
modern-carpentry-workshop.webp
high-end-construction-site.webp
```

**❌ RUIM:**
```
image1.jpg
foto.png
DSC_0123.jpg
```

### 3. Use transformações automáticas:

O Cloudinary otimiza automaticamente:
```
https://res.cloudinary.com/dkkj9mpqv/image/upload/
  w_1280,h_720,c_fill,    // Redimensiona para 1280x720
  q_auto:good,            // Qualidade automática
  f_auto/                 // Formato automático (WebP)
  wgalmeida/blog/sua-imagem
```

### 4. Adicione tags:

No Cloudinary, adicione tags às imagens:
- `blog`
- `featured`
- `architecture`
- `high-quality`

Assim você pode buscar depois programaticamente.

---

## 📝 Palavras-chave para Buscar (PT → EN)

### Arquitetura:
```
- luxury apartment interior → Interior de apartamento de luxo
- modern architecture design → Design de arquitetura moderna
- contemporary living room → Sala de estar contemporânea
- marble kitchen interior → Interior de cozinha de mármore
- minimalist bedroom design → Design de quarto minimalista
```

### Engenharia:
```
- construction site premium → Canteiro de obras premium
- high-end building materials → Materiais de construção de alto padrão
- structural engineering → Engenharia estrutural
- modern construction → Construção moderna
```

### Marcenaria:
```
- bespoke joinery → Marcenaria sob medida
- wood craftsmanship → Artesanato em madeira
- custom furniture design → Design de móveis personalizados
- luxury carpentry → Marcenaria de luxo
- handcrafted woodwork → Trabalho artesanal em madeira
```

---

## 🛠️ Script Útil

Execute para listar suas imagens do blog:

```bash
node fetch-blog-images.cjs
```

Isso mostrará:
- Todas as imagens em `wgalmeida/blog/`
- URLs otimizadas prontas para usar
- Tamanhos e dimensões

---

## 💰 Comparação de Custos

| Serviço | Custo no Cloudinary | Custo Direto | Economia |
|---------|---------------------|--------------|----------|
| **Pixabay** | GRÁTIS | GRÁTIS | - |
| **Shutterstock** | $49/mês (10 img) | $29/mês (10 img) | Integração vale a pena |
| **Getty Images** | Sob consulta | Muito caro | Economize tempo |

---

## 🎨 Dicas Finais

1. **Sempre use Pixabay primeiro** - 1.9M imagens gratuitas
2. **Reserve Shutterstock para imagens críticas** - Landing pages, destaques
3. **Organize bem as pastas** - Facilita manutenção
4. **Use tags** - Busca programática depois
5. **Aproveite as transformações** - CDN + otimização automática

---

## 📞 Suporte

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Pixabay Add-on:** https://cloudinary.com/documentation/pixabay_image_search_plugin
- **API Reference:** https://cloudinary.com/documentation/image_upload_api_reference

---

**Pronto para usar!** 🚀

Agora você tem acesso direto a milhões de imagens de alta qualidade sem sair do Cloudinary.
