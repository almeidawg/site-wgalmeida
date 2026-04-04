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
