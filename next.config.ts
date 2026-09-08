import type { NextConfig } from "next"

const isGithubPages = process.env.GITHUB_PAGES === "true"
const repo = "fic_ui"

const basePath = isGithubPages ? `/${repo}` : ""

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGithubPages
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
}

export default nextConfig
