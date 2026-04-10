# Checklist Técnico — Capturas `SreenSiteWg`

Data: 08/04/2026
Projeto: `site-wgalmeida`
Origem das solicitações: `C:\Users\Atendimento\Desktop\SreenSiteWg`

## Diagnóstico do projeto

- O projeto atual não usa WordPress.
- Stack encontrada:
  - React 18
  - Vite 8
  - Tailwind CSS
  - APIs serverless em `api/`
  - Conteúdo markdown em `src/content/`
  - Integrações com Supabase, Cloudinary e Google Places
- Portanto, as correções precisam ser feitas no código React/CSS/API local.

## Itens já corrigidos ou parcialmente cobertos

### 1. `não trabalhamos com negrito - remover - e idnetificar se a fonte estão corretas...`
Status: corrigido de forma estrutural nos principais pontos institucionais

Evidências:
- Tipografia Suisse configurada em `src/index.css`
- Override global de pesos fortes em `src/index.css`
- Header e Footer já usam `font-suisse font-light`

Solução já aplicada no projeto:
- `b`, `strong` herdam peso em vez de forçar bold
- `.font-medium`, `.font-semibold`, `.font-bold`, `.font-extrabold`, `.font-black` foram achatadas para `300 !important`
- Footer já foi alinhado para `font-suisse font-light`
- páginas institucionais e landings-chave foram limpas para remover pesos fortes no próprio markup:
  - `src/pages/AMarca.jsx`
  - `src/pages/BuildTech.jsx`
  - `src/pages/ObraEasyLanding.jsx`
  - `src/pages/EasyRealStateLanding.jsx`
  - `src/components/home/HomeColorTransformer.jsx`
  - `src/components/InstagramGallery.jsx`

Arquivos-chave:
- `src/index.css`
- `src/components/layout/Header.jsx`
- `src/components/layout/Footer.jsx`

Observação:
- Ainda existem componentes com classes `font-medium` e `font-semibold`. O override CSS reduz o impacto visual, mas ainda vale limpeza estrutural nos componentes mais sensíveis.

### 2. `remover estas estrelas de todo o site`
Status: corrigido nos blocos institucionais e comerciais principais

Evidências:
- Existe componente institucional `BrandStar` em `src/components/BrandStar.jsx`
- Mas ainda há uso direto de `Star` em:
  - `src/components/GoogleReviewsBadge.jsx`
  - `src/pages/Testimonials.jsx`
  - `src/pages/ObraEasyLanding.jsx`

Solução já aplicada no projeto:
- O ícone institucional foi criado para substituir estrela padrão
- avaliações principais migradas para `BrandStar`/`BrandRating`
- landings comerciais principais também passaram a usar o ícone da marca

Arquivos ajustados:
- `src/components/BrandStar.jsx`
- `src/components/GoogleReviewsBadge.jsx`
- `src/pages/Testimonials.jsx`
- `src/pages/ObraEasyLanding.jsx`
- `src/pages/EasyRealStateLanding.jsx`

Pendência:
- ainda existem usos de `Star` em telas secundárias/admin e podem ser migrados em nova rodada se você quiser padronização total do repositório

### 3. `remover negrito dos textos`
Status: corrigido nos blocos mais visíveis e com maior impacto de marca

Evidências:
- O CSS global já derruba pesos fortes
- Vários títulos seguem com `font-medium` em páginas específicas

Pontos já ajustados:
- `src/pages/ObraEasyLanding.jsx`
- `src/components/GoogleReviewsBadge.jsx`
- `src/pages/Testimonials.jsx`
- `src/pages/AMarca.jsx`
- `src/pages/BuildTech.jsx`
- `src/pages/EasyRealStateLanding.jsx`

Pendência residual:
- componentes do moodboard/room visualizer ainda têm vários pesos declarados no markup, embora visualmente estejam achatados pelo CSS global

### 4. `vincular instragram e imagen do instagram`
Status: corrigido visualmente e estabilizado no fallback

Evidências:
- Links institucionais no footer:
  - `src/components/layout/Footer.jsx`
- Galeria dedicada:
  - `src/components/InstagramGallery.jsx`

Solução existente:
- Há códigos reais de posts salvos localmente
- Há links para posts e perfil institucional
- a vitrine foi ajustada para o padrão cromático WG no componente
- o fallback visual deixou de usar gradiente genérico fora da identidade

Fragilidade atual:
- As thumbnails usam `https://www.instagram.com/p/.../media/?size=l`, um endpoint instável para consumo direto
- Se o Instagram bloquear ou mudar comportamento, a galeria quebra e cai no fallback visual

### 5. `não tme conteudo das materias -`
Status: provável correção já aplicada no pipeline, mas precisa validação visual

Evidências:
- O conteúdo do blog vem de markdown real em `src/content/blog`
- Os menores artigos verificados não estão vazios
- O build estático injeta SEO e fallback em `build-seo-routes.mjs`

Solução já aplicada:
- Correção do parser raw/frontmatter para Vite 8
- Geração estática por rota em `build-seo-routes.mjs`

Arquivos-chave:
- `src/pages/Blog.jsx`
- `build-seo-routes.mjs`
- `src/content/blog/*.md`

Observação:
- Se ainda houver “matéria sem conteúdo” na interface, a origem mais provável é problema de renderização/estilo por rota, não ausência do markdown-fonte.

## Itens pendentes com localização técnica

### 1. `deslocar coluna nucleos para esquerda para melhorar distribuição de Onde Atuamos`
Status: corrigido

Alvo principal:
- `src/components/layout/Footer.jsx`

Trecho relevante:
- grid principal do footer
- bloco `Onde Atuamos - SEO Local`

Solução aplicada:
- grid do footer reequilibrado
- coluna `Onde Atuamos` saiu de `lg:mx-auto` para deslocamento controlado à esquerda
- malha interna passou a responder melhor em 2/3 colunas

Arquivo ajustado:
- `src/components/layout/Footer.jsx`

### 2. `cor do texto e contorno do botão`
Status: pendente

Alvos prováveis:
- `src/components/ui/button.jsx`
- `src/pages/Testimonials.jsx`
- `src/pages/ObraEasyLanding.jsx`
- `src/index.css`

Motivo:
- Existem botões com mistura de `btn-apple`, `variant="outline"` e classes locais
- A borda/contraste pode variar entre páginas

### 3. `erro de cor e texto`
Status: pendente

Alvos prováveis:
- `src/index.css`
- `src/pages/Home.jsx`
- `src/pages/Testimonials.jsx`
- `src/pages/ObraEasyLanding.jsx`

Motivo:
- O projeto já carrega múltiplas famílias e tokens de cor
- Há componentes antigos com classes utilitárias diferentes do sistema mais recente

### 4. `ajustar caculadora para ficar assim e com efeito e ajsutar cores da marca`
Status: pendente

Alvos prováveis:
- `src/pages/ObraEasyLanding.jsx`
- `src/components/home/HomeColorTransformer.jsx`

Leitura técnica:
- `ObraEasyLanding.jsx` contém a proposta/calculadora comercial do produto
- `HomeColorTransformer.jsx` é o comparador visual com efeito de arraste e cores
- Pelo nome do print, o ajuste pode estar em um desses dois blocos dependendo da tela capturada

### 5. `consultoria de martketing - acho que tem muita informação aqui`
Status: pendente

Alvos prováveis:
- `src/pages/BuildTech.jsx`
- `src/pages/AMarca.jsx`
- `src/pages/Wnomas.jsx`
- `src/pages/Home.jsx`

Observação:
- Esse item precisa da imagem para fechar o alvo exato, mas a tendência é ser uma seção institucional/comercial com excesso de texto ou cards.

### 6. `idnetificar se os dados sção rais vindos da base de dadios criado em wgeasy`
Status: parcialmente validado

Evidências encontradas:
- Integração com Supabase em `src/api/EcommerceApi.js`
- Comentários explícitos apontando WG Easy como origem
- Link de acesso WG Easy no header/footer

Conclusão atual:
- A loja/produtos têm trilha clara para dados reais do WG Easy via Supabase
- Isso não prova automaticamente que todo número do site seja real

Arquivos-chave:
- `src/api/EcommerceApi.js`
- `src/lib/customSupabaseClient`
- `verificar-dados-supabase.js`

### 7. `imoveis comparaveis - as metragens não chegam nem perto...`
Status: pendente e sensível

Alvo mais provável:
- `src/pages/ObraEasyLanding.jsx`

Motivo:
- A página cita EVF, mercado, SINAPI, CUB/SINDUSCON, FipeZAP e comparativos
- Se houver cards/tabelas de “imóveis comparáveis”, isso precisa ser validado contra fonte real, não só design

Risco:
- Esse item não deve ser “corrigido visualmente” sem confirmar a origem dos dados

Atualização técnica:
- o bloco do print analisado está em `src/pages/Process.jsx`, não em `ObraEasyLanding.jsx`
- hoje ele usa arrays e fórmulas locais por metragem
- portanto não é dado live vindo do WG Easy
- correção aplicada nesta rodada:
  - transparência explícita no texto da interface
  - remoção de referência ambígua a leitura live do WG Easy
  - correção do link de WhatsApp que ainda usava número placeholder

### 8. `lidar se estão reais`
Status: pendente

Categoria:
- auditoria de dados

Alvos:
- `src/api/EcommerceApi.js`
- `api/google-reviews.js`
- possíveis seções do `ObraEasyLanding.jsx`

Diagnóstico atualizado:
- `src/pages/Process.jsx`: não usa dado real do WG Easy; é simulação editorial local
- `src/api/EcommerceApi.js`: confirmado com Supabase acessível via `pricelist_itens`
- `src/hooks/useEstatisticasWG.js`: tenta ler `contratos` e `contratos_itens`, mas a leitura atual retornou vazia; a home fica em fallback histórico
- `contacts` e `propostas_solicitadas`: acessíveis, porém vazias na leitura com a chave pública atual

### 9. `substituir qualquer lkugar que tenha este icon`
Status: pendente

Evidências:
- O projeto usa muitos ícones `lucide-react`
- Também existe ícone institucional próprio em `src/components/BrandStar.jsx`

Alvos com maior concentração de ícones:
- `src/pages/Process.jsx`
- `src/pages/ObraEasyLanding.jsx`
- `src/components/layout/Header.jsx`
- `src/components/layout/Footer.jsx`
- componentes do moodboard e room visualizer

### 10. `vrificar paginas com esse erro de barra branca`
Status: pendente

Evidências relacionadas:
- Classe `.hero-under-header` em `src/index.css`
- Ajustes de preview local e service worker em `src/main.jsx`

Hipótese técnica:
- Pode ser sobreposição entre header fixo, hero e fundo branco da próxima seção
- Pode ser cache antigo de service worker em preview

Alvos prováveis:
- `src/index.css`
- `src/main.jsx`
- páginas com hero full-bleed

## Itens de dados e integrações já identificados

### Google Reviews
- Fonte remota: `api/google-reviews.js`
- Hook cliente: `src/hooks/useGoogleReviews.js`
- Situação:
  - se houver credenciais, busca Google Places
  - sem credenciais, cai em fallback local hardcoded

Conclusão:
- As avaliações podem ser reais via API
- Mas hoje existe fallback estático, então nem toda renderização garante dado live

### Instagram
- Perfil institucional já vinculado no footer
- Galeria usa códigos reais de posts
- Correção aplicada nesta rodada:
  - thumbnails reais passaram a ser congeladas localmente em `public/images/instagram/`
  - script de atualização criado em `tools/fetch-instagram-thumbnails.mjs`
  - componente `src/components/InstagramGallery.jsx` deixou de depender do endpoint frágil `/media/?size=l`

### Turn Key no blog
- Já existe material publicado sobre o tema
- Evidência principal:
  - `src/content/blog/o-que-e-turn-key.md`
- Complementares:
  - `src/content/blog/liz-curadoria-wg-almeida.md`
  - `src/content/blog/quanto-custa-reformar-apartamento-2026.md`

## Atualização desta rodada

### 11. `continua sem ajuste ... trazer um pouco mais onde atuamos`
Status: corrigido

Solução aplicada:
- `src/components/layout/Footer.jsx`
- redistribuição da malha do footer
- coluna `Onde Atuamos` deslocada mais para a esquerda
- grid interno reequilibrado para leitura mais diagramada

### 12. `remover o efeito sanfona ... tres cards com as cores de cada nucleo`
Status: corrigido

Solução aplicada:
- componente legado de sanfona removido do projeto
- `src/pages/SanfonaEntry.jsx` refeito como vitrine estática de 3 cards
- cada card agora respeita o núcleo correspondente:
  - Arquitetura
  - Engenharia
  - Marcenaria

### 13. `todos textos ... marrom substituir pelo cinza escuro da marca mudar +3mil para +3898`
Status: corrigido no bloco principal alvo

Solução aplicada:
- `src/pages/Home.jsx`
- números da faixa de resultados migrados para cinza escuro da marca
- `metrosRevestimentos` deixou de resumir para `3mil`
- a animação agora exibe o valor completo (`3.898`)
- pesos tipográficos visíveis do bloco também foram suavizados

### 14. `iamgens em duplicidade ... linkar imagens reais do instagram`
Status: corrigido

Solução aplicada:
- `src/components/InstagramGallery.jsx`
- `tools/fetch-instagram-thumbnails.mjs`
- `public/images/instagram/`

Resultado:
- cada card passa a usar thumbnail real e única do post
- a galeria deixa de depender do endpoint público instável do Instagram
- o comportamento fica mais previsível para build local e deploy estático

### Cloudinary
- Há uso real no projeto para:
  - moodboard/transformação de cor
  - galeria de projetos
  - hero otimizado
- Não há automação de “imagem de matéria/post” baseada em conteúdo editorial

## Resumo executivo

### Já corrigido ou estruturado
- Tipografia Suisse e política anti-negrito
- componente institucional para substituir estrelas
- links institucionais de Instagram
- renderização de conteúdo das matérias via markdown
- parte da mídia já migrada para Cloudinary
- FAQ sem negrito via `src/pages/faq.css`
- timeline/processo com aviso explícito de simulação local

### Parcial
- remoção de estrelas ainda incompleta
- remoção de negrito ainda incompleta em alguns componentes
- Instagram existe, mas a imagem/thumbnail ainda é frágil
- dados “reais” dependem de qual módulo estamos falando

### Aberto
- layout de “Onde Atuamos”
- cor/contorno de botões
- revisão visual da calculadora
- excesso de informação em seção de marketing
- validação de comparáveis/metragens
- substituição do ícone apontado na captura
- investigação da barra branca nas páginas

## Prontidão para atualizar imagens

### Blog
Status: pronto para rodar assim que os `public_id` editoriais forem definidos

Dependência:
- preencher `src/data/blogImageManifest.js`

### Guia de estilos
Status: funcional com fallback atual, mas não curado

Situação:
- `src/utils/styleCatalog.js` usa fallback local estável
- para imagem editorial definitiva, falta manifesto ou mapeamento de covers reais

### Moodboard
Status: depende de Cloudinary operacional

Situação:
- o código já reconhece `VITE_CLOUDINARY_UPLOAD_PRESET`
- se o preset estiver válido, a trilha real pode rodar
- se não estiver válido, partes do fluxo entram em modo demonstração

## Continuação — rodada atual

### 18. `aprimorar a diagramação das respostas do faq`
Status: corrigido

Solução aplicada:
- `src/pages/FAQ.jsx`
- `src/pages/faq.css`

Resultado:
- FAQ reorganizado por clusters de intenção
- respostas mais úteis para SEO e conversão
- manutenção do schema FAQPage

### 19. `sobre as imagens vamos fazer a busca das imagens publicas no cloudinary ... aplica para todos que dependencias de imagens`
Status: corrigido na primeira camada editorial

Solução aplicada:
- `tools/sync-cloudinary-editorial-assets.mjs`
- `cloudinary-editorial-sync-2026-04-08.json`
- `src/data/blogImageManifest.js`
- `src/data/styleImageManifest.js`

Resultado:
- blog passou a usar Cloudinary para os slugs com capa local existente
- revista de estilos passou a usar Cloudinary para os 31 estilos
- banners de categoria também foram sincronizados como fallback editorial

### 20. `o link criado não é personalizado e nem cria uma landing`
Status: corrigido

Solução aplicada:
- `src/pages/MoodboardShare.jsx`
- `src/utils/moodboardShare.js`
- `src/components/moodboard/ColorTransformer.jsx`
- `src/App.jsx`

Resultado:
- compartilhamento agora abre landing própria
- imagem transformada fica embalada em página com CTA para proposta, briefing e WhatsApp

## Rodada de links e navegação

### Corrigido
- padronização de links internos para `Link` do React Router
- remoção de hard reload em CTAs internos
- criação de auditoria automática de rotas e referências

### Evidências
- `LINK-AUDIT-2026-04-08.md`
- `link-audit-2026-04-08.json`

### Resultado
- `63` rotas reconhecidas
- `128` referências internas auditadas
- `0` links inválidos
- `0` hard navigations internas
