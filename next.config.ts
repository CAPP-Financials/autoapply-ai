import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin Turbopack root so Next doesn't pick up an unrelated lockfile higher
  // up in the user's home directory.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Trim metadata exposed to clients
  poweredByHeader: false,
  reactStrictMode: true,
  // pdfjs-dist needs to stay external on the server (it imports from
  // Node's `fs` lazily); preserve as a Node-only package.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
