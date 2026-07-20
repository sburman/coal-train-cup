/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/**/*": ["./data/**/*"],
  },
};

module.exports = nextConfig;
