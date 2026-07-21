import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // A lockfile in the parent Documents/GitHub folder otherwise makes Next
  // misdetect the workspace root as one level up from this project.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
