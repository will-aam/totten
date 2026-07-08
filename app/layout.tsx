// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Philosopher } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { InstallPrompt } from "@/components/install-prompt";
import { SWRProvider } from "@/components/swr-provider";
import { PWAUpdater } from "@/components/pwa-updater";
// @ts-expect-error CSS module declaration is provided by Next.js build tooling.
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const philosopher = Philosopher({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-philosopher",
});

export const metadata: Metadata = {
  title: "Totten - Sistema de Gestão e Check-in",
  description:
    "Sistema completo de gestão de check-ins, pacotes de sessões e controle de atendimento para empresas.",
  keywords: [
    "sistema de gestão",
    "totem de atendimento",
    "check-in",
    "pacotes de sessões",
    "gestão de clientes",
    "automação de atendimento",
  ],
  openGraph: {
    title: "Totten - Sistema de Gestão e Check-in",
    description:
      "Sistema completo de gestão de check-ins e pacotes de sessões.",
    url: "https://totten.com.br",
    siteName: "Totten",
    locale: "pt_BR",
    type: "website",
  },
  //  ADIÇÕES: Cache Busting (Força o navegador a baixar os novos ícones)
  manifest: "/site.webmanifest?v=2",
  icons: {
    icon: "/favicon.ico?v=2",
    apple: "/apple-touch-icon.png?v=2",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Totten",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${philosopher.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <SWRProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {/* PWAUpdater e InstallPrompt são componentes para gerenciar atualizações e prompt de instalação do PWA */}
              <PWAUpdater />
              <InstallPrompt />
              {children}
              {/* Toaster é um componente para exibir notificações ao usuário */}
              <Toaster position="top-right" richColors />
              {/* Analytics é um componente para rastreamento de análises, como o Vercel Analytics */}
              <Analytics />
              {/* ThemeProvider é um componente para gerenciar o tema da aplicação */}
            </ThemeProvider>
            {/* SWRProvider é um componente para gerenciar o estado da aplicação */}
          </SWRProvider>
          {/* SessionProvider é um componente para gerenciar a sessão do usuário */}
        </SessionProvider>
      </body>
    </html>
  );
}
