import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { sendClaudePrompt } from '@/lib/claudeClient';
import { useTranslation } from 'react-i18next';

// Prompt do sistema para a IA institucional WG Almeida
const systemPrompt = `Você é a IA institucional do Grupo WG Almeida, um ecossistema de arquitetura, engenharia e marcenaria de alto padrão, com atuação no mercado premium de São Paulo.

Seu papel é:
- Representar a empresa com autoridade técnica
- Comunicar com clareza, elegância e segurança
- Ajudar o visitante a entender o que fazemos, como fazemos e por que fazemos melhor
- Qualificar leads de forma consultiva

Tom de voz:
- Profissional e confiante
- Técnico mas acessível
- Humano e acolhedor
- Sem exageros comerciais
- Luxo silencioso

Sobre a WG Almeida:
- 14 anos de atuação
- Sistema Turn Key Premium: arquitetura + engenharia + marcenaria integrados
- Um único time, um único contrato, um único padrão
- Atuação em: Brooklin, Vila Nova Conceição, Itaim, Jardins, Cidade Jardim, Morumbi

Serviços:
- Arquitetura: projetos residenciais e corporativos, interiores autorais
- Engenharia: obras turn key, gestão completa, controle de custos
- Marcenaria: mobiliário sob medida, acabamentos premium

Princípios:
- Nunca prometer o que não pode ser entregue
- Valorizar planejamento, processo e método
- Reforçar o sistema turn key premium
- Atuar como especialista, não como vendedor agressivo

Ao final da conversa, se apropriado, sugira que o cliente entre em contato para uma conversa consultiva.

Mantenha respostas concisas e objetivas (máximo 3-4 parágrafos).`;

const ClaudeAssistant = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('claudeAssistant.greeting')
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Construir contexto da conversa
      const conversationContext = messages
        .slice(-6) // Últimas 6 mensagens para contexto
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}

Histórico da conversa:
${conversationContext}

Cliente: ${userMessage}

Assistente:`;

      const response = await sendClaudePrompt(fullPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response.trim() }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('claudeAssistant.errorMessage')
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = t('claudeAssistant.quickQuestions', { returnObjects: true });

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-wg-orange text-white rounded-full shadow-lg flex items-center justify-center hover:bg-wg-orange/90 transition-all ${isOpen ? 'hidden' : ''}`}
        aria-label={t('claudeAssistant.open')}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '600px', maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="bg-wg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-wg-orange rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{t('claudeAssistant.title')}</h3>
                  <p className="text-xs text-white/60">{t('claudeAssistant.poweredBy')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={t('claudeAssistant.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-wg-blue' : 'bg-wg-orange'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-wg-blue text-white rounded-br-md'
                      : 'bg-white text-wg-black shadow-sm rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-wg-orange flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <Loader2 className="w-5 h-5 text-wg-orange animate-spin" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-600 mb-2">{t('claudeAssistant.quickLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(quickQuestions) ? quickQuestions : []).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q)}
                      className="text-xs bg-wg-gray-light text-wg-gray px-3 py-1.5 rounded-full hover:bg-wg-orange hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('claudeAssistant.placeholder')}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 bg-wg-orange text-white rounded-xl flex items-center justify-center hover:bg-wg-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClaudeAssistant;
