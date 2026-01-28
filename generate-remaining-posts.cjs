const fs = require('fs');
const path = require('path');

const blogPosts = [
  {
    slug: "sustentabilidade-construcao-certificacoes",
    title: "Certificações de Sustentabilidade na Construção: LEED, AQUA e Casa Azul",
    excerpt: "Conheça as principais certificações sustentáveis para construções e como obtê-las",
    category: "Sustentabilidade",
    tags: ["sustentabilidade", "certificação", "LEED", "construção verde"]
  },
  {
    slug: "reforma-apartamento-pequeno-dicas",
    title: "10 Dicas Para Reformar Apartamento Pequeno e Ganhar Espaço",
    excerpt: "Soluções inteligentes para otimizar cada metro quadrado do seu apartamento compacto",
    category: "Reforma",
    tags: ["apartamento pequeno", "otimização", "reforma", "espaços compactos"]
  },
  {
    slug: "como-escolher-construtora-confiavel",
    title: "Como Escolher uma Construtora Confiável: 15 Pontos Essenciais",
    excerpt: "Checklist completo para contratar a construtora certa e evitar problemas",
    category: "Dicas",
    tags: ["construtora", "contratação", "dicas", "checklist"]
  },
  {
    slug: "piso-porcelanato-vs-ceramica-2026",
    title: "Porcelanato vs Cerâmica: Qual Escolher em 2026?",
    excerpt: "Comparação detalhada entre porcelanato e cerâmica: custos, durabilidade e aplicações",
    category: "Materiais",
    tags: ["porcelanato", "cerâmica", "piso", "revestimento"]
  },
  {
    slug: "iluminacao-residencial-guia-completo",
    title: "Iluminação Residencial: Guia Completo Para Cada Ambiente",
    excerpt: "Como planejar a iluminação perfeita para cada cômodo da casa",
    category: "Design",
    tags: ["iluminação", "design de interiores", "LED", "luminotécnica"]
  },
  {
    slug: "cores-pintura-casa-tendencias-2026",
    title: "Cores Para Pintar a Casa em 2026: Paleta Completa",
    excerpt: "Descubra as cores em alta para 2026 e como combiná-las nos ambientes",
    category: "Decoração",
    tags: ["cores", "pintura", "tendências", "paleta de cores"]
  },
  {
    slug: "closet-planejado-preco-dicas",
    title: "Closet Planejado: Preços, Tamanhos e Dicas de Organização",
    excerpt: "Tudo sobre closet planejado: quanto custa, medidas ideais e como organizar",
    category: "Marcenaria",
    tags: ["closet", "móveis planejados", "organização", "preços"]
  },
  {
    slug: "home-office-planejado-ergonomico",
    title: "Home Office Planejado: Ergonomia e Produtividade",
    excerpt: "Como criar um home office funcional, confortável e produtivo",
    category: "Marcenaria",
    tags: ["home office", "ergonomia", "produtividade", "trabalho remoto"]
  },
  {
    slug: "cozinha-americana-vantagens-desvantagens",
    title: "Cozinha Americana: Vale a Pena? Vantagens e Desvantagens",
    excerpt: "Análise completa sobre cozinha integrada: prós, contras e quando escolher",
    category: "Arquitetura",
    tags: ["cozinha americana", "integração", "layout", "reforma"]
  },
  {
    slug: "reforma-itaim-bibi-alto-padrao",
    title: "Reforma de Alto Padrão no Itaim Bibi: O Que Saber",
    excerpt: "Especificidades de reformar no Itaim: normas, custos e padrões do bairro",
    category: "Reforma Regional",
    tags: ["Itaim Bibi", "alto padrão", "reforma", "São Paulo"]
  },
  {
    slug: "reforma-jardins-valoriza-imovel",
    title: "Reforma nos Jardins: Como Valorizar Seu Imóvel",
    excerpt: "Reformas estratégicas que valorizam imóveis nos Jardins",
    category: "Reforma Regional",
    tags: ["Jardins", "valorização", "reforma", "investimento"]
  },
  {
    slug: "construtora-vila-nova-conceicao",
    title: "Construtora Especializada em Vila Nova Conceição",
    excerpt: "Por que contratar construtora especializada para obras na VNC",
    category: "Construção Regional",
    tags: ["Vila Nova Conceição", "construtora", "alto padrão", "expertise local"]
  },
  {
    slug: "marcenaria-morumbi-planejados",
    title: "Marcenaria Sob Medida no Morumbi: Elegância e Funcionalidade",
    excerpt: "Tendências de marcenaria planejada para residências no Morumbi",
    category: "Marcenaria Regional",
    tags: ["Morumbi", "marcenaria", "sob medida", "luxo"]
  },
  {
    slug: "arquitetura-corporativa-escritorios",
    title: "Arquitetura Corporativa: Tendências Para Escritórios 2026",
    excerpt: "Design de escritórios modernos: flexibilidade, bem-estar e produtividade",
    category: "Arquitetura Corporativa",
    tags: ["escritório", "corporativo", "design", "ambiente de trabalho"]
  },
  {
    slug: "obra-turn-key-vale-a-pena",
    title: "Obra Turn Key Vale a Pena? Vantagens e Custos",
    excerpt: "Entenda o sistema chave na mão e quando é a melhor escolha",
    category: "Construção",
    tags: ["turn key", "chave na mão", "construção", "reforma"]
  },
  {
    slug: "impermeabilizacao-quando-fazer",
    title: "Impermeabilização: Quando Fazer e Como Garantir Qualidade",
    excerpt: "Guia completo sobre impermeabilização: tipos, custos e cuidados essenciais",
    category: "Construção",
    tags: ["impermeabilização", "infiltração", "manutenção", "prevenção"]
  },
  {
    slug: "reforma-condominio-o-que-saber",
    title: "Reforma em Condomínio: Normas, Autorizações e Cuidados",
    excerpt: "O que você precisa saber antes de reformar em condomínio",
    category: "Reforma",
    tags: ["condomínio", "normas", "autorização", "convenção"]
  },
  {
    slug: "garantia-reforma-o-que-exigir",
    title: "Garantia de Reforma: O Que Exigir em Contrato",
    excerpt: "Direitos do consumidor e garantias essenciais em obras e reformas",
    category: "Dicas",
    tags: ["garantia", "contrato", "direitos", "proteção"]
  },
  {
    slug: "reforma-sustentavel-praticas",
    title: "Reforma Sustentável: 20 Práticas Ecológicas",
    excerpt: "Como fazer uma reforma ambientalmente responsável",
    category: "Sustentabilidade",
    tags: ["sustentabilidade", "reforma verde", "ecológico", "meio ambiente"]
  },
  {
    slug: "automacao-residencial-2026",
    title: "Automação Residencial em 2026: Smart Home Acessível",
    excerpt: "Tecnologias de automação que cabem no seu orçamento",
    category: "Tecnologia",
    tags: ["automação", "smart home", "tecnologia", "casa inteligente"]
  },
  {
    slug: "varanda-gourmet-tendencias",
    title: "Varanda Gourmet: Tendências e Custos 2026",
    excerpt: "Como criar uma varanda gourmet funcional e elegante",
    category: "Design",
    tags: ["varanda gourmet", "churrasqueira", "área externa", "lazer"]
  },
  {
    slug: "cronograma-reforma-como-fazer",
    title: "Cronograma de Reforma: Como Planejar Cada Etapa",
    excerpt: "Aprenda a criar um cronograma realista para sua reforma",
    category: "Planejamento",
    tags: ["cronograma", "planejamento", "organização", "prazos"]
  }
];

const dir = 'src/content/blog';

let count = 0;
blogPosts.forEach(post => {
  const fullPost = {
    ...post,
    date: "2026-01-25",
    author: "Grupo WG Almeida",
    image: `/images/blog/${post.slug}.jpg`,
    content: `# ${post.title}\n\n${post.excerpt}\n\n## Introdução\n\n[Conteúdo detalhado será expandido]\n\n## Principais Pontos\n\n- Informação relevante sobre o tema\n- Dicas práticas\n- Custos e investimentos\n- Tendências para 2026\n\n## Por Que Escolher o Grupo WG Almeida?\n\nSomos especialistas em ${post.category.toLowerCase()} com mais de 15 anos de experiência no mercado paulistano.\n\n✅ Equipe qualificada\n✅ Materiais de primeira linha\n✅ Garantia estendida\n✅ Atendimento personalizado\n✅ Projetos em BIM 3D\n\n**Solicite seu orçamento gratuito!**\n\nTelefone/WhatsApp: (11) 98465-0002\nE-mail: contato@wgalmeida.com.br`
  };

  const filename = path.join(dir, `${post.slug}.json`);
  fs.writeFileSync(filename, JSON.stringify(fullPost, null, 2));
  count++;
  console.log(`✅ ${count}. Criado: ${post.slug}`);
});

console.log(`\n🎉 Total: ${count} artigos criados com sucesso!`);
console.log(`📊 Total geral no blog: ${fs.readdirSync(dir).filter(f => f.endsWith('.json')).length} artigos`);
