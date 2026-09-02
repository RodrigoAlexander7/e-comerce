"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  ClipboardIcon,
  GridIcon,
  LayersIcon,
  SettingsIcon,
  TagIcon,
} from "@/components/icons";
import { logoutUrl } from "@/lib/auth-links";
import type { SessionUser } from "@/lib/api/types";

const NAV = [
  { href: "/admin", label: "Panel", icon: GridIcon, exact: true },
  { href: "/admin/ordenes", label: "Ordenes", icon: ClipboardIcon, exact: false },
  { href: "/admin/productos", label: "Productos", icon: TagIcon, exact: false },
  { href: "/admin/categorias", label: "Categorias", icon: LayersIcon, exact: false },
  { href: "/admin/ajustes", label: "Ajustes", icon: SettingsIcon, exact: false },
] as const;

/**
 * Cascara del panel: barra lateral fija y contenido.
 *
 * Estetica deliberadamente distinta de la tienda: aqui prima la densidad de
 * informacion sobre el espacio en blanco editorial. Sigue siendo el mismo
 * sistema de color y tipografia, solo con una escala mas compacta.
 */
export function AdminShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper lg:flex">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link href="/admin" className="font-display text-xl">
            Atlas Sport
          </Link>
        </div>

        <nav className="flex-1 px-3 py-6">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-ink text-paper" : "text-steel hover:bg-mist hover:text-ink"
                    }`}
                  >
                    <Icon className="size-4.5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="label-caps mt-0.5 text-ash">{user.role}</p>
          <div className="mt-3 flex gap-3 text-xs">
            <Link href="/" className="text-muted underline hover:text-ink">
              Ver tienda
            </Link>
            <a href={logoutUrl()} className="text-muted underline hover:text-ink">
              Cerrar sesion
            </a>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
          <Link href="/admin" className="font-display text-lg">
            Atlas Sport
          </Link>
          <a href={logoutUrl()} className="text-xs text-muted underline">
            Cerrar sesion
          </a>
        </header>

        {/* Navegacion compacta para movil: la barra lateral solo aparece desde lg. */}
        <nav className="flex overflow-x-auto border-b border-line bg-paper px-2 lg:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`label-caps shrink-0 border-b-2 px-3 py-3 ${
                  active ? "border-ink text-ink" : "border-transparent text-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
