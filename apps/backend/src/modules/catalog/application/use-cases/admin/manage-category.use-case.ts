import { Injectable } from '@nestjs/common';
import type { Category } from '../../../domain/entities/category.entity.js';
import { CategoryRepository, type CategoryInput } from '../../../domain/repositories/category.repository.js';

/** Lista todas las categorias para el panel, activas o no. */
@Injectable()
export class ListCategoriesAdminUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(): Promise<Category[]> {
    return this.categories.findAll();
  }
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(input: CategoryInput): Promise<Category> {
    return this.categories.create(input);
  }
}

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(id: string, patch: Partial<CategoryInput>): Promise<Category> {
    return this.categories.update(id, patch);
  }
}

/**
 * Publica o retira una categoria.
 *
 * Retirarla no toca sus prendas: siguen existiendo, solo dejan de listarse en
 * la navegacion publica mientras la categoria este deshabilitada.
 */
@Injectable()
export class SetCategoryActiveUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(id: string, isActive: boolean): Promise<Category> {
    return this.categories.setActive(id, isActive);
  }
}
