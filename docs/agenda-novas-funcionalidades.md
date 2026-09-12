# Documentação das Novas Funcionalidades da Agenda

Este documento detalha as novas funcionalidades implementadas no módulo de Agenda, focadas na filosofia "Check-in Centric" do sistema Totten. O objetivo dessas funcionalidades é otimizar o fluxo de recepção com o uso do botão flutuante de ações rápidas (Speed Dial).

## 1. Speed Dial (Botão de Ações Rápidas)
Substituiu o antigo botão `+` por um menu dinâmico que oferece as seguintes opções para os recepcionistas:
- **Agendar Consulta/Novo Agendamento:** Fluxo padrão de agendamento (já existente).
- **Check-in Manual (Encaixe):** Novo fluxo para pacientes sem agendamento prévio.
- **Bloquear Horário:** Fluxo para bloquear turnos na agenda.
- **Vender Produto/Serviço:** (Redirecionamento).
- **Vender Pacote:** (Redirecionamento).


## 3. Bloqueio de Horário
Permite fechar horários específicos (como horário de almoço ou pausas) diretamente na grade da agenda.
- **Banco de Dados:** Tabela `ScheduleBlock` adicionada via `prisma db push` (não destrutivo). Contém título, horário de início, término e relação com um Profissional (ou toda a clínica).
- **UI:** A grade diária e semanal (DailyAgendaGrid / WeeklyAgendaGrid) agora renderizam dinamicamente caixas vermelhas onde há bloqueios.
- Ao tentar agendar por cima de um bloqueio, a visão visual já afasta a pessoa do erro (no futuro pode-se adicionar backend validation extra).

## 4. Check-in Manual / Encaixe Rápido
Serve para o fluxo em que o paciente chega à recepção para ser atendido na hora, sem agendamento feito.
- Um modal permite selecionar rapidamente o Paciente, o Serviço Desejado e o Profissional que fará o encaixe.
- O sistema automaticamente cria um `Appointment` no horário atual com status "CONFIRMADO" e um `CheckIn` associado simultaneamente.
- O paciente aparece instantaneamente na tela da "Sala de Espera (Live)".

---
*Segurança de Dados: Todas as migrações foram de adição. Nenhum dado de histórico de check-ins, clientes ou agendamentos foi sobrescrito ou deletado durante essa evolução.*
