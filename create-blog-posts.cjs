const fs = require('fs');
const path = require('path');

const blogPosts = [
  {
    slug: "reforma-cozinha-planejada-guia-completo",
    title: "Reforma de Cozinha Planejada: Guia Completo 2026",
    excerpt: "Tudo o que você precisa saber para reformar sua cozinha: custos, prazos, materiais e dicas práticas.",
    category: "Reforma",
    tags: ["cozinha", "reforma", "móveis planejados", "custos"],
    content: `# Reforma de Cozinha Planejada: Guia Completo 2026

A cozinha é um dos ambientes mais importantes da casa. Uma reforma bem planejada pode transformar completamente esse espaço e valorizar seu imóvel.

## Por Que Reformar a Cozinha?

- Valorização do imóvel (até 15%)
- Maior funcionalidade
- Economia de energia
- Modernização estética
- Melhor aproveitamento do espaço

## Etapas da Reforma

### 1. Planejamento (2-4 semanas)
- Definição do orçamento
- Escolha do estilo
- Projeto 3D
- Seleção de materiais
- Aprovação do condomínio

### 2. Demolição (3-5 dias)
- Remoção de móveis antigos
- Quebra de revestimentos
- Alterações hidráulicas e elétricas
- Descarte de entulho

### 3. Infraestrutura (1-2 semanas)
- Reforço estrutural se necessário
- Nova instalação elétrica
- Nova instalação hidráulica
- Pontos para eletrodomésticos
- Sistema de exaustão

### 4. Revestimentos (1-2 semanas)
- Piso novo
- Azulejos ou porcelanato
- Bancada (granito, quartzo, porcelanato)
- Acabamentos

### 5. Marcenaria (2-3 semanas)
- Instalação de armários
- Bancada planejada
- Ilha (se houver)
- Adega
- Despensa

### 6. Acabamentos Finais (1 semana)
- Instalação de eletrodomésticos
- Iluminação
- Metais (torneiras, cuba)
- Pintura de retoques
- Limpeza final

## Custos Detalhados

### Cozinha Básica (R$ 15.000 - R$ 25.000)
- Armários em MDP
- Bancada de granito nacional
- Piso cerâmico
- Azulejo simples
- Eletrodomésticos básicos

### Cozinha Intermediária (R$ 25.000 - R$ 50.000)
- Armários em MDF
- Bancada de quartzo
- Porcelanato
- Revestimento diferenciado
- Ilha pequena
- Eletrodomésticos de médio padrão

### Cozinha Alto Padrão (R$ 50.000 - R$ 120.000+)
- Marcenaria em laca ou madeira nobre
- Bancada de mármore ou quartzo importado
- Porcelanato grande formato
- Ilha completa com cooktop
- Adega climatizada
- Eletrodomésticos premium
- Iluminação inteligente

## Materiais para Bancada

### Granito
**Prós:** Resistente, durável, variedade de cores
**Contras:** Pode manchar, precisa impermeabilização
**Custo:** R$ 200-600/m²

### Quartzo
**Prós:** Não poroso, não mancha, alta resistência
**Contras:** Custo mais alto
**Custo:** R$ 600-1.500/m²

### Mármore
**Prós:** Beleza incomparável, elegância
**Contras:** Mancha fácil, manutenção constante
**Custo:** R$ 400-2.000/m²

### Porcelanato
**Prós:** Higiênico, variedade, bom custo-benefício
**Contras:** Emendas visíveis
**Custo:** R$ 150-500/m²

## Tendências 2026 para Cozinhas

✨ **Cozinhas Integradas**
Espaço aberto para sala, ilha como ponto focal

✨ **Cores Neutras com Pontos de Cor**
Armários claros com ilha colorida ou bancada marcante

✨ **Metais Pretos ou Dourados Foscos**
Torneiras e puxadores em acabamento matte

✨ **Iluminação Linear**
Fitas LED sob armários e nichos

✨ **Horta Integrada**
Espaço para temperos frescos

✨ **Tecnologia**
Torneiras touch, lixeiras com sensor, tomadas USB

## Erros Comuns a Evitar

❌ Não planejar a circulação (triângulo de trabalho)
❌ Esquecer tomadas suficientes
❌ Escolher materiais difíceis de limpar
❌ Não pensar na exaustão adequada
❌ Economizar em ferragens de qualidade
❌ Não considerar a ergonomia

## Dicas de Ouro

💡 **Triângulo de Trabalho**
Posicione pia, fogão e geladeira formando um triângulo eficiente

💡 **Iluminação Funcional**
Luz geral + luz de tarefa + luz de destaque

💡 **Armazenamento Inteligente**
Use cantos com gavetas mágicas, cestões, divisórias

💡 **Tomadas Estratégicas**
No mínimo 8 tomadas em posições variadas

💡 **Revestimentos Práticos**
Escolha materiais fáceis de limpar atrás do fogão

## Prazo Total

Reforma completa: **6 a 12 semanas**
- Planejamento: 2-4 semanas
- Execução: 4-8 semanas

## Grupo WG Almeida - Reforma de Cozinhas

✅ Projeto 3D incluído
✅ Prazo garantido em contrato
✅ Materiais de primeira linha
✅ Marcenaria própria
✅ Garantia de 5 anos
✅ Acompanhamento diário

**Solicite seu orçamento gratuito!**`
  },
  {
    slug: "reforma-banheiro-moderno-2026",
    title: "Reforma de Banheiro Moderno: Tendências e Custos 2026",
    excerpt: "Como planejar a reforma do banheiro com estilo spa, tecnologia e sustentabilidade.",
    category: "Reforma",
    tags: ["banheiro", "reforma", "spa", "sustentabilidade"],
    content: `# Reforma de Banheiro Moderno: Tendências e Custos 2026

O banheiro deixou de ser apenas funcional para se tornar um espaço de bem-estar e relaxamento. Veja como criar seu spa pessoal.

## Tendências 2026

### Conceito Spa
Transforme seu banheiro em refúgio de autocuidado.

**Elementos:**
- Banheira de imersão
- Chuveiro de chuva
- Iluminação relaxante
- Pedras naturais
- Plantas tropicais
- Aquecimento de piso
- Aromaterapia integrada

### Sustentabilidade
- Torneiras com arejador
- Descarga dual flush
- Chuveiro com temporizador
- Reúso de água cinza
- Iluminação LED
- Materiais reciclados

### Tecnologia
- Espelho com desembaçador
- Espelho com iluminação LED
- Vaso sanitário inteligente
- Chuveiro digital
- Música ambiente
- Controle por app

## Custos de Reforma

### Banheiro Básico (R$ 8.000 - R$ 15.000)
- Revestimento cerâmico
- Louças brancas padrão
- Metais cromados simples
- Box de vidro temperado
- Iluminação básica

### Banheiro Intermediário (R$ 15.000 - R$ 35.000)
- Porcelanato retificado
- Louças de design
- Metais com acabamento especial
- Nicho embutido
- Iluminação indireta
- Bancada de mármore ou quartzo

### Banheiro Alto Padrão (R$ 35.000 - R$ 80.000+)
- Mármore ou pedras nobres
- Louças premium (Deca, Roca)
- Metais importados
- Banheira de hidromassagem
- Chuveiro de chuva + ducha
- Aquecimento de piso
- Automação

## Materiais em Alta

### Revestimentos
- Porcelanato efeito mármore
- Pedras naturais
- Cimento queimado
- Pastilhas de vidro
- Madeira tratada

### Louças
- Brancas sempre clássicas
- Preto fosco moderno
- Cinza concreto
- Formas orgânicas

### Metais
- Preto fosco
- Dourado rosé
- Bronze envelhecido
- Inox escovado

## Tamanhos e Layouts

### Lavabo (2-3m²)
Essenciais: vaso e cuba
Opcional: espelho grande, revestimento de destaque

### Banheiro Social (4-6m²)
Essenciais: vaso, chuveiro, cuba
Layout: linear ou em L

### Suíte (6-10m²)
Essenciais: vaso, chuveiro, cuba dupla
Opcional: banheira, closet integrado

### Suíte Máster (10-20m²)
Completo: duplo de tudo, banheira, closet, área de maquiagem

## Passo a Passo da Reforma

### 1. Planejamento
- Definir layout
- Escolher materiais
- Orçamento detalhado
- Projeto 3D

### 2. Demolição (2-3 dias)
- Remoção de louças
- Quebra de revestimentos
- Ponto de descarte

### 3. Infraestrutura (5-7 dias)
- Impermeabilização
- Instalação hidráulica
- Instalação elétrica
- Pontos de iluminação

### 4. Revestimentos (7-10 dias)
- Contrapiso
- Piso
- Azulejos/porcelanato
- Rejuntamento

### 5. Instalações (3-5 dias)
- Louças
- Metais
- Box
- Bancada
- Espelhos

### 6. Acabamentos (2-3 dias)
- Iluminação
- Acessórios
- Pintura
- Limpeza

**Prazo total: 3 a 5 semanas**

## Erros Comuns

❌ Esquecer impermeabilização adequada
❌ Não planejar ventilação
❌ Escolher materiais escorregadios para piso
❌ Economizar em materiais hidráulicos
❌ Não testar pressão da água

## Dicas Importantes

✅ Use piso antiderrapante
✅ Planeje iluminação em camadas
✅ Invista em boa ventilação
✅ Preveja tomadas suficientes
✅ Escolha materiais fáceis de limpar
✅ Teste todo instalação antes do acabamento

## Banheiros Pequenos

Soluções para aproveitar cada centímetro:

- Cuba de sobrepor com gabinete
- Vaso sanitário suspenso
- Box com porta de correr
- Espelho grande
- Nicho no box
- Prateleiras suspensas
- Cores claras

## Acessibilidade

Pense no futuro:

- Barras de apoio
- Piso antiderrapante
- Banco no box
- Torneiras monocomando
- Iluminação adequada
- Espaço para manobra

## Grupo WG Almeida - Reforma de Banheiros

Nossa especialidade:

✅ Impermeabilização com garantia
✅ Materiais de primeira linha
✅ Instalação hidráulica certificada
✅ Projeto 3D realista
✅ Prazo cumprido
✅ Garantia de 5 anos

**Transforme seu banheiro em spa!**`
  },

  // Continue criando mais 24 posts...
];

// Função para criar os arquivos
const dir = 'src/content/blog';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

blogPosts.forEach(post => {
  const fullPost = {
    ...post,
    date: "2026-01-25",
    author: "Grupo WG Almeida",
    image: `/images/blog/${post.slug}.jpg`
  };

  const filename = path.join(dir, `${post.slug}.json`);
  fs.writeFileSync(filename, JSON.stringify(fullPost, null, 2));
  console.log(`✅ Criado: ${post.slug}`);
});

console.log(`\n🎉 ${blogPosts.length} artigos criados com sucesso!`);
