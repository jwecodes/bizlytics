import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "plotly.js",
      "react-plotly.js",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tooltip",
    ],
  },
  turbopack: {},
}

export default nextConfig
