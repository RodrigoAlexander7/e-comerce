import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service.js';
import { NotFoundError } from '../../../shared/domain/domain-error.js';
import { User, type UserRoleValue } from '../domain/entities/user.entity.js';
import {
  UserRepository,
  type FederatedProfile,
} from '../domain/repositories/user.repository.js';

interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  googleId: string | null;
  isActive: boolean;
  createdAt: Date;
}

function toDomain(row: UserRow): User {
  return new User({
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role as UserRoleValue,
    avatarUrl: row.avatarUrl,
    googleId: row.googleId,
    isActive: row.isActive,
    createdAt: row.createdAt,
  });
}

/** Implementacion del puerto de usuarios sobre PostgreSQL. */
@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row === null ? null : toDomain(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return row === null ? null : toDomain(row);
  }

  async findOrCreateFromGoogle(profile: FederatedProfile): Promise<User> {
    const email = profile.email.trim().toLowerCase();

    // El correo es la identidad canonica, no el identificador de Google: una
    // cuenta creada antes por otra via (un administrador sembrado, por
    // ejemplo) debe quedar vinculada en lugar de duplicarse. El upsert hace
    // ambas cosas en una sola sentencia, sin ventana de carrera entre dos
    // accesos simultaneos del mismo usuario.
    const row = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: profile.name,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      },
      update: {
        googleId: profile.googleId,
        // El nombre y el avatar se refrescan desde Google, pero el rol jamas:
        // lo asigna la tienda y ningun proveedor externo puede elevarlo.
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    });

    return toDomain(row);
  }

  async updateRole(userId: string, role: UserRoleValue): Promise<User> {
    const exists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (exists === null) throw new NotFoundError('el usuario', userId);

    const row = await this.prisma.user.update({ where: { id: userId }, data: { role } });
    return toDomain(row);
  }

  async listAdmins(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
    });
    return rows.map(toDomain);
  }
}
