// app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  //  Redireciona DIRETAMENTE para o totem (sem precisar de auth)
  redirect("/totem/idle");
}
