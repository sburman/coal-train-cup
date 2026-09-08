/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/**/*": ["./data/**/*"],
  },
  async redirects() {
    return [
      {
        // The 2026 season is over, so the live leaderboard has nothing to
        // track. Temporary (307) on purpose: a permanent redirect would be
        // cached by browsers and would still be sending people to the 2026
        // archive when the 2027 season starts. Delete this entry to restore
        // the live page - app/leaderboard/page.tsx is untouched.
        source: "/leaderboard",
        destination: "/leaderboard-2026",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
