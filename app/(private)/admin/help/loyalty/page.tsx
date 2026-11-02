"use client";

import React from "react";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { ArrowLeft, Play } from "@boxicons/react";

export default function LoyaltyHelpPage() {
  // 💡 COLOQUE AQUI A URL DO SEU VÍDEO DO YOUTUBE (ex: "https://www.youtube.com/watch?v=XXXX" ou "https://youtu.be/XXXX")
  const youtubeUrl = "";

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    if (url.includes("/embed/")) return url;
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(youtubeUrl);

  return (
    <>
      <AdminHeader title="Ajuda" />

      <div className="flex flex-col gap-8 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">

        {/* Navegação de Retorno */}
        <div>
          <Link
            href="/admin/help"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Voltar para Ajuda</span>
          </Link>
        </div>

        {/* Título Principal */}
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Programa de Fidelidade
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manual de instruções, boas práticas e funcionamento completo do motor de pontos e vouchers.
          </p>
        </div>

        {/* Player de Vídeo ou Container Reservado */}
        <div className="w-full">
          {embedUrl ? (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border shadow-sm bg-black">
              <iframe
                src={embedUrl}
                title="Aula explicativa do Programa de Fidelidade"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video max-h-[460px] rounded-3xl border bg-muted/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-card border flex items-center justify-center shadow-xs text-muted-foreground">
                <Play className="w-5 h-5 ml-0.5" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-sm font-semibold text-foreground">
                  Aula Explicativa em Vídeo
                </p>
                <p className="text-xs text-muted-foreground">
                  Espaço reservado para o vídeo tutorial. Acompanhe abaixo o guia detalhado em texto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo Completo do Manual */}
        <div className="space-y-10 text-foreground leading-relaxed text-sm md:text-base max-w-4xl">

          {/* Seção 1 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              1. Visão Geral e Propósito
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O <strong>Programa de Fidelidade do Totten</strong> é uma ferramenta desenhada para impulsionar a retenção, a frequência de visitas e o ticket médio da sua clínica. Ele transforma atendimentos, pontualidade e consumo financeiro em uma moeda de relacionamento (pontos), que os clientes podem acumular e trocar por vantagens reais: <strong>brindes, cortesias, descontos em porcentagem ou abatimentos em dinheiro</strong>.
            </p>
          </section>

          {/* Seção 2 */}
          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              2. Como os Clientes Acumulam Pontos
            </h2>
            <p className="text-muted-foreground">
              O Totten conta com quatro modalidades complementares de pontuação que podem ser ativadas em conjunto ou separadamente:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border bg-card space-y-2">
                <h3 className="font-semibold text-sm text-foreground">
                  A. Pontos por Check-in (Presença)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Concedidos quando o cliente comparece à clínica e faz check-in no <strong>Totem de Autoatendimento</strong>, na <strong>Sala de Espera</strong>, na recepção ou ao realizar uma <strong>sessão de pacote</strong>. Estimula a assiduidade presencial.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card space-y-2">
                <h3 className="font-semibold text-sm text-foreground">
                  B. Pontos por Agendamento (Incentivo Online)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Concedidos quando um agendamento é marcado como <strong>"Realizado"</strong> na agenda. Incentiva o cliente a utilizar o link público de agendamento online, desafogando o WhatsApp da recepção.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card space-y-2">
                <h3 className="font-semibold text-sm text-foreground">
                  C. Pontos por Valor Gasto (Cashback em Pontos)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permite configurar uma proporção monetária (ex: <em>a cada R$ 10,00 gastos = ganha 1 ponto</em>). O cálculo é realizado estritamente sobre o valor financeiro líquido pago no checkout (descontando cupons e vouchers).
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card space-y-2">
                <h3 className="font-semibold text-sm text-foreground">
                  D. Compra de Pacotes Pré-pagos
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ao contratar um pacote de sessões à vista, o cliente pontua na hora pelo valor total investido no pacote. E ao retornar para realizar cada sessão individual, recebe os pontos normais de presença/check-in.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              3. Gestão e Configurações (Aba Configurações)
            </h2>
            <div className="space-y-3 text-muted-foreground text-xs md:text-sm">
              <p>
                <strong>• Abrangência Global vs. Específica:</strong> No modo <em>Global</em>, todos os clientes cadastrados acumulam pontos automaticamente. No modo <em>Específico</em>, apenas clientes adicionados manualmente à lista acumulam pontos (ideal para clubes VIP restritos).
              </p>
              <p>
                <strong>• Limite Máximo de Pontos (Teto de Segurança):</strong> Define o saldo máximo que um cliente pode ter (ex: 500 ou 1.000 pontos). Evita acúmulo desmedido e incentiva a troca contínua por recompensas.
              </p>
              <p>
                <strong>• Integração com o Financeiro (Modo Automático vs. Manual):</strong> No modo automático, ao aplicar o voucher no agendamento, o sistema calcula o desconto (% ou R$) e abate a fatura na hora. No modo manual, a recepcionista dá baixa no voucher apenas como comprovante, realizando a cobrança na maquininha de cartão.
              </p>
              <p>
                <strong>• Expiração por Inatividade:</strong> Protege o caixa da clínica contra passivos ocultos. Se o cliente passar do prazo configurado (60, 90, 180 ou 365 dias) sem realizar nenhuma visita ou check-in, seu saldo de pontos é zerado com registro de auditoria.
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              4. Catálogo de Recompensas e Tipos de Vouchers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2.5 font-semibold text-foreground">Tipo de Recompensa</th>
                    <th className="py-2.5 font-semibold text-foreground">Exemplo Prático</th>
                    <th className="py-2.5 font-semibold text-foreground">Comportamento no Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  <tr>
                    <td className="py-3 font-medium text-foreground">Brinde / Cortesia (GIFT)</td>
                    <td className="py-3">Drenagem Cortesia ou Mimo</td>
                    <td className="py-3">Procedimento 100% gratuito. No financeiro gera receita R$ 0,00 como quitado por voucher.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-foreground">Desconto Percentual (%)</td>
                    <td className="py-3">10% OFF em qualquer procedimento</td>
                    <td className="py-3">O sistema calcula 10% sobre o preço do serviço e subtrai o valor na cobrança final.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-foreground">Desconto em Dinheiro (R$)</td>
                    <td className="py-3">R$ 50,00 de Desconto</td>
                    <td className="py-3">Abate o valor fixo de R$ 50,00 diretamente do total a pagar no checkout.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              * Cada recompensa possui um prazo de validade em dias após o resgate pelo cliente (ex: 30 dias). Vouchers não utilizados dentro do prazo são marcados como expirados.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              5. A Experiência do Cliente (Portal do Cliente)
            </h2>
            <p className="text-muted-foreground">
              O cliente não precisa baixar aplicativo: ele acessa diretamente pelo link da clínica no celular (<code>totten.app/{'{slug}'}/cliente</code>).
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs md:text-sm text-muted-foreground">
              <li>O cliente entra informando seu CPF + WhatsApp cadastrado ou via código OTP recebido por e-mail.</li>
              <li>Visualiza seu saldo em tempo real, seu nível (Bronze, Prata, Ouro) e a lista de prêmios disponíveis.</li>
              <li>Ao atingir a pontuação, clica em "Resgatar" e recebe um cartão digital com código PIN de 6 dígitos (ex: <code>#VCH-ABC123</code>).</li>
              <li>Apresenta o código na recepção no momento do atendimento.</li>
            </ol>
          </section>

          {/* Seção 6 */}
          <section className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              6. Operação na Recepção (Validação e Baixa)
            </h2>
            <div className="space-y-3 text-xs md:text-sm text-muted-foreground">
              <div className="p-4 rounded-2xl border bg-card space-y-1">
                <h4 className="font-semibold text-foreground">Opção 1: Validação Direta no Agendamento</h4>
                <p>
                  Ao abrir a modal do agendamento para realizar o atendimento, digite o PIN no campo <em>"Cupom / Voucher Fidelidade"</em>. O sistema valida se pertence ao cliente, calcula o novo preço líquido e já registra a baixa ao salvar o agendamento como "Realizado".
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card space-y-1">
                <h4 className="font-semibold text-foreground">Opção 2: Baixa Rápida na Aba "Visão Geral"</h4>
                <p>
                  No menu Fidelidade → Visão Geral, utilize o campo superior de busca por PIN. Digite os 6 dígitos do código e clique em <em>"Dar Baixa no Voucher Agora"</em>.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 7 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              7. Regras de Estorno e Segurança Operacional
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <strong>Desmarcar Agendamento Realizado:</strong> Se a recepcionista regredir o status de "Realizado" para "Confirmado" ou "Cancelado", o voucher utilizado é <strong>automaticamente restaurado para "Disponível"</strong>, sem prejuízo ao cliente, e os pontos ganhos são estornados.
              </li>
              <li>
                <strong>Exclusão de Agendamento:</strong> Se um atendimento realizado for excluído, o sistema restaura o voucher e reverte a pontuação exata concedida.
              </li>
              <li>
                <strong>Cancelamento de Pacotes:</strong> Se um pacote pago à vista for encerrado sem nenhuma sessão utilizada, os pontos gerados na compra são revertidos no livro-razão.
              </li>
            </ul>
          </section>

          {/* Seção 8 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              8. Livro-Razão e Extrato (Aba Extrato)
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm">
              Na aba Extrato do painel administrativo, o gestor acompanha todas as entradas e saídas de pontos de forma auditável e imutável:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border bg-card"><code>CHECK_IN</code>: Presença presencial</div>
              <div className="p-2.5 rounded-xl border bg-card"><code>APPOINTMENT</code>: Agendamento concluído</div>
              <div className="p-2.5 rounded-xl border bg-card"><code>PACKAGE_PURCHASE</code>: Compra de pacote</div>
              <div className="p-2.5 rounded-xl border bg-card"><code>MANUAL_BONUS</code>: Bônus de cortesia</div>
              <div className="p-2.5 rounded-xl border bg-card"><code>REWARD_REDEEM</code>: Resgate de prêmio</div>
              <div className="p-2.5 rounded-xl border bg-card"><code>POINTS_EXPIRED</code>: Inatividade prolongada</div>
            </div>
          </section>

          {/* Seção 9 */}
          <section className="space-y-3 pb-8">
            <h2 className="text-lg md:text-xl font-bold text-foreground border-b pb-2">
              9. Perguntas Frequentes (FAQ)
            </h2>
            <div className="space-y-2 text-xs md:text-sm">
              <div className="p-4 rounded-2xl border bg-card space-y-1">
                <span className="font-semibold text-foreground block">
                  Se a cliente tiver agendamento e fizer check-in no totem, pontua duas vezes?
                </span>
                <p className="text-muted-foreground">
                  Não. O sistema possui trava de concorrência: se o cliente já recebeu pontos pela presença daquela visita, o agendamento concede apenas os pontos correspondentes ao valor financeiro do serviço.
                </p>
              </div>

              <div className="p-4 rounded-2xl border bg-card space-y-1">
                <span className="font-semibold text-foreground block">
                  A clínica pode pontuar apenas por valor financeiro (R$) e desligar pontos fixos?
                </span>
                <p className="text-muted-foreground">
                  Sim. Basta desativar as chaves de "Pontos por Check-in" e "Pontos por Agendamento", mantendo ligada apenas a regra de "Pontos por Valor Gasto".
                </p>
              </div>
            </div>
          </section>

        </div>

      </div>
    </>
  );
}
