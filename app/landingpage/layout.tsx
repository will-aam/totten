export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark bg-[#09090b] text-white">
      {children}
    </div>
  );
}
