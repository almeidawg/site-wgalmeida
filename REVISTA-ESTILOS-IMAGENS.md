# Guia: Imagens para Revista de Estilos

## Estrutura Criada

✅ **Conteúdo dos Estilos**: `/src/content/estilos/`
- minimalismo.md
- classico.md
- moderno.md
- vintage.md
- tropical.md
- boho.md

✅ **Páginas React**:
- `/src/pages/RevistaEstilos.jsx` - Página principal com grid de cards
- `/src/pages/EstiloDetail.jsx` - Página de detalhe de cada estilo

✅ **Rotas Configuradas**:
- `/revista-estilos` - Página principal
- `/estilos/:slug` - Detalhe de cada estilo

## Imagens Necessárias

Cada estilo precisa de uma imagem em `/public/images/estilos/`:

### Lista de Imagens:
1. `minimalismo.webp` - Ambiente minimalista (branco, preto, linhas retas)
2. `classico.webp` - Ambiente clássico (molduras, lustres, elegante)
3. `moderno.webp` - Ambiente contemporâneo (tecnologia, clean)
4. `vintage.webp` - Ambiente retrô anos 60-90 (peças antigas, nostálgico)
5. `tropical.webp` - Ambiente tropical (plantas, cores vibrantes)
6. `boho.webp` - Ambiente boho (texturas, étnico, confortável)

## Como Buscar Imagens

### Opção 1: Cloudinary + Pixabay (GRÁTIS)
1. Acesse seu Cloudinary: `https://cloudinary.com/console`
2. Vá em "Add-ons" > "Pixabay"
3. Ative o add-on (gratuito - 1.9M imagens)
4. Busque por:
   - "minimalist interior"
   - "classic luxury interior"
   - "modern home interior"
   - "vintage retro interior"
   - "tropical plants interior"
   - "boho interior design"

### Opção 2: Usar Projetos Existentes
Se o Grupo WG Almeida tem fotos de projetos que se encaixam nesses estilos, use-as!

### Opção 3: Unsplash (Gratuito)
- https://unsplash.com/s/photos/minimalist-interior
- https://unsplash.com/s/photos/classic-interior
- https://unsplash.com/s/photos/modern-interior
- https://unsplash.com/s/photos/vintage-interior
- https://unsplash.com/s/photos/tropical-interior
- https://unsplash.com/s/photos/boho-interior

## Especificações das Imagens

- **Formato**: WebP (otimizado)
- **Dimensão recomendada**: 1920x1080px ou maior
- **Proporção**: 16:9 ou similar
- **Qualidade**: Alta (para card grande) e média (para cards menores)
- **Nome do arquivo**: `[slug-do-estilo].webp`

## Convertendo para WebP

Se você tiver imagens em JPG/PNG, use o script:

```bash
npm run convert-webp
```

Ou manualmente:
```bash
cwebp input.jpg -q 85 -o output.webp
```

## Imagens Temporárias (Placeholder)

Por enquanto, os estilos estão usando a mesma imagem do banner SOBRE:
- `/images/banners/SOBRE.webp`

Para adicionar as imagens corretas:
1. Baixe/escolha as imagens
2. Converta para WebP (se necessário)
3. Coloque em `/public/images/estilos/`
4. Os arquivos .md já estão configurados para buscar as imagens corretas

## Checklist

- [ ] Buscar/criar 6 imagens de alta qualidade
- [ ] Converter para WebP
- [ ] Salvar em `/public/images/estilos/`
- [ ] Testar a página `/revista-estilos`
- [ ] Adicionar link no menu de navegação (opcional)

## Próximos Passos

1. **Adicionar Link no Menu**:
   - Editar `/src/components/layout/Header.jsx`
   - Adicionar item "Revista de Estilos" no menu

2. **SEO**:
   - As páginas já têm SEO configurado
   - Considere adicionar ao sitemap

3. **Analytics**:
   - Acompanhar acessos à revista de estilos
   - Ver quais estilos são mais populares

## Links Úteis

- Cloudinary Dashboard: https://cloudinary.com/console
- Pixabay Add-on: https://cloudinary.com/console/addons#pixabay
- Unsplash: https://unsplash.com
- WebP Converter Online: https://convertio.co/jpg-webp/
