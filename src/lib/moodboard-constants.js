// Constants and data for moodboard generator

export const PAGE_SIZES = {
  A4_PORTRAIT: { width: 210, height: 297, name: 'A4 Portrait' },
  A4_LANDSCAPE: { width: 297, height: 210, name: 'A4 Landscape' },
  LETTER_PORTRAIT: { width: 216, height: 279, name: 'Letter Portrait' },
  LETTER_LANDSCAPE: { width: 279, height: 216, name: 'Letter Landscape' },
  MOBILE_PORTRAIT: { width: 375, height: 667, name: 'Mobile Portrait' },
};

export const ENVIRONMENT_DATA = {
  'sala-estar-contemporaneo': {
    id: 'sala-estar-contemporaneo',
    title: 'Sala de Estar Contemporânea',
    description: 'Um espaço que mescla modernidade com conforto, utilizando linhas limpas e materiais atuais.',
    searchQuery: 'contemporary living room interior design'
  },
  'sala-estar-classico': {
    id: 'sala-estar-classico',
    title: 'Sala de Estar Clássica',
    description: 'Elegância atemporal com móveis tradicionais e acabamentos refinados.',
    searchQuery: 'classic living room interior design elegant'
  },
  'sala-estar-minimalista': {
    id: 'sala-estar-minimalista',
    title: 'Sala de Estar Minimalista',
    description: 'Simplicidade e funcionalidade, com foco no essencial e paleta neutra.',
    searchQuery: 'minimalist living room interior design clean'
  },
  'quarto-master': {
    id: 'quarto-master',
    title: 'Quarto Master',
    description: 'Suíte principal com design sofisticado e ambiente acolhedor.',
    searchQuery: 'master bedroom interior design luxury'
  },
  'quarto-moderno': {
    id: 'quarto-moderno',
    title: 'Quarto Moderno',
    description: 'Dormitório com elementos contemporâneos e soluções inovadoras.',
    searchQuery: 'modern bedroom interior design'
  },
  'quarto-infantil': {
    id: 'quarto-infantil',
    title: 'Quarto Infantil',
    description: 'Espaço lúdico e funcional, pensado para o desenvolvimento das crianças.',
    searchQuery: 'kids bedroom interior design playful'
  },
  'cozinha-gourmet': {
    id: 'cozinha-gourmet',
    title: 'Cozinha Gourmet',
    description: 'Espaço equipado para os amantes da culinária, com acabamentos premium.',
    searchQuery: 'gourmet kitchen interior design professional'
  },
  'cozinha-classica': {
    id: 'cozinha-classica',
    title: 'Cozinha Clássica',
    description: 'Design tradicional com marcenaria detalhada e charme atemporal.',
    searchQuery: 'classic kitchen interior design traditional'
  },
  'cozinha-industrial': {
    id: 'cozinha-industrial',
    title: 'Cozinha Industrial',
    description: 'Estética urbana com elementos metálicos e concreto aparente.',
    searchQuery: 'industrial kitchen interior design urban'
  },
  'banheiro-spa': {
    id: 'banheiro-spa',
    title: 'Banheiro Spa',
    description: 'Ambiente relaxante inspirado em spas de luxo.',
    searchQuery: 'spa bathroom interior design luxury relaxing'
  },
  'banheiro-contemporaneo': {
    id: 'banheiro-contemporaneo',
    title: 'Banheiro Contemporâneo',
    description: 'Design moderno com acabamentos sofisticados e funcionalidade.',
    searchQuery: 'contemporary bathroom interior design modern'
  },
  'lavabo-statement': {
    id: 'lavabo-statement',
    title: 'Lavabo Statement',
    description: 'Espaço de impacto com elementos marcantes e design ousado.',
    searchQuery: 'powder room statement interior design bold'
  },
  'area-gourmet': {
    id: 'area-gourmet',
    title: 'Área Gourmet',
    description: 'Espaço externo equipado para entretenimento e gastronomia.',
    searchQuery: 'outdoor kitchen area gourmet entertaining'
  },
  'varanda-gourmet': {
    id: 'varanda-gourmet',
    title: 'Varanda Gourmet',
    description: 'Varanda integrada com área de preparo e convívio.',
    searchQuery: 'gourmet balcony outdoor entertaining space'
  },
  'piscina-resort': {
    id: 'piscina-resort',
    title: 'Piscina Resort',
    description: 'Área de lazer com conceito de resort e paisagismo integrado.',
    searchQuery: 'resort style pool luxury outdoor'
  },
  'home-office': {
    id: 'home-office',
    title: 'Home Office',
    description: 'Escritório residencial produtivo e inspirador.',
    searchQuery: 'home office interior design productive workspace'
  },
  'walk-in-closet': {
    id: 'walk-in-closet',
    title: 'Walk-in Closet',
    description: 'Closet amplo e organizado com iluminação especial.',
    searchQuery: 'walk in closet luxury organized wardrobe'
  },
  'hall-entrada': {
    id: 'hall-entrada',
    title: 'Hall de Entrada',
    description: 'Primeiro impacto da casa com design acolhedor e elegante.',
    searchQuery: 'entrance hall foyer interior design elegant'
  }
};

export const MATERIAL_DATA = {
  'marcenaria-detalhes': {
    id: 'marcenaria-detalhes',
    title: 'Marcenaria e Detalhes',
    description: 'Ferragens, puxadores e detalhes que fazem a diferença no acabamento.',
    searchQuery: 'cabinet hardware details brass handles'
  },
  'paineis-madeira': {
    id: 'paineis-madeira',
    title: 'Painéis de Madeira',
    description: 'Revestimentos em madeira que trazem aconchego e sofisticação.',
    searchQuery: 'wood panel wall cladding interior'
  },
  'paleta-pedras': {
    id: 'paleta-pedras',
    title: 'Paleta de Pedras',
    description: 'Mármores, granitos e quartzitos selecionados.',
    searchQuery: 'marble granite stone texture luxury'
  },
  'materiais-metalicos': {
    id: 'materiais-metalicos',
    title: 'Materiais Metálicos',
    description: 'Acabamentos em dourado, rose gold, inox escovado e preto fosco.',
    searchQuery: 'metal finish gold brass black matte'
  },
  'tecidos': {
    id: 'tecidos',
    title: 'Tecidos',
    description: 'Seleção de tecidos para estofados, cortinas e almofadas.',
    searchQuery: 'fabric texture upholstery linen velvet'
  },
  'paleta-neutra': {
    id: 'paleta-neutra',
    title: 'Paleta Neutra',
    description: 'Tons de branco, bege, cinza e nude para ambientes atemporais.',
    searchQuery: 'neutral color palette beige grey white'
  },
  'paleta-terrosa': {
    id: 'paleta-terrosa',
    title: 'Paleta Terrosa',
    description: 'Cores quentes inspiradas na natureza: terracota, caramelo e marrom.',
    searchQuery: 'earth tone palette terracotta brown warm'
  },
  'paleta-fria': {
    id: 'paleta-fria',
    title: 'Paleta Fria',
    description: 'Tons de azul, verde e cinza para ambientes serenos.',
    searchQuery: 'cool color palette blue green grey serene'
  },
  'conceito-geral': {
    id: 'conceito-geral',
    title: 'Conceito Geral',
    description: 'Visão geral do projeto com elementos-chave do design.',
    searchQuery: 'interior design concept mood inspiration'
  }
};
