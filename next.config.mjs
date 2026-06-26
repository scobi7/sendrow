/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "@react-pdf/renderer"],
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
