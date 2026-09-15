import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { ConflictError, NotFoundError } from '../../../shared/domain/domain-error.js';
import type { Category } from '../domain/entities/category.entity.js';
import { CategoryRepository, type CategoryInput } from '../domain/repositories/category.repository.js';
import { CATEGORY_INCLUDE, toDomainCategory } from './catalog.mapper.js';

const UNIQUE_VIOLATION = 'P2002';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}

/** Implementacion del puerto CategoryRepository sobre PostgreSQL. */
@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findAllActive(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      // El contador solo cuenta prendas publicadas: una categoria cuyo unico
      // producto esta deshabilitado debe mostrarse vacia en la tienda.
      include: CATEGORY_INCLUDE,
    });

    return rows.map(toDomainCategory);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: CATEGORY_INCLUDE,
    });
    return row === null ? null : toDomainCategory(row);
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: CATEGORY_INCLUDE,
    });
    return rows.map(toDomainCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id }, include: CATEGORY_INCLUDE });
    return row === null ? null : toDomainCategory(row);
  }

  async create(input: CategoryInput): Promise<Category> {
    try {
      const row = await this.prisma.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          position: input.position ?? 0,
        },
        include: CATEGORY_INCLUDE,
      });
      return toDomainCategory(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(`Ya existe una categoria con el slug "${input.slug}".`);
      }
      throw error;
    }
  }

  async update(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    await this.requireCategory(id);
    try {
      const row = await this.prisma.category.update({
        where: { id },
        data: {
          name: patch.name,
          slug: patch.slug,
          description: patch.description,
          position: patch.position,
        },
        include: CATEGORY_INCLUDE,
      });
      return toDomainCategory(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(`Ya existe otra categoria con el slug "${patch.slug}".`);
      }
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean): Promise<Category> {
    await this.requireCategory(id);
    const row = await this.prisma.category.update({
      where: { id },
      data: { isActive },
      include: CATEGORY_INCLUDE,
    });
    return toDomainCategory(row);
  }

  private async requireCategory(id: string): Promise<void> {
    const exists = await this.prisma.category.findUnique({ where: { id } });
    if (exists === null) throw new NotFoundError('la categoria', id);
  }
}
