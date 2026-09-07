# Histórico de Modificações e Correções

Este documento registra as principais atualizações recentes feitas no sistema, com foco nas correções de bugs, ajustes na interface e regras de negócios da Agenda e Autoagendamento.

## 1. Visibilidade de Agendamentos Futuros (Bug dos meses seguintes)
- **Problema:** Apenas os agendamentos de Agosto apareciam na Agenda. Os agendamentos a partir de Setembro (incluindo sessões futuras de pacotes) pareciam não existir no sistema, mesmo estando cadastrados no banco de dados.
- **Causa:** O backend (`getAgenda` no serviço `agenda.service.ts`) estava configurado para retornar somente agendamentos com status `CONFIRMADO`, `REALIZADO` e `CANCELADO`. Como as sessões recorrentes criadas na compra de pacotes nascem com o status `PENDENTE`, elas eram bloqueadas pela consulta.
- **Solução:** Adicionamos `"PENDENTE"` ao array de status permitidos dentro da `whereClause` do `agenda.service.ts`. Agora todos os agendamentos de pacotes e pendentes aparecem normalmente nos meses futuros.

## 2. Navegação do Mini-Calendário (Sincronização da Agenda)
- **Problema:** Na visão mensal da Agenda Administrativa, clicar nas setas (`<` e `>`) do mini-calendário da barra lateral não atualizava os agendamentos listados na grade principal. O usuário achava que mudava de mês, mas a consulta continuava travada no mês anterior.
- **Causa:** As funções de navegação da barra lateral (`agenda-sidebar.tsx`) estavam apenas atualizando o estado visual local do calendário (`setMonth`), sem disparar a atualização da data selecionada na página raiz (`selectedDate`).
- **Solução:** As funções `nextMonth`, `prevMonth` e o gatilho `onMonthChange` do componente de calendário foram atualizadas para sincronizar a data via `onSelectDate(newMonth)`. Isso força a Agenda Principal a recalcular os limites (do dia 1 ao fim do mês) e buscar do banco os dados corretos.

## 3. Oscilação e Layout da Agenda (Mobile)
- **Problema:** A visualização semanal e diária da agenda não abria de forma correta e "oscilava" o layout em dispositivos móveis como tablets (Samsung) e celulares.
- **Causa:** Foram encontradas classes de utilitários CSS do Tailwind inexistentes/inválidas nos componentes de grade (`min-w-200`, `min-w-27.5`, `min-w-75`), o que quebrava o grid em telas menores.
- **Solução:** Substituímos as classes inválidas por valores padronizados ou customizados usando colchetes (ex: `min-w-[300px]`) nos arquivos `weekly-agenda-grid.tsx` e `daily-agenda-grid.tsx`, estabilizando a interface no mobile.

## 4. Retenção de Cache no Autoagendamento (Área do Cliente)
- **Problema:** Quando o cliente finalizava a compra de um pacote ou agendava um serviço, enviava a mensagem e voltava para tentar um novo agendamento, os dados do processo anterior continuavam presos no modal, impedindo novos agendamentos corretos.
- **Causa:** O estado local dos dados do agendamento não estava sendo limpo ao abrir o modal para um novo fluxo.
- **Solução:** Inserimos um reset completo do estado na função `handleOpenBooking` (dentro de `client-agendar-view.tsx`), garantindo que o formulário abra sempre do zero ao iniciar um novo agendamento.

## 5. Herança Indesejada de Tema Dark (Área do Cliente)
- **Problema:** Toda a página de autoagendamento do cliente estava puxando o tema escuro do celular do usuário (Dark Mode), ignorando as cores que foram configuradas pela organização no painel do sistema, deixando os textos e elementos "bugados" em termos de contraste.
- **Causa:** O componente global aplicava as preferências de sistema indiscriminadamente no HTML raíz.
- **Solução:** Implementamos `useTheme` no componente `client-agendar-view.tsx` para forçar o tema configurado nas variáveis da clínica (`booking_theme`), evitando a herança do sistema operacional do cliente e isolando as cores corretas da clínica na página de agendamento.

## 6. Limpeza de Interface Administrativa
- **Problema:** Haviam botões repetitivos e em locais desnecessários referentes ao "Compartilhar Portal do Cliente".
- **Solução:** Limpamos a lista global de clientes removendo o botão de "Compartilhar Portal" que poluia a interface de cada cliente listado. Depreciamos também a antiga visualização unitária pública. Foi acordado substituir a interface por um botão global consolidado no cabeçalho.

## 7. Contraste de Texto nos Botões (Tema Clean)
- **Problema:** Na página de autoagendamento, ao usar temas claros como o "Clean (Branco)" e acessar os modais, a cor do texto do botão entrava em conflito com a cor de fundo primária escura do tema. Adicionalmente, alguns botões de agendar ficavam invisíveis caso o celular do cliente estivesse em "Modo Noturno", pois as classes do Tailwind (`dark:`) entravam em ação indevidamente.
- **Causa:** O texto dos botões herdava configurações não relacionadas (`theme_config` do link da bio) que deixavam o texto preto, e o Tailwind aplicava classes `dark:` forçadas pelo sistema do cliente, ignorando as configurações da clínica.
- **Solução:** Adicionamos uma nova propriedade explícita de `btnTxt` nos temas globais em `booking-appearance-settings.tsx`. Além disso, atualizamos o `client-agendar-view.tsx` para respeitar essas cores de contraste e substituímos as classes `dark:` estáticas por um controle dinâmico baseado na variável do tema da organização (`isDark`).
