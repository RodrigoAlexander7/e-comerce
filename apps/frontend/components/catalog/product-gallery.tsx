"use client";

import Image from "next/image";
import { useState } from "react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

/**
 * Galeria de la ficha de producto.
 *
 * Con una sola imagen no se pintan miniaturas: un carrusel de un elemento solo
 * anade ruido visual y un control que no lleva a ninguna parte.
 */
export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  if (!active) {
    return <div className="aspect-4/5 w-full bg-mist" aria-hidden />;
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {images.length > 1 ? (
        <ul className="flex gap-3 sm:flex-col" aria-label={`Imagenes de ${name}`}>
          {images.map((image, index) => {
            const current = index === activeIndex;
            return (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-current={current ? "true" : undefined}
                  aria-label={`Ver ${image.alt}`}
                  className={`relative block size-20 cursor-pointer overflow-hidden border transition-colors ${
                    current ? "border-ink" : "border-line hover:border-ash"
                  }`}
                >
                  <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="relative aspect-4/5 flex-1 overflow-hidden bg-mist">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
