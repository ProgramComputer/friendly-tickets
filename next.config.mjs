/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow reasonable time for page generation
  staticPageGenerationTimeout: 120,
  experimental: {
    // Enable memory cache for ISR
    isrMemoryCacheSize: 50,
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  // Disable chunking and optimization
  webpack: (config, { dev, isServer }) => {
    // Disable code splitting
    config.optimization = {
      minimize: false,
      splitChunks: false,
      runtimeChunk: false
    }

    // Handle Node.js module polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: false,
      crypto: false,
      http: false,
      https: false,
      querystring: false,
      net: false,
      tls: false,
      fs: false,
      stream: false,
      buffer: false,
      url: false,
      util: false,
      os: false,
      zlib: false,
      timers: false,
      'timers/promises': false
    }

    // Ignore specific module warnings
    config.ignoreWarnings = [
      { module: /node_modules\/socket\.io/ },
      { module: /node_modules\/engine\.io/ },
      { module: /node_modules\/mime-types/ },
      { module: /node_modules\/accepts/ },
      { module: /node_modules\/socket\.io-adapter/ },
      { module: /node_modules\/timers/ },
      { module: /node_modules\/engine\.io\/build\/socket\.js/ }
    ]

    return config
  },
  // Force all pages to be server-side rendered
  output: 'standalone',
  distDir: '.next',
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  images: {
    unoptimized: true
  }
}

export default nextConfig 