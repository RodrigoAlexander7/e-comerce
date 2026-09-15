import { connect } from './cdp.mjs';

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ok = (label, pass, detail = '') =>
  console.log(`  [${pass ? 'OK  ' : 'FALLA'}] ${label}${detail ? ' -> ' + detail : ''}`);

const page = await connect(9222);

// --- 1. Anadir una prenda al carrito desde la ficha ------------------------
console.log('\n1. FICHA DE PRODUCTO -> CARRITO');
await page.goto(`${BASE}/`);
await page.evaluate("localStorage.clear(); sessionStorage.clear(); return true;");
await page.goto(`${BASE}/producto/polo-essential-dry`);

const added = await page.evaluate(`
  const size = [...document.querySelectorAll('button')]
    .find(b => b.textContent.trim() === 'M' && !b.disabled);
  size.click();
  await new Promise(r => setTimeout(r, 200));
  const add = [...document.querySelectorAll('button')]
    .find(b => b.textContent.includes('Anadir al carrito'));
  add.click();
  await new Promise(r => setTimeout(r, 400));
  return {
    label: document.querySelector('button.bg-accent')?.textContent.trim(),
    stored: JSON.parse(localStorage.getItem('atlas-sport:cart:v1') || '[]'),
  };
`);
ok('la talla M se selecciona y el boton anade', added.stored.length === 1, added.label);
ok('la linea guarda variante, talla y precio',
   added.stored[0]?.variantLabel?.includes('M') && added.stored[0]?.unitPriceCents > 0,
   `${added.stored[0]?.variantLabel} ${added.stored[0]?.unitPriceCents}`);

// --- 2. El carrito muestra el total calculado por el servidor --------------
console.log('\n2. CARRITO');
await page.goto(`${BASE}/carrito`);
const cart = await page.evaluate(`
  await new Promise(r => setTimeout(r, 900));
  const text = document.body.innerText;
  return {
    hasProduct: text.includes('Polo Essential Dry'),
    total: (text.match(/TOTAL\\s*(S\\/\\s*[\\d.]+)/i) || [])[1],
    hasImpuestos: text.includes('Impuestos'),
    badge: document.querySelector('header span.bg-accent')?.textContent.trim(),
  };
`);
ok('la prenda aparece en el carrito', cart.hasProduct);
ok('el resumen trae total e impuestos del servidor', Boolean(cart.total) && cart.hasImpuestos, cart.total);
ok('el contador de la cabecera se actualiza', cart.badge === '1', `badge=${cart.badge}`);

// --- 3. Paso 1: validacion y selectores encadenados ------------------------
console.log('\n3. CHECKOUT PASO 1 (DETALLES)');
await page.goto(`${BASE}/checkout`);

const blocked = await page.evaluate(`
  await new Promise(r => setTimeout(r, 700));
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Continuar')).click();
  await new Promise(r => setTimeout(r, 300));
  return {
    url: location.pathname,
    errores: [...document.querySelectorAll('[role="alert"]')].map(e => e.textContent).length,
  };
`);
ok('no deja avanzar con el formulario vacio', blocked.url === '/checkout', blocked.url);
ok('muestra errores por campo', blocked.errores >= 4, `${blocked.errores} errores`);

const chained = await page.evaluate(`
  const set = (el, value) => {
    if (el instanceof HTMLSelectElement) {
      const index = [...el.options].findIndex(o => o.value === value);
      if (index < 0) throw new Error('opcion no encontrada: ' + value + ' en ' + el.id);
      el.selectedIndex = index;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  set(document.querySelector('#customerName'), 'Juan Perez');
  set(document.querySelector('#customerEmail'), 'theleetuser7@gmail.com');
  set(document.querySelector('#customerPhone'), '+51930900259');
  set(document.querySelector('#idNumber'), '76435222');

  const invoice = [...document.querySelectorAll('input[type=checkbox]')][0];
  invoice.click();
  await new Promise(r => setTimeout(r, 250));
  const hasInvoiceFields = Boolean(document.querySelector('#businessName') && document.querySelector('#ruc'));
  set(document.querySelector('#businessName'), 'Ingenieria');
  set(document.querySelector('#ruc'), '10524346251');

  set(document.querySelector('#shipping-state'), 'Arequipa');
  await new Promise(r => setTimeout(r, 250));
  const provincias = document.querySelector('#shipping-city').options.length;
  set(document.querySelector('#shipping-city'), 'Arequipa');
  await new Promise(r => setTimeout(r, 250));
  const distritoEl = document.querySelector('#shipping-district');
  const distritos = distritoEl.tagName === 'SELECT' ? distritoEl.options.length : 0;
  set(distritoEl, 'Miraflores');
  set(document.querySelector('#shipping-street'), 'Calle San Antonio 223');
  await new Promise(r => setTimeout(r, 250));

  return { hasInvoiceFields, provincias, distritos };
`);
ok('el checkbox de factura despliega razon social y RUC', chained.hasInvoiceFields);
ok('elegir departamento carga sus provincias', chained.provincias > 1, `${chained.provincias - 1} provincias`);
ok('elegir provincia carga sus distritos', chained.distritos > 1, `${chained.distritos - 1} distritos`);
await page.evaluate(`
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Continuar')).click();
  return true;
`);
await new Promise((r) => setTimeout(r, 1500));
const step2Url = await page.evaluate('return location.pathname;');
ok('avanza al paso 2 con datos validos', step2Url === '/checkout/entrega', step2Url);

// --- 4. Paso 2: el envio se suma al total ---------------------------------
console.log('\n4. CHECKOUT PASO 2 (ENTREGA)');
// Se mide y se hace clic en llamadas separadas: evaluar a traves de una
// navegacion invalida el contexto de ejecucion de la pagina.
const delivery = await page.evaluate(`
  await new Promise(r => setTimeout(r, 1500));
  const totalOf = () => (document.body.innerText.match(/TOTAL\\s*S\\/\\s*([\\d.]+)/i) || [])[1];
  const antes = totalOf();
  const radios = [...document.querySelectorAll('input[name=shippingMethod]')];
  radios[1].click();
  await new Promise(r => setTimeout(r, 1800));
  return {
    metodos: radios.length,
    antes,
    despues: totalOf(),
    resumen: document.body.innerText.includes('Calle San Antonio 223'),
  };
`);
ok('lista los metodos de entrega', delivery.metodos === 3, `${delivery.metodos} metodos`);
ok('el coste de envio se suma al total', delivery.antes !== delivery.despues,
   `${delivery.antes} -> ${delivery.despues}`);
ok('muestra la direccion del paso 1 como resumen', delivery.resumen);

await page.evaluate(`
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Continuar')).click();
  return true;
`);
await new Promise((r) => setTimeout(r, 1500));
const step3Url = await page.evaluate('return location.pathname;');
ok('avanza al paso 3', step3Url === '/checkout/pago', step3Url);

// --- 5. Paso 3: terminos obligatorios y confirmacion -----------------------
console.log('\n5. CHECKOUT PASO 3 (PAGO)');
const payment = await page.evaluate(`
  await new Promise(r => setTimeout(r, 1500));
  const payBtn = () => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Pagar ahora'));
  const bloqueadoSinTerminos = payBtn().disabled;
  const facturaVisible = document.body.innerText.includes('10524346251');
  const terms = [...document.querySelectorAll('input[type=checkbox]')].pop();
  terms.click();
  await new Promise(r => setTimeout(r, 400));
  return { bloqueadoSinTerminos, facturaVisible, habilitado: !payBtn().disabled };
`);
ok('"Pagar ahora" esta bloqueado sin aceptar terminos', payment.bloqueadoSinTerminos);
ok('el resumen muestra los datos de factura', payment.facturaVisible);
ok('aceptar terminos habilita el boton', payment.habilitado);

await page.evaluate(`
  [...document.querySelectorAll('button')].find(b => b.textContent.includes('Pagar ahora')).click();
  return true;
`);
await new Promise((r) => setTimeout(r, 5000));
const after = await page.evaluate(`
  return {
    url: location.pathname + location.search,
    carritoVacio: JSON.parse(localStorage.getItem('atlas-sport:cart:v1') || '[]').length === 0,
  };
`);
ok('redirige a la confirmacion', after.url.startsWith('/checkout/confirmacion'), after.url);
ok('vacia el carrito tras confirmar', after.carritoVacio);

// --- 6. Confirmacion ------------------------------------------------------
console.log('\n6. CONFIRMACION');
const confirm = await page.evaluate(`
  await new Promise(r => setTimeout(r, 600));
  // innerText devuelve el texto ya transformado por CSS: los rotulos de la
  // marca van en mayusculas, asi que la comparacion ignora la caja.
  const t = document.body.innerText.toLowerCase();
  return {
    gracias: t.includes('gracias por tu orden'),
    numero: (t.match(/orden\\s+(s\\d+)/) || [])[1],
    yape: t.includes('946 146 622'),
    qr: Boolean(document.querySelector('img[alt*="QR"]')),
    bancos: t.includes('0011-0286-0200122689') && t.includes('2003007729349'),
    whatsapp: Boolean(document.querySelector('a[href*="wa.me"]')),
    registrarse: t.includes('registrarse'),
    comunicacion: t.includes('comunicacion:'),
  };
`);
ok('muestra el agradecimiento y el numero', confirm.gracias && Boolean(confirm.numero), confirm.numero);
ok('muestra el numero de Yape y el QR', confirm.yape && confirm.qr);
ok('muestra las cuentas bancarias con CCI', confirm.bancos);
ok('ofrece el enlace de WhatsApp', confirm.whatsapp);
ok('incluye el CTA de registro y la referencia', confirm.registrarse && confirm.comunicacion);

page.close();
