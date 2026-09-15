import type { NextConfig } from "next";

// Host del backend, para autorizar next/image a optimizar las imagenes que
// sirve /static (fotos de producto y QR de pago subidos desde el panel).
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api");

const nextConfig: NextConfig = {
  images: {
    /**
     * SVG viene de dos origenes: los marcadores de posicion del catalogo, que
     * son archivos propios del repositorio en /public, y ahora tambien
     * archivos que un administrador sube desde el panel (/admin/media, por
     * ejemplo un QR de pago exportado como SVG). next/image bloquea SVG por
     * defecto porque uno remoto puede incrustar scripts; aqui la subida ya
     * exige rol ADMIN y ademas se sirve con una CSP que desactiva scripts, asi
     * que un SVG malicioso no podria ejecutar nada aunque lo intentara.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;
