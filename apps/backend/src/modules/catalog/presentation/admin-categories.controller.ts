import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../auth/presentation/decorators/roles.decorator.js';
import { SetActiveDto } from '../../../shared/presentation/dto/set-active.dto.js';
import { slugify } from '../domain/slug.js';
import {
  CreateCategoryUseCase,
  ListCategoriesAdminUseCase,
  SetCategoryActiveUseCase,
  UpdateCategoryUseCase,
} from '../application/use-cases/admin/manage-category.use-case.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/admin-category.dto.js';
import { toAdminCategoryView, type AdminCategoryView } from './admin-product.view-model.js';

/** CRUD de categorias del panel. */
@Roles('ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(
    private readonly listCategoriesAdmin: ListCategoriesAdminUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly setCategoryActive: SetCategoryActiveUseCase,
  ) {}

  @Get()
  async list(): Promise<AdminCategoryView[]> {
    const categories = await this.listCategoriesAdmin.execute();
    return categories.map(toAdminCategoryView);
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto): Promise<AdminCategoryView> {
    const category = await this.createCategory.execute({
      name: dto.name,
      slug: dto.slug?.trim() || slugify(dto.name),
      description: dto.description,
      position: dto.position,
    });
    return toAdminCategoryView(category);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<AdminCategoryView> {
    const category = await this.updateCategory.execute(id, dto);
    return toAdminCategoryView(category);
  }

  @Patch(':id/activo')
  async setActive(@Param('id') id: string, @Body() dto: SetActiveDto): Promise<AdminCategoryView> {
    const category = await this.setCategoryActive.execute(id, dto.isActive);
    return toAdminCategoryView(category);
  }
}
