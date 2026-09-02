import { Injectable } from '@nestjs/common';
import type { Category } from '../../domain/entities/category.entity.js';
import { CategoryRepository } from '../../domain/repositories/category.repository.js';

/** Devuelve las categorias activas para la navegacion de la tienda. */
@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categories: CategoryRepository) {}

  execute(): Promise<Category[]> {
    return this.categories.findAllActive();
  }
}
