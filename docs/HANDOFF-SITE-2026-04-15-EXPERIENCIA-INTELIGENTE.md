# HANDOFF — site-wgalmeida — 15/04/2026

## Prompt para a outra sessão

Leia obrigatoriamente:
1. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\IA-START-HERE-WG.md`
2. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\AGENTS-BOAS-PRATICAS-WG.md`
3. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\22_20260310_Biblioteca\knowledge\processos\manifesto-ecossistema-wg-inteligencia-simples.md`
4. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\22_20260310_Biblioteca\knowledge\processos\diretriz-produto-wg-experiencia-inteligente.md`
5. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\_Grupo_WG_Almeida\site-wgalmeida\site-wgalmeida\RETURN-POINT.md`
6. `C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\_Grupo_WG_Almeida\site-wgalmeida\site-wgalmeida\docs\HANDOFF-SITE-2026-04-15-EXPERIENCIA-INTELIGENTE.md`

Depois continue no `site-wgalmeida` com alteração cirúrgica nas páginas:
- `src/pages/ConstrutoraAltoPadraoSP.jsx`
- `src/pages/ObraTurnKey.jsx`
- `src/pages/ReformaApartamentoItaim.jsx`
- `src/pages/regions/Mooca.jsx`
- `src/pages/regions/VilaMariana.jsx`

## Objetivo

Trocar linguagem mais fria de `sistema`, `plataforma` e `ferramenta` por:
- inteligência por trás
- leitura guiada
- experiência simples
- menos coordenação manual

Sem reescrever editorial amplo e preservando SEO/schema quando necessário.

## Regras de edição

- alteração cirúrgica por bloco
- não reescrever páginas inteiras
- preservar termos de mercado quando forem tese comercial válida:
  - `alto padrão`
  - `luxo`
  - `turn key`
- preservar SEO e schema quando `software`, `plataforma` ou `sistema` estiverem só em camada técnica
- reescrever apenas quando a linguagem fria estiver aparecendo como promessa principal da experiência

## Linguagem-alvo

Evitar:
- `o sistema faz`
- `a plataforma conecta`
- `a ferramenta permite`

Preferir:
- `a leitura organiza`
- `a experiência facilita`
- `a inteligência trabalha por trás`
- `a operação fica mais clara`
- `menos coordenação manual`
- `mais previsibilidade`

## Validação obrigatória ao final

Rodar no diretório do projeto:

```powershell
npm run check:imports
npm run audit:consistency:strict
npm run build
npm run blog:editorial:status
```

Registrar o fechamento no `RETURN-POINT.md`.

## Comando rápido para abrir este handoff

```powershell
notepad "C:\Users\Atendimento\Documents\_WG_ALMEIDA_GROUPO\01_APPS\02_BUILDTECH\04_OPERACIONAL\02_20260310_Projetos\02_20260310_Desenvolvimento\_Grupo_WG_Almeida\site-wgalmeida\site-wgalmeida\docs\HANDOFF-SITE-2026-04-15-EXPERIENCIA-INTELIGENTE.md"
```

## Planejamento do rollout para todas as páginas com leitura semelhante

### Base homologada

Usar como referência principal:
- `/blog/como-calcular-custo-de-obra`

Usar como apoio operacional:
- `docs/AUDITORIA-PADRAO-EDITORIAL-BLOG-E-GUIAS-2026-04-15.md`
- `docs/CHECKLIST-VALIDACAO-EDITORIAL-ANTES-DA-ENTREGA.md`
- `docs/PLANO-ROLLOUT-PADRONIZACAO-BLOG-E-GUIAS-2026-04-15.md`

### Estratégia correta

Não continuar corrigindo só por exceção local.

Aplicar esta ordem:
1. leitura total do slug ou da página
2. separar problema de conteúdo vs problema de template
3. promover a regra para o template central quando possível
4. tocar no markdown apenas quando houver erro textual, estrutura de heading ou conteúdo fora do padrão
5. validar no renderer inteiro, não só no bloco que parece afetado

### Famílias a cobrir

- blog com leitura estruturada
- guias de estilos
- páginas institucionais/comerciais que usam a mesma lógica de hero + card + leitura guiada + blocos editoriais

### Checklist mínimo por página

- hero
- card abaixo do hero
- tipografia e pesos
- títulos de bloco
- corpo do artigo/página
- listas e marcadores
- FAQ
- ICCRI/Liz quando houver
- imagens por bloco
- renderers de imagem em todos os caminhos
- footer
- responsividade
- validação técnica

### Regra crítica de imagem

Se houver máscara, zoom, corte, tratamento editorial ou regra por seção:
- validar em `ContextImageCard`
- validar no renderer integrado por seção
- validar `sectionTitle/sectionId`
- validar se a matéria pede `1 imagem por seção` ou agrupamento

### Entregável esperado da próxima sessão

- páginas comerciais acima ajustadas
- registro no `RETURN-POINT.md`
- manutenção do plano de rollout para continuar depois em blog/guias/páginas correlatas
