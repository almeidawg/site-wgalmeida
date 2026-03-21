# 🤖 INTEGRAÇÃO OLLAMA DESKTOP × SERVIDOR EVENTOS

**Data:** 11 de Março de 2026
**Status:** ⏳ Aguardando setup como Administrador

---

## 📋 O Que Fazer

### ✅ PASSO 1: Execute como Administrador (OBRIGATÓRIO)

1. **Abra PowerShell como Administrador:**
   - Clique em Windows
   - Digite: `PowerShell`
   - Direita → "Executar como administrador"
   - Confirme com a senha: `130300@$Wg`

2. **Navegue para Desktop:**
   ```powershell
   cd Desktop
   ```

3. **Execute o script de setup:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   .\SETUP-OLLAMA-INTEGRACAO.ps1
   ```

4. **Aguarde a conclusão** (vai iniciar Ollama automaticamente)

---

### ✅ PASSO 2: Verificar Modelos Ollama

Depois que o script terminar, no PowerShell como Admin:

```powershell
# Listar modelos
ollama list

# Se não tiver nenhum, baixar Mistral (recomendado)
ollama pull mistral

# Ou outra opção:
ollama pull llama2
ollama pull neural-chat
```

---

### ✅ PASSO 3: Integração no Servidor EventOS

O arquivo `ollama-client.js` já está pronto em:
```
C:\Users\Atendimento\Documents\_WG_build.tech\Em-Desenvolvimento\20260310-Grupo_UmaUma\ollama-client.js
```

Para usar no servidor, crie um arquivo `/api/ollama.js`:

```javascript
const OllamaClient = require('../ollama-client.js');
const ollama = new OllamaClient('http://localhost:11434');

// Health check
app.get('/api/ollama/health', async (req, res) => {
  const health = await ollama.health();
  res.json(health);
});

// Chat com Ollama
app.post('/api/ollama/chat', async (req, res) => {
  const { model, message, context } = req.body;
  const response = await ollama.chat(model, message, context);
  res.json(response);
});

// Listar modelos
app.get('/api/ollama/models', async (req, res) => {
  try {
    const models = await ollama.getModels();
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔧 ARQUIVOS CRIADOS

| Arquivo | Descrição |
|---------|-----------|
| `SETUP-OLLAMA-INTEGRACAO.ps1` | Script de setup (EXECUTAR COMO ADMIN) |
| `ollama-client.js` | Cliente Node.js para Ollama |
| `OLLAMA-SETUP-GUIA.md` | Este arquivo |

---

## 📍 URLs de Teste

Depois que Ollama estiver rodando:

```bash
# Testar conexão
curl http://localhost:11434/api/tags

# Chat simples
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral",
    "messages": [{"role": "user", "content": "Oi!"}],
    "stream": false
  }'
```

---

## 🎯 CASOS DE USO

### 1. **Chat com Automações**
```javascript
const response = await ollama.chat('mistral',
  'Gere uma descrição de evento para Carnaval');
```

### 2. **Embeddings para Busca**
```javascript
const embedding = await ollama.embed('nomic-embed-text',
  'Carnaval na Cidade SP');
```

### 3. **Completion para Templates**
```javascript
const completion = await ollama.generate('mistral',
  'Preencha o template: Evento: [NOME], Data: [DATA], Orçamento: [ORC]');
```

---

## ⚠️ TROUBLESHOOTING

### Ollama não responde
```powershell
# Verificar se Ollama está rodando
Get-Process ollama

# Se não estiver, iniciar
& "C:\Users\Administrador\AppData\Local\Programs\Ollama\ollama.exe"
```

### Porta 11434 já em uso
```powershell
# Encontrar processo na porta
netstat -ano | findstr :11434

# Matar processo
taskkill /PID [PID] /F
```

### Modelo não encontrado
```powershell
ollama pull mistral
ollama pull llama2
ollama list
```

---

## 📊 MODELOS RECOMENDADOS

| Modelo | Tamanho | Velocidade | Qualidade | Caso de Uso |
|--------|---------|-----------|-----------|------------|
| **mistral** | 7B | ⚡⚡⚡ | ⭐⭐⭐ | Chat geral, rápido |
| **llama2** | 7B | ⚡⚡ | ⭐⭐⭐ | Chat, context-aware |
| **neural-chat** | 7B | ⚡⚡⚡ | ⭐⭐⭐⭐ | Chat especializado |
| **nomic-embed-text** | 274M | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Embeddings/Search |

---

## 📌 PRÓXIMAS ETAPAS

1. ✅ **Executar SETUP-OLLAMA-INTEGRACAO.ps1 como Admin**
2. ✅ **Baixar modelo com `ollama pull mistral`**
3. ✅ **Testar via curl/Postman**
4. ✅ **Integrar no servidor EventOS**
5. ✅ **Usar em automações/chat**

---

## 🎊 Quando Estiver Pronto

Avise que:
- ✅ Script executado como Administrador
- ✅ Ollama rodando (porta 11434)
- ✅ Modelo baixado
- ✅ Testado com curl

Então integrarei com o servidor EventOS! 🚀

---

**EventOS — Confidencial — WG build.tech × Grupo UMAUMA — Março 2026**

