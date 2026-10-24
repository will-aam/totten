# Funcionalidade: Sincronizar Saldo de Pacote

## O que é?
A funcionalidade de **Sincronizar**, localizada na tela de detalhes de um pacote (`package-details-modal.tsx`), serve como uma ferramenta de **Auditoria e Correção de Consistência** de dados. 

Ela possui o ícone `<RefreshCwAlt />` acompanhado do texto "Sincronizar" e um ícone de interrogação `?` (`<HelpCircle />`) com tooltip explicativo.

## Como funciona?
O sistema lida com dados de consumo de pacotes originados de três fontes legítimas:
1. **Agendamentos Realizados (`Appointment` com status `REALIZADO`):** Atendimentos concluídos pelo profissional diretamente na Agenda tradicional ou no Totem.
2. **Check-ins Físicos / Baixas (`CheckIn` ativo):** Registros de presença no Totem e baixas manuais via Gestão de Pacotes.
3. **Check-ins Avulsos via CPF:** Presenças diretas no Totem sem agendamento prévio.

Ao clicar em **Sincronizar**, a action `syncPackageBalance` é chamada no backend. O sistema executa o seguinte fluxo:
1. Busca todos os agendamentos com status `REALIZADO` vinculados ao pacote.
2. Busca check-ins ativos (`deleted_at: null`) vinculados ao pacote e computa check-ins avulsos que não duplicam agendamentos já computados.
3. Soma o total real de sessões consumidas e atualiza o campo `used_sessions` no pacote.
4. Preserva o status do pacote caso ele tenha sido arquivado manualmente, ou ajusta `active: true/false` de acordo com o saldo e validade.
5. Revalida a tela para atualizar o progresso visualmente.

## Por que foi criada?
Na vida útil de sistemas complexos de banco de dados, podem ocorrer falhas de integridade ou falta de sincronia (race conditions, falhas de rede no exato momento da gravação, ou exclusões manuais feitas diretamente no banco).

Se o pacote de um cliente diz *"4 sessões usadas"*, mas o cliente jura que só foi 3 vezes (e o histórico abaixo confirma que só existem 3 registros gravados), ocorreu uma falha de sincronia. 

O botão **Sincronizar** atua como um botão de emergência (healing). O atendente só precisa apertar esse botão e o saldo volta magicamente para o valor auditado real, alinhando os números com a realidade física registrada no banco.

## Informação Didática na Interface (UI)
Foi adicionado um ícone de Ajuda (`?`) com um tooltip explicativo e um modal de confirmação detalhado ("Como funciona a Sincronização?") que orienta de forma didática os colaboradores sobre a recontagem de atendimentos da agenda tradicional, totem e baixas manuais, evitando dúvidas e uso incorreto.
