/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Disable chunking completely
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        minimize: false,
      }
    }
    return config
  },
  // Disable compression
  compress: false,
  // Disable chunk output indicators
  devIndicators: {
    buildActivity: false
  }
}

export default nextConfig 