import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: false,
  allowedDevOrigins: [
    "http://localhost",
    "http://127.0.0.1",
    "http://[::1]",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
  ],
};

export default nextConfig;
