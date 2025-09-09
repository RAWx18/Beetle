/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/github/:path*',
        destination: 'http://localhost:8000/api/github/:path*',
      },
    ]
  },
}

export default nextConfig
