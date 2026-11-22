import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.SIHALAL_AUTH_TEST === "1" ? ".next-auth-test" : ".next",
  logging: {
    incomingRequests: {ignore: [/\/auth\/confirm(?:\?|$)/]},
    serverFunctions: false,
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
