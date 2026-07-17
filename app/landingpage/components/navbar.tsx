import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const links = [
    { label: "Recursos", href: "#recursos" },
    { label: "Agenda", href: "#agenda" },
    { label: "Totem", href: "#totem" },
    { label: "Preços", href: "#precos" },
    { label: "FAQ", href: "#faq" },
    { label: "Demonstração", href: "#demo" },
  ];
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-soft transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {/* <ThemeToggle /> */}
          <Button variant="default" size="sm" className="hidden sm:inline-flex">
            Entrar
          </Button>
          <Button size="icon" variant="ghost" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
