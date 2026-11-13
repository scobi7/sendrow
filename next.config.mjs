/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
