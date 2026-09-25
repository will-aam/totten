# Funcionalidade: Sincronizar Saldo de Pacote

## O que é?
A funcionalidade de **Sincronizar**, localizada na tela de detalhes de um pacote (`package-details-modal.tsx`), serve como uma ferramenta de **Auditoria e Correção de Consistência** de dados. 

Ela possui o ícone `<RefreshCwAlt />` acompanhado do texto "Sincronizar" e um ícone de interrogação `?` (`<HelpCircle />`) com tooltip explicativo.

## Como funciona?
O sistema lida com dois locais de dados para pacotes:
1. O **Saldo** (campo numérico `used_sessions` na tabela `Package`) que diz rapidamente ao sistema quantas sessões foram gastas.
2. O **Histórico Real** (tabela `CheckIn`) que guarda o momento exato em que a sessão ocorreu, quem fez e qual agendamento disparou o evento.

Ao clicar em **Sincronizar**, a action `syncPackageBalance` é chamada no backend. O sistema executa o seguinte fluxo:
1. Faz um `count()` direto na tabela de `CheckIn`, buscando exatamente todos os check-ins *reais* vinculados ao ID do pacote em questão.
2. Substitui o número de `used_sessions` no pacote por essa contagem real.
3. Revalida a tela para atualizar o progresso visualmente.

## Por que foi criada?
Na vida útil de sistemas complexos de banco de dados, podem ocorrer falhas de integridade ou falta de sincronia (race conditions, falhas de rede no exato momento da gravação, ou exclusões manuais feitas diretamente no banco).

Se o pacote de um cliente diz *"4 sessões usadas"*, mas o cliente jura que só foi 3 vezes (e o histórico abaixo confirma que só existem 3 registros gravados), ocorreu uma falha de sincronia. 

O botão **Sincronizar** atua como um botão de emergência (healing). O atendente só precisa apertar esse botão e o saldo volta magicamente para "3", alinhando os números com a realidade física registrada no banco.

## Mudanças UI recentes
Para melhorar o entendimento da equipe, foi adicionado um ícone de Ajuda (`?`) com um tooltip ("Força a recontagem das sessões caso o saldo do pacote não esteja batendo com o histórico abaixo") que orienta de forma didática os colaboradores de clínica sobre a sua função, evitando o uso incorreto.
