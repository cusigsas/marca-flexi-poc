import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // La cámara solo funciona en HTTPS o en localhost; Vercel ya entrega HTTPS.
  reactStrictMode: false,
};

export default nextConfig;
