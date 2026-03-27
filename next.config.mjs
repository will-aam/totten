import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  register: true, // Garante que o SW seja registrado pelo plugin
  skipWaiting: true, // Força a nova versão a assumir o controle na hora, sem "waiting"
  cleanupOutdatedCaches: true, // Deleta pastas de cache de versões antigas automaticamente
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
