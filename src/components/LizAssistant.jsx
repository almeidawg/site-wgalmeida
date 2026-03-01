import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { Mic, MicOff, X, Phone, PhoneOff, MessageCircle, Send, Loader2 } from 'lucide-react';
import { createThread, sendMessageToLiz, synthesizeSpeech, transcribeAudio } from '@/lib/openaiClient';
import { useTranslation } from 'react-i18next';

/**
 * Liz Assistant - Assistente Virtual WG Almeida
 * Conectada ao Assistant treinado via OpenAI Assistants API
 * Com suporte a voz (Whisper + TTS)
 */
const LizAssistant = () => {
  const { t, i18n } = useTranslation();
  // Estados
  const [isOpen, setIsOpen] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [threadId, setThreadId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const callTimerRef = useRef(null);

  // Inicializar thread ao abrir
  useEffect(() => {
    if (isOpen && !threadId) {
      initThread();
    }
  }, [isOpen]);

  // Auto-scroll mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer da ligação
  useEffect(() => {
    if (isCallMode && callStartTime) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isCallMode, callStartTime]);

  // Inicializar thread
  const initThread = async () => {
    try {
      const id = await createThread();
      setThreadId(id);
      logEvent('thread_created', { threadId: id });
    } catch (error) {
      console.error('Erro ao criar thread:', error);
    }
  };

  // Log de eventos (silenciado em produção)
  const logEvent = (event, data = {}) => {
    // Log desativado para produção
    // Habilitar apenas em desenvolvimento se necessário
  };

  // Formatar duração
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enviar mensagem de texto
  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      const response = await sendMessageToLiz(currentThreadId, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      logEvent('message_sent', { userMessage, response: response.substring(0, 100) });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('lizAssistant.errors.sendFailed')
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      logEvent('recording_started');
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert(t('lizAssistant.errors.microphone'));
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      logEvent('recording_stopped');
    }
  };

  // Processar áudio gravado
  const processAudio = async (audioBlob) => {
    setIsProcessing(true);

    try {
      // Transcrever com Whisper
      const transcription = await transcribeAudio(audioBlob);

      if (!transcription) {
        throw new Error(t('lizAssistant.errors.transcription'));
      }

      // Adicionar mensagem do usuário
      setMessages(prev => [...prev, { role: 'user', content: transcription }]);

      // Enviar para Liz
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      const response = await sendMessageToLiz(currentThreadId, transcription);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Sintetizar resposta em voz
      if (isCallMode) {
        await speakResponse(response);
      }

      logEvent('voice_interaction', {
        transcription,
        response: response.substring(0, 100)
      });
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      const errorMessage = t('lizAssistant.errors.audioProcessing');
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);

      if (isCallMode) {
        await speakResponse(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Falar resposta
  const speakResponse = async (text) => {
    setIsSpeaking(true);

    try {
      const audioUrl = await synthesizeSpeech(text);

      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          // Auto-escutar novamente no modo ligação
          if (isCallMode) {
            setTimeout(() => startRecording(), 500);
          }
        };
        await audioRef.current.play();
      } else {
        // Fallback para Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        const speechLocale = {
          'pt-BR': 'pt-BR',
          en: 'en-US',
          es: 'es-ES',
        }[i18n.language] || 'pt-BR';
        utterance.lang = speechLocale;
        utterance.rate = 1.0;
        utterance.onend = () => {
          setIsSpeaking(false);
          if (isCallMode) {
            setTimeout(() => startRecording(), 500);
          }
        };
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Erro ao sintetizar voz:', error);
      setIsSpeaking(false);
    }
  };

  // Iniciar ligação
  const startCall = async () => {
    setIsCallMode(true);
    setCallStartTime(Date.now());
    setCallDuration(0);
    logEvent('call_started');

    // Mensagem inicial da Liz
    const greeting = t('lizAssistant.greeting');
    setMessages(prev => [...prev, { role: 'assistant', content: greeting }]);
    await speakResponse(greeting);
  };

  // Encerrar ligação
  const endCall = () => {
    stopRecording();
    setIsCallMode(false);
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    logEvent('call_ended', { duration: callDuration });
    setCallStartTime(null);
  };

  // Avatar da Liz
  const LizAvatar = ({ size = 'md', speaking = false }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-12 h-12 text-lg',
      lg: 'w-20 h-20 text-2xl',
    };

    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div className={`${sizeClasses[size].split(' ').slice(0, 2).join(' ')} rounded-full bg-gradient-to-br from-wg-orange to-wg-orange/70 flex items-center justify-center text-white font-semibold ${speaking ? 'animate-pulse' : ''}`}>
          <span>L</span>
        </div>
        {speaking && (
          <div className="absolute inset-0 rounded-full border-2 border-wg-orange animate-ping opacity-50" />
        )}
      </div>
    );
  };

  // Ondas de voz
  const VoiceWaves = () => (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            height: isListening || isSpeaking ? [8, 24, 8] : 8,
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          className="w-1 bg-wg-orange rounded-full"
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Áudio player oculto */}
      <audio ref={audioRef} className="hidden" />

      {/* Botão flutuante discreto */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-wg-orange text-white px-5 py-3 rounded-full shadow-lg hover:bg-wg-orange/90 transition-all"
          >
            <div className="relative">
              <Mic className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{t('lizAssistant.ctaTitle')}</div>
              <div className="text-xs opacity-80">{t('lizAssistant.ctaSubtitle')}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal principal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-wg-orange to-wg-orange/80 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LizAvatar size="md" speaking={isSpeaking} />
                  <div>
                    <h3 className="font-semibold">Liz</h3>
                    <p className="text-xs opacity-90">
                      {isCallMode
                        ? t('lizAssistant.calling', { duration: formatDuration(callDuration) })
                        : t('lizAssistant.role')
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isCallMode ? (
                    <button
                      onClick={startCall}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                      title={t('lizAssistant.startCall')}
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={endCall}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      title={t('lizAssistant.endCall')}
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isCallMode) endCall();
                      setIsOpen(false);
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modo ligação */}
            {isCallMode ? (
              <div className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-b from-gray-50 to-white">
                <LizAvatar size="lg" speaking={isSpeaking} />

                <div className="mt-6 text-center">
                  <p className="text-lg font-medium text-wg-black">
                    {isProcessing
                      ? t('lizAssistant.callStatus.processing')
                      : isSpeaking
                        ? t('lizAssistant.callStatus.speaking')
                        : isListening
                          ? t('lizAssistant.callStatus.listening')
                          : t('lizAssistant.callStatus.tapToSpeak')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDuration(callDuration)}
                  </p>
                </div>

                <div className="mt-6">
                  <VoiceWaves />
                </div>

                <button
                  onClick={isListening ? stopRecording : startRecording}
                  disabled={isProcessing || isSpeaking}
                  className={`mt-8 p-6 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : isProcessing || isSpeaking
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-wg-orange hover:bg-wg-orange/90'
                  } text-white shadow-lg`}
                >
                  {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <p className="mt-4 text-xs text-gray-600">
                  {isListening ? t('lizAssistant.callStatus.tapToStop') : t('lizAssistant.callStatus.tapToSpeak')}
                </p>
              </div>
            ) : (
              <>
                {/* Área de mensagens */}
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-600 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{t('lizAssistant.emptyState.title')}</p>
                      <p className="text-xs mt-1">{t('lizAssistant.emptyState.subtitle')}</p>
                    </div>
                  )}

                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {msg.role === 'assistant' && <LizAvatar size="sm" />}
                        <div className={`p-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-wg-orange text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2">
                        <LizAvatar size="sm" />
                        <div className="bg-white p-3 rounded-2xl rounded-bl-md shadow-sm">
                          <Loader2 className="w-5 h-5 text-wg-orange animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input de texto */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isListening ? stopRecording : startRecording}
                      disabled={isProcessing}
                      className={`p-3 rounded-full transition-all ${
                        isListening
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isListening ? t('lizAssistant.stopRecording') : t('lizAssistant.startRecording')}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t('lizAssistant.inputPlaceholder')}
                      disabled={isProcessing || isListening}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-wg-orange transition-colors text-sm"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isProcessing}
                      className="p-3 bg-wg-orange text-white rounded-full hover:bg-wg-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LizAssistant;
