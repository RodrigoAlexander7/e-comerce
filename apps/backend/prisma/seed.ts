/**
 * Datos de arranque para desarrollo.
 *
 * Es idempotente: se apoya en upsert por slug y SKU, de modo que volver a
 * ejecutarlo actualiza el catalogo en lugar de duplicarlo.
 */
import { PrismaClient } from '../src/shared/infrastructure/prisma/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

process.loadEnvFile('.env');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const NEGRO = { name: 'Negro', hex: '#0A0A0A' };
const BLANCO = { name: 'Blanco', hex: '#FFFFFF' };
const GRIS = { name: 'Gris Jaspeado', hex: '#8A8A8E' };
const ARENA = { name: 'Arena', hex: '#C9C1B4' };

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  basePriceCents: number;
  compareAtPriceCents?: number;
  isFeatured?: boolean;
  colors: { name: string; hex: string }[];
  sizes: string[];
  stockPerVariant: number;
}

const CATEGORIES = [
  { name: 'Polos', slug: 'polos', description: 'Polos de entrenamiento y uso diario.', position: 1 },
  { name: 'Casacas', slug: 'casacas', description: 'Cortavientos y capas exteriores.', position: 2 },
  { name: 'Pantalones', slug: 'pantalones', description: 'Joggers y pantalones tecnicos.', position: 3 },
  { name: 'Shorts', slug: 'shorts', description: 'Shorts de entrenamiento y running.', position: 4 },
];

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Polo Essential Dry',
    slug: 'polo-essential-dry',
    description:
      'Polo de entrenamiento en tejido tecnico de secado rapido. Corte regular, costuras planas para reducir el roce y panel trasero transpirable.',
    categorySlug: 'polos',
    basePriceCents: 8_900,
    isFeatured: true,
    colors: [NEGRO, BLANCO, GRIS],
    sizes: ['S', 'M', 'L', 'XL'],
    stockPerVariant: 14,
  },
  {
    name: 'Polo Training Mesh',
    slug: 'polo-training-mesh',
    description:
      'Polo de malla ligera con ventilacion en zonas de alta sudoracion. Pensado para sesiones de alta intensidad en interiores.',
    categorySlug: 'polos',
    basePriceCents: 10_900,
    compareAtPriceCents: 13_900,
    colors: [NEGRO, GRIS],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stockPerVariant: 9,
  },
  {
    name: 'Polo Oversize Court',
    slug: 'polo-oversize-court',
    description:
      'Polo de algodon peinado con caida oversize y hombro caido. Version de uso diario de la linea de entrenamiento.',
    categorySlug: 'polos',
    basePriceCents: 11_900,
    colors: [BLANCO, ARENA, NEGRO],
    sizes: ['S', 'M', 'L', 'XL'],
    stockPerVariant: 6,
  },
  {
    name: 'Casaca Cortavientos Ridge',
    slug: 'casaca-cortavientos-ridge',
    description:
      'Cortavientos plegable con capucha ajustable y bolsillos con cierre. Repele la llovizna sin sacrificar transpirabilidad.',
    categorySlug: 'casacas',
    basePriceCents: 24_900,
    isFeatured: true,
    colors: [NEGRO, ARENA],
    sizes: ['S', 'M', 'L', 'XL'],
    stockPerVariant: 7,
  },
  {
    name: 'Casaca Track Retro',
    slug: 'casaca-track-retro',
    description:
      'Casaca deportiva de cierre completo con canales laterales contrastados. Tejido con caida firme y punos acanalados.',
    categorySlug: 'casacas',
    basePriceCents: 22_900,
    compareAtPriceCents: 27_900,
    colors: [NEGRO, BLANCO],
    sizes: ['M', 'L', 'XL'],
    stockPerVariant: 4,
  },
  {
    name: 'Jogger Tech Fleece',
    slug: 'jogger-tech-fleece',
    description:
      'Jogger de felpa tecnica con cintura elastica y cordon plano. Tobillo ajustado y bolsillos laterales con cierre.',
    categorySlug: 'pantalones',
    basePriceCents: 18_900,
    isFeatured: true,
    colors: [NEGRO, GRIS],
    sizes: ['S', 'M', 'L', 'XL'],
    stockPerVariant: 11,
  },
  {
    name: 'Pantalon Training Slim',
    slug: 'pantalon-training-slim',
    description:
      'Pantalon de entrenamiento en tejido elastico de cuatro vias. Corte slim que acompana el movimiento sin restringirlo.',
    categorySlug: 'pantalones',
    basePriceCents: 19_900,
    colors: [NEGRO],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    stockPerVariant: 3,
  },
  {
    name: 'Short Running Pace',
    slug: 'short-running-pace',
    description:
      'Short de running de 7 pulgadas con calzoncillo interior integrado y bolsillo trasero para llave o tarjeta.',
    categorySlug: 'shorts',
    basePriceCents: 9_900,
    colors: [NEGRO, GRIS],
    sizes: ['S', 'M', 'L', 'XL'],
    stockPerVariant: 12,
  },
  {
    name: 'Short Court Mesh',
    slug: 'short-court-mesh',
    description:
      'Short de malla con corte holgado y cintura elastica ancha. Inspirado en el uniforme de basquet clasico.',
    categorySlug: 'shorts',
    basePriceCents: 8_500,
    colors: [BLANCO, NEGRO],
    sizes: ['M', 'L', 'XL'],
    stockPerVariant: 0,
  },
];

const SHIPPING_METHODS = [
  {
    name: 'Envio Regular (Lima Metropolitana)',
    description:
      'Entrega en 2 a 4 dias habiles. Su pedido sera enviado a la direccion indicada en el paso anterior.',
    priceCents: 1_200,
    position: 1,
  },
  {
    name: 'Envio Regular (Provincias)',
    description:
      'Entrega en 4 a 7 dias habiles mediante agencia. Si prefiere recoger su pedido en una agencia, indique la direccion de la agencia como direccion de entrega.',
    priceCents: 2_135,
    position: 2,
  },
  {
    name: 'Recojo en tienda',
    description: 'Sin costo. Recoja su pedido en nuestra tienda una vez confirmado el pago.',
    priceCents: 0,
    position: 3,
  },
];

/** Genera un SKU estable y legible a partir del producto, la talla y el color. */
function buildSku(productSlug: string, size: string, colorName: string): string {
  const base = productSlug.split('-').map((part) => part.slice(0, 3).toUpperCase()).join('');
  const color = colorName.split(' ')[0].slice(0, 3).toUpperCase();
  return `${base}-${color}-${size}`;
}

function imagePath(slug: string, colorName: string): string {
  const color = colorName.toLowerCase().replace(/\s+/g, '-');
  return `/products/${slug}-${color}.svg`;
}

async function main(): Promise<void> {
  console.log('Sembrando catalogo...');

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description, position: category.position },
    });
  }

  for (const method of SHIPPING_METHODS) {
    const existing = await prisma.shippingMethod.findFirst({ where: { name: method.name } });
    if (existing) {
      await prisma.shippingMethod.update({ where: { id: existing.id }, data: method });
    } else {
      await prisma.shippingMethod.create({ data: method });
    }
  }

  for (const seed of PRODUCTS) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: seed.categorySlug } });

    const product = await prisma.product.upsert({
      where: { slug: seed.slug },
      create: {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        categoryId: category.id,
        basePriceCents: seed.basePriceCents,
        compareAtPriceCents: seed.compareAtPriceCents ?? null,
        isFeatured: seed.isFeatured ?? false,
      },
      update: {
        name: seed.name,
        description: seed.description,
        categoryId: category.id,
        basePriceCents: seed.basePriceCents,
        compareAtPriceCents: seed.compareAtPriceCents ?? null,
        isFeatured: seed.isFeatured ?? false,
      },
    });

    // Las imagenes se reemplazan enteras: son pocas y asi el orden queda limpio.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: seed.colors.map((color, index) => ({
        productId: product.id,
        url: imagePath(seed.slug, color.name),
        alt: `${seed.name} en color ${color.name.toLowerCase()}`,
        position: index + 1,
      })),
    });

    for (const color of seed.colors) {
      for (const size of seed.sizes) {
        const sku = buildSku(seed.slug, size, color.name);
        await prisma.productVariant.upsert({
          where: { sku },
          create: {
            productId: product.id,
            sku,
            size,
            colorName: color.name,
            colorHex: color.hex,
            stock: seed.stockPerVariant,
          },
          update: { stock: seed.stockPerVariant, colorHex: color.hex },
        });
      }
    }
  }

  // Primer administrador. Sin esta cuenta, nadie podria entrar nunca al panel:
  // el rol jamas se asigna solo, y la unica via de acceso es OAuth con Google,
  // que no deja crear una cuenta con un rol elegido a mano.
  const superadminEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (superadminEmail) {
    await prisma.user.upsert({
      where: { email: superadminEmail },
      create: { email: superadminEmail, name: 'Administrador', role: 'SUPERADMIN' },
      update: { role: 'SUPERADMIN' },
    });
    console.log(`Cuenta SUPERADMIN asegurada para ${superadminEmail}.`);
  } else {
    console.log('SUPERADMIN_EMAIL no esta definida: no se sembro ningun administrador.');
  }

  const counts = {
    categorias: await prisma.category.count(),
    productos: await prisma.product.count(),
    variantes: await prisma.productVariant.count(),
    metodosDeEnvio: await prisma.shippingMethod.count(),
    administradores: await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] } } }),
  };
  console.log('Catalogo sembrado:', counts);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
