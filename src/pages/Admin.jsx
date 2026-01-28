import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, FileText, TrendingUp, Send, Loader2, Copy, Check,
  BarChart3, Target, Lightbulb, Globe, RefreshCw
} from 'lucide-react';
import { sendClaudePrompt } from '@/lib/claudeClient';
import { useTranslation } from 'react-i18next';

// Contexto da empresa para a IA
const WG_CONTEXT = `
CONTEXTO DA EMPRESA - GRUPO WG ALMEIDA:

SOBRE:
- Empresa com 14 anos de atuação em São Paulo
- Ecossistema integrado: Arquitetura + Engenharia + Marcenaria
- Sistema Turn Key Premium: um time, um contrato, um padrão
- Segmento: Alto padrão residencial e corporativo

REGIÕES DE ATUAÇÃO:
- Brooklin, Vila Nova Conceição, Itaim Bibi, Jardins, Cidade Jardim, Morumbi

DIFERENCIAIS:
- Projetos autorais com viabilidade técnica
- Execução com precisão e controle total
- Mobiliário premium integrado ao projeto
- Do conceito à entrega sob um único padrão

TOM DE VOZ:
- Profissional e confiante
- Técnico mas acessível
- Luxo silencioso (sem exageros)
- Autoridade sem arrogância

PALAVRAS-CHAVE PRINCIPAIS:
- arquitetura alto padrão são paulo
- reforma apartamento alto padrão
- engenharia residencial premium
- marcenaria sob medida sp
- projeto turn key
- arquiteto brooklin / itaim / jardins

CONCORRENTES:
- Escritórios de arquitetura boutique
- Construtoras de alto padrão
- Marcenarias premium
`;

const Admin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('seo');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // SEO Analyzer State
  const [seoUrl, setSeoUrl] = useState('');
  const [seoAnalysis, setSeoAnalysis] = useState('');

  // Content Generator State
  const [contentType, setContentType] = useState('pagina');
  const [contentTopic, setContentTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  // Strategic Consultant State
  const [question, setQuestion] = useState('');
  const [consultantResponse, setConsultantResponse] = useState('');

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SEO Analysis
  const analyzeSEO = async () => {
    if (!seoUrl.trim()) return;
    setIsLoading(true);
    setSeoAnalysis('');

    try {
      const prompt = `${WG_CONTEXT}

TAREFA: Analise a página/seção "${seoUrl}" do site da WG Almeida e forneça recomendações de SEO.

Por favor, analise e sugira melhorias para:

1. **META TAGS RECOMENDADAS**
   - Title tag otimizado (máx 60 caracteres)
   - Meta description (máx 155 caracteres)
   - Keywords principais

2. **ESTRUTURA DE CONTEÚDO**
   - Heading hierarchy (H1, H2, H3)
   - Densidade de palavras-chave ideal
   - Estrutura de parágrafos

3. **OPORTUNIDADES DE PALAVRAS-CHAVE**
   - Keywords de cauda longa para ranquear
   - Termos relacionados a incluir
   - Perguntas frequentes do público

4. **MELHORIAS TÉCNICAS**
   - Schema markup recomendado
   - Links internos sugeridos
   - CTAs otimizados

5. **SCORE ESTIMADO E PRIORIDADES**
   - O que fazer primeiro
   - Impacto esperado

Formate de forma clara e acionável.`;

      const response = await sendClaudePrompt(prompt, 0.7);
      setSeoAnalysis(response);
    } catch (error) {
      setSeoAnalysis(t('adminPage.seo.error', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  // Content Generation
  const generateContent = async () => {
    if (!contentTopic.trim()) return;
    setIsLoading(true);
    setGeneratedContent('');

    try {
      const prompt = `${WG_CONTEXT}

TAREFA: Crie conteúdo otimizado para SEO.

TIPO: ${contentTypeLabels[contentType]}
TEMA: ${contentTopic}

DIRETRIZES:
- Use o tom de voz da WG Almeida (profissional, confiante, luxo silencioso)
- Inclua palavras-chave naturalmente
- Foque em benefícios, não apenas features
- Seja persuasivo mas não apelativo
- Mantenha o padrão premium da marca

ENTREGUE:
${contentType === 'pagina' ? `
1. Título H1 impactante
2. Subtítulo H2
3. 3-4 parágrafos de conteúdo
4. 3 bullet points de benefícios
5. CTA final` : ''}
${contentType === 'blog' ? `
1. Título otimizado para SEO
2. Introdução engajadora (2 parágrafos)
3. 3-5 subtítulos H2 com conteúdo
4. Conclusão com CTA
5. Meta description sugerida` : ''}
${contentType === 'descricao' ? `
1. Título do serviço
2. Descrição curta (2 linhas)
3. Descrição completa (3 parágrafos)
4. 5 diferenciais em bullet points
5. CTA` : ''}
${contentType === 'cta' ? `
1. 5 opções de headline principal
2. 5 opções de subtítulo
3. 5 opções de texto do botão
4. Sugestão de urgência/escassez ética` : ''}
${contentType === 'social' ? `
1. 3 versões para Instagram
2. 2 versões para LinkedIn
3. Hashtags relevantes
4. Sugestão de imagem/criativo` : ''}`;

      const response = await sendClaudePrompt(prompt, 0.8);
      setGeneratedContent(response);
    } catch (error) {
      setGeneratedContent(t('adminPage.content.error', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  // Strategic Consultant
  const askConsultant = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setConsultantResponse('');

    try {
      const prompt = `${WG_CONTEXT}

Você é um consultor estratégico de marketing digital especializado em empresas de arquitetura e construção de alto padrão.

PERGUNTA DO CLIENTE (WG Almeida):
${question}

Responda como um consultor experiente:
- Seja direto e prático
- Dê exemplos específicos quando possível
- Considere o mercado de São Paulo
- Foque em ações que geram resultado
- Mencione tendências relevantes do setor
- Sugira métricas para acompanhar

Se a pergunta for sobre concorrência, analise o posicionamento.
Se for sobre conteúdo, sugira temas e formatos.
Se for sobre SEO, dê recomendações técnicas.
Se for sobre estratégia, apresente um plano de ação.`;

      const response = await sendClaudePrompt(prompt, 0.7);
      setConsultantResponse(response);
    } catch (error) {
      setConsultantResponse(t('adminPage.consultant.error', { message: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'seo', label: t('adminPage.tabs.seo'), icon: Search },
    { id: 'content', label: t('adminPage.tabs.content'), icon: FileText },
    { id: 'consultant', label: t('adminPage.tabs.consultant'), icon: TrendingUp },
  ];

  const contentTypeLabels = {
    pagina: t('adminPage.contentTypes.page'),
    blog: t('adminPage.contentTypes.blog'),
    descricao: t('adminPage.contentTypes.description'),
    cta: t('adminPage.contentTypes.cta'),
    social: t('adminPage.contentTypes.social'),
  };

  const quickQuestions = t('adminPage.quickQuestions', { returnObjects: true });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-wg-orange rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-wg-black">{t('adminPage.title')}</h1>
              <p className="text-sm text-gray-500">{t('adminPage.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-wg-orange text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          {/* SEO Analyzer */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <BarChart3 className="w-6 h-6 text-wg-orange" />
                <div>
                  <h2 className="text-lg font-semibold">{t('adminPage.seo.title')}</h2>
                  <p className="text-sm text-gray-500">{t('adminPage.seo.subtitle')}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={seoUrl}
                  onChange={(e) => setSeoUrl(e.target.value)}
                  placeholder={t('adminPage.seo.placeholder')}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                />
                <button
                  onClick={analyzeSEO}
                  disabled={isLoading || !seoUrl.trim()}
                  className="px-6 py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {t('adminPage.seo.analyze')}
                </button>
              </div>

              {seoAnalysis && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy(seoAnalysis)}
                    className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                  <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                    {seoAnalysis}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content Generator */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <FileText className="w-6 h-6 text-wg-orange" />
                <div>
                  <h2 className="text-lg font-semibold">{t('adminPage.content.title')}</h2>
                  <p className="text-sm text-gray-500">{t('adminPage.content.subtitle')}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('adminPage.content.typeLabel')}</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                  >
                    <option value="pagina">{t('adminPage.contentTypes.page')}</option>
                    <option value="blog">{t('adminPage.contentTypes.blog')}</option>
                    <option value="descricao">{t('adminPage.contentTypes.description')}</option>
                    <option value="cta">{t('adminPage.contentTypes.cta')}</option>
                    <option value="social">{t('adminPage.contentTypes.social')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('adminPage.content.topicLabel')}</label>
                  <input
                    type="text"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    placeholder={t('adminPage.content.topicPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30"
                  />
                </div>
              </div>

              <button
                onClick={generateContent}
                disabled={isLoading || !contentTopic.trim()}
                className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('adminPage.content.generate')}
              </button>

              {generatedContent && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy(generatedContent)}
                    className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                  <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                    {generatedContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strategic Consultant */}
          {activeTab === 'consultant' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <Target className="w-6 h-6 text-wg-orange" />
                <div>
                  <h2 className="text-lg font-semibold">{t('adminPage.consultant.title')}</h2>
                  <p className="text-sm text-gray-500">{t('adminPage.consultant.subtitle')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                {(Array.isArray(quickQuestions) ? quickQuestions : []).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuestion(q)}
                    className="text-xs text-left px-3 py-2 bg-gray-100 hover:bg-wg-orange/10 rounded-lg transition-colors text-gray-600 hover:text-wg-orange"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t('adminPage.consultant.placeholder')}
                  rows={3}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wg-orange/30 resize-none"
                />
              </div>

              <button
                onClick={askConsultant}
                disabled={isLoading || !question.trim()}
                className="w-full py-3 bg-wg-orange text-white rounded-xl hover:bg-wg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {t('adminPage.consultant.submit')}
              </button>

              {consultantResponse && (
                <div className="relative">
                  <button
                    onClick={() => handleCopy(consultantResponse)}
                    className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                  <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none whitespace-pre-wrap">
                    {consultantResponse}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <Globe className="w-4 h-4 inline mr-1" />
          {t('adminPage.footer')}
        </div>
      </div>
    </div>
  );
};

export default Admin;
