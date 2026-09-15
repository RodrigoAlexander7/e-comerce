import { defineConfig, env } from 'prisma/config';

// Prisma 7 ya no lee archivos .env por su cuenta ni admite `url` dentro del
// bloque datasource del schema. La URL de conexion para migraciones vive aqui.
// Node 24 carga el archivo de forma nativa, sin dependencias extra.
try {
  process.loadEnvFile('.env');
} catch {
  // En CI y en produccion las variables llegan por el entorno del proceso.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
