import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { redirects } from './src/redirects'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      // CMS media (Payload)
      { pathname: '/api/media/file/**' },
      // Public image assets
      { pathname: '/*.png' },
      { pathname: '/*.webp' },
      { pathname: '/*.jpg' },
      { pathname: '/*.jpeg' },
      // Public image assets in subfolders (e.g. /img/about.webp)
      { pathname: '/img/**' },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  async redirects() {
    return redirects
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
