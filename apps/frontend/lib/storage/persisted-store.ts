/**
 * Estado respaldado por el almacenamiento del navegador.
 *
 * Se implementa como un store externo en lugar de useState mas useEffect
 * porque eso es exactamente lo que React expone useSyncExternalStore para
 * resolver: leer una fuente que solo existe en el cliente sin provocar un
 * renderizado en cascada tras el montaje, y sin desajustar la hidratacion.
 *
 * Como efecto secundario desaparece la escucha manual del evento "storage":
 * la sincronizacion entre pestanas queda cubierta por la misma suscripcion.
 */
export interface PersistedStore<T> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T) => void;
  clear: () => void;
}

export function createPersistedStore<T>(options: {
  key: string;
  initial: T;
  /** Decide si lo leido del almacenamiento es utilizable. */
  parse: (raw: unknown) => T | null;
  storage: () => Storage;
}): PersistedStore<T> {
  const listeners = new Set<() => void>();

  // getSnapshot debe devolver la MISMA referencia mientras el valor no cambie,
  // o React entra en un bucle de renderizados. Se memoiza contra la cadena
  // cruda y solo se vuelve a parsear cuando esa cadena difiere.
  let cachedRaw: string | null = null;
  let cachedValue: T = options.initial;
  let initialized = false;

  // Respaldo para navegadores en modo privado o con el almacenamiento
  // bloqueado: sin el, el estado se perderia en cada renderizado.
  let memoryRaw: string | null = null;
  let useMemory = false;

  function read(): string | null {
    if (useMemory) return memoryRaw;
    try {
      return options.storage().getItem(options.key);
    } catch {
      useMemory = true;
      return memoryRaw;
    }
  }

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function commit(raw: string | null, value: T): void {
    cachedRaw = raw;
    cachedValue = value;
    initialized = true;
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);

      // El evento storage solo lo emiten OTRAS pestanas; los cambios propios
      // se anuncian desde set() y clear().
      const onStorage = (event: StorageEvent) => {
        if (event.key === options.key) {
          initialized = false;
          onChange();
        }
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },

    getSnapshot() {
      const raw = read();
      if (initialized && raw === cachedRaw) return cachedValue;

      if (raw === null) {
        commit(null, options.initial);
        return cachedValue;
      }

      try {
        commit(raw, options.parse(JSON.parse(raw)) ?? options.initial);
      } catch {
        // Contenido corrupto o de una version anterior de la tienda.
        commit(raw, options.initial);
      }
      return cachedValue;
    },

    // Durante el renderizado en servidor no hay almacenamiento: se devuelve el
    // valor inicial, y la primera lectura real ocurre ya en el cliente.
    getServerSnapshot() {
      return options.initial;
    },

    set(next) {
      const raw = JSON.stringify(next);
      try {
        options.storage().setItem(options.key, raw);
      } catch {
        useMemory = true;
      }
      memoryRaw = raw;
      // Se cachea la cadena recien escrita para que la siguiente lectura
      // devuelva "next" tal cual, sin reparsear ni crear otra referencia.
      commit(raw, next);
      notify();
    },

    clear() {
      try {
        options.storage().removeItem(options.key);
      } catch {
        useMemory = true;
      }
      memoryRaw = null;
      commit(null, options.initial);
      notify();
    },
  };
}
