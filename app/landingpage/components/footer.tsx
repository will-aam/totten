import { Github, Instagram, Linkedin, Youtube } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const cols = [
    { t: "Produto", l: ["Recursos", "Preços", "Totem", "Integrações"] },
    { t: "Empresa", l: ["Sobre", "Contato", "Blog", "Carreiras"] },
    { t: "Legal", l: ["Privacidade", "Termos", "Segurança", "LGPD"] },
  ];
  return (
    <footer className="border-t border-totten py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className={`flex items-center gap-2`}>
              <Image
                src="/totten-brac.png"
                alt="Logo"
                width={36}
                height={36}
                className="object-contain hidden dark:block"
                priority
              />
              <span className="font-philosopher text-lg font-semibold tracking-tight">
                Totten
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-soft">
              Gestão completa e moderna para negócios baseados em agendamentos.
            </p>
            <div className="mt-5 flex gap-3">
              {[Youtube, Instagram, Linkedin, Github].map((I, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-totten bg-card-totten text-zinc-soft transition-colors hover:text-white"
                >
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.t}>
              <div className="text-xs font-semibold uppercase tracking-wider text-white">
                {c.t}
              </div>
              <ul className="mt-4 space-y-2">
                {c.l.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-zinc-soft transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-totten pt-6 text-xs text-zinc-soft sm:flex-row">
          <div>
            © {new Date().getFullYear()} Totten. Todos os direitos reservados.
          </div>
          <div>Feito com precisão para operações de agendamento.</div>
        </div>
      </div>
    </footer>
  );
}
