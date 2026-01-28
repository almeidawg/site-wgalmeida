const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahlqzzkxuutwoepirpzr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobHF6emt4dXV0d29lcGlycHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzEyNDMsImV4cCI6MjA3NjE0NzI0M30.gLz5lpB5YlQpTfxzJjmILZwGp_H_XsT81nM2vXDbs7Y';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function explorePricelist() {
  try {
    console.log('\n🔍 EXPLORANDO PRICELIST...\n');

    // Buscar TODOS os itens
    const { data: todosItens, error } = await supabase
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
        categoria:pricelist_categorias(nome)
      `)
      .limit(100);

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log(`✅ Total de itens encontrados: ${todosItens.length}\n`);

    if (todosItens.length === 0) {
      console.log('⚠️  Nenhum item encontrado na tabela pricelist_itens');
      console.log('   Verifique se a tabela existe e tem dados no Supabase\n');
      return;
    }

    // Agrupar por tipo
    const porTipo = {};
    todosItens.forEach(item => {
      const tipo = item.tipo || 'sem_tipo';
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(item);
    });

    console.log('📊 ITENS POR TIPO:\n');
    Object.entries(porTipo).forEach(([tipo, items]) => {
      console.log(`   ${tipo}: ${items.length} itens`);
    });

    // Agrupar por status (ativo/inativo)
    const ativos = todosItens.filter(i => i.ativo).length;
    const inativos = todosItens.length - ativos;

    console.log('\n📊 ITENS POR STATUS:\n');
    console.log(`   Ativos: ${ativos}`);
    console.log(`   Inativos: ${inativos}`);

    // Mostrar primeiros 10 itens como exemplo
    console.log('\n\n📋 PRIMEIROS 10 ITENS:\n');
    todosItens.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. ${item.nome}`);
      console.log(`   Código: ${item.codigo || 'N/A'}`);
      console.log(`   Preço: R$ ${item.preco?.toFixed(2) || '0.00'}`);
      console.log(`   Unidade: ${item.unidade || 'UN'}`);
      console.log(`   Tipo: ${item.tipo || 'N/A'}`);
      console.log(`   Categoria: ${item.categoria?.nome || 'N/A'}`);
      console.log(`   Ativo: ${item.ativo ? 'Sim' : 'Não'}`);
      console.log('');
    });

    // Buscar categorias
    console.log('\n\n📂 CATEGORIAS DISPONÍVEIS:\n');
    const { data: categorias, error: catError } = await supabase
      .from('pricelist_categorias')
      .select('*');

    if (!catError && categorias) {
      categorias.forEach(cat => {
        const itensNaCat = todosItens.filter(i => i.categoria?.nome === cat.nome).length;
        console.log(`   ${cat.nome}: ${itensNaCat} itens`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

explorePricelist();
