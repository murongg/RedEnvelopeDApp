/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects() {
    return [
      {
        source: "/",
        destination: "/create",
        permanent: true,
      },
    ];
  }
};

module.exports = nextConfig;
