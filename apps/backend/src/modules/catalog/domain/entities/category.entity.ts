export interface CategoryProps {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly position: number;
  readonly isActive: boolean;
  /** Numero de prendas activas. Lo calcula el repositorio, no la entidad. */
  readonly productCount: number;
}

/** Agrupacion comercial del catalogo: Polos, Casacas, Pantalones. */
export class Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly position: number;
  readonly isActive: boolean;
  readonly productCount: number;

  constructor(props: CategoryProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.description = props.description;
    this.position = props.position;
    this.isActive = props.isActive;
    this.productCount = props.productCount;
  }

  get hasProducts(): boolean {
    return this.productCount > 0;
  }
}
