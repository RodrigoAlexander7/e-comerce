import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

/**
 * Boton del sistema.
 *
 * "primary" es la unica variante que usa el color de acento y se reserva a la
 * accion principal de cada pantalla: anadir al carrito, continuar, pagar. El
 * resto de acciones usan tinta negra o contorno, de modo que el acento nunca
 * compite consigo mismo dentro de una misma vista.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-paper hover:bg-accent-strong",
  solid: "bg-ink text-paper hover:bg-graphite",
  outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-mist",
};

const SIZES: Record<Size, string> = {
  // Todas las alturas superan los 44 px de area tactil minima recomendada.
  sm: "h-11 px-5 text-xs",
  md: "h-12 px-7 text-sm",
  lg: "h-14 px-9 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 label-caps cursor-pointer " +
  "transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";

function classesFor(variant: Variant, size: Size, className?: string): string {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={classesFor(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/** Misma apariencia que Button, pero navega. Se mantiene como enlace real
 *  para no romper "abrir en pestana nueva" ni la navegacion por teclado. */
export function ButtonLink({
  variant = "solid",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={classesFor(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
