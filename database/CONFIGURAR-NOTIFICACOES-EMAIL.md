# Configuracao de Notificacoes por Email

## Visao Geral

Sistema de notificacoes para o site Grupo WG Almeida:
1. **Notificacao Instantanea** - Email quando um novo usuario se cadastra
2. **Resumo Diario** - Email diario com todas as atividades

---

## Passo 1: Executar SQL no Supabase

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Va em **SQL Editor**
3. Execute o arquivo `CRIAR-SISTEMA-NOTIFICACOES-CADASTRO.sql`

---

## Passo 2: Criar conta no Resend (Servico de Email)

1. Acesse https://resend.com
2. Crie uma conta gratuita (100 emails/dia gratis)
3. Adicione e verifique seu dominio (wgalmeida.com.br)
4. Gere uma API Key em **API Keys > Create API Key**
5. Guarde a chave (comeca com `re_`)

---

## Passo 3: Configurar Secrets no Supabase

1. No painel do Supabase, va em **Settings > Edge Functions**
2. Adicione os seguintes secrets:

```
RESEND_API_KEY = re_sua_chave_aqui
ADMIN_EMAIL = contato@wgalmeida.com.br
```

Ou via CLI:
```bash
supabase secrets set RESEND_API_KEY=re_sua_chave_aqui
supabase secrets set ADMIN_EMAIL=contato@wgalmeida.com.br
```

---

## Passo 4: Deploy das Edge Functions

```bash
cd site
supabase link --project-ref ahlqzzkxuutwoepirpzr
supabase functions deploy notify-registration
supabase functions deploy daily-summary
```

---

## Passo 5: Configurar Webhook para Notificacao Instantanea

1. No Supabase, va em **Database > Webhooks**
2. Clique em **Create a new webhook**
3. Configure:
   - **Name**: notify-new-registration
   - **Table**: pending_registrations
   - **Events**: INSERT
   - **Type**: Supabase Edge Function
   - **Function**: notify-registration

---

## Passo 6: Configurar Resumo Diario (Cron)

### Opcao A: Usar Supabase pg_cron

1. No SQL Editor, execute:
```sql
-- Habilitar extensao
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar resumo diario as 8h (horario UTC)
SELECT cron.schedule(
  'daily-summary-email',
  '0 11 * * *', -- 11h UTC = 8h Brasilia
  $$
  SELECT net.http_post(
    url := 'https://ahlqzzkxuutwoepirpzr.supabase.co/functions/v1/daily-summary',
    headers := '{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Opcao B: Usar servico externo (cron-job.org)

1. Acesse https://cron-job.org
2. Crie uma conta gratuita
3. Configure um novo cron job:
   - **URL**: `https://ahlqzzkxuutwoepirpzr.supabase.co/functions/v1/daily-summary`
   - **Schedule**: `0 8 * * *` (todos os dias as 8h)
   - **Headers**: `Authorization: Bearer SEU_ANON_KEY`

---

## Testar as Funcoes

### Testar notificacao de registro:
```bash
curl -X POST 'https://ahlqzzkxuutwoepirpzr.supabase.co/functions/v1/notify-registration' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type":"INSERT","table":"pending_registrations","record":{"id":"test","nome":"Teste","email":"teste@email.com","created_at":"2024-01-01T10:00:00Z"}}'
```

### Testar resumo diario:
```bash
curl -X POST 'https://ahlqzzkxuutwoepirpzr.supabase.co/functions/v1/daily-summary' \
  -H 'Authorization: Bearer SEU_ANON_KEY'
```

---

## Verificar Cadastros Pendentes

No SQL Editor:
```sql
-- Ver todos os cadastros pendentes
SELECT * FROM pending_registrations WHERE status = 'pendente';

-- Aprovar um cadastro
UPDATE pending_registrations
SET status = 'aprovado', reviewed_at = NOW()
WHERE id = 'ID_DO_CADASTRO';

-- Ver resumo do dia
SELECT * FROM get_daily_summary();
```

---

## Alterar Email de Notificacao

```sql
UPDATE notification_settings
SET setting_value = 'novo@email.com'
WHERE setting_key = 'admin_email';
```

Ou altere o secret no Supabase:
```bash
supabase secrets set ADMIN_EMAIL=novo@email.com
```

---

## Troubleshooting

### Emails nao estao sendo enviados
1. Verifique se o dominio foi verificado no Resend
2. Confirme que a API Key esta correta
3. Verifique os logs da Edge Function no painel do Supabase

### Webhook nao dispara
1. Confirme que a tabela `pending_registrations` existe
2. Verifique se o webhook esta ativo em **Database > Webhooks**

### Cron nao executa
1. Verifique se a extensao pg_cron esta habilitada
2. Confirme o horario (UTC vs horario local)

---

## Custos

- **Resend**: 100 emails/dia gratis, depois $0.001/email
- **Supabase**: Edge Functions sao gratuitas ate 500k invocacoes/mes
- **Cron-job.org**: Gratuito para uso basico

---

## Arquivos Criados

```
site/
  database/
    CRIAR-SISTEMA-NOTIFICACOES-CADASTRO.sql
    CONFIGURAR-NOTIFICACOES-EMAIL.md
  supabase/
    functions/
      notify-registration/
        index.ts
      daily-summary/
        index.ts
  src/
    pages/
      Register.jsx (modificado)
```
