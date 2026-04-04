const insights = [
  {
    id: 'intent',
    title: 'Palavras-chave de intenção transacional',
    value: '12 focadas',
    description: 'IA detectou termos de alto valor que ainda não aparecem nas 3 primeiras posições do Google.',
    trend: '+18% volume aguardando otimizacao',
  },
  {
    id: 'performance',
    title: 'Performance carregamento',
    value: '0.9s (média)',
    description: 'Sugestão IA: priorizar imagens WebP e reduzir scripts de terceiros críticos.',
    trend: 'Tempo estabilizado em -20% no último mês',
  },
  {
    id: 'authority',
    title: 'Links e reputação',
    value: '4 menções novas',
    description: 'Análise IA recomenda vincular a avaliações do Google Meu Negócio para reforçar confiança.',
    trend: 'Conversão +4% estimada',
  },
];

export const fetchSeoHighlights = async () => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return insights;
};
