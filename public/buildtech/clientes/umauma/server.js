/**
 * SERVIDOR EXPRESS — EventOS + Ollama Integration
 * Substitui http-server com suporte a Ollama
 *
 * Uso: node server.js
 * Porta: 8000
 */

const express = require('express');
const path = require('path');
const http = require('http');
const OllamaClient = require('./ollama-client.js');

const app = express();
const PORT = 8000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Inicializar cliente Ollama
const ollama = new OllamaClient('http://localhost:11434', 60000);

// ====================================
// ROTAS DE SAÚDE
// ====================================

/**
 * Health check geral
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'EventOS',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check Ollama
 */
app.get('/api/ollama/health', async (req, res) => {
  try {
    const health = await ollama.health();
    res.json({
      status: health.status,
      connected: health.connected,
      ollama_url: 'http://localhost:11434',
      error: health.error || null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      connected: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS OLLAMA — CHAT
// ====================================

/**
 * POST /api/ollama/chat
 * Body: { model, message, context? }
 */
app.post('/api/ollama/chat', async (req, res) => {
  try {
    const { model = 'mistral', message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Campo "message" é obrigatório'
      });
    }

    console.log(`[Ollama Chat] Model: ${model}, Message: ${message.substring(0, 50)}...`);

    const response = await ollama.chat(model, message, context);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: response.error
      });
    }

    res.json({
      success: true,
      model: response.model,
      message: response.message,
      context: response.context,
      response_time: response.response_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS OLLAMA — MODELOS
// ====================================

/**
 * GET /api/ollama/models
 * Lista modelos disponíveis
 */
app.get('/api/ollama/models', async (req, res) => {
  try {
    console.log('[Ollama Models] Listando modelos...');
    const models = await ollama.getModels();

    res.json({
      success: true,
      count: models.length,
      models: models.map(m => ({
        name: m.name,
        size: m.size,
        modified_at: m.modified_at,
        digest: m.digest
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ollama/pull
 * Baixar modelo
 * Body: { model }
 */
app.post('/api/ollama/pull', async (req, res) => {
  try {
    const { model } = req.body;

    if (!model) {
      return res.status(400).json({
        error: 'Campo "model" é obrigatório'
      });
    }

    console.log(`[Ollama Pull] Baixando modelo: ${model}...`);

    const response = await ollama.pull(model);

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS OLLAMA — EMBEDDINGS
// ====================================

/**
 * POST /api/ollama/embed
 * Gerar embeddings
 * Body: { model, text }
 */
app.post('/api/ollama/embed', async (req, res) => {
  try {
    const { model = 'nomic-embed-text', text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Campo "text" é obrigatório'
      });
    }

    console.log(`[Ollama Embed] Model: ${model}, Text: ${text.substring(0, 50)}...`);

    const response = await ollama.embed(model, text);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: response.error
      });
    }

    res.json({
      success: true,
      model: response.model,
      embedding: response.embedding,
      embedding_size: response.embedding.length,
      response_time: response.response_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS OLLAMA — GENERATION
// ====================================

/**
 * POST /api/ollama/generate
 * Gerar completion
 * Body: { model, prompt }
 */
app.post('/api/ollama/generate', async (req, res) => {
  try {
    const { model = 'mistral', prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Campo "prompt" é obrigatório'
      });
    }

    console.log(`[Ollama Generate] Model: ${model}, Prompt: ${prompt.substring(0, 50)}...`);

    const response = await ollama.generate(model, prompt);

    if (!response.success) {
      return res.status(500).json({
        success: false,
        error: response.error
      });
    }

    res.json({
      success: true,
      model: response.model,
      response: response.response,
      response_time: response.response_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS UTILITÁRIAS — AUTOMAÇÕES
// ====================================

/**
 * POST /api/automacao/descrever-evento
 * Gera descrição de evento com Ollama
 * Body: { nome_evento, tipo, data, local }
 */
app.post('/api/automacao/descrever-evento', async (req, res) => {
  try {
    const { nome_evento, tipo, data, local } = req.body;

    const prompt = `Gere uma descrição profissional e atraente para um evento com os seguintes dados:
- Nome: ${nome_evento}
- Tipo: ${tipo}
- Data: ${data}
- Local: ${local}

A descrição deve ter 2-3 parágrafos, ser criativa e captar a essência do evento.`;

    const response = await ollama.generate('mistral', prompt);

    res.json({
      success: true,
      evento: nome_evento,
      descricao: response.response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/automacao/gerar-checklist
 * Gera checklist de tarefas com Ollama
 * Body: { tipo_evento, equipe_size }
 */
app.post('/api/automacao/gerar-checklist', async (req, res) => {
  try {
    const { tipo_evento = 'Evento', equipe_size = 5 } = req.body;

    const prompt = `Gere um checklist de tarefas para organizar um ${tipo_evento} com uma equipe de ${equipe_size} pessoas.
Formato: lista numerada com 15-20 tarefas, do planejamento até execução.
Organize por fases (Planejamento, Preparação, Execução, Pós-evento).`;

    const response = await ollama.generate('mistral', prompt);

    res.json({
      success: true,
      tipo_evento,
      checklist: response.response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ====================================
// ROTAS ESTÁTICAS (HTML/CSS/JS)
// ====================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/01-Pitch/EventOS-Pitch.html', (req, res) => {
  res.sendFile(path.join(__dirname, '01-Pitch', 'EventOS-Pitch.html'));
});

app.get('/02-Analise-Requisitos/Analise-Requisitos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '02-Analise-Requisitos', 'Analise-Requisitos.html'));
});

app.get('/03-Demo-Produto/EventOS-Demo.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03-Demo-Produto', 'EventOS-Demo.html'));
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
});

// ====================================
// INICIAR SERVIDOR
// ====================================

const server = http.createServer(app);

server.listen(PORT, async () => {
  console.log(`\n╔════════════════════════════════════════════════╗`);
  console.log(`║ 🚀 EventOS Server com Ollama Integration      ║`);
  console.log(`╚════════════════════════════════════════════════╝\n`);

  console.log(`📍 Servidor rodando: http://localhost:${PORT}`);
  console.log(`🌐 Túnel público: https://arbitration-karma-headline-bibliography.trycloudflare.com\n`);

  // Testar Ollama
  console.log(`⏳ Testando conexão com Ollama...\n`);
  const health = await ollama.health();

  if (health.connected) {
    console.log(`✅ Ollama conectado na porta 11434\n`);

    // Listar modelos
    try {
      const models = await ollama.getModels();
      console.log(`📦 Modelos disponíveis: ${models.length}`);
      models.forEach(m => console.log(`   • ${m.name}`));
    } catch (e) {
      console.log(`⚠️ Erro ao listar modelos: ${e.message}`);
    }
  } else {
    console.log(`⚠️ ATENÇÃO: Ollama NÃO está respondendo`);
    console.log(`   Inicie Ollama como Administrador\n`);
  }

  console.log(`\n📌 Rotas disponíveis:\n`);
  console.log(`   GET  /api/health                    - Status do servidor`);
  console.log(`   GET  /api/ollama/health             - Status do Ollama`);
  console.log(`   GET  /api/ollama/models             - Listar modelos`);
  console.log(`   POST /api/ollama/chat               - Chat com IA`);
  console.log(`   POST /api/ollama/embed              - Embeddings`);
  console.log(`   POST /api/ollama/generate           - Generation`);
  console.log(`   POST /api/automacao/descrever-evento`);
  console.log(`   POST /api/automacao/gerar-checklist\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Servidor encerrado');
  process.exit(0);
});
