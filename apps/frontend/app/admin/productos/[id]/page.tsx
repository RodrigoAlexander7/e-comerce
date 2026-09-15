"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  adminDelete,
  adminGet,
  adminPatch,
  adminPost,
  AdminApiError,
} from "@/lib/admin/client";
import { formatPrice } from "@/lib/format";
import { Field, inputClass, selectClass } from "@/components/ui/field";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { AdminCategory, AdminProduct, AdminVariant } from "@/lib/admin/types";
import { CLOTHING_SIZES } from "@/lib/admin/sizes";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function load() {
    adminGet<AdminProduct>(`/admin/products/${params.id}`)
      .then(setProduct)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "No se pudo cargar."));
  }

  useEffect(load, [params.id]);
  useEffect(() => {
    adminGet<AdminCategory[]>("/admin/categories").then(setCategories);
  }, []);

  if (error && !product) {
    return <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p>;
  }
  if (!product) {
    return <div className="h-96 animate-pulse border border-line bg-mist" aria-label="Cargando prenda" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="label-caps text-muted">{product.categoryName}</p>
          <h1 className="font-display mt-1 text-3xl">{product.name}</h1>
        </div>
        <ActiveToggle
          productId={product.id}
          isActive={product.isActive}
          onChanged={(updated) => setProduct(updated)}
        />
      </div>

      {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}
      {savedAt ? (
        <p className="flex items-center gap-2 text-sm text-accent" role="status">
          <CheckIcon className="size-4" />
          Cambios guardados.
        </p>
      ) : null}

      <GeneralForm
        product={product}
        categories={categories ?? []}
        onSaved={(updated) => {
          setProduct(updated);
          setSavedAt(Date.now());
          setError(null);
        }}
        onError={setError}
      />

      <VariantsSection product={product} onChange={setProduct} onError={setError} />
    </div>
  );
}

function ActiveToggle({
  productId,
  isActive,
  onChanged,
}: {
  productId: string;
  isActive: boolean;
  onChanged: (product: AdminProduct) => void;
}) {
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const updated = await adminPatch<AdminProduct>(`/admin/products/${productId}/activo`, {
        isActive: !isActive,
      });
      onChanged(updated);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`label-caps inline-flex h-10 cursor-pointer items-center px-4 transition-colors disabled:opacity-50 ${
        isActive ? "border border-line text-muted hover:border-danger hover:text-danger" : "bg-ink text-paper hover:bg-graphite"
      }`}
    >
      {isActive ? "Retirar de la tienda" : "Publicar en la tienda"}
    </button>
  );
}

function GeneralForm({
  product,
  categories,
  onSaved,
  onError,
}: {
  product: AdminProduct;
  categories: AdminCategory[];
  onSaved: (product: AdminProduct) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [basePrice, setBasePrice] = useState((product.basePriceCents / 100).toFixed(2));
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compareAtPriceCents !== null ? (product.compareAtPriceCents / 100).toFixed(2) : "",
  );
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [images, setImages] = useState(product.images.map((image) => ({ url: image.url, alt: image.alt })));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const updated = await adminPatch<AdminProduct>(`/admin/products/${product.id}`, {
        name,
        description,
        categoryId,
        basePriceCents: Math.round(Number(basePrice) * 100),
        compareAtPriceCents: compareAtPrice ? Math.round(Number(compareAtPrice) * 100) : null,
        isFeatured,
        images: images.filter((image) => image.url.trim() !== ""),
      });
      onSaved(updated);
    } catch (cause) {
      onError(cause instanceof AdminApiError ? cause.message : "No se pudo guardar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-6 border border-line bg-paper p-6">
      <h2 className="label-caps text-ash">Datos generales</h2>

      <Field label="Nombre" htmlFor="edit-name" required>
        <input
          id="edit-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className={inputClass}
        />
      </Field>

      <Field label="Descripcion" htmlFor="edit-description" required>
        <textarea
          id="edit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={4}
          className="w-full border border-line bg-paper p-3 text-base focus:border-ink"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Categoria" htmlFor="edit-category" required>
          <select
            id="edit-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={selectClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-3 self-end pb-3">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="size-4 cursor-pointer accent-[#c2410c]"
          />
          <span className="text-sm">Destacar en la portada</span>
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Precio (S/)" htmlFor="edit-price" required>
          <input
            id="edit-price"
            type="number"
            min="0"
            step="0.10"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Precio anterior (S/)" htmlFor="edit-compare">
          <input
            id="edit-compare"
            type="number"
            min="0"
            step="0.10"
            value={compareAtPrice}
            onChange={(event) => setCompareAtPrice(event.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="label-caps text-ash">Imagenes</legend>
        {images.map((image, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={image.url}
              onChange={(event) =>
                setImages((current) =>
                  current.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)),
                )
              }
              placeholder="/products/mi-imagen.svg"
              className={`${inputClass} flex-1`}
            />
            <input
              value={image.alt}
              onChange={(event) =>
                setImages((current) =>
                  current.map((item, i) => (i === index ? { ...item, alt: event.target.value } : item)),
                )
              }
              placeholder="Texto alternativo"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
              aria-label="Quitar imagen"
              className="grid size-11 shrink-0 cursor-pointer place-items-center border border-line text-muted hover:text-danger"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setImages((current) => [...current, { url: "", alt: "" }])}
          className="label-caps inline-flex w-fit cursor-pointer items-center gap-2 text-muted hover:text-ink"
        >
          <PlusIcon className="size-3.5" />
          Anadir imagen
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={isSubmitting}
        className="label-caps inline-flex h-12 w-fit cursor-pointer items-center bg-ink px-8 text-paper transition-colors hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function VariantsSection({
  product,
  onChange,
  onError,
}: {
  product: AdminProduct;
  onChange: (product: AdminProduct) => void;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState({ size: "M", colorName: "", colorHex: "#0A0A0A", stock: "0" });
  const [isAdding, setIsAdding] = useState(false);

  async function addVariant(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.colorName.trim()) {
      onError("Indica el color de la nueva variante.");
      return;
    }
    setIsAdding(true);
    try {
      const updated = await adminPost<AdminProduct>(`/admin/products/${product.id}/variantes`, {
        size: draft.size,
        colorName: draft.colorName,
        colorHex: draft.colorHex,
        stock: Number(draft.stock) || 0,
      });
      onChange(updated);
      setDraft({ size: "M", colorName: "", colorHex: "#0A0A0A", stock: "0" });
    } catch (cause) {
      onError(cause instanceof AdminApiError ? cause.message : "No se pudo anadir la variante.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <section className="border border-line bg-paper p-6">
      <h2 className="label-caps text-ash">Variantes</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="py-2 font-medium">SKU</th>
              <th className="py-2 font-medium">Talla</th>
              <th className="py-2 font-medium">Color</th>
              <th className="py-2 font-medium">Stock</th>
              <th className="py-2 font-medium">Precio propio</th>
              <th className="py-2 font-medium">Estado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                basePriceCents={product.basePriceCents}
                onChange={onChange}
                onError={onError}
              />
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addVariant} className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-5">
        <div>
          <label className="mb-1 block text-xs text-muted">Talla</label>
          <select
            value={draft.size}
            onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
            className={`${selectClass} w-24`}
          >
            {CLOTHING_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Color</label>
          <input
            value={draft.colorName}
            onChange={(event) => setDraft((current) => ({ ...current, colorName: event.target.value }))}
            className={`${inputClass} w-36`}
          />
        </div>
        <input
          type="color"
          value={draft.colorHex}
          onChange={(event) => setDraft((current) => ({ ...current, colorHex: event.target.value }))}
          aria-label="Color de muestra"
          className="h-11 w-14 cursor-pointer border border-line bg-paper"
        />
        <div>
          <label className="mb-1 block text-xs text-muted">Stock</label>
          <input
            type="number"
            min="0"
            value={draft.stock}
            onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value }))}
            className={`${inputClass} w-24`}
          />
        </div>
        <button
          type="submit"
          disabled={isAdding}
          className="label-caps inline-flex h-11 cursor-pointer items-center gap-2 bg-accent px-4 text-paper transition-colors hover:bg-accent-strong disabled:opacity-40"
        >
          <PlusIcon className="size-4" />
          Anadir variante
        </button>
      </form>
    </section>
  );
}

function VariantRow({
  variant,
  basePriceCents,
  onChange,
  onError,
}: {
  variant: AdminVariant;
  basePriceCents: number;
  onChange: (product: AdminProduct) => void;
  onError: (message: string) => void;
}) {
  const [stock, setStock] = useState(String(variant.stock));
  const [price, setPrice] = useState(variant.priceCents !== null ? (variant.priceCents / 100).toFixed(2) : "");
  const [isSaving, setIsSaving] = useState(false);

  const dirty = stock !== String(variant.stock) || price !== (variant.priceCents !== null ? (variant.priceCents / 100).toFixed(2) : "");

  async function save() {
    setIsSaving(true);
    try {
      const updated = await adminPatch<AdminProduct>(`/admin/products/variantes/${variant.id}`, {
        stock: Number(stock) || 0,
        priceCents: price ? Math.round(Number(price) * 100) : null,
      });
      onChange(updated);
    } catch (cause) {
      onError(cause instanceof AdminApiError ? cause.message : "No se pudo actualizar la variante.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive() {
    setIsSaving(true);
    try {
      const updated = await adminPatch<AdminProduct>(`/admin/products/variantes/${variant.id}`, {
        isActive: !variant.isActive,
      });
      onChange(updated);
    } catch (cause) {
      onError(cause instanceof AdminApiError ? cause.message : "No se pudo cambiar el estado.");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Quitar la variante ${variant.size} / ${variant.colorName}?`)) return;
    setIsSaving(true);
    try {
      const updated = await adminDelete<AdminProduct>(`/admin/products/variantes/${variant.id}`);
      onChange(updated);
    } catch (cause) {
      onError(cause instanceof AdminApiError ? cause.message : "No se pudo quitar la variante.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2.5 font-mono text-xs text-muted">{variant.sku}</td>
      <td className="py-2.5">{variant.size}</td>
      <td className="py-2.5">
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-3.5 rounded-full ring-1 ring-line ring-inset"
            style={{ backgroundColor: variant.colorHex }}
          />
          {variant.colorName}
        </span>
      </td>
      <td className="py-2.5">
        <input
          type="number"
          min="0"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          className={`${inputClass} h-9 w-20 text-sm ${variant.isLowStock ? "border-accent" : ""}`}
        />
      </td>
      <td className="py-2.5">
        <input
          type="number"
          min="0"
          step="0.10"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder={formatPrice(basePriceCents)}
          className={`${inputClass} h-9 w-24 text-sm`}
        />
      </td>
      <td className="py-2.5">
        <button
          type="button"
          onClick={toggleActive}
          disabled={isSaving}
          className={`label-caps cursor-pointer underline disabled:opacity-40 ${
            variant.isActive ? "text-ink" : "text-ash"
          }`}
        >
          {variant.isActive ? "Activa" : "Inactiva"}
        </button>
      </td>
      <td className="py-2.5 text-right">
        <div className="flex justify-end gap-2">
          {dirty ? (
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="label-caps cursor-pointer text-accent underline disabled:opacity-40"
            >
              Guardar
            </button>
          ) : null}
          <button
            type="button"
            onClick={remove}
            disabled={isSaving}
            aria-label="Quitar variante"
            className="cursor-pointer text-muted hover:text-danger disabled:opacity-40"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
