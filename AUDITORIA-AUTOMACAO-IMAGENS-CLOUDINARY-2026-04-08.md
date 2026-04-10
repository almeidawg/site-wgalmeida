# Auditoria — Automação de Imagens + Fallback Cloudinary

Data: 08/04/2026
Projeto: `site-wgalmeida`

## 1. Diagnóstico do ambiente

### Stack identificada
- React 18
- Vite 8
- Tailwind CSS
- APIs serverless em `api/`
- Conteúdo editorial em markdown dentro de `src/content/`

### Conclusão sobre CMS
- Este projeto não usa WordPress.
- Não há `wp-content`, `functions.php`, `plugins` WordPress, hooks `save_post`, `wp_insert_post` ou similares.
- Também não há CMS tradicional embutido no repositório.

### “Plugins” encontrados
Os itens na pasta `plugins/` são plugins de desenvolvimento do Vite, não plugins de CMS:
- `plugins/selection-mode`
- `plugins/visual-editor`
- `plugins/vite-plugin-iframe-route-restoration.js`

## 2. Auditoria de automação local de imagens

### O que foi procurado
- sinais de busca automática de imagens por conteúdo
- geração de imagem destacada para posts
- inserção automática de imagens em artigos
- chamadas externas para bancos de imagens ou IA
- integrações editoriais com Cloudinary

### Evidências encontradas

#### 2.1. Conteúdo do blog
- Os artigos são lidos via markdown em `src/pages/Blog.jsx`
- O build SEO lê frontmatter em `build-seo-routes.mjs`
- Há fallback de banner por categoria/slug

O que isso faz:
- escolhe banner/fallback para o artigo
- injeta meta tags e OG image

O que isso não faz:
- não busca imagem nova com base no conteúdo
- não gera automaticamente imagem destacada
- não faz upload para Cloudinary por artigo

#### 2.2. Cloudinary no projeto
Foram encontrados usos reais de Cloudinary em:
- `src/components/home/HomeColorTransformer.jsx`
- `src/components/moodboard/ColorTransformer.jsx`
- `src/services/cloudinaryAI.js`
- `src/utils/cloudinaryMedia.js`
- `src/utils/cloudinaryProjectPortfolio.js`

Esses usos atendem:
- upload manual/assistido de imagem
- transformação visual
- recolor/generative UI
- entrega otimizada de mídia

Não atendem:
- automação editorial de imagem para post/publicação

#### 2.3. APIs externas de imagem/IA
Há indícios de:
- Cloudinary
- Stability AI
- Google Places/Reviews

Não há indícios locais de:
- Unsplash API para posts
- Pexels API para posts
- Pixabay API para posts
- DALL·E/OpenAI para geração automática de imagem editorial
- rotina de “ao salvar publicação, gerar imagem”

### Conclusão da fase 1

Não existe automação local editorial de imagens para publicações neste projeto.

Mais precisamente:
- existe gestão e otimização de mídia
- existe transformação visual com Cloudinary
- existe fallback de banner para blog
- não existe pipeline automático que leia título/conteúdo/tags e busque ou gere imagem para a publicação

## 3. Itens específicos que NÃO foram encontrados

Como o projeto não é WordPress, não foram encontrados:
- `save_post`
- `wp_insert_post`
- `the_content`
- `add_action`
- `add_filter`
- `set_post_thumbnail`
- `media_sideload_image`
- `wp_insert_attachment`
- `wp_remote_get`
- `curl_exec` para rotina editorial

## 4. Conclusão objetiva

### Existe automação local?
Não, não existe automação editorial local de imagens para posts/publicações.

### O que existe hoje?
- fallback de banners no blog
- otimização de mídia no build
- uso de Cloudinary para transformação e delivery

### O que falta?
- pipeline que associe imagem automaticamente ao conteúdo editorial

## 5. Arquitetura recomendada de fallback com Cloudinary

Como este projeto não usa WordPress, o fallback recomendado precisa seguir a arquitetura atual React/Vite + scripts/API.

### Fluxo recomendado
1. Ler os artigos em `src/content/blog/*.md`
2. Extrair:
   - `title`
   - `excerpt`
   - `category`
   - `tags`, se existirem
3. Gerar palavra-chave principal
4. Buscar imagem por uma destas estratégias:
   - Estratégia A: mapa curado local por categoria/slug
   - Estratégia B: integração com banco externo e upload no Cloudinary
   - Estratégia C: uso de assets já existentes no Cloudinary com naming padronizado
5. Armazenar a URL otimizada no frontmatter do artigo
6. Rebuild do SEO estático para refletir a imagem correta

### Solução mais segura para este projeto
Estratégia A + C

Motivo:
- mantém controle visual e institucional
- evita depender de geração aleatória
- combina bem com a conta Cloudinary já usada no projeto

## 6. Implementação sugerida

### Opção 1 — sem IA, com curadoria controlada
Criar um script Node:
- lê os markdowns
- detecta artigos sem `image`
- escolhe `public_id` do Cloudinary por categoria/slug
- escreve a imagem no frontmatter

Arquivos-alvo:
- novo script em `tools/`
- apoio em `src/content/blog/*.md`
- reuso do delivery em `build-seo-routes.mjs`

### Opção 2 — com integração externa + Cloudinary
Criar rotina server-side que:
- extrai keywords do artigo
- consulta API externa de imagens
- faz upload para Cloudinary
- salva URL otimizada no frontmatter ou em manifesto JSON

Risco:
- menor controle de branding
- maior risco de inconsistência visual

## 7. Proposta técnica mínima para este repositório

### Recomendação
Implementar um manifesto local de imagens editoriais, por exemplo:
- `src/data/blogImageManifest.js`

Formato sugerido:
- `slug -> public_id do Cloudinary`
- fallback por categoria

Exemplo de fluxo:
- `build-seo-routes.mjs` usa o manifesto antes do fallback genérico
- `Blog.jsx` usa a mesma fonte
- se o slug não existir no manifesto, aplica banner determinístico atual

### Benefícios
- resolve ausência de automação editorial sem romper o padrão do projeto
- mantém SEO consistente
- reduz dependência de endpoints frágeis
- permite curadoria visual alinhada à marca

## 7.1 Implementação aplicada nesta rodada

Foi criada a base técnica para esse fallback sem quebrar o fluxo atual:

- manifesto local em `src/data/blogImageManifest.js`
- `Blog.jsx` agora consulta esse manifesto antes do fallback local por categoria/slug
- `build-seo-routes.mjs` também passou a consultar o manifesto para OG/SEO estático

Decisão operacional:
- o manifesto foi entregue vazio por padrão, porque ainda não há mapeamento editorial definitivo de `public_id` para blog
- quando os IDs forem definidos, a ativação passa a ser incremental por `slug` e/ou categoria, sem mexer no restante do pipeline

Resultado:
- o projeto agora já suporta fallback Cloudinary curado para blog/publicações
- o fallback local anterior continua preservado como contingência

## 8. Evidências usadas nesta auditoria

- `src/pages/Blog.jsx`
- `build-seo-routes.mjs`
- `src/components/home/HomeColorTransformer.jsx`
- `src/components/moodboard/ColorTransformer.jsx`
- `src/services/cloudinaryAI.js`
- `src/utils/cloudinaryMedia.js`
- `src/utils/cloudinaryProjectPortfolio.js`
- `plugins/`
- `api/`

## 9. Resposta final da auditoria

### Existe automação local de imagem para publicações?
Não.

### Existe infraestrutura de mídia aproveitável?
Sim.

### Melhor fallback para este projeto
Cloudinary com manifesto curado por slug/categoria, integrado ao pipeline atual de blog e SEO.
