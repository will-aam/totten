import { Search } from "lucide-react";

export default function BrowserFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-totten bg-card-totten shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-totten bg-[#0c0c0e] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27272A]" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-totten bg-card-totten px-3 py-0.5 text-[10px] text-zinc-soft">
          <Search className="h-2.5 w-2.5" /> totten.com.br/admin/agenda
        </div>
      </div>
      {children}
    </div>
  );
}
