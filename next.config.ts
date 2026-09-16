import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone: la imagen Docker de produccion (CRM-11) copia solo
  // .next/standalone + .next/static, sin necesitar node_modules completo
  // ni el codigo fuente en la imagen final.
  output: "standalone",
};

export default nextConfig;
