# Atlas Sport

Plataforma de e-commerce de ropa deportiva. Monorepo con Next.js 16 (tienda) y
NestJS 12 (API) sobre PostgreSQL.

## Requisitos

- Node.js 20.9 o superior (el repo se desarrolla con Node 24)
- pnpm 11
- Docker, para PostgreSQL y el buzon de correo de desarrollo

## Puesta en marcha

```bash
pnpm install

# PostgreSQL en el puerto 5433 y Mailpit en el 8025
pnpm db:up

# Variables de entorno
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Esquema y datos de ejemplo
pnpm db:migrate
pnpm db:seed

# Tienda en :3000 y API en :3001
pnpm dev
```

### Primer acceso al panel

El panel de administracion solo se abre con Google, y ningun flujo de la
aplicacion permite elegirse un rol a si mismo. El primer administrador se
otorga desde fuera:

```bash
# En apps/backend/.env, antes de sembrar:
SUPERADMIN_EMAIL="tu-correo@gmail.com"

pnpm db:seed
```

Inicia sesion en http://localhost:3000/cuenta con ese correo de Google y ya
tendras acceso a `/admin`. Para configurar el acceso con Google, crea
credenciales OAuth 2.0 en Google Cloud Console con el URI de redireccion
`http://localhost:3001/api/auth/google/callback` y complétalas en
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

Sin esas credenciales, el boton de Google queda deshabilitado con un aviso
claro (no rompe el arranque). Para probar el panel sin configurar Google,
activa `ENABLE_DEV_LOGIN=true` en desarrollo y entra por
`GET /api/auth/dev-login?email=tu@correo.com&role=ADMIN`: emite la misma
cookie de sesion que el flujo real, pero nunca esta disponible si
`NODE_ENV=production`, sea cual sea el valor de esa variable.

| Servicio            | URL                            |
| ------------------- | ------------------------------ |
| Tienda              | http://localhost:3000          |
| API                 | http://localhost:3001/api      |
| Buzon de desarrollo | http://localhost:8025          |
| Prisma Studio       | `pnpm db:studio`               |

Los correos del checkout no salen a internet en desarrollo: van a Mailpit, y se
leen en el buzon de la tabla anterior.

## Estructura

```
apps/
  backend/    API NestJS con Clean Architecture
  frontend/   Tienda Next.js con App Router
```

### Capas del backend

Cada dominio (`src/modules/<dominio>/`) se divide en cuatro capas y la
dependencia apunta siempre hacia adentro:

```
domain/          Entidades y objetos de valor. TypeScript puro, sin NestJS ni Prisma.
  repositories/  Puertos: clases abstractas que el dominio exige.
application/     Casos de uso. Dependen de los puertos, nunca de la base de datos.
infrastructure/  Repositorios Prisma y mappers. Unico lugar con SQL.
presentation/    Controladores, DTOs validados y view models del contrato HTTP.
```

El cableado ocurre en el modulo del dominio (`useClass`), que es el unico punto
donde el puerto y su implementacion se encuentran.

## Convenciones

- **Dinero**: siempre enteros en centimos. La conversion a unidades solo ocurre
  al pintar. El IGV se extrae de un precio que ya lo incluye, y el impuesto se
  calcula por diferencia para que el desglose cuadre al centimo.
- **Backend ESM**: `"type": "module"` con `moduleResolution: nodenext`. Todos
  los imports relativos llevan extension `.js`.
- **Sin emojis** en codigo, interfaz ni comentarios. Los iconos son SVG en
  linea (`components/icons`).
- **Color**: todo sale de los tokens de `app/globals.css`. El acento
  (`--color-accent`) se reserva a las llamadas a la accion primarias.

## Comandos

| Comando            | Efecto                                     |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Tienda y API en paralelo                   |
| `pnpm build`       | Compila ambos paquetes                     |
| `pnpm test`        | Pruebas del backend                        |
| `pnpm test:e2e`    | Prueba de humo del checkout en navegador   |
| `pnpm lint`        | Linter en ambos paquetes                   |
| `pnpm db:migrate`  | Aplica migraciones de Prisma               |
| `pnpm db:seed`     | Siembra el catalogo de ejemplo             |

## Flujo de compra

El checkout replica un proceso de pago fuera de linea en cuatro pantallas:

1. **Detalles** (`/checkout`): contacto, identificacion, facturacion opcional
   con RUC y direccion de envio con selectores encadenados de departamento,
   provincia y distrito.
2. **Entrega** (`/checkout/entrega`): metodo de envio, cuyo coste se suma al
   total, y direccion de facturacion.
3. **Pago** (`/checkout/pago`): Yape/Plin o transferencia, aceptacion de
   terminos y confirmacion.
4. **Confirmacion** (`/checkout/confirmacion`): numero de orden, QR y numero de
   Yape, cuentas bancarias con CCI y enlace de WhatsApp para el comprobante.

Reglas que sostienen el flujo:

- **El precio se recalcula siempre en el servidor.** El navegador solo envia
  identificadores de variante y cantidades; el importe que llegue en la
  peticion se ignora.
- **El stock se reserva de forma atomica.** El descuento viaja dentro del mismo
  `UPDATE` condicional que comprueba la disponibilidad, asi que dos compras
  simultaneas de la ultima unidad no pueden pasar ambas.
- **La orden se consulta con numero y correo.** El codigo publico es
  correlativo, y por si solo no autoriza a leer datos personales.
- **El correo no bloquea la compra.** Si el servidor SMTP falla, la orden queda
  registrada igualmente y el fallo se anota en el log.

## Panel de administracion

`/admin` esta protegido en dos capas: `proxy.ts` (el borde de Next, ver mas
abajo) consulta `/api/auth/me` y redirige a quien no tenga rol `ADMIN` o
`SUPERADMIN`; cada endpoint `/api/admin/*` vuelve a exigir el rol por su
cuenta en el backend, que es la comprobacion real. El proxy es una
conveniencia de experiencia de usuario, no la defensa.

- **Panel principal**: ventas del mes, ordenes por verificar, plazo de pago
  vencido y alertas de stock bajo.
- **Ordenes**: listado filtrable por estado, detalle completo y cambio de
  estado manual. Al marcar una orden como `PAGADO`, el backend envia el
  correo de confirmacion automaticamente (mismo mecanismo que el correo de
  pago pendiente de la Fase 2).
- **Productos y categorias**: alta, edicion, variantes (talla, color, stock,
  precio propio opcional) y publicar o retirar sin borrar el historial.
- **Ajustes**: datos de la empresa, cuentas bancarias, plazo de pago y el
  codigo QR de Yape, que se sube como archivo desde el propio panel en lugar
  de apuntar a una imagen fija del repositorio.

### Autenticacion

Unico mecanismo de acceso: OAuth con Google. No hay contraseñas ni registro
propio. Al iniciar sesion por primera vez con un correo que ya hizo compras
como invitado, esas ordenes se vinculan automaticamente a la cuenta nueva.

La sesion es un JWT en una cookie httpOnly (`atlas_session`), firmada por el
backend. El frontend nunca la lee directamente: en Componentes de Servidor la
reenvia a `/api/auth/me` (ver `lib/api/auth.ts`), y en el panel, que es
interactivo, cada peticion viaja con `credentials: "include"` (ver
`lib/admin/client.ts`).

## Pendiente de configurar

- `apps/frontend/public/payment/yape-qr.svg` sigue existiendo como respaldo,
  pero el QR real se gestiona ahora desde `/admin/ajustes`; nada del codigo lo
  referencia por defecto una vez que se sube uno desde el panel.
- Los datos de la empresa (RUC, cuentas bancarias, telefono de Yape) que
  quedan en variables de entorno solo siembran la fila inicial de
  configuracion; a partir de ahi se editan desde `/admin/ajustes`.
- El catalogo de ubicaciones cubre los 25 departamentos y todas sus provincias,
  con distritos detallados en las provincias urbanas principales. Donde falta
  el detalle, el formulario acepta el distrito escrito a mano. Para cobertura
  completa, amplia `apps/backend/src/modules/locations/infrastructure/peru-locations.data.ts`
  con el UBIGEO oficial del INEI.
- Credenciales reales de Google OAuth (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
  para poder iniciar sesion fuera de `dev-login`.

## Estado

- [x] Fase 1: fundacion, dominio, catalogo publico y sistema de diseno
- [x] Fase 2: carrito, checkout de tres pasos y correos transaccionales
- [x] Fase 3: OAuth con Google y panel de administracion con RBAC
