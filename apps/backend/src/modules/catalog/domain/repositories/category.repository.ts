import type { Category } from '../entities/category.entity.js';

export interface CategoryInput {
  readonly name: string;
  readonly slug: string;
  readonly description?: string | null;
  readonly position?: number;
}

/**
 * Puerto de acceso a categorias. Misma razon que ProductRepository para ser
 * una clase abstracta: sirve de contrato y de token de inyeccion a la vez.
 */
export abstract class CategoryRepository {
  abstract findAllActive(): Promise<Category[]>;
  abstract findBySlug(slug: string): Promise<Category | null>;

  // --- Escritura, reservada al panel de administracion --------------------

  /** Incluye categorias deshabilitadas: el panel debe poder reactivarlas. */
  abstract findAll(): Promise<Category[]>;
  abstract findById(id: string): Promise<Category | null>;
  abstract create(input: CategoryInput): Promise<Category>;
  abstract update(id: string, patch: Partial<CategoryInput>): Promise<Category>;
  abstract setActive(id: string, isActive: boolean): Promise<Category>;
}
