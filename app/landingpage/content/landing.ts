import { Calendar, Users, CheckCircle2, Boxes } from "lucide-react";
import { Package, CreditCard } from "@boxicons/react";

export const landingContent = {
  hero: {
    badge: {
      text: "Novo — Totem de autoatendimento",
      href: "#recursos",
    },

    title:
      "Gestão inteligente para clínicas, salões e negócios de agendamentos.",

    description:
      "O Totten reúne agendamento, check-in, financeiro, estoque, pacotes, prontuários e gestão completa em um único sistema moderno.",

    primaryButton: "Começar agora",

    secondaryButton: "Agendar demonstração",

    highlights: ["Sem cartão", "14 dias grátis", "Cancelamento livre"],
  },

  features: {
    eyebrow: "Recursos",

    title: "Tudo o que sua empresa precisa em um único sistema.",

    subtitle:
      "Uma plataforma completa, pensada para operações que dependem de agendamentos precisos e clientes bem atendidos.",

    items: [
      {
        icon: Calendar,
        title: "Agendamentos inteligentes",
        description: "Recorrentes e visualização semelhante ao Google Agenda.",
      },

      {
        icon: CheckCircle2,
        title: "Check-in automático",
        description: "Cliente realiza check-in por CPF ou telefone no Totem.",
      },
    ],
  },

  agenda: {
    badge: "Agenda",

    title: "A agenda que sua equipe já sabe usar.",

    description:
      "Interface familiar semelhante ao Google Agenda. Arraste, filtre por profissional e visualize sua operação em qualquer escala.",

    items: [
      "Visualização diária, semanal e mensal",
      "Arrastar e reagendar",
      "Filtros por profissional e serviço",
      "Agendamentos recorrentes",
    ],
  },
};
