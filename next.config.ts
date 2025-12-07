import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@coinbase/onchainkit"],
  turbopack: {},
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Suppress MetaMask SDK warning for missing react-native module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
    };
    
    return config;
  },
};

export default nextConfig;
