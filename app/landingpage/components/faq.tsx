import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionHeader from "./section-header";

export default function FAQSection() {
  const faqs = [
    {
      q: "Preciso instalar algo para usar o Totten?",
      a: "Não. O Totten roda 100% no navegador e também pode ser instalado como PWA em Android, iOS e desktop, sem passar por loja de aplicativos.",
    },
    {
      q: "O totem de autoatendimento funciona em qualquer aparelho?",
      a: "Sim. Ele funciona em qualquer tablet ou celular com navegador atualizado — basta abrir o modo Totem no seu Totten.",
    },
    {
      q: "Posso migrar meus dados de outro sistema?",
      a: "Sim. Nossa equipe ajuda na importação de clientes, agendamentos e histórico durante o onboarding, sem custo adicional nos planos Business e Scale.",
    },
    {
      q: "Existe fidelidade ou multa de cancelamento?",
      a: "Não. Todos os planos são mensais e você pode cancelar quando quiser diretamente pelo painel, sem burocracia.",
    },
    {
      q: "Como funciona o suporte?",
      a: "Suporte por e-mail em todos os planos, chat prioritário no Business e um gerente de sucesso dedicado no Scale, com SLA garantido.",
    },
    {
      q: "Meus dados estão seguros?",
      a: "Sim. Toda a plataforma opera com criptografia em trânsito e em repouso, backups automáticos diários e conformidade com a LGPD.",
    },
  ];
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Perguntas frequentes."
          subtitle="Não encontrou o que procurava? Fale com a nossa equipe."
        />
        <div className="mt-12 rounded-2xl border border-totten bg-card-totten p-2">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="border-b border-totten last:border-b-0"
              >
                <AccordionTrigger className="px-4 text-left text-sm font-medium hover:no-underline hover:text-white">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="px-4 text-sm leading-relaxed text-zinc-soft">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
