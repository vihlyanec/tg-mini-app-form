import type { NextConfig } from 'next';

const githubPagesRepo =
  process.env.GITHUB_PAGES_REPO ??
  process.env.GITHUB_REPOSITORY?.split('/')[1] ??
  '';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = isGithubPages
  ? {
      output: 'export',
      images: {
        unoptimized: true,
      },
      trailingSlash: true,
      ...(githubPagesRepo
        ? {
            assetPrefix: `/${githubPagesRepo}/`,
            basePath: `/${githubPagesRepo}`,
          }
        : {}),
    }
  : {};

export default nextConfig;
