import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // recharts v3 and its deps ship ESM-only modules that webpack can't handle
  // without explicit transpilation
  transpilePackages: ["recharts", "victory-vendor"],

  // pino uses worker_threads for transports — must not be bundled by webpack
  experimental: {
    serverComponentsExternalPackages: ["pino", "pino-pretty"],
  },
  webpack(config, { dev }) {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "pub-8b013d06768841f7a14bf65b8219e6f6.r2.dev",
      },
    ],
  },
  output: "standalone",
};

const withPWAConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
});

export default withPWAConfig(nextConfig);
