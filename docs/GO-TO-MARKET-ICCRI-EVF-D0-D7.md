# GO-TO-MARKET ICCRI + EVF (D0-D7)

## Objetivo da semana

- Ativar uso real do EVF com corretores.
- Validar conversao de leitura para clique e lead.
- Definir se o gargalo esta em distribuicao, mensagem ou fluxo.

## Meta operacional

- 10 corretores ativos na semana.
- 30 EVFs enviados para clientes.
- Taxa de abertura > 40%.
- CTR para Obra Easy > 12%.

## Regras de operacao

- Todo link enviado deve conter `?ref=<codigo-corretor>`.
- Todo corretor envia no minimo 1 EVF por dia util.
- Toda interacao relevante deve ser consolidada em planilha diaria.

## Fase D0 (hoje)

1. Selecionar 10 corretores.
2. Criar codigo `ref` unico por corretor (ex.: `ref=corretor_ana`).
3. Enviar mensagem de onboarding rapido (template em `docs/templates`).
4. Cada corretor deve enviar 1 EVF real para 1 cliente.

## Fase D1

1. Consolidar metrica por corretor:
   - EVFs enviados
   - EVFs abertos
   - cliques de CTA
   - leads gerados
2. Classificar cada corretor:
   - `ativo com conversao`
   - `ativo sem conversao`
   - `inativo`

## Fase D2-D4

1. Ajuste de distribuicao:
   - se nao abriu: ajustar texto de envio.
2. Ajuste de proposta:
   - se abriu e nao clicou: ajustar chamada para acao.
3. Ajuste de continuidade:
   - se clicou e nao virou lead: ajustar follow-up.

## Fase D5-D7

1. Fechar ranking dos 10 corretores.
2. Replicar script dos 3 melhores para todo o grupo.
3. Definir escala para 30 corretores na semana seguinte.

## Modelo de decisao semanal

- Se poucos abrem: problema de distribuicao.
- Se abrem e nao clicam: problema de copy/CTA.
- Se clicam e nao convertem: problema de fluxo comercial.
- Se convertem: escalar imediatamente.

## Cadencia diaria (15 min)

1. 09:00 - conferencia de enviados por corretor.
2. 13:00 - conferencia de aberturas e cliques.
3. 18:00 - fechamento de resultados do dia e proximas acoes.

## Entregaveis da operacao

- Planilha diaria atualizada: `docs/templates/METRICAS-ATIVACAO-ICCRI-EVF.csv`
- Mensagem para corretor: `docs/templates/WHATSAPP-ATIVACAO-CORRETOR-D0.md`
- Mensagem corretor -> cliente: `docs/templates/WHATSAPP-CORRETOR-PARA-CLIENTE-EVF.md`

