const isMobileBuild = process.env.BUILD_TARGET === 'capacitor';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: isMobileBuild ? 'export' : 'standalone',
  trailingSlash: isMobileBuild,
  images: {
    unoptimized: isMobileBuild
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' }
        ]
      }
    ];
  }
};

export default nextConfig;
