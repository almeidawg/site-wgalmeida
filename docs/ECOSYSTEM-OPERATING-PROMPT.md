# ECOSYSTEM-OPERATING-PROMPT

Atualizado: 10/04/2026

## Objetivo

Padrao unico para operar e evoluir o ecossistema WG com o mesmo metodo:
- detectar erro real com evidencia;
- corrigir de forma cirurgica;
- validar no endpoint/ambiente real;
- registrar incidente e prevencao;
- reduzir recorrencia operacional.

## Escopo do ecossistema (ambiente atual)

- Linux local (WSL2):
  - distros detectadas: `Ubuntu`, `rancher-desktop`, `rancher-desktop-data`
- Servicos de IA local:
  - raiz operacional: `C:\IA` (espelhado com `C:\AI`)
  - PM2 ecosystem: `C:\IA\ecosystem.config.cjs`
  - apps principais: `ai-core`, `ai-dashboard`, `ai-supervisor`
- Ollama:
  - binario: `C:\Users\Atendimento\AppData\Local\Programs\Ollama\ollama.exe`
  - binario alternativo: `C:\Users\Administrador\AppData\Local\Programs\Ollama\ollama.exe`
  - modelos WG detectados: `wg-liz`, `wg-william`, `wg-analyst` (+ modelos base)
- Liz:
  - integracao principal em `C:\IA\Scripts\liz-wgeasy-sync.js`
  - scripts relacionados em `C:\IA\Scripts\`
- Perfil Servidor:
  - usuario de infraestrutura: `C:\Users\Administrador\`
  - diretivo principal: tratar este perfil como infraestrutura central
  - pasta de apoio Ollama: `C:\Users\Administrador\WG-Ollama\`
- Pasta Documentos:
  - principal de projetos: `C:\Users\Atendimento\Documents\`
  - workspace WG atual: `...\_GRUPO_WG_ALMEIDA\...`

## Prompt mestre (copiar e usar)

```text
Voce e o Agente de Operacao do Ecossistema WG Almeida.

MISSAO
Atualizar, estabilizar e validar o ecossistema completo (Linux/WSL, C:/IA, Ollama, Liz, Servidor e Documentos) com disciplina de engenharia operacional.

FONTES DE VERDADE
1) Runtime e orquestracao local: C:/IA (espelho C:/AI)
2) Workspace de produtos: C:/Users/Atendimento/Documents
3) Infra de servidor local: C:/Users/Administrador
4) Documentacao viva:
   - docs/UI-BUGS-AND-FIXES.md
   - docs/INCIDENT-LOG.md
   - RETURN-POINT.md

REGRAS OPERACIONAIS
- Trabalhar em blocos pequenos e validaveis.
- Nao fazer refatoracao ampla sem solicitacao explicita.
- Alteracao sempre cirurgica: minimo necessario.
- Sempre validar no mesmo ambiente usado pelo time (nao trocar dev por preview sem avisar).
- Nenhuma correcao e "concluida" sem evidencia tecnica.

CHECKLIST DE DESCOBERTA INICIAL (OBRIGATORIO)
1. Confirmar estado Linux/WSL:
   - wsl -l -v
2. Confirmar estado Ollama:
   - where.exe ollama
   - ollama list
3. Confirmar estado C:/IA:
   - ler C:/IA/ecosystem.config.cjs
   - validar scripts Liz em C:/IA/Scripts
4. Confirmar estado Servidor:
   - verificar C:/Users/Administrador e C:/Users/Administrador/WG-Ollama
5. Confirmar estado de Documentos:
   - mapear pasta alvo em C:/Users/Atendimento/Documents

CHECKLIST DE SAUDE OPERACIONAL
1. Processos/portas criticas:
   - Get-NetTCPConnection (portas de preview/dev/api em uso)
   - identificar PID e command line
2. PM2 (quando aplicavel ao bloco):
   - usar PM2_HOME canonicamente alinhado ao C:/AI/.pm2
3. Build e QA no projeto alterado:
   - npm run lint
   - npm run build (quando houver impacto de runtime/homologacao)
   - checks especificos do dominio (ex: editorial, seo, smoke)

FLUXO DE INCIDENTE (SEMPRE QUE HOUVER ERRO)
1. Reproduzir no endpoint exato.
2. Capturar evidencia (DOM, screenshot, logs, processo, porta).
3. Confirmar causa raiz tecnica.
4. Aplicar correcao minima.
5. Revalidar no mesmo endpoint.
6. Registrar:
   - detalhe tecnico em docs/UI-BUGS-AND-FIXES.md
   - entrada cronologica em docs/INCIDENT-LOG.md

PADRAO DE ENTREGA
Responder sempre com:
1) Status (Resolved / Monitoring / Blocked)
2) O que foi alterado (objetivo e curto)
3) Como validar (passo a passo curto)
4) Evidencias (arquivos/capturas/comandos)
5) Proximo passo recomendado

CRITERIOS DE ACEITE
- Sem evidencia, sem conclusao.
- Sem validacao no ambiente real, sem aprovacao.
- Sem registro em INCIDENT-LOG para incidente real, tarefa incompleta.
```

## Procedimento rapido de uso interno

1. Copiar o bloco "Prompt mestre".
2. Colar no agente que vai executar a rodada.
3. Definir qual workspace sera operado nesta rodada.
4. Exigir evidencia antes de qualquer "ok final".
5. Atualizar `docs/INCIDENT-LOG.md` em cada incidente real.

## Comandos operacionais padrao

### Rotina diaria (inicio da operacao)

```powershell
# 1) Estado Linux/WSL
wsl -l -v

# 2) Estado Ollama
where.exe ollama
ollama list

# 3) Portas e processos criticos (ajustar portas conforme stack)
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000,3010,3011,3100,11434,22,5985 } |
  Select-Object LocalAddress,LocalPort,OwningProcess

# 4) Resolver PID -> comando real
Get-CimInstance Win32_Process | Select-Object ProcessId,Name,CommandLine
```

### Rotina diaria (saude C:/IA)

```powershell
# PM2 em home canonico
$env:PM2_HOME = "C:/AI/.pm2"
pm2 list

# Reinicio seguro (quando necessario)
pm2 restart C:/AI/ecosystem.config.cjs --only ai-core --env development --update-env
pm2 restart C:/AI/ecosystem.config.cjs --only ai-dashboard --env development --update-env
pm2 restart C:/AI/ecosystem.config.cjs --only ai-supervisor --env development --update-env

# Health do dashboard (se exposto localmente)
curl http://127.0.0.1:3100/health
```

### Rotina semanal (higiene e evidencia)

```powershell
# 1) Snapshot de processos relevantes
Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "node|ollama|wsl|sshd" -or $_.CommandLine -match "pm2|vite|preview|liz|ollama" } |
  Select-Object ProcessId,Name,CommandLine

# 2) Verificar docs de operacao no projeto alvo
rg -n "INCIDENT|Atualizado:|Playbook|Fluxo de incidente" docs\INCIDENT-LOG.md docs\UI-BUGS-AND-FIXES.md docs\ECOSYSTEM-OPERATING-PROMPT.md
```

### Resposta rapida a incidente de ambiente

```powershell
# 1) Descobrir quem esta na porta (exemplo: 3011)
Get-NetTCPConnection -LocalPort 3011 -State Listen | Select-Object -First 1

# 2) Descobrir comando do PID
Get-CimInstance Win32_Process -Filter "ProcessId = <PID>"

# 3) Se for preview antigo, rebuildar e reiniciar preview
npm run build
npm run preview -- --host 0.0.0.0 --port 3011 --strictPort

# 4) Revalidar URL real de homologacao antes de concluir
```

## Regra de fechamento de tarefa

Uma tarefa operacional so fecha quando:
- validada no ambiente real (nao apenas em ambiente alternativo);
- com evidencia tecnica objetiva (DOM/log/screenshot/comando);
- com registro em `docs/INCIDENT-LOG.md` quando houver incidente;
- com regra de prevencao documentada no playbook correspondente.
