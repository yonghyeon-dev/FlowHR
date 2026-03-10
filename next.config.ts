import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["src"]
  },
  typescript: {
    tsconfigPath: "./tsconfig.next.json"
  },
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: true,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
    parallelServerCompiles: false,
    parallelServerBuildTraces: false
  }
};

export default nextConfig;
