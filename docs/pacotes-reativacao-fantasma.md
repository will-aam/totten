# Correção de Reativação Fantasma de Pacotes (Package Active State Leak)

**Data:** 22 de Setembro de 2026
**Módulo:** Agendamentos e Pacotes (`appointments`, `packages`)

## O Problema: "Como estava antes"

Havia uma falha lógica na transição de estados de sessões vinculadas a um pacote. Quando um agendamento vinculado a um pacote mudava de estado, o sistema atualizava a flag `active` do pacote apenas baseando-se no saldo de sessões restantes.

**Regra anterior (Falha):**
```typescript
const aindaTemSaldo = saldo_atual < total_sessoes;
updatePackage({ active: aindaTemSaldo });
```

**Consequências Práticas:**
1. **Ressurreição de pacotes arquivados:** Se a clínica arquivava um pacote manualmente (por exemplo, cliente desistiu, pacote foi cancelado por inadimplência ou expirou) o `active` ia para `false`. No entanto, se houvesse sessões antigas ou futuras sendo manipuladas, qualquer ação (dar baixa, registrar falta, desfazer falta) reativava o pacote, ignorando que ele havia sido fechado manualmente pela gestão.
2. **`undoNoShow` Incondicional:** Ao reverter uma falta, o sistema forçava o pacote para `active: true` incondicionalmente, estragando o encerramento manual.
3. **Restos de Agenda (Orphans):** No método `archivePackageAction`, havia um comentário dizendo que excluiria os agendamentos "pendentes", mas deixaria passar os status de "confirmado" (felizmente, no código isso já estava como `not: REALIZADO`, mas a confusão conceitual era um risco).

## A Solução: "Como está agora"

O cálculo de ativação do pacote agora é um composto: ele une a verificação do saldo matemático à verificação do estado administrativo atual do pacote. O sistema aprendeu a identificar o que é um "Arquivamento Manual".

**Nova Regra (Blindada):**
```typescript
// 1. O pacote ainda tem sessões?
const aindaTemSaldo = saldo_atual < total_sessoes;

// 2. O pacote foi encerrado administrativamente antes do tempo?
const arquivamentoManual = !pacote.active && (saldo_anterior < total_sessoes);

// 3. Resultado final para o banco de dados
const statusFinal = arquivamentoManual ? false : aindaTemSaldo;
updatePackage({ active: statusFinal });
```

**Comportamentos atualizados:**
- **Dar Baixa (`updateAppointment`):** A baixa decrementa a sessão, mas se o pacote estava inativo, ele permanece inativo. Se estava ativo, avalia se o limite foi atingido.
- **Registrar Falta (`markAbsentAction`):** Segue a mesma lógica rigorosa.
- **Desfazer Falta (`undoNoShow`):** O hardcode `active: true` foi extirpado. Substituído pela fórmula composta que devolve o saldo, mantendo o pacote inativo caso o gestor o tenha desativado manualmente.
- **Estorno via Serviço (`PackageService.fixAppointment`):** A rotina interna, chamada durante cancelamentos drásticos, recebeu a mesma proteção de domínio.
- **Limpeza (`packages.ts`):** Foi garantido (e checado no código) que a deleção ao arquivar afeta a query `{ not: 'REALIZADO' }`, limpando corretamente qualquer sessão projetada futura que estivesse supostamente "Confirmada".
