import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
  // 🔥 A MUDANÇA CRÍTICA: false.
  // O SW baixa a atualização e fica aguardando o usuário clicar no botão do nosso Modal.
  skipWaiting: false,
  cleanupOutdatedCaches: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Força a CDN a nunca cachear o Service Worker (Essencial)
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=0, must-revalidate",
          },
        ],
      },
    ];
  },
  turbopack: {},
};

export default withPWA(nextConfig);
