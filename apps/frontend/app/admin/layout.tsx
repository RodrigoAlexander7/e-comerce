import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Atlas Sport" },
  robots: { index: false, follow: false },
};

/**
 * Contenedor del panel de administracion.
 *
 * proxy.ts ya bloquea /admin en el borde para quien no tiene rol ADMIN o
 * superior, pero esta comprobacion se repite aqui a proposito: un proxy mal
 * configurado, una version antigua en cache o un despliegue que lo omita no
 * deben dejar el panel abierto. La defensa real vive en el backend (todos los
 * endpoints /admin/* exigen el rol), esto es una segunda capa en el borde
 * correcto para no renderizar ni un pixel del panel a quien no corresponde.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    redirect("/cuenta");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
