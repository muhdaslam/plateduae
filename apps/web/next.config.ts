import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pins the workspace root to this repo — without it, Next.js can infer
  // the wrong root if a stray lockfile exists in a parent directory.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
