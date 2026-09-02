"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPersistedStore } from "@/lib/storage/persisted-store";

const STORAGE_KEY = "atlas-sport:cart:v1";
const MAX_QUANTITY_PER_LINE = 20;

/**
 * Linea guardada en el navegador.
 *
 * Ademas del identificador y la cantidad se conserva una copia de lo que ve el
 * usuario (nombre, imagen, precio). Es solo para pintar el carrito al instante
 * sin esperar a la red: el precio que se cobra lo recalcula siempre el
 * servidor al tasar el carrito, nunca este valor.
 */
export interface CartLine {
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  variantLabel: string;
  unitPriceCents: number;
  imageUrl: string | null;
  maxStock: number;
}

const EMPTY: CartLine[] = [];

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.variantId === "string" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

/**
 * El carrito sobrevive al cierre del navegador, asi que vive en localStorage.
 * El contenido puede venir de una version anterior de la tienda o haber sido
 * editado a mano, de modo que se filtra en lugar de confiar en su forma.
 */
const cartStore = createPersistedStore<CartLine[]>({
  key: STORAGE_KEY,
  initial: EMPTY,
  storage: () => window.localStorage,
  parse: (raw) => (Array.isArray(raw) ? raw.filter(isCartLine) : null),
});

interface CartContextValue {
  lines: CartLine[];
  /** Falso hasta leer el almacenamiento, para no pintar un carrito vacio enganoso. */
  isReady: boolean;
  itemCount: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  // En servidor y en el primer renderizado del cliente el store devuelve el
  // valor inicial; a partir de la hidratacion ya refleja el almacenamiento.
  const isReady = useSyncExternalStore(
    cartStore.subscribe,
    () => true,
    () => false,
  );

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    const current = cartStore.getSnapshot();
    const existing = current.find((entry) => entry.variantId === line.variantId);

    cartStore.set(
      existing
        ? current.map((entry) =>
            entry.variantId === line.variantId
              ? { ...entry, ...line, quantity: clamp(entry.quantity + quantity, line.maxStock) }
              : entry,
          )
        : [...current, { ...line, quantity: clamp(quantity, line.maxStock) }],
    );
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    const current = cartStore.getSnapshot();
    cartStore.set(
      quantity <= 0
        ? current.filter((entry) => entry.variantId !== variantId)
        : current.map((entry) =>
            entry.variantId === variantId
              ? { ...entry, quantity: clamp(quantity, entry.maxStock) }
              : entry,
          ),
    );
  }, []);

  const remove = useCallback((variantId: string) => {
    cartStore.set(cartStore.getSnapshot().filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => cartStore.clear(), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isReady,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, isReady, add, setQuantity, remove, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }
  return context;
}

function clamp(quantity: number, maxStock: number): number {
  const ceiling = Math.min(MAX_QUANTITY_PER_LINE, maxStock > 0 ? maxStock : MAX_QUANTITY_PER_LINE);
  return Math.max(1, Math.min(quantity, ceiling));
}
