/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Compress responses
  compress: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Simplified webpack config to avoid issues
  webpack: (config, { isServer, dev }) => {
    // Font loader (simplified)
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource',
    })
    
    // Disable webpack cache in development to avoid issues
    if (dev) {
      config.cache = false
      // Disable chunk optimization in dev to prevent missing chunk errors
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      }
    }
    
    return config
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
  
  // Experimental features for better performance
  // optimizeCss disabled temporarily to fix CSS loading issues
  // experimental: {
  //   optimizeCss: true,
  // },
}

module.exports = nextConfig