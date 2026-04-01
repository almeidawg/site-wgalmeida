/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * 🧪 TESTE AUTOMATIZADO DO MÓDULO CRONOGRAMA
 * Execute este script para verificar se todas as funcionalidades estÍo funcionando
 */

import { supabaseRaw } from './lib/supabaseClient';

interface TestResult {
  nome: string;
  status: 'sucesso' | 'erro' | 'aviso';
  mensagem: string;
  detalhes?: any;
}

async function testarCronograma() {
  console.log('='.repeat(80));
  console.log('🧪 INICIANDO TESTES DO MÓDULO CRONOGRAMA');
  console.log('='.repeat(80));

  const resultados: TestResult[] = [];

  // ========================================
  // TESTE 1: Autenticação
  // ========================================
  console.log('\n📌 TESTE 1: Verificando autenticação...');
  try {
    const { data: { user }, error } = await supabaseRaw.auth.getUser();
    if (error) throw error;

    if (user) {
      resultados.push({
        nome: 'Autenticação',
        status: 'sucesso',
        mensagem: `Usuário autenticado: ${user.email}`,
        detalhes: { userId: user.id, email: user.email }
      });
      console.log(`✅ Usuário autenticado: ${user.email}`);
    } else {
      resultados.push({
        nome: 'Autenticação',
        status: 'erro',
        mensagem: 'Nenhum usuário autenticado'
      });
      console.log('❌ Nenhum usuário autenticado');
      return resultados;
    }
  } catch (error: any) {
    resultados.push({
      nome: 'Autenticação',
      status: 'erro',
      mensagem: error.message
    });
    console.log(`❌ Erro de autenticação: ${error.message}`);
    return resultados;
  }

  // ========================================
  // TESTE 2: Tabelas do Banco de Dados
  // ========================================
  console.log('\n📌 TESTE 2: Verificando tabelas do banco...');

  const tabelas = [
    { nome: 'team_members', descricao: 'Membros da Equipe' },
    { nome: 'catalog_items', descricao: 'Catálogo de Itens' },
    { nome: 'projects', descricao: 'Projetos' },
    { nome: 'project_items', descricao: 'Itens do Projeto' },
    { nome: 'tasks', descricao: 'Tarefas' }
  ];

  for (const tabela of tabelas) {
    try {
      const { data, error, count } = await supabaseRaw
        .from(tabela.nome)
        .select('*', { count: 'exact', head: true });

      if (error) {
        // Tabela Não existe ou sem permissão
        resultados.push({
          nome: `Tabela ${tabela.nome}`,
          status: 'erro',
          mensagem: `Erro ao acessar: ${error.message}`,
          detalhes: { code: error.code, hint: error.hint }
        });
        console.log(`❌ ${tabela.descricao} (${tabela.nome}): ${error.message}`);
      } else {
        resultados.push({
          nome: `Tabela ${tabela.nome}`,
          status: 'sucesso',
          mensagem: `Tabela OK - ${count || 0} registros`,
          detalhes: { count }
        });
        console.log(`✅ ${tabela.descricao} (${tabela.nome}): ${count || 0} registros`);
      }
    } catch (error: any) {
      resultados.push({
        nome: `Tabela ${tabela.nome}`,
        status: 'erro',
        mensagem: error.message
      });
      console.log(`❌ ${tabela.descricao}: ${error.message}`);
    }
  }

  // ========================================
  // TESTE 3: CRUD em Team Members
  // ========================================
  console.log('\n📌 TESTE 3: Testando CRUD em Team Members...');
  try {
    // CREATE
    const novoMembro = {
      name: `Teste Automatizado ${Date.now()}`,
      role: 'Developer',
      email: `teste${Date.now()}@teste.com`,
      phone: '11999999999',
      avatar_url: null
    };

    const { data: criado, error: erroCriar } = await supabaseRaw
      .from('team_members')
      .insert(novoMembro)
      .select()
      .single();

    if (erroCriar) throw new Error(`Erro ao criar: ${erroCriar.message}`);

    resultados.push({
      nome: 'CRUD Team Members - CREATE',
      status: 'sucesso',
      mensagem: 'Membro criado com sucesso',
      detalhes: criado
    });
    console.log(`✅ CREATE: Membro criado com ID ${criado.id}`);

    // READ
    const { data: lido, error: erroLer } = await supabaseRaw
      .from('team_members')
      .select('*')
      .eq('id', criado.id)
      .single();

    if (erroLer) throw new Error(`Erro ao ler: ${erroLer.message}`);

    resultados.push({
      nome: 'CRUD Team Members - READ',
      status: 'sucesso',
      mensagem: 'Membro lido com sucesso',
      detalhes: lido
    });
    console.log(`✅ READ: Membro lido com sucesso`);

    // UPDATE
    const { data: atualizado, error: erroAtualizar } = await supabaseRaw
      .from('team_members')
      .update({ role: 'Senior Developer' })
      .eq('id', criado.id)
      .select()
      .single();

    if (erroAtualizar) throw new Error(`Erro ao atualizar: ${erroAtualizar.message}`);

    resultados.push({
      nome: 'CRUD Team Members - UPDATE',
      status: 'sucesso',
      mensagem: 'Membro atualizado com sucesso',
      detalhes: atualizado
    });
    console.log(`✅ UPDATE: Membro atualizado com sucesso`);

    // DELETE
    const { error: erroDeletar } = await supabaseRaw
      .from('team_members')
      .delete()
      .eq('id', criado.id);

    if (erroDeletar) throw new Error(`Erro ao deletar: ${erroDeletar.message}`);

    resultados.push({
      nome: 'CRUD Team Members - DELETE',
      status: 'sucesso',
      mensagem: 'Membro deletado com sucesso'
    });
    console.log(`✅ DELETE: Membro deletado com sucesso`);

  } catch (error: any) {
    resultados.push({
      nome: 'CRUD Team Members',
      status: 'erro',
      mensagem: error.message
    });
    console.log(`❌ CRUD Team Members: ${error.message}`);
  }

  // ========================================
  // TESTE 4: Verificar Clientes (entities)
  // ========================================
  console.log('\n📌 TESTE 4: Verificando clientes disponíveis...');
  try {
    const { data: clientes, error } = await supabaseRaw
      .from('entities')
      .select('id, nome_razao_social, tipo')
      .eq('tipo', 'cliente')
      .limit(5);

    if (error) throw error;

    if (clientes && clientes.length > 0) {
      resultados.push({
        nome: 'Clientes Disponíveis',
        status: 'sucesso',
        mensagem: `${clientes.length} clientes encontrados`,
        detalhes: clientes
      });
      console.log(`✅ ${clientes.length} clientes disponíveis para criar projetos`);
      clientes.forEach((c: any) => {
        console.log(`   - ${c.nome_razao_social}`);
      });
    } else {
      resultados.push({
        nome: 'Clientes Disponíveis',
        status: 'aviso',
        mensagem: 'Nenhum cliente cadastrado'
      });
      console.log('⚠️ Nenhum cliente cadastrado. Você precisa cadastrar clientes primeiro!');
    }
  } catch (error: any) {
    resultados.push({
      nome: 'Clientes Disponíveis',
      status: 'erro',
      mensagem: error.message
    });
    console.log(`❌ Erro ao verificar clientes: ${error.message}`);
  }

  // ========================================
  // TESTE 5: Storage Bucket
  // ========================================
  console.log('\n📌 TESTE 5: Verificando Storage Bucket (avatars)...');
  try {
    const { data, error } = await supabaseRaw.storage.getBucket('avatars');

    if (error) throw error;

    resultados.push({
      nome: 'Storage Bucket (avatars)',
      status: 'sucesso',
      mensagem: 'Bucket configurado corretamente',
      detalhes: data
    });
    console.log(`✅ Bucket 'avatars' configurado e funcionando`);
  } catch (error: any) {
    resultados.push({
      nome: 'Storage Bucket (avatars)',
      status: 'aviso',
      mensagem: error.message
    });
    console.log(`⚠️ Bucket 'avatars': ${error.message}`);
    console.log('   Upload de fotos pode Não funcionar');
  }

  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(80));

  const sucessos = resultados.filter(r => r.status === 'sucesso');
  const erros = resultados.filter(r => r.status === 'erro');
  const avisos = resultados.filter(r => r.status === 'aviso');

  console.log(`\n✅ SUCESSOS: ${sucessos.length}`);
  sucessos.forEach(r => console.log(`   ✓ ${r.nome}: ${r.mensagem}`));

  if (avisos.length > 0) {
    console.log(`\n⚠️ AVISOS: ${avisos.length}`);
    avisos.forEach(r => console.log(`   ⚠ ${r.nome}: ${r.mensagem}`));
  }

  if (erros.length > 0) {
    console.log(`\n❌ ERROS: ${erros.length}`);
    erros.forEach(r => console.log(`   ✗ ${r.nome}: ${r.mensagem}`));
  }

  console.log('\n' + '='.repeat(80));

  const total = resultados.length;
  const percentualSucesso = Math.round((sucessos.length / total) * 100);

  if (erros.length === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log(`   ${percentualSucesso}% de sucesso (${sucessos.length}/${total})`);
    console.log('   O módulo cronograma está pronto para uso!');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log(`   ${percentualSucesso}% de sucesso (${sucessos.length}/${total})`);
    console.log('   Verifique os erros acima e corrija antes de usar o módulo.');
  }

  console.log('='.repeat(80) + '\n');

  return {
    resultados,
    resumo: {
      total,
      sucessos: sucessos.length,
      erros: erros.length,
      avisos: avisos.length,
      percentualSucesso
    }
  };
}

// Exportar para uso
export default testarCronograma;

// Se executado diretamente
if (typeof window !== 'undefined') {
  (window as any).testarCronograma = testarCronograma;
  console.log('💡 Execute "testarCronograma()" no console para iniciar os testes!');
}

