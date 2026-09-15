"use client";

import { useEffect, useState } from "react";
import { adminGet, adminPatch, adminPost, AdminApiError } from "@/lib/admin/client";
import { PlusIcon } from "@/components/icons";
import type { AdminCategory } from "@/lib/admin/types";

/**
 * CRUD de categorias.
 *
 * Sin pagina de edicion propia: cada fila se edita en linea, porque una
 * categoria tiene tres campos y una tabla es mas rapida de recorrer que
 * navegar a una pagina por cada una.
 */
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  function load() {
    adminGet<AdminCategory[]>("/admin/categories")
      .then(setCategories)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar."));
  }

  useEffect(load, []);

  async function createCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await adminPost("/admin/categories", { name: newName.trim() });
      setNewName("");
      load();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "No se pudo crear la categoria.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(category: AdminCategory) {
    try {
      await adminPatch(`/admin/categories/${category.id}/activo`, { isActive: !category.isActive });
      load();
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "No se pudo cambiar el estado.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Categorias</h1>

      <form onSubmit={createCategory} className="flex max-w-md gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Nombre de la categoria"
          className="h-11 flex-1 border border-line bg-paper px-3 text-sm focus:border-ink"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="label-caps inline-flex h-11 cursor-pointer items-center gap-2 bg-accent px-4 text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="size-4" />
          Crear
        </button>
      </form>

      {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}

      {!categories ? (
        <div className="h-48 animate-pulse border border-line bg-mist" aria-label="Cargando categorias" />
      ) : (
        <div className="overflow-x-auto border border-line bg-paper">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-mist text-xs text-muted">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 text-right font-medium">Prendas</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{category.slug}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{category.productCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`label-caps ${category.isActive ? "text-ink" : "text-ash"}`}
                    >
                      {category.isActive ? "Activa" : "Deshabilitada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(category)}
                      className="label-caps cursor-pointer text-muted underline hover:text-ink"
                    >
                      {category.isActive ? "Deshabilitar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
