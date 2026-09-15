/**
 * Errores que expresa el dominio sin conocer HTTP ni NestJS.
 * La capa de presentacion los traduce a codigos de estado mediante un filtro.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** La entidad solicitada no existe. Se traduce a 404. */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(resource: string, identifier: string) {
    super(`No se encontro ${resource} con identificador "${identifier}".`);
  }
}

/** Los datos violan una regla de negocio. Se traduce a 422. */
export class BusinessRuleError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';
}

/** El recurso choca con otro existente. Se traduce a 409. */
export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}

/** Valor invalido al construir un objeto de valor. Se traduce a 422. */
export class InvalidValueError extends DomainError {
  readonly code = 'INVALID_VALUE';
}
