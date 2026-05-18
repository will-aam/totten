import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",

  // ========================================================
  // ESTRATÉGIA ANTI-ZUMBI: ATUALIZAÇÃO AGRESSIVA
  // ========================================================
  register: true,
  skipWaiting: true, // ESSENCIAL: Faz o SW assumir o controle na hora
  cleanupOutdatedCaches: true, // Deleta o lixo antigo
  // ========================================================
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
};

export default withPWA(nextConfig);
