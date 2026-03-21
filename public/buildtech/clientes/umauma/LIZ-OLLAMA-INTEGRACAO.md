# 🤖 INTEGRAÇÃO OLLAMA NO LIZ — GUIA FINAL

**Data:** 11 de Março de 2026
**Status:** ⏳ Pronto para ativação
**Servidor:** WG Assistente Zap (Liz) — Bot WhatsApp
**Fallback:** Ollama como principal quando Claude, GPT-4o e Gemini falham

---

## ✅ O QUE JÁ ESTÁ CONFIGURADO

### 1. Código Ollama ✅
- ✅ Função `chatWithOllama()` existe (linha 1738 em `claude.js`)
- ✅ Fallback chain já implementada (linha 2010)
- ✅ Retry automático com p-queue

### 2. Arquivo .env ✅
```
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:14b
OLLAMA_MODEL_OWNER=qwen2.5:14b
CLIENTS_USE_OLLAMA=true
```

### 3. Servidor Liz Localizado ✅
```
C:/Users/Atendimento/Documents/_WG_build.tech/02_20260310_Projetos/01_20260310_Producao/01_20260310_WG-Liz-WhatsApp/01_20260310_Production-Code/wg-zap/
```

---

## 📋 O QUE VOCÊ PRECISA FAZER

### PASSO 1: Fazer Login como Administrador
```
Usuário: Servidor (ou Administrador)
Senha: 130300@$Wg
```

### PASSO 2: Abrir PowerShell como ADMINISTRADOR

### PASSO 3A: Verificar Modelos Ollama Baixados
```powershell
ollama list
```

**Opções:**
- ✅ Se tem `qwen2.5:14b` → pronto, vai para PASSO 4
- ✅ Se tem `mistral` → pode usar, edita .env (veja abaixo)
- ❌ Se não tem nada → vai para PASSO 3B

### PASSO 3B: Baixar Modelo (SE NECESSÁRIO)
```powershell
# Opção 1: Qwen (recomendado — configurado no .env)
ollama pull qwen2.5:14b

# Opção 2: Mistral (mais rápido)
ollama pull mistral

# Opção 3: Llama2
ollama pull llama2
```

### PASSO 4: Iniciar Ollama em Background
```powershell
# Inicia Ollama na porta 11434
ollama serve
```
Deixe rodando (não feche a janela).

---

## 🔧 TESTAR CONNEXÃO

Em **outra janela PowerShell**, execute:

```powershell
# Testar se Ollama está respondendo
curl http://localhost:11434/v1/models

# Ou com Invoke-RestMethod
Invoke-RestMethod -Uri "http://localhost:11434/v1/models" -Method Get
```

**Resultado esperado:** JSON com lista de modelos

---

## 📝 SE USAR MODELO DIFERENTE DE QWEN

Se você tem `mistral` em vez de `qwen2.5:14b`, edite o `.env`:

**Arquivo:** `C:/Users/Atendimento/Documents/_WG_build.tech/02_20260310_Projetos/01_20260310_Producao/01_20260310_WG-Liz-WhatsApp/01_20260310_Production-Code/wg-zap/.env`

**Encontre (linhas 17-19):**
```
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=qwen2.5:14b
OLLAMA_MODEL_OWNER=qwen2.5:14b
```

**Substitua por:**
```
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=mistral
OLLAMA_MODEL_OWNER=mistral
```

---

## ▶️ ATIVAR LIZ COM OLLAMA

### Via PM2 (se já está usando PM2):
```powershell
# Como Administrador
pm2 restart wg-zap --update-env
```

### Ou manualmente (desenvolvimento):
```powershell
cd "C:\Users\Atendimento\Documents\_WG_build.tech\02_20260310_Projetos\01_20260310_Producao\01_20260310_WG-Liz-WhatsApp\01_20260310_Production-Code\wg-zap"
npm start
```

---

## 🧪 TESTAR OLLAMA NO LIZ

1. **Abra WhatsApp**
2. **Envie mensagem** para Liz
3. **Veja nos logs:**
   ```
   [WG-Zap] ⚡ Claude OK...
   ```
   ou se Claude falhar:
   ```
   [WG-Zap] ⚠️ Claude falhou — tentando GPT-4o
   [WG-Zap] ⚠️ GPT-4o falhou — tentando Gemini
   [WG-Zap] ⚠️ Gemini falhou — tentando Ollama
   [WG-Zap] 🦙 Ativando Ollama local (qwen2.5:14b)
   ```

---

## 📊 FALLBACK CHAIN DO LIZ (ATUALIZADO)

```
┌─────────────────────────────────────────┐
│         MENSAGEM WHATSAPP RECEBIDA      │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Claude (Haiku)│  ← Primário
        └────────┬───────┘
                 │ (se falhar)
                 ▼
        ┌────────────────┐
        │   GPT-4o       │  ← Fallback 1
        └────────┬───────┘
                 │ (se falhar)
                 ▼
        ┌────────────────┐
        │    Gemini      │  ← Fallback 2
        └────────┬───────┘
                 │ (se falhar)
                 ▼
        ┌─────────────────┐
        │ 🦙 OLLAMA LOCAL │  ← Fallback PRINCIPAL
        │ (qwen2.5:14b)   │     (GRATUITO 24/7)
        └────────┬────────┘
                 │ (se falhar)
                 ▼
        ┌────────────────┐
        │  BridgeAI      │
        │ (Claude Code)  │
        └────────┬───────┘
                 │ (se falhar)
                 ▼
         ⚠️ SEM RESPOSTA
```

---

## 🎯 BENEFÍCIOS OLLAMA

✅ **Grátis** — sem API costs
✅ **Local** — sem dados enviados para nuvem
✅ **24/7** — não depende de APIs externas
✅ **Rápido** — latência de milissegundos
✅ **Privado** — conversa fica no seu PC
✅ **Fallback** — quando outras IAs caem

---

## 📌 STATUS ATUAL

| Item | Status |
|------|--------|
| Código Ollama | ✅ Pronto |
| .env Ollama | ✅ Configurado |
| Servidor Liz | ✅ Localizado |
| Modelo | ⏳ Precisa baixar |
| Ollama Rodando | ⏳ Precisa iniciar |
| Teste | ⏳ Depois de ativar |

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Faça login como **Administrador**
2. ✅ Abra **PowerShell como Admin**
3. ✅ Execute **`ollama list`** para verificar modelos
4. ✅ Se necessário, **`ollama pull qwen2.5:14b`**
5. ✅ Execute **`ollama serve`** (deixe rodando)
6. ✅ Teste com **`curl http://localhost:11434/v1/models`**
7. ✅ Reinicie Liz com **`pm2 restart wg-zap --update-env`**
8. ✅ Envie mensagem WhatsApp e veja Ollama responder!

---

**EventOS — Confidencial — WG build.tech × Grupo UMAUMA — Março 2026**

