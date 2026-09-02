import type { User } from '../domain/entities/user.entity.js';

/** Contrato JSON del usuario expuesto al frontend. Nunca incluye tokens. */
export interface UserView {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}
