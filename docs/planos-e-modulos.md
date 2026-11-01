# Planos e módulos — proposta atual

Este documento registra a estrutura de planos em avaliação para a Totten. Serve como referência de produto enquanto os cards de `/admin/plan` são usados para visualizar a proposta.

## Princípios definidos

- Não haverá um plano gratuito permanente. A pessoa poderá testar todos os recursos por 14 dias.
- Os planos serão cumulativos: o Médio inclui o Básico; o Avançado inclui o Médio.
- O produto é voltado principalmente a profissionais autônomos e operações pequenas, de uma a quatro pessoas.
- Cadastros, estoque e registros fazem parte da operação básica. Não haverá limites de quantidade para clientes, fichas de anamnese, serviços, modelos de pacotes ou itens de estoque.
- Os limites comerciais podem ser aplicados a recursos específicos, como quantidade de profissionais e pacotes ativos por cliente.
- O Autoatendimento completo pertence ao Plano Avançado. A cobrança via Mercado Pago e as taxas por transação são detalhes do recurso de pagamento e devem ser explicadas junto a ele, não como itens ou cobranças dos planos.

## Estrutura dos planos

### Plano Básico

Para a profissional que conduz a própria rotina.

- Dashboard, Agenda e check-in.
- Confirmações manuais, aniversariantes e notas.
- Gestão de pacotes e todos os Registros: comprovantes, histórico de check-in e histórico de ações.
- Cadastros: clientes, fichas de anamnese, profissionais, serviços e pacotes, e estoque.
- Clientes, fichas, serviços, modelos de pacotes e itens de estoque sem limite de quantidade.
- Até 1 profissional cadastrado.
- Até 1 pacote ativo por cliente.

### Plano Médio

Para quem quer ampliar a operação e acompanhar a recorrência e as finanças.

- Inclui tudo do Plano Básico.
- Até 2 profissionais cadastrados.
- Até 3 pacotes ativos por cliente.
- Módulo Financeiro.
- Programa de Fidelidade.

### Plano Avançado

Para operações que precisam de autoatendimento e capacidade ampliada.

- Inclui tudo do Plano Médio.
- De 3 até 30 profissionais cadastrados.
- Pacotes ativos sem limite por cliente.
- Módulo de Autoatendimento completo: dashboard, solicitações pendentes, regras e horários, e página personalizada.
- Suporte humano prioritário é uma possibilidade em avaliação e depende da capacidade operacional de oferecer esse atendimento.

## Preços e Stripe

A decisão final de preços será feita quando a integração com Stripe for implementada. Até lá:

- Os valores exibidos nos cards são referências temporárias da interface, não preços aprovados para cobrança.
- Os cards podem manter os valores de teste atuais para visualização, mas não devem ser conectados a uma cobrança real.
- A integração com Stripe deverá definir preços mensais e anuais, recorrência, período de teste de 14 dias e comportamento após o fim do teste.
- O seletor anual deve apresentar o valor como total por ano, não como valor mensal.
- O selo de desconto anual deve corresponder matematicamente aos valores definidos.

## Itens ainda a confirmar

- Se o limite de 30 profissionais no Avançado é o teto final adequado ao público pretendido.
- Se o suporte humano prioritário será oferecido e qual será o nível de serviço.
- A confirmação dos limites de pacotes ativos por cliente em cada plano.
- Os preços e as condições mensais e anuais, junto à configuração dos produtos e preços no Stripe.
- A aplicação técnica dos limites e permissões por plano. A estrutura descrita aqui é uma proposta de produto e não implica que o controle de acesso já esteja implementado.
