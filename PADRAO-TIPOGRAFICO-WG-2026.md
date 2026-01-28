# Padrão Tipográfico WG Easy 2026

## 📐 Guia de Estilo de Tipografia

Este documento define o padrão tipográfico oficial para todas as páginas de conteúdo do site WG Almeida.

---

## Aplicação

### Classe Base:
```jsx
<div className="wg-prose max-w-none [estilos...]">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {conteudo}
  </ReactMarkdown>
</div>
```

### String Completa de Classes:
```
wg-prose max-w-none
[&>h1]:text-[32px] [&>h1]:font-light [&>h1]:tracking-tight [&>h1]:text-[#1A1A1A] [&>h1]:mb-8 [&>h1]:mt-0
[&>h2]:text-[20px] [&>h2]:font-light [&>h2]:tracking-tight [&>h2]:text-[#1A1A1A] [&>h2]:mb-6 [&>h2]:mt-16 [&>h2]:pt-8 [&>h2]:border-t [&>h2]:border-[#E5E5E5]
[&>h3]:text-[16px] [&>h3]:font-medium [&>h3]:text-[#2E2E2E] [&>h3]:mb-4 [&>h3]:mt-10
[&>p]:text-[15px] [&>p]:text-[#4C4C4C] [&>p]:leading-[1.8] [&>p]:mb-6
[&_strong]:text-[#1A1A1A] [&_strong]:font-medium
[&_a]:text-[#F25C26] [&_a]:no-underline [&_a:hover]:underline [&_a]:font-medium
[&>ul]:my-6 [&>ul]:space-y-3 [&>ul]:pl-0 [&>ul]:list-none
[&>ul>li]:text-[15px] [&>ul>li]:text-[#4C4C4C] [&>ul>li]:leading-[1.8] [&>ul>li]:pl-6 [&>ul>li]:relative [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[10px] [&>ul>li]:before:w-2 [&>ul>li]:before:h-2 [&>ul>li]:before:bg-[#F25C26] [&>ul>li]:before:rounded-full
[&>blockquote]:border-l-4 [&>blockquote]:border-[#F25C26] [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-[#4C4C4C] [&>blockquote]:bg-[#F9F9F9] [&>blockquote]:py-4 [&>blockquote]:pr-4 [&>blockquote]:rounded-r-lg [&>blockquote]:my-8
[&>table]:w-full [&>table]:my-10 [&>table]:rounded-xl [&>table]:overflow-hidden [&>table]:shadow-md [&>table]:border [&>table]:border-[#E5E5E5]
[&>table>thead]:bg-[#F5F5F5]
[&>table>thead>tr>th]:px-5 [&>table>thead>tr>th]:py-4 [&>table>thead>tr>th]:text-left [&>table>thead>tr>th]:text-[12px] [&>table>thead>tr>th]:font-medium [&>table>thead>tr>th]:uppercase [&>table>thead>tr>th]:tracking-wide [&>table>thead>tr>th]:text-[#2E2E2E] [&>table>thead>tr>th]:border-b [&>table>thead>tr>th]:border-[#E5E5E5]
[&>table>tbody>tr>td]:px-5 [&>table>tbody>tr>td]:py-4 [&>table>tbody>tr>td]:text-[14px] [&>table>tbody>tr>td]:text-[#4C4C4C] [&>table>tbody>tr>td]:border-b [&>table>tbody>tr>td]:border-[#E5E5E5]
[&>table>tbody>tr]:transition-colors [&>table>tbody>tr:hover]:bg-[#F9F9F9]
[&>table>tbody>tr:last-child>td]:border-b-0
[&_code]:bg-[#F5F5F5] [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-[#F25C26]
[&>pre]:bg-[#1A1A1A] [&>pre]:text-white [&>pre]:p-6 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:my-8
[&>img]:rounded-lg [&>img]:shadow-md [&>img]:my-8
[&>hr]:border-[#E5E5E5] [&>hr]:my-12
```

---

## Especificações Detalhadas

### 1. Headings (Títulos)

#### H1 - Título Principal
```css
font-size: 32px
font-weight: 300 (light)
letter-spacing: tight
color: #1A1A1A
margin-bottom: 32px (2rem)
margin-top: 0
```
**Uso**: Título principal do artigo (geralmente apenas 1 por página)

---

#### H2 - Seções Principais
```css
font-size: 20px
font-weight: 300 (light)
letter-spacing: tight
color: #1A1A1A
margin-bottom: 24px (1.5rem)
margin-top: 64px (4rem)
padding-top: 32px (2rem)
border-top: 1px solid #E5E5E5
```
**Uso**: Separar seções principais do conteúdo
**Destaque**: Border-top cria separação visual clara

---

#### H3 - Subseções
```css
font-size: 16px
font-weight: 500 (medium)
color: #2E2E2E
margin-bottom: 16px (1rem)
margin-top: 40px (2.5rem)
```
**Uso**: Subsecões dentro de um H2

---

### 2. Body Text (Texto Corpo)

#### Parágrafos
```css
font-size: 15px
color: #4C4C4C
line-height: 1.8 (27px)
margin-bottom: 24px (1.5rem)
```
**Legibilidade**: Line-height 1.8 garante leitura confortável

---

#### Strong (Negrito)
```css
color: #1A1A1A
font-weight: 500 (medium)
```
**Uso**: Destacar palavras-chave e termos importantes

---

#### Links
```css
color: #F25C26 (WG Orange)
text-decoration: none
font-weight: 500 (medium)

Hover:
text-decoration: underline
```
**Uso**: Links internos e externos

---

### 3. Lists (Listas)

#### Bullets Customizados
```css
List:
  margin: 24px 0
  spacing: 12px entre itens
  padding-left: 0
  list-style: none

Item:
  font-size: 15px
  color: #4C4C4C
  line-height: 1.8
  padding-left: 24px
  position: relative

Bullet (::before):
  content: ''
  position: absolute
  left: 0
  top: 10px
  width: 8px
  height: 8px
  background: #F25C26
  border-radius: 50%
```
**Visual**: Círculos laranja personalizados

---

### 4. Blockquote (Citações)

```css
border-left: 4px solid #F25C26
padding-left: 24px
padding: 16px 16px 16px 24px
font-style: italic
color: #4C4C4C
background: #F9F9F9
border-radius: 0 8px 8px 0
margin: 32px 0
```
**Uso**: Citações, destaques especiais

---

### 5. Tables (Tabelas)

#### Container
```css
width: 100%
margin: 40px 0
border-radius: 12px
overflow: hidden
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)
border: 1px solid #E5E5E5
```

#### Header (thead)
```css
background: #F5F5F5

TH:
  padding: 16px 20px
  text-align: left
  font-size: 12px
  font-weight: 500
  text-transform: uppercase
  letter-spacing: wide
  color: #2E2E2E
  border-bottom: 1px solid #E5E5E5
```

#### Body (tbody)
```css
TD:
  padding: 16px 20px
  font-size: 14px
  color: #4C4C4C
  border-bottom: 1px solid #E5E5E5

Row:
  transition: colors

Row:hover:
  background: #F9F9F9

Last Row TD:
  border-bottom: 0
```
**Interatividade**: Hover effect nas linhas

---

### 6. Code (Código)

#### Inline Code
```css
background: #F5F5F5
padding: 4px 8px
border-radius: 4px
font-size: 13px
color: #F25C26
```
**Uso**: `código inline`

---

#### Code Block
```css
background: #1A1A1A
color: white
padding: 24px
border-radius: 8px
overflow-x: auto
margin: 32px 0
```
**Uso**: Blocos de código

```javascript
// Exemplo
const exemplo = "código";
```

---

### 7. Images (Imagens)

```css
border-radius: 8px
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)
margin: 32px 0
```

---

### 8. Horizontal Rule (Separador)

```css
border-color: #E5E5E5
margin: 48px 0
```

---

## Paleta de Cores

### Cores de Texto:
- **Primary (Títulos)**: `#1A1A1A` - Preto suave
- **Secondary (Subtítulos)**: `#2E2E2E` - Cinza escuro
- **Body (Parágrafos)**: `#4C4C4C` - Cinza médio
- **Brand (Links/Destaques)**: `#F25C26` - WG Orange

### Cores de Background:
- **Light Gray**: `#F5F5F5` - Para thead, code inline
- **Extra Light Gray**: `#F9F9F9` - Para blockquote, hover

### Cores de Borda:
- **Divider**: `#E5E5E5` - Borders, separadores

---

## Páginas que Usam Este Padrão

✅ **Blog.jsx** - `/blog/:slug`
✅ **EstiloDetail.jsx** - `/estilos/:slug`
⏳ **FAQ.jsx** - (futuro)
⏳ **Landing Pages** - (futuro)

---

## Como Aplicar em Nova Página

1. Importar ReactMarkdown:
```jsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
```

2. Usar a classe `wg-prose` com todos os estilos:
```jsx
<div className="wg-prose max-w-none [todos-os-estilos-aqui]">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {content}
  </ReactMarkdown>
</div>
```

3. Copiar a string completa de classes deste documento

---

## Componentes Adicionais

### Tags Section
```jsx
<div className="mt-12 pt-8 border-t border-gray-200">
  <div className="flex items-center gap-2 mb-4">
    <Tag className="w-4 h-4 text-wg-gray" />
    <span className="text-sm font-medium text-wg-gray uppercase tracking-wider">Tags</span>
  </div>
  <div className="flex flex-wrap items-center gap-3">
    {tags.map((tag) => (
      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-wg-orange/10 to-wg-orange/5 text-wg-black border border-wg-orange/20 hover:border-wg-orange hover:shadow-sm transition-all">
        #{tag}
      </span>
    ))}
  </div>
</div>
```

### Share Section
```jsx
<div className="mt-8 pt-8 border-t border-gray-200">
  <div className="flex items-center gap-2 mb-4">
    <Share2 className="w-4 h-4 text-wg-gray" />
    <span className="text-sm font-medium text-wg-gray uppercase tracking-wider">Compartilhe</span>
  </div>
  <ShareButtons title={title} url={url} />
</div>
```

---

## Preview Visual

### Exemplo de Markdown:

```markdown
# Título Principal (H1)

Este é um parágrafo introdutório com **texto em negrito** e [link para algo](#).

## Seção Principal (H2)

### Subseção (H3)

- Item de lista 1
- Item de lista 2
- Item de lista 3

> Esta é uma citação ou blockquote importante

| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Dado 1   | Dado 2   | Dado 3   |

Código inline: `const x = 10;`

\`\`\`javascript
// Bloco de código
function exemplo() {
  return "Hello World";
}
\`\`\`
```

---

## Responsividade

O padrão é **mobile-first** e funciona perfeitamente em:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

---

## Manutenção

**Data de Criação**: Janeiro 2026
**Última Atualização**: Janeiro 2026
**Responsável**: Grupo WG Almeida - Equipe Digital

Para sugestões de melhorias neste padrão, contate a equipe de desenvolvimento.

---

**Documento de Referência Oficial**
© 2026 Grupo WG Almeida
