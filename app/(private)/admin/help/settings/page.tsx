"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
  Building,
  Whatsapp,
  Bell,
  CheckShield,
  InfoCircle,
  CalendarCheck,
  Package,
  CalendarX,
  Last,
  Coffee,
  CheckCircle,
} from "@boxicons/react";

type SettingsTab = "geral" | "whatsapp" | "notificacoes" | "acesso";

export default function SettingsHelpPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("geral");

  // 💡 URL do vídeo explicativo do YouTube (opcional)
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

      <div className="flex flex-col gap-6 md:gap-8 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">

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
            Configurações do Sistema
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manual prático e didático sobre o funcionamento das abas Geral, WhatsApp, Notificações e Acesso.
          </p>
        </div>

        {/* Player de Vídeo ou Container Reservado */}
        <div className="w-full">
          {embedUrl ? (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border shadow-sm bg-black">
              <iframe
                src={embedUrl}
                title="Aula explicativa das Configurações do Sistema"
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
                  Espaço reservado para o tutorial em vídeo. Selecione uma das abas abaixo para consultar o guia em texto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botões Interativos no formato de Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* TAB 1: GERAL */}
          <button
            type="button"
            onClick={() => setActiveTab("geral")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "geral"
                ? "bg-card border-primary ring-2 ring-primary/20 shadow-sm"
                : "bg-card/60 hover:bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                activeTab === "geral"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Building size="sm" />
            </div>
            <div>
              <h4
                className={cn(
                  "text-sm font-bold transition-colors",
                  activeTab === "geral" ? "text-primary" : "text-foreground"
                )}
              >
                1. Geral
              </h4>
              <p className="text-xs text-muted-foreground">Dados, CNPJ e contato</p>
            </div>
          </button>

          {/* TAB 2: WHATSAPP */}
          <button
            type="button"
            onClick={() => setActiveTab("whatsapp")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "whatsapp"
                ? "bg-card border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                : "bg-card/60 hover:bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                activeTab === "whatsapp"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-500/10 text-emerald-600"
              )}
            >
              <Whatsapp size="sm" />
            </div>
            <div>
              <h4
                className={cn(
                  "text-sm font-bold transition-colors",
                  activeTab === "whatsapp" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}
              >
                2. WhatsApp
              </h4>
              <p className="text-xs text-muted-foreground">Modelos de mensagens</p>
            </div>
          </button>

          {/* TAB 3: NOTIFICAÇÕES */}
          <button
            type="button"
            onClick={() => setActiveTab("notificacoes")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "notificacoes"
                ? "bg-card border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "bg-card/60 hover:bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                activeTab === "notificacoes"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-500/10 text-amber-600"
              )}
            >
              <Bell size="sm" />
            </div>
            <div>
              <h4
                className={cn(
                  "text-sm font-bold transition-colors",
                  activeTab === "notificacoes" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                )}
              >
                3. Notificações
              </h4>
              <p className="text-xs text-muted-foreground">Sininho e resumo matinal</p>
            </div>
          </button>

          {/* TAB 4: ACESSO */}
          <button
            type="button"
            onClick={() => setActiveTab("acesso")}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "acesso"
                ? "bg-card border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                : "bg-card/60 hover:bg-card border-border/60 hover:border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                activeTab === "acesso"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-500/10 text-blue-600"
              )}
            >
              <CheckShield size="sm" />
            </div>
            <div>
              <h4
                className={cn(
                  "text-sm font-bold transition-colors",
                  activeTab === "acesso" ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                )}
              >
                4. Acesso
              </h4>
              <p className="text-xs text-muted-foreground">Senha e credenciais</p>
            </div>
          </button>
        </div>

        {/* Conteúdo Dinâmico Renderizado por Aba */}
        <div className="text-foreground leading-relaxed text-sm md:text-base max-w-4xl animate-in fade-in duration-300">

          {/* SESSÃO 1: GERAL */}
          {activeTab === "geral" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building size="xs" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Aba Geral: Identidade e Dados da Empresa
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                A aba <strong>Geral</strong> é onde você configura a certidão de identidade do seu estabelecimento no Totten. Os dados cadastrados aqui são automaticamente refletidos no portal público de agendamento online do cliente, nos cabeçalhos de comprovantes e nas comunicações oficiais.
              </p>

              <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <InfoCircle size="xs" className="text-primary" />
                  Principais Recursos da Aba Geral:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Consulta Automática de CNPJ:</strong> Ao digitar o CNPJ da empresa e clicar na lupa de busca, o Totten conecta-se à base da Receita Federal (BrasilAPI) e preenche instantaneamente a Razão Social, Nome Fantasia, CEP, Endereço, Bairro, Município e Estado.
                  </li>
                  <li>
                    <strong className="text-foreground">Padronização de Nomes:</strong> O sistema formata automaticamente os textos para o padrão formal de capitulação (iniciais maiúsculas), preservando siglas oficiais (como LTDA, EPP, ME e siglas de estados).
                  </li>
                  <li>
                    <strong className="text-foreground">Canais de Contato:</strong> Cadastre o telefone e o WhatsApp oficial da recepção para que seus clientes encontrem suporte com facilidade no portal.
                  </li>
                </ul>
              </div>
            </section>
          )}

          {/* SESSÃO 2: WHATSAPP */}
          {activeTab === "whatsapp" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Whatsapp size="xs" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Aba WhatsApp: Modelos e Automação de Mensagens
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Esta seção permite que você personalize os textos pré-definidos das mensagens que a sua equipe envia para os clientes no dia a dia. A integração é 100% segura e direta via link oficial do WhatsApp (WhatsApp Web ou app móvel), eliminando riscos de bloqueio de número.
              </p>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-foreground">
                  Gatilhos de Mensagens Configuráveis:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border bg-card">
                    <span className="font-bold text-xs text-primary uppercase tracking-wider block mb-1">
                      Confirmação de Presença
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enviada assim que o cliente é atendido na recepção ou conclui o check-in no totem.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-card">
                    <span className="font-bold text-xs text-emerald-600 uppercase tracking-wider block mb-1">
                      Mensagem de Boas-Vindas
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Disparada no cadastro inicial do novo cliente para acolhimento e apresentação do seu espaço.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-card">
                    <span className="font-bold text-xs text-blue-600 uppercase tracking-wider block mb-1">
                      Renovação de Pacote
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enviada quando a cliente está na última ou penúltima sessão do seu pacote, sugerindo continuidade.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-card">
                    <span className="font-bold text-xs text-amber-600 uppercase tracking-wider block mb-1">
                      Lembrete de Horário
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Enviada para recordar a data e o horário agendado, minimizando faltas e atrasos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                <strong className="font-bold block mb-1">Variáveis Dinâmicas Disponíveis:</strong>
                Nos modelos de texto você pode utilizar as tags <code>{"{nome}"}</code>, <code>{"{clinica}"}</code>, <code>{"{data}"}</code>, <code>{"{horario}"}</code>, <code>{"{profissional}"}</code> e <code>{"{servico}"}</code>. O sistema troca automaticamente essas tags pelos dados reais do cliente no momento do envio!
              </div>
            </section>
          )}

          {/* SESSÃO 3: NOTIFICAÇÕES */}
          {activeTab === "notificacoes" && (
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Bell size="xs" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Aba Notificações: Central de Alertas e Resumo Matinal
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                A aba <strong>Notificações</strong> é o coração da inteligência em tempo real do Totten. Ela permite que cada gestor e recepcionista personalize exatamente quais alertas deseja receber, mantendo o foco operacional sem sobrecarga de avisos desnecessários.
              </p>

              {/* Subseção A: Feed do Sino */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Bell size="xs" className="text-primary" />
                  A. Feed de Notificações em Tempo Real (Sininho no Topo)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  No topo direito do painel de administração existe o ícone do sino com um contador de novidades. Você pode ativar ou desativar individualmente os 5 gatilhos principais:
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <CalendarCheck size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Check-in Realizado
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Notifica no momento em que um cliente realiza check-in no totem ou é registrado na recepção, informando o profissional designado.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                      <CalendarCheck size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Solicitações de Agendamento
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Alerta quando um cliente envia um pedido de agendamento online através da sua página pública aguardando confirmação.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 shrink-0 mt-0.5">
                      <CalendarX size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Cancelamentos de Agendamento
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Avisa quando uma consulta é cancelada, permitindo que a recepção rapidamente libere ou remaneje o horário para outro cliente da lista de espera.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                      <Last size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Última Sessão de Pacote
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Gera um alerta crucial no momento em que o cliente conclui a última sessão do seu pacote, permitindo que o profissional recomende a renovação antes de a cliente sair do estabelecimento.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl border bg-card">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
                      <Package size="xs" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground">
                        Estoque Baixo
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Notifica a equipe administrativa quando a quantidade de qualquer insumo ou produto cadastrado atingir o limite mínimo de segurança.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subseção B: Daily Kickoff */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Coffee size="xs" className="text-amber-600" />
                  B. Resumo Matinal (Daily Kickoff)
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  O <strong>Resumo Matinal</strong> é um cartão inteligente posicionado no topo da página inicial do Dashboard. Ele resume a operação logo cedo com três indicadores essenciais:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground pl-1">
                  <li><strong className="text-foreground">Atendimentos de Hoje:</strong> Total de agendamentos programados para a jornada.</li>
                  <li><strong className="text-foreground">Solicitações Pendentes:</strong> Marcações feitas pelos clientes que aguardam aprovação.</li>
                  <li><strong className="text-foreground">Aniversariantes do Dia:</strong> Destaque com botão de atalho para parabenizar a cliente pelo WhatsApp com apenas um toque.</li>
                </ul>
              </div>
            </section>
          )}

          {/* SESSÃO 4: ACESSO */}
          {activeTab === "acesso" && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <CheckShield size="xs" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  Aba Acesso: Credenciais e Segurança
                </h2>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                A aba <strong>Acesso</strong> é destinada à gestão das credenciais de autenticação do usuário conectado, garantindo a proteção e a integridade de todas as informações confidenciais da sua empresa.
              </p>

              <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CheckCircle size="xs" className="text-blue-600" />
                  Diretrizes de Segurança de Acesso:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Alteração de Senha:</strong> Por exigência de segurança, para alterar a senha é necessário informar a senha atual válida.
                  </li>
                  <li>
                    <strong className="text-foreground">Validação Obrigatória:</strong> A nova senha deve ter no mínimo 6 caracteres e confirmação idêntica.
                  </li>
                  <li>
                    <strong className="text-foreground">Isolamento entre Usuários:</strong> Cada profissional deve utilizar seu próprio login. Os privilégios de acesso aos módulos (como Financeiro ou Histórico) são configurados pelo Administrador na página de *Profissionais*.
                  </li>
                </ul>
              </div>
            </section>
          )}

        </div>
      </div>
    </>
  );
}
