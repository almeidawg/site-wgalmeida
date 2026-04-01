/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * 🔍 DIAGNÓSTICO DO MÓDULO CRONOGRAMA
 * Execute este script para verificar se tudo está configurado corretamente
 */

import { supabaseRaw } from './lib/supabaseClient';

async function diagnosticoCronograma() {
  console.log('='.repeat(80));
  console.log('🔍 INICIANDO DIAGNÓSTICO DO MÓDULO CRONOGRAMA');
  console.log('='.repeat(80));

  const erros: string[] = [];
  const avisos: string[] = [];
  const sucessos: string[] = [];
  const isCli = typeof window === "undefined";

  async function validarTabela(
    table: string,
    label: string,
    opcoes?: { warningOnly?: boolean; nota?: string }
  ) {
    try {
      const { error, count } = await supabaseRaw
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      sucessos.push(`✅ ${label} OK - ${count ?? 0} registros`);
      console.log(`✅ ${label} OK - ${count ?? 0} registros`);
    } catch (error: any) {
      const msg = `${label}: ${error?.message || "falha desconhecida"}`;
      if (opcoes?.warningOnly) {
        avisos.push(`⚠️ ${msg}`);
        console.log(`⚠️ ${msg}`);
        if (opcoes.nota) console.log(`   ${opcoes.nota}`);
      } else {
        erros.push(`❌ ${msg}`);
        console.log(`❌ ${msg}`);
        if (opcoes?.nota) console.log(`   ${opcoes.nota}`);
      }
    }
  }

  // 1. VERIFICAR AUTENTICAÇÃO
  console.log('\n1️⃣ VERIFICANDO AUTENTICAÇÃO...');
  try {
    const { data: { user }, error } = await supabaseRaw.auth.getUser();
    if (error) {
      // Em execução CLI, normalmente Não há sessão persistida.
      if (isCli && /Auth session missing/i.test(error.message || "")) {
        avisos.push("⚠️ Sem sessão autenticada no CLI (normal em teste terminal).");
        console.log("⚠️ Sem sessão autenticada no CLI (normal em teste terminal).");
      } else {
        throw error;
      }
    }

    if (user) {
      sucessos.push(`✅ Usuário autenticado: ${user.email}`);
      console.log(`✅ Usuário autenticado: ${user.email}`);
    } else if (!isCli) {
      erros.push('❌ Nenhum usuário autenticado');
      console.log('❌ Nenhum usuário autenticado');
    }
  } catch (error: any) {
    const msg = `Erro de AUTENTICAÇÃO: ${error.message}`;
    if (isCli) {
      avisos.push(`⚠️ ${msg}`);
      console.log(`⚠️ ${msg}`);
    } else {
      erros.push(`❌ ${msg}`);
      console.log(`❌ ${msg}`);
    }
  }

  // 2. VERIFICAR FONTE DE CLIENTES (schema atual e legado)
  console.log('\n2️⃣ VERIFICANDO FONTE DE CLIENTES...');
  try {
    let fonte = "";
    const pessoasCliente = await supabaseRaw
      .from("pessoas")
      .select("id", { count: "exact", head: true })
      .or("tipo.ilike.%cliente%");

    if (!pessoasCliente.error) {
      fonte = "pessoas";
      sucessos.push(`✅ Fonte de clientes OK (pessoas) - ${pessoasCliente.count ?? 0} registros`);
      console.log(`✅ Fonte de clientes OK (pessoas) - ${pessoasCliente.count ?? 0} registros`);
    } else {
      const clientes = await supabaseRaw
        .from("clientes")
        .select("id", { count: "exact", head: true });
      if (!clientes.error) {
        fonte = "clientes";
        sucessos.push(`✅ Fonte de clientes OK (clientes) - ${clientes.count ?? 0} registros`);
        console.log(`✅ Fonte de clientes OK (clientes) - ${clientes.count ?? 0} registros`);
      }
    }
    if (!fonte) {
      avisos.push("⚠️ Nenhuma fonte de clientes encontrada (pessoas/clientes).");
      console.log("⚠️ Nenhuma fonte de clientes encontrada (pessoas/clientes).");
      console.log("   Verifique se as migrations de clientes foram aplicadas.");
    }
  } catch (error: any) {
    avisos.push(`⚠️ Falha ao validar fonte de clientes: ${error.message}`);
    console.log(`⚠️ Falha ao validar fonte de clientes: ${error.message}`);
  }

  // 3-6. VERIFICAR TABELAS BASE (schema atual)
  console.log('\n3️⃣ VERIFICANDO TABELAS BASE (schema atual)...');
  await validarTabela("projetos", "Tabela projetos");
  await validarTabela("projeto_equipes", "Tabela projeto_equipes");
  await validarTabela("cronograma_tarefas", "Tabela cronograma_tarefas");
  await validarTabela("contratos_itens", "Tabela contratos_itens");
  await validarTabela("cliente_checklist_items", "Tabela cliente_checklist_items", {
    warningOnly: true,
    nota: "Opcional para projetos sem checklist integrado."
  });

  // 7. VERIFICAR TABELAS LEGADAS (warning only)
  console.log('\n4️⃣ VERIFICANDO TABELAS LEGADAS (compatibilidade)...');
  await validarTabela("projects", "Tabela projects (legado)", { warningOnly: true });
  await validarTabela("project_items", "Tabela project_items (legado)", { warningOnly: true });
  await validarTabela("tasks", "Tabela tasks (legado)", { warningOnly: true });
  await validarTabela("team_members", "Tabela team_members (legado)", { warningOnly: true });
  await validarTabela("catalog_items", "Tabela catalog_items (legado)", { warningOnly: true });

  // 8. VERIFICAR RPC DE ORDENAÇÃO INTELIGENTE
  console.log('\n5️⃣ VERIFICANDO RPC listar_ordem_cronograma_inteligente...');
  try {
    const { error } = await supabaseRaw.rpc("listar_ordem_cronograma_inteligente", {
      p_projeto_id: "00000000-0000-0000-0000-000000000000",
    });
    if (error) throw error;
    sucessos.push("✅ RPC listar_ordem_cronograma_inteligente OK");
    console.log("✅ RPC listar_ordem_cronograma_inteligente OK");
  } catch (error: any) {
    avisos.push(`⚠️ RPC listar_ordem_cronograma_inteligente: ${error.message}`);
    console.log(`⚠️ RPC listar_ordem_cronograma_inteligente: ${error.message}`);
    console.log("   Aplique a migration 20260220_1010_rpc_ordem_cronograma_inteligente.sql");
  }

  // 9. VERIFICAR STORAGE BUCKET AVATARES
  console.log('\n6️⃣ VERIFICANDO STORAGE BUCKET AVATARES...');
  try {
    const { data, error } = await supabaseRaw.storage.getBucket('avatars');

    if (error) throw error;

    sucessos.push(`✅ Bucket avatars OK`);
    console.log(`✅ Bucket avatars configurado corretamente`);
  } catch (error: any) {
    avisos.push(`⚠️ Bucket avatars: ${error.message}`);
    console.log(`⚠️ Bucket avatars pode Não estar configurado`);
    console.log('   Upload de fotos pode Não funcionar');
  }

  // RESUMO FINAL
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DO DIAGNÓSTICO');
  console.log('='.repeat(80));

  console.log(`\n✅ SUCESSOS: ${sucessos.length}`);
  sucessos.forEach(s => console.log(`   ${s}`));

  if (avisos.length > 0) {
    console.log(`\n⚠️ AVISOS: ${avisos.length}`);
    avisos.forEach(a => console.log(`   ${a}`));
  }

  if (erros.length > 0) {
    console.log(`\n❌ ERROS: ${erros.length}`);
    erros.forEach(e => console.log(`   ${e}`));
  }

  console.log('\n' + '='.repeat(80));

  if (erros.length === 0) {
    console.log('🎉 TUDO FUNCIONANDO PERFEITAMENTE!');
    console.log('   Você pode usar o módulo cronograma normalmente.');
  } else {
    console.log('⚠️ Ação NECESSÁRIA:');
    console.log('   1. Verifique se executou o SQL no Supabase');
    console.log('   2. Verifique as RLS policies das tabelas');
    console.log('   3. Verifique se está autenticado no sistema');
  }

  console.log('='.repeat(80) + '\n');

  return {
    sucessos,
    avisos,
    erros,
    todosOk: erros.length === 0
  };
}

// Exportar para uso
export default diagnosticoCronograma;

// Se executado diretamente
if (typeof window !== 'undefined') {
  (window as any).diagnosticoCronograma = diagnosticoCronograma;
  console.log('💡 Execute "diagnosticoCronograma()" no console para testar!');
} else {
  diagnosticoCronograma()
    .then((resultado) => {
      if (!resultado.todosOk) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error("❌ Falha ao executar diagnóstico do cronograma:", error);
      process.exitCode = 1;
    });
}

