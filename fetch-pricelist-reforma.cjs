const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma do site)
const supabaseUrl = 'https://ahlqzzkxuutwoepirpzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobHF6emt4dXV0d29lcGlycHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzEyNDMsImV4cCI6MjA3NjE0NzI0M30.gLz5lpB5YlQpTfxzJjmILZwGp_H_XsT81nM2vXDbs7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Busca valores da pricelist para o artigo "Quanto Custa Reformar Apartamento 2026"
 *
 * Categorias relevantes:
 * - Reforma de apartamento
 * - Serviços de construção
 * - Acabamentos
 * - Marcenaria
 */

async function fetchReformaPrices() {
  try {
    console.log('\n🔍 Buscando preços da pricelist no WG Easy...\n');

    // Buscar todos os itens ativos da pricelist
    const { data: itens, error } = await supabase
      .from('pricelist_itens')
      .select(`
        id,
        codigo,
        nome,
        descricao,
        preco,
        unidade,
        tipo,
        ativo,
        categoria:pricelist_categorias(
          id,
          nome
        )
      `)
      .eq('ativo', true)
      .eq('tipo', 'servico')
      .order('preco', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar itens:', error.message);
      return;
    }

    console.log(`✅ Encontrados ${itens.length} serviços ativos\n`);

    // Agrupar por categoria
    const categorias = {};
    itens.forEach(item => {
      const catNome = item.categoria?.nome || 'Sem Categoria';
      if (!categorias[catNome]) {
        categorias[catNome] = [];
      }
      categorias[catNome].push(item);
    });

    // Exibir resumo por categoria
    console.log('📊 RESUMO POR CATEGORIA:\n');
    Object.entries(categorias).forEach(([categoria, items]) => {
      const totalItens = items.length;
      const precoMin = Math.min(...items.map(i => i.preco));
      const precoMax = Math.max(...items.map(i => i.preco));
      const precoMedio = items.reduce((sum, i) => sum + i.preco, 0) / totalItens;

      console.log(`📁 ${categoria}`);
      console.log(`   Itens: ${totalItens}`);
      console.log(`   Preço mínimo: R$ ${precoMin.toFixed(2)}`);
      console.log(`   Preço máximo: R$ ${precoMax.toFixed(2)}`);
      console.log(`   Preço médio: R$ ${precoMedio.toFixed(2)}`);
      console.log('');
    });

    // Buscar itens relevantes para reforma
    const termosBusca = [
      'pintura',
      'gesso',
      'elétrica',
      'hidráulica',
      'piso',
      'revestimento',
      'marcenaria',
      'demolição',
      'alvenaria',
      'contrapiso',
      'acabamento'
    ];

    console.log('\n💰 SERVIÇOS RELEVANTES PARA REFORMA:\n');

    termosBusca.forEach(termo => {
      const itensRelevantes = itens.filter(item =>
        item.nome.toLowerCase().includes(termo) ||
        item.descricao?.toLowerCase().includes(termo)
      );

      if (itensRelevantes.length > 0) {
        console.log(`\n🔨 ${termo.toUpperCase()}`);
        itensRelevantes.slice(0, 5).forEach(item => {
          console.log(`   ${item.nome}`);
          console.log(`   R$ ${item.preco.toFixed(2)} / ${item.unidade}`);
          if (item.descricao) {
            console.log(`   ${item.descricao}`);
          }
          console.log('');
        });
      }
    });

    // Gerar tabela markdown para o blog
    console.log('\n\n📝 TABELA MARKDOWN PARA O BLOG:\n');
    console.log('```markdown');
    console.log('## Tabela de Preços - Reforma de Apartamento 2026\n');
    console.log('| Serviço | Preço | Unidade |');
    console.log('|---------|-------|---------|');

    // Selecionar os 20 serviços mais comuns em reformas
    const servicosComuns = itens
      .filter(item => {
        const nome = item.nome.toLowerCase();
        return termosBusca.some(termo =>
          nome.includes(termo) || item.descricao?.toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => a.preco - b.preco)
      .slice(0, 20);

    servicosComuns.forEach(item => {
      const preco = item.preco.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      console.log(`| ${item.nome} | ${preco} | ${item.unidade} |`);
    });

    console.log('```\n');

    // Calcular custo estimado por m² para diferentes tipos de reforma
    console.log('\n\n💵 ESTIMATIVA DE CUSTO POR M²:\n');

    const estimativas = [
      {
        tipo: 'Reforma Básica',
        descricao: 'Pintura, elétrica básica, hidráulica',
        fatorMin: 1500,
        fatorMax: 2500
      },
      {
        tipo: 'Reforma Intermediária',
        descricao: 'Inclui piso, revestimentos, marcenaria simples',
        fatorMin: 2500,
        fatorMax: 4000
      },
      {
        tipo: 'Reforma Completa',
        descricao: 'Inclui demolição, alvenaria, acabamentos premium',
        fatorMin: 4000,
        fatorMax: 6000
      },
      {
        tipo: 'Reforma Premium/Turn Key',
        descricao: 'Projeto completo, materiais de luxo, marcenaria sob medida',
        fatorMin: 6000,
        fatorMax: 10000
      }
    ];

    estimativas.forEach(est => {
      console.log(`📐 ${est.tipo}`);
      console.log(`   ${est.descricao}`);
      console.log(`   R$ ${est.fatorMin.toLocaleString('pt-BR')}/m² - R$ ${est.fatorMax.toLocaleString('pt-BR')}/m²`);
      console.log('');
    });

    // Exemplos práticos
    console.log('\n\n📊 EXEMPLOS PRÁTICOS:\n');

    const apartamentos = [
      { metragem: 50, tipo: 'Apartamento Compacto' },
      { metragem: 80, tipo: 'Apartamento 2 dormitórios' },
      { metragem: 120, tipo: 'Apartamento 3 dormitórios' },
      { metragem: 180, tipo: 'Apartamento Alto Padrão' }
    ];

    apartamentos.forEach(apt => {
      console.log(`🏠 ${apt.tipo} (${apt.metragem}m²)`);
      estimativas.forEach(est => {
        const min = apt.metragem * est.fatorMin;
        const max = apt.metragem * est.fatorMax;
        console.log(`   ${est.tipo}: R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
fetchReformaPrices();
