import { Money } from '../../../../shared/domain/money.js';

export interface ShippingMethodProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Coste con IGV incluido, igual que los precios del catalogo. */
  readonly price: Money;
  readonly position: number;
  readonly isActive: boolean;
}

/** Opcion de entrega elegible en el paso 2 del checkout. */
export class ShippingMethod {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: Money;
  readonly position: number;
  readonly isActive: boolean;

  constructor(props: ShippingMethodProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.position = props.position;
    this.isActive = props.isActive;
  }

  get isFree(): boolean {
    return this.price.isZero();
  }
}
