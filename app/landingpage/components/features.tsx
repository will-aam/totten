import { Bell, Calendar, CreditCard, Package, Ticket } from "@boxicons/react";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Palette,
  StickyNote,
  UserCog,
  Users,
} from "lucide-react";
import SectionHeader from "./section-header";

export default function Features() {
  const features = [
    {
      icon: Calendar,
      title: "Agendamentos inteligentes",
      desc: "Recorrentes e visualização semelhante ao Google Agenda.",
    },
    {
      icon: CheckCircle2,
      title: "Check-in automático",
      desc: "Cliente realiza check-in por CPF ou telefone no Totem.",
    },
    {
      icon: Users,
      title: "Gestão de clientes",
      desc: "Cadastro completo com histórico integrado.",
    },
    {
      icon: Package,
      title: "Pacotes",
      desc: "Venda e controle de pacotes de serviços.",
    },
    {
      icon: CreditCard,
      title: "Financeiro",
      desc: "Caixa, contas, pagamentos e recebimentos.",
    },
    {
      icon: Boxes,
      title: "Estoque inteligente",
      desc: "Baixa automática dos produtos utilizados.",
    },
    // {
    //   icon: ClipboardList,
    //   title: "Ficha de anamnese",
    //   desc: "Prontuários personalizados para clínicas.",
    // },
    // {
    //   icon: UserCog,
    //   title: "Gestão de profissionais",
    //   desc: "Colaboradores, escalas e permissões.",
    // },
    // {
    //   icon: Ticket,
    //   title: "Vouchers",
    //   desc: "Crie e gerencie cupons e vale-presentes.",
    // },
    // {
    //   icon: StickyNote,
    //   title: "Notas",
    //   desc: "Espaço para observações internas da equipe.",
    // },
    // {
    //   icon: Bell,
    //   title: "Notificações",
    //   desc: "Alertas importantes em tempo real.",
    // },
    // {
    //   icon: Palette,
    //   title: "Temas personalizados",
    //   desc: "Personalize o sistema conforme sua marca.",
    // },
  ];
  return (
    <section
      id="recursos"
      className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <SectionHeader
        eyebrow="Recursos"
        title="Tudo o que sua empresa precisa em um único sistema."
        subtitle="Uma plataforma completa, pensada para operações que dependem de agendamentos precisos e clientes bem atendidos."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-2xl border border-totten bg-card-totten p-6 transition-all hover:border-white/20 hover:bg-[#1c1c1f]"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/3 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-totten bg-[#0c0c0e]">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-soft">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
