/**
 * CLIENTE OLLAMA PARA SERVIDOR EVENTOSPYTHON
 * Integração com Ollama Desktop via API HTTP
 *
 * Uso:
 * const Ollama = require('./ollama-client.js');
 * const ollama = new Ollama('http://localhost:11434');
 * const response = await ollama.chat('mistral', 'Olá!');
 */

const http = require('http');

class OllamaClient {
  constructor(baseUrl = 'http://localhost:11434', timeout = 60000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.connected = false;
  }

  /**
   * Verificar conexão com Ollama
   */
  async health() {
    try {
      const response = await this._request(`${this.baseUrl}/api/tags`, 'GET');
      this.connected = true;
      return { status: 'ok', connected: true };
    } catch (error) {
      this.connected = false;
      return { status: 'error', connected: false, error: error.message };
    }
  }

  /**
   * Obter lista de modelos disponíveis
   */
  async getModels() {
    if (!this.connected) await this.health();

    try {
      const data = await this._request(`${this.baseUrl}/api/tags`, 'GET');
      return data.models || [];
    } catch (error) {
      throw new Error(`Erro ao obter modelos: ${error.message}`);
    }
  }

  /**
   * Chat com Ollama
   * @param {string} model - Nome do modelo (ex: 'mistral', 'llama2')
   * @param {string} message - Mensagem do usuário
   * @param {Array} context - Context anterior (opcional)
   */
  async chat(model, message, context = null) {
    if (!this.connected) await this.health();

    const payload = {
      model: model,
      messages: [
        { role: 'user', content: message }
      ],
      stream: false
    };

    if (context) {
      payload.context = context;
    }

    try {
      const response = await this._request(
        `${this.baseUrl}/api/chat`,
        'POST',
        payload
      );
      return {
        success: true,
        model: model,
        message: response.message?.content || '',
        context: response.context || null,
        response_time: response.eval_duration ? (response.eval_duration / 1e9).toFixed(2) : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar embeddings
   * @param {string} model - Nome do modelo de embedding
   * @param {string} text - Texto para embedding
   */
  async embed(model, text) {
    if (!this.connected) await this.health();

    const payload = {
      model: model,
      prompt: text
    };

    try {
      const response = await this._request(
        `${this.baseUrl}/api/embeddings`,
        'POST',
        payload
      );
      return {
        success: true,
        model: model,
        embedding: response.embedding || [],
        response_time: response.eval_duration ? (response.eval_duration / 1e9).toFixed(2) : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gerar completion
   * @param {string} model - Nome do modelo
   * @param {string} prompt - Prompt para completion
   */
  async generate(model, prompt) {
    if (!this.connected) await this.health();

    const payload = {
      model: model,
      prompt: prompt,
      stream: false
    };

    try {
      const response = await this._request(
        `${this.baseUrl}/api/generate`,
        'POST',
        payload
      );
      return {
        success: true,
        model: model,
        response: response.response || '',
        response_time: response.eval_duration ? (response.eval_duration / 1e9).toFixed(2) : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Pull (baixar) um modelo
   * @param {string} model - Nome do modelo a baixar
   */
  async pull(model) {
    if (!this.connected) await this.health();

    const payload = {
      name: model
    };

    try {
      const response = await this._request(
        `${this.baseUrl}/api/pull`,
        'POST',
        payload
      );
      return {
        success: true,
        model: model,
        message: 'Modelo baixado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Request HTTP genérico
   * @private
   */
  async _request(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 11434,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const parsed = responseData ? JSON.parse(responseData) : {};
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Erro ao parsear resposta: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Erro de conexão: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout após ${this.timeout}ms`));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }
}

module.exports = OllamaClient;
