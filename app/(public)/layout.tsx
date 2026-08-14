// app/(public)/layout.tsx
// Isola as páginas públicas do tema do sistema (painel admin).
// O ThemeProvider do root layout pode aplicar "dark" no <html>,
// mas esta div.light garante que as variáveis CSS do tema claro
// sejam restauradas para todo o conteúdo público, impedindo que
// a escolha de tema do admin vaze para o Link Bio, Site e Agenda.

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="light" data-public-layout="true" style={{ colorScheme: "light", minHeight: "100dvh" }}>
      {children}
    </div>
  );
}
