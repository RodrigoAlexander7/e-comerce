# Prueba de humo del checkout

Recorre en un navegador real el camino completo de compra: ficha de producto,
carrito, los tres pasos del checkout y la pagina de confirmacion.

Cubre lo que las pruebas unitarias no alcanzan: estado de cliente, navegacion
entre pasos, selectores encadenados de direccion y guardianes de paso.

## Requisitos

Google Chrome instalado, la API en el puerto 3001 y la tienda en el 3000.

## Uso

```bash
pnpm db:up
pnpm dev          # en otra terminal
pnpm test:e2e
```

El script arranca Chrome sin interfaz, se conecta por el protocolo de DevTools
y no necesita ninguna dependencia de npm: usa el WebSocket nativo de Node.

Cada ejecucion crea una orden real en la base de datos de desarrollo y descuenta
stock, igual que una compra normal.
