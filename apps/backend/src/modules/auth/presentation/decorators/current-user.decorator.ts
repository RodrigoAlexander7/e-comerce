import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { User } from '../../domain/entities/user.entity.js';

/** Inyecta en el controlador el usuario que el guardian ya resolvio. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | null => {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    return request.user ?? null;
  },
);
