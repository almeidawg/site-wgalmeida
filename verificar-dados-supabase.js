/**
 * Verificar dados existentes no Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahlqzzkxuutwoepirpzr.supabase.co';
const supabaseAnonKey = 'JWT_REVOKED_ROTATE_IMMEDIATELY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m',
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    title: (msg) => console.log(`\n${colors.cyan}${colors.bold}${'='.repeat(70)}\n${msg}\n${'='.repeat(70)}${colors.reset}`),
};

async function verificarDados() {
    console.log(`${colors.magenta}${colors.bold}
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     🔍 VERIFICAÇÃO DE DADOS NO SUPABASE 🔍                         ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

    log.title('📊 VERIFICANDO DADOS NO BANCO');

    try {
        // Buscar contatos
        log.info('Buscando contatos...');
        const { data: contatos, error: errorContatos, count: countContatos } = await supabase
            .from('contacts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (errorContatos) {
            log.error(`Erro ao buscar contatos: ${errorContatos.message}`);
        } else {
            log.success(`Total de contatos encontrados: ${countContatos || 0}`);

            if (contatos && contatos.length > 0) {
                console.log(`\n${colors.cyan}Últimos 5 contatos:${colors.reset}`);
                contatos.slice(0, 5).forEach((c, i) => {
                    console.log(`  ${i + 1}. ${c.name} (${c.email}) - ${c.phone || 'Sem telefone'}`);
                    console.log(`     Data: ${new Date(c.created_at).toLocaleString('pt-BR')}`);
                });
            }
        }

        console.log('\n');

        // Buscar propostas
        log.info('Buscando propostas...');
        const { data: propostas, error: errorPropostas, count: countPropostas } = await supabase
            .from('propostas_solicitadas')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (errorPropostas) {
            log.error(`Erro ao buscar propostas: ${errorPropostas.message}`);
        } else {
            log.success(`Total de propostas encontradas: ${countPropostas || 0}`);

            if (propostas && propostas.length > 0) {
                console.log(`\n${colors.cyan}Últimas 5 propostas:${colors.reset}`);
                propostas.slice(0, 5).forEach((p, i) => {
                    console.log(`  ${i + 1}. ${p.nome} (${p.email}) - ${p.telefone || 'Sem telefone'}`);
                    console.log(`     Projeto: ${p.tipo_imovel || 'Não informado'}`);
                    console.log(`     Data: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
                });
            }
        }

        console.log('\n');
        log.title('📊 RESUMO');

        const totalContatos = countContatos || 0;
        const totalPropostas = countPropostas || 0;
        const total = totalContatos + totalPropostas;

        console.log(`\n${colors.cyan}📧 Contatos no banco:${colors.reset} ${totalContatos}`);
        console.log(`${colors.cyan}🏠 Propostas no banco:${colors.reset} ${totalPropostas}`);
        console.log(`${colors.cyan}📊 TOTAL de registros:${colors.reset} ${total}\n`);

        if (total === 0) {
            log.warning('Não há registros no banco de dados.');
            log.info('Os emails serão enviados automaticamente quando novos formulários forem preenchidos.');
        } else {
            log.title('📤 ENVIAR EMAILS RETROATIVOS?');
            console.log(`\n${colors.yellow}Você tem ${total} registro(s) no banco.${colors.reset}`);
            console.log(`\n${colors.green}Para enviar emails para todos esses registros, execute:${colors.reset}`);
            console.log(`\n${colors.cyan}${colors.bold}  node enviar-emails-retroativos.js${colors.reset}\n`);
            console.log(`${colors.yellow}⚠️  Isso enviará ${totalContatos} email(s) de contato + ${totalPropostas} email(s) de proposta${colors.reset}`);
            console.log(`${colors.yellow}⚠️  Destino: william@wgalmeida.com.br${colors.reset}\n`);
        }

    } catch (error) {
        log.error(`Erro crítico: ${error.message}`);
    }
}

verificarDados().catch(error => {
    log.error(`Erro: ${error.message}`);
    process.exit(1);
});
