import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', '@timecapsule/core'],
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/branding': path.resolve(__dirname, 'packages/timecapsule/src/branding.js'),
      '@timecapsule/core': path.resolve(__dirname, 'packages/timecapsule/src/index.js'),
      '@/packages/studio/src/models': path.resolve(
        __dirname,
        'packages/timecapsule/src/models/index.js'
      ),
      '@/packages/studio/src/muapi': path.resolve(
        __dirname,
        'packages/timecapsule/src/client/index.js'
      ),
      '@/packages/studio/src/kie': path.resolve(
        __dirname,
        'packages/timecapsule/src/client/index.js'
      ),
      [path.resolve(__dirname, 'packages/studio/src/models.js')]: path.resolve(
        __dirname,
        'packages/timecapsule/src/models/index.js'
      ),
      [path.resolve(__dirname, 'packages/studio/src/kie.js')]: path.resolve(
        __dirname,
        'packages/timecapsule/src/client/index.js'
      ),
    };
    return config;
  },
};

export default nextConfig;
