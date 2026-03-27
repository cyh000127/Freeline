import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
    outputFileTracingRoot: process.cwd(),
  basePath: "/super",
    turbopack: {
        root: process.cwd(),
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/super",
                basePath: false,
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
