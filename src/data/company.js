/**
 * SINGLE SOURCE OF TRUTH — Dados da empresa e URLs dos produtos
 *
 * REGRA: Este é o ÚNICO lugar onde dados de contato e URLs são definidos.
 * Todos os componentes devem importar daqui.
 *
 * Ao alterar telefone, email, endereço ou URL:
 *   1. Alterar aqui
 *   2. Rodar: grep -rn "98465-0002\|contato@wg\|obraeasy\.wg\|easy\.wg\|easyrealstate\.wg" src/
 *   3. Garantir que todos os resultados sejam apenas importações desta constante
 *
 * Última revisão: 2026-04-12
 */

export const COMPANY = {
  name:         'Grupo WG Almeida',
  phone:        '+55 (11) 98465-0002',
  phoneRaw:     '+5511984650002',
  whatsapp:     'https://wa.me/5511984650002',
  ceoPhone:     '+55 (11) 99179-2291',
  ceoPhoneRaw:  '+5511991792291',
  ceoWhatsapp:  'https://wa.me/5511991792291',
  email:        'contato@wgalmeida.com.br',
  address:      'São Paulo, SP — Brasil',
  instagram:    'https://www.instagram.com/wgalmeida.arq',
  linkedin:     'https://www.linkedin.com/company/wgalmeida',
  facebook:     'https://www.facebook.com/wgalmeidaarquitetura',
  houzz:        'https://www.houzz.com/user/wgalmeida',
  pinterest:    'https://br.pinterest.com/wgalmeida',
  homify:       'https://www.homify.com.br/profissionais/232168/grupo-wg-almeida-arquitetura-engenharia-e-marcenaria-de-alto-padrao',
  gtmId:        'GTM-PT885HFQ',
}

export const PRODUCT_URLS = {
  site:         'https://wgalmeida.com.br',
  wgeasy:       'https://easy.wgalmeida.com.br',
  obraeasy:     'https://obraeasy.wgalmeida.com.br',
  easyrealstate:'https://easyrealstate.wgalmeida.com.br',
  corretor:     'https://obraeasy.wgalmeida.com.br/landing/corretor',
  buildtech:    'https://buildtech.wgalmeida.com.br',
  iccri:        'https://wgalmeida.com.br/iccri',
  easylocker:   'https://wgalmeida.com.br/easylocker',
}

/** Preços ObraEasy — espelho para uso no site sem importar o TS do ObraEasy */
export const OBRAEASY_PRECOS = {
  pro:      { label: 'Pro',              price: 'R$ 29,90', id: 'pro' },
  business: { label: 'Business',         price: 'R$ 59,90', id: 'business' },
  solo:     { label: 'Solo · Parceiro',  price: 'R$ 79,90', id: 'solo' },
  completo: { label: 'Completo · Parc.', price: 'R$ 149,90',id: 'completo' },
}

export const EASYREALSTATE_PRECOS = {
  free:        { label: 'Gratuito', price: 'R$ 0' },
  proCorretor: { label: 'Pro Corretor', price: 'R$ 49' },
  imobiliaria: { label: 'Imobiliária', price: 'R$ 149' },
}

export const WG_PRODUCT_MESSAGES = {
  wgExperienceCore:
    'A complexidade, a lógica, as regras e a automação trabalham por trás. Na frente, a experiência precisa ser objetiva, intuitiva e útil para decidir e executar.',
  wgAutomationPromise:
    'A tecnologia WG existe para reduzir atrito, automatizar rotinas, organizar informação e facilitar o dia a dia de quem vende, aprova, especifica, executa ou investe.',
  obraeasyPromise:
    'O ObraEasy organiza a obra por etapas operacionais reais: o que começa antes, o que depende de medição, o que precisa de aprovação e o que pode ser produzido em paralelo.',
  obraeasyB2B:
    'O ObraEasy conecta viabilidade, etapas operacionais, execução e financeiro real para reduzir achismo em retrofit, reforma e implantação de maior ticket.',
  obraeasyBenchmarks:
    'SINAPI, CUB/SINDUSCON e FipeZap entram como referência. O diferencial WG está em transformar mercado, orçamento e obra real em leitura acionável para decisão.',
  iccriPositioning:
    'O ICCRI é o motor proprietário da WG Almeida para conectar categorias, serviços, composições e leitura operacional da obra.',
  marketReferences:
    'SINAPI, CUB/SINDUSCON, FipeZAP e outras bases entram como referência. A organização da experiência segue a metodologia operacional WG Almeida.',
  easyRealStateB2B:
    'O Easy Real State conecta valor atual, fechamento real e potencial pós-obra no mesmo fluxo para apoiar decisões imobiliárias de maior ticket.',
  easyRealStateConfidence:
    'A leitura do ativo não precisa parecer absoluta para gerar valor. Ela pode estar em fase experimental, assistida ou já defensável, conforme a força da base real daquele objetivo.',
  easyRealStateBenchmarks:
    'A lapidação do motor considera referências nacionais e internacionais de AVM, fechamento real e valuation, mas a vantagem WG está na conexão entre mercado, obra e captura de valor.',
  obraeasyCapture:
    'No ecossistema WG, a obra deixa de ser só custo. Ela passa a mostrar quanto da tese do ativo já está sendo protegida, validada ou destravada pela execução real.',
  wgExperienceSystem:
    'O sistema de experiência WG transforma referências, estilo, briefing e contexto em uma jornada mais clara de decisão visual, alinhamento e execução.',
  wgExperienceAddon:
    'Como add-on, essa frente pode entrar antes do projeto, durante a pré-venda ou como camada de alinhamento entre cliente, corretor, arquiteto e equipe.',
  wgExperienceConversion:
    'A função dessa camada não é gerar mais uma ferramenta. É reduzir indecisão, organizar preferências e aproximar inspiração de proposta, projeto e obra real.',
}
