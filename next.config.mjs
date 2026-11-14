/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  eslint: { ignoreDuringBuilds: true },
  // The GHG report PDF reads bundled Archivo fonts from disk at render time (components/pdf/GHGReportPDF.tsx).
  outputFileTracingIncludes: { "/api/report/pdf": ["./components/pdf/fonts/**"] },
};
export default nextConfig;
