/**
 * SINGLE SOURCE OF TRUTH — Dados da empresa e URLs dos produtos
 *
 * REGRA: Este é o ÚNICO lugar onde dados de contato e URLs são definidos.
 * Todos os componentes devem importar daqui.
 *
 * Ao alterar telefone, email, endereço ou URL:
 *   1. Alterar aqui
 *   2. Rodar: grep -rn "98465-0002\|contato@wg\|obraeasy\.wg\|easy\.wg" src/
 *   3. Garantir que todos os resultados sejam apenas importações desta constante
 *
 * Última revisão: 2026-04-12
 */

export const COMPANY = {
  name:         'Grupo WG Almeida',
  phone:        '+55 (11) 98465-0002',
  phoneRaw:     '+5511984650002',
  whatsapp:     'https://wa.me/5511984650002',
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
