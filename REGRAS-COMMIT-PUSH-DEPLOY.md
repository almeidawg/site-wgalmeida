# Regras para Commit, Push e Deploy

## 1. Organização de Pastas e Arquivos
- Mantenha imagens e vídeos em suas respectivas pastas dentro de `public/images` e `public/videos`.
- Utilize subpastas para projetos, banners, blog, etc.
- Não armazene arquivos temporários, duplicados ou não utilizados no repositório.
- Use arquivos `.gitkeep` para manter pastas vazias no controle de versão, se necessário.

## 2. Imagens e Vídeos
- Prefira armazenar imagens e vídeos em serviços externos (ex: Cloudinary) e referenciar por URL.
- Se necessário manter local, garanta que estejam organizados e realmente utilizados no site.
- Remova arquivos de mídia não utilizados ou duplicados.

## 3. Arquivos Públicos
- Não armazene arquivos sensíveis ou desnecessários em `public/`.
- Use README.md nas pastas para descrever o conteúdo quando necessário.

## 4. Boas Práticas de Commit
- Antes de commitar, execute: `git status` para revisar alterações.
- Não commite arquivos grandes, desnecessários ou temporários.
- Use mensagens de commit claras e objetivas.
- Exemplo: `git commit -m "ajuste imagens do blog"`

## 5. Push e Deploy
- Certifique-se de que o repositório remoto está acessível.
- Execute `git pull` antes de `git push` para evitar conflitos.
- Não faça push de arquivos não utilizados ou grandes mídias locais.
- Após push, valide o deploy no ambiente de produção.

## 6. Checklist Antes do Deploy
- [ ] Remover arquivos desnecessários
- [ ] Garantir que todas as mídias estão linkadas corretamente
- [ ] Validar funcionamento do site localmente
- [ ] Executar testes automatizados, se houver
- [ ] Realizar commit e push

---

Dúvidas? Consulte este documento antes de cada deploy.

## LIÇÕES APRENDIDAS — Abril 2026

### Branch tracking incorreto (divergência ahead/behind)
**Problema:** `.git/config` apontava `merge = refs/heads/release/site-novo-2026-04-11` para o branch `main`, causando divergência silenciosa (local 30 commits à frente, remoto 13 commits à frente).
**Como detectar:** `git status` mostra "ahead X, behind Y" — ou `cat .git/config` e verificar a linha `merge` em `[branch "main"]`.
**Correção:** `git branch --set-upstream-to=origin/main main`
**Regra:** Após qualquer operação de branch (merge, checkout de release), verificar `.git/config` para garantir que `merge = refs/heads/main`.

### Resolução de divergência (ahead + behind)
**Nunca usar** `git push --force` em main.
**Usar rebase:**
```bash
git fetch origin
git rebase origin/main
git push origin main
```
O rebase coloca os commits locais em cima dos commits remotos, preservando histórico limpo.

### Branches com históricos não relacionados (unrelated histories)
**Problema:** `git merge-base` retorna exit 1. Acontece quando o remoto foi recriado do zero (ex: "LIMPEZA TOTAL") enquanto o local continuou com feature work.
**Diagnóstico:** `git log --oneline main | tail -5` vs `git log --oneline origin/main | tail -5` — sem commits em comum = históricos não relacionados.
**Solução:**
```bash
# 1. Absorver histórico remoto mantendo nosso código
git merge --allow-unrelated-histories -s ours origin/main -m "merge: absorver historico remoto..."
# 2. Verificar fixes do remoto que não temos localmente e aplicar manualmente
git show <hash> -- <arquivo>
# 3. Push
git push origin main
```
**Nunca usar** `git rebase` nesta situação — causa centenas de conflitos add/add.

### Padrões obrigatórios no .gitignore
Sempre incluir (já adicionados):
- `.monitor-data/` — dados do NOC/monitor local
- `codex-dev.log`, `codex-dev.err.log` — logs do Codex
- `preview-*.log`, `preview-*.err.log`, `preview-*.out.log` — logs de preview
- `noc-tools/tmp/` — temporários do NOC
- `temp_unsplash_*.json`, `temp-local-server.*` — arquivos temporários locais
- `AUDITORIA-*.md`, `LINK-AUDIT-*.md`, `CLOUDINARY-*.md` — relatórios locais gerados

### Redirects externos em vercel.json
Para rotas que devem redirecionar para outro domínio (ex: `/parceiros` → `obraeasy.wgalmeida.com.br`):
- **Adicionar em vercel.json** (server-side): necessário para SEO bots e clientes sem JS
- **Adicionar em App.jsx** (client-side): garante SPA redirect para usuários logados
- Usar `"permanent": false` para redirects cross-domínio (status 302) — facilita mudanças futuras
- Usar `"permanent": true` apenas para redirects internos definitivos (ex: `/wnomas` → `/wnomasvinho`)
## 7. BuildTech clientes no monodomain
- O subdominio oficial de aprovacao e `https://buildtech.wgalmeida.com.br/clientes/<slug>/`.
- Se tambem for necessario atender `https://wgalmeida.com.br/buildtech/clientes/<slug>/`, manter em `vercel.json` um redirect explicito de `/buildtech/clientes/:path*` para `https://buildtech.wgalmeida.com.br/clientes/:path*`.
- Nao confiar apenas no rewrite generico `/buildtech/:path*`.
- Sempre que atualizar essa regra, rodar novo deploy de producao do projeto `grupo-wg-almeida`.
- Checklist minimo para clientes BuildTech:
  - publicar com `publish-approval.mjs`
  - deploy de producao em `wg-WTB-build-tech/files`
  - validar `buildtech.wgalmeida.com.br/clientes/<slug>`
  - validar `wgalmeida.com.br/buildtech/clientes/<slug>`
