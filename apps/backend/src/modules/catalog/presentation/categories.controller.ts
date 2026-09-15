import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/presentation/decorators/roles.decorator.js';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case.js';
import { toCategoryView, type CategoryView } from './product.view-model.js';

/** Superficie HTTP de las categorias del catalogo. */
@Public()
@Controller('catalog/categories')
export class CategoriesController {
  constructor(private readonly listCategories: ListCategoriesUseCase) {}

  @Get()
  async list(): Promise<CategoryView[]> {
    const categories = await this.listCategories.execute();
    return categories.map(toCategoryView);
  }
}
