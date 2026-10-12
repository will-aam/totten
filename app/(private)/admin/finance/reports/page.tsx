// app/(private)/admin/finance/reports/page.tsx
import { redirect } from "next/navigation";

export default function ReportsPage() {
  redirect("/admin/finance/dashboard");
}
