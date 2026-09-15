/**
 * Unico punto por el que entra el cliente generado por Prisma.
 *
 * Centralizarlo aqui significa que regenerar el cliente en otra ruta, o migrar
 * de ORM, toca un solo archivo en lugar de todos los repositorios. El resto de
 * la infraestructura importa siempre desde aqui, nunca desde ./generated.
 */
export * from './generated/client.js';
