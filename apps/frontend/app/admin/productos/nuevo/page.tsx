"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGet, adminPost, AdminApiError } from "@/lib/admin/client";
import { Field, inputClass, selectClass } from "@/components/ui/field";
import { PlusIcon, TrashIcon } from "@/components/icons";
import type { AdminCategory, AdminProduct } from "@/lib/admin/types";
import { CLOTHING_SIZES } from "@/lib/admin/sizes";

interface VariantDraft {
  size: string;
  colorName: string;
  colorHex: string;
  stock: string;
}

interface ImageDraft {
  url: string;
  alt: string;
}

const EMPTY_VARIANT: VariantDraft = { size: "M", colorName: "", colorHex: "#0A0A0A", stock: "0" };

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<ImageDraft[]>([{ url: "", alt: "" }]);
  const [variants, setVariants] = useState<VariantDraft[]>([{ ...EMPTY_VARIANT }]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    adminGet<AdminCategory[]>("/admin/categories").then((data) => {
      setCategories(data);
      if (data[0]) setCategoryId((current) => current || data[0].id);
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cleanImages = images.filter((image) => image.url.trim() !== "");
    const cleanVariants = variants.filter((variant) => variant.colorName.trim() !== "");

    if (cleanVariants.length === 0) {
      setError("Anade al menos una variante con talla, color y stock.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminPost<AdminProduct>("/admin/products", {
        name,
        description,
        categoryId,
        basePriceCents: Math.round(Number(basePrice) * 100),
        compareAtPriceCents: compareAtPrice ? Math.round(Number(compareAtPrice) * 100) : null,
        isFeatured,
        images: cleanImages,
        variants: cleanVariants.map((variant) => ({
          size: variant.size,
          colorName: variant.colorName,
          colorHex: variant.colorHex,
          stock: Number(variant.stock) || 0,
        })),
      });
      router.push(`/admin/productos/${created.id}`);
    } catch (cause) {
      setError(cause instanceof AdminApiError ? cause.message : "No se pudo crear la prenda.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl">Nueva prenda</h1>

      <form onSubmit={submit} className="flex max-w-2xl flex-col gap-6">
        <Field label="Nombre" htmlFor="name" required>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            className={inputClass}
          />
        </Field>

        <Field label="Descripcion" htmlFor="description" required>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={10}
            rows={4}
            className="w-full border border-line bg-paper p-3 text-base focus:border-ink"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="category" required>
            <select
              id="category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className={selectClass}
            >
              {(categories ?? []).map((category) => (
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
          <Field label="Precio (S/)" htmlFor="basePrice" required hint="Con IGV incluido.">
            <input
              id="basePrice"
              type="number"
              min="0"
              step="0.10"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Precio anterior (S/)" htmlFor="compareAtPrice" hint="Opcional, para prendas en oferta.">
            <input
              id="compareAtPrice"
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

        <fieldset className="flex flex-col gap-3">
          <legend className="label-caps text-ash">Variantes (talla / color / stock)</legend>
          {variants.map((variant, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <select
                value={variant.size}
                onChange={(event) =>
                  setVariants((current) =>
                    current.map((item, i) => (i === index ? { ...item, size: event.target.value } : item)),
                  )
                }
                className={`${selectClass} w-24`}
              >
                {CLOTHING_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <input
                value={variant.colorName}
                onChange={(event) =>
                  setVariants((current) =>
                    current.map((item, i) => (i === index ? { ...item, colorName: event.target.value } : item)),
                  )
                }
                placeholder="Color"
                className={`${inputClass} w-36`}
              />
              <input
                type="color"
                value={variant.colorHex}
                onChange={(event) =>
                  setVariants((current) =>
                    current.map((item, i) => (i === index ? { ...item, colorHex: event.target.value } : item)),
                  )
                }
                className="h-11 w-14 cursor-pointer border border-line bg-paper"
              />
              <input
                type="number"
                min="0"
                value={variant.stock}
                onChange={(event) =>
                  setVariants((current) =>
                    current.map((item, i) => (i === index ? { ...item, stock: event.target.value } : item)),
                  )
                }
                placeholder="Stock"
                className={`${inputClass} w-24`}
              />
              <button
                type="button"
                onClick={() => setVariants((current) => current.filter((_, i) => i !== index))}
                aria-label="Quitar variante"
                className="grid size-11 shrink-0 cursor-pointer place-items-center border border-line text-muted hover:text-danger"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVariants((current) => [...current, { ...EMPTY_VARIANT }])}
            className="label-caps inline-flex w-fit cursor-pointer items-center gap-2 text-muted hover:text-ink"
          >
            <PlusIcon className="size-3.5" />
            Anadir variante
          </button>
        </fieldset>

        {error ? <p className="border-l-4 border-danger bg-mist p-4 text-sm text-steel">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="label-caps inline-flex h-12 w-fit cursor-pointer items-center bg-accent px-8 text-paper transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Creando..." : "Crear prenda"}
        </button>
      </form>
    </div>
  );
}
