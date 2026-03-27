import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
    outputFileTracingRoot: process.cwd(),
  basePath: "/booth",
    turbopack: {
        root: process.cwd(),
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/booth",
                basePath: false,
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
