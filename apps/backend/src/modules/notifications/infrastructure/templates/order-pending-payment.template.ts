import type { StoreSettings } from '../../../settings/domain/entities/store-settings.entity.js';
import type { Order } from '../../../checkout/domain/entities/order.entity.js';
import { COLORS, escapeHtml, layout, money, whatsappLink } from './shared.js';

/**
 * Correo de pago pendiente.
 *
 * Es la pieza que sostiene todo el flujo de pago offline: sale en el momento
 * de confirmar la compra y contiene lo unico que el cliente necesita para
 * pagar (a donde, cuanto, hasta cuando y como avisar del abono).
 */
export function renderOrderPendingPayment(order: Order, settings: StoreSettings): { subject: string; html: string; text: string } {
  const number = order.number.value;
  const isYape = order.paymentMethod === 'YAPE_PLIN';

  const voucherMessage = `Hola, envio el comprobante de pago de mi orden ${number}.`;
  const whatsapp = whatsappLink(settings.whatsapp, voucherMessage);

  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escapeHtml(order.customer.name)},</p>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
      El pago de su pedido <strong>${number}</strong> por un total de
      <strong>${money(order.totals.total.cents)}</strong> esta pendiente.
      Confirmaremos su orden una vez que se confirme el pago.
    </p>

    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
      Recuerde que tiene un plazo de <strong>${settings.paymentWindowHours} horas</strong>
      para realizar el pago correspondiente, hasta las
      <strong>${formatDeadline(order.paymentDueAt)}</strong>.
    </p>

    ${renderPaymentInstructions(settings, isYape)}

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;">
      Luego de realizar su pago, envie el voucher por
      <a href="${whatsapp}" style="color:${COLORS.accent};font-weight:700;">WhatsApp al ${escapeHtml(settings.yapePhone)}</a>
      o por correo a
      <a href="mailto:${escapeHtml(settings.companyEmail)}" style="color:${COLORS.accent};font-weight:700;">${escapeHtml(settings.companyEmail)}</a>.
      Indique el numero de orden <strong>${number}</strong> como referencia.
    </p>

    ${renderItemsTable(order)}
    ${renderAddresses(order)}

    <p style="margin:28px 0 0;font-size:15px;line-height:1.6;">Agradecemos su confianza.</p>
    <p style="margin:6px 0 0;font-size:15px;line-height:1.6;">
      No dude en ponerse en contacto con nosotros si tiene alguna pregunta.
    </p>`;

  return {
    subject: `Su pedido ${number} esta pendiente de pago`,
    html: layout({
      title: `Pedido ${number} pendiente de pago`,
      storeName: settings.companyName,
      body,
      footer: `${escapeHtml(settings.companyName)} &middot; RUC ${escapeHtml(settings.companyRuc)}<br>Este correo se genero automaticamente por su compra en nuestra tienda.`,
    }),
    text: renderPlainText(order, settings, whatsapp),
  };
}

function formatDeadline(date: Date): string {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Lima',
  }).format(date);
}

/**
 * Bloque de instrucciones de pago.
 *
 * Se destacan los datos del medio elegido, pero se incluyen igualmente los del
 * otro: es habitual que el cliente escoja Yape y acabe pagando por
 * transferencia porque supera el limite diario de la aplicacion.
 */
function renderPaymentInstructions(settings: StoreSettings, isYape: boolean): string {
  const qrRow = settings.yapeQrUrl
    ? `<tr><td align="center" style="padding:16px 0 0;">
        <img src="${escapeHtml(settings.yapeQrUrl)}" alt="Codigo QR de Yape" width="160" height="160"
             style="display:block;border:2px solid ${COLORS.ink};" />
      </td></tr>`
    : '';

  const yapeBlock = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:2px solid ${isYape ? COLORS.accent : COLORS.line};">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${isYape ? COLORS.accent : COLORS.muted};">
          Pago con Yape o Plin${isYape ? ' &middot; metodo elegido' : ''}
        </p>
        <p style="margin:0;font-size:16px;line-height:1.6;">
          Realice su pago al numero <strong style="font-size:20px;">${escapeHtml(settings.yapePhone)}</strong>
          a nombre de ${escapeHtml(settings.companyName)}.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${qrRow}</table>
      </td></tr>
    </table>`;

  const rows = settings.bankAccounts
    .map(
      (account) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;line-height:1.6;">
          <strong>Cuenta soles ${escapeHtml(account.bank)}:</strong> ${escapeHtml(account.accountNumber)}<br>
          <span style="color:${COLORS.steel};">CCI: ${escapeHtml(account.cci)}</span>
        </td>
      </tr>`,
    )
    .join('');

  const transferBlock =
    settings.bankAccounts.length === 0
      ? ''
      : `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid ${isYape ? COLORS.line : COLORS.accent};">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${isYape ? COLORS.muted : COLORS.accent};">
          Transferencia bancaria${isYape ? '' : ' &middot; metodo elegido'}
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.6;">
          A nombre de <strong>${escapeHtml(settings.companyName)}</strong>, RUC ${escapeHtml(settings.companyRuc)}.
        </p>
      </td></tr>
    </table>`;

  return yapeBlock + transferBlock;
}

function renderItemsTable(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;line-height:1.5;">
          ${escapeHtml(item.productName)}<br>
          <span style="color:${COLORS.muted};font-size:13px;">${escapeHtml(item.variantLabel)} &middot; ${escapeHtml(item.sku)}</span>
        </td>
        <td align="center" style="padding:12px 8px;border-bottom:1px solid ${COLORS.line};font-size:15px;">${item.quantity}</td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;white-space:nowrap;">${money(item.lineTotal.cents)}</td>
      </tr>`,
    )
    .join('');

  const totalRow = (label: string, value: string, strong = false) => `
      <tr>
        <td colspan="2" align="right" style="padding:6px 8px 6px 0;font-size:${strong ? '16' : '14'}px;${strong ? 'font-weight:700;' : `color:${COLORS.steel};`}">${label}</td>
        <td align="right" style="padding:6px 0;font-size:${strong ? '16' : '14'}px;white-space:nowrap;${strong ? 'font-weight:700;' : `color:${COLORS.steel};`}">${value}</td>
      </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Producto</th>
        <th align="center" style="padding:0 8px 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Cant.</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Precio</th>
      </tr>
      ${rows}
      ${totalRow('Entrega', money(order.totals.shipping.cents))}
      ${totalRow('Subtotal', money(order.totals.subtotal.cents))}
      ${totalRow(`Impuestos (IGV ${(order.totals.taxRateBps / 100).toFixed(0)} %)`, money(order.totals.tax.cents))}
      ${totalRow('Total', money(order.totals.total.cents), true)}
    </table>`;
}

function renderAddresses(order: Order): string {
  const invoice =
    order.invoice === null
      ? ''
      : `
      <p style="margin:14px 0 0;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Datos para la factura</p>
      <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${COLORS.steel};">
        Razon Social: ${escapeHtml(order.invoice.businessName)}<br>
        Numero de RUC: ${escapeHtml(order.invoice.ruc)}
      </p>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border:1px solid ${COLORS.line};">
      <tr><td style="padding:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};">Entrega y facturacion</p>
        <p style="margin:10px 0 0;font-size:15px;font-weight:700;">${escapeHtml(order.customer.name)}</p>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${COLORS.steel};">
          ${escapeHtml(order.shippingAddress.toSingleLine())}
        </p>
        <p style="margin:10px 0 0;font-size:14px;color:${COLORS.steel};">
          Metodo de entrega: ${escapeHtml(order.shippingMethodName)}
        </p>
        ${invoice}
      </td></tr>
    </table>`;
}

/** Version en texto plano, para clientes que no renderizan HTML. */
function renderPlainText(order: Order, settings: StoreSettings, whatsapp: string): string {
  const lines = [
    `Hola ${order.customer.name},`,
    '',
    `El pago de su pedido ${order.number.value} por un total de ${money(order.totals.total.cents)} esta pendiente.`,
    `Tiene ${settings.paymentWindowHours} horas para realizarlo, hasta las ${formatDeadline(order.paymentDueAt)}.`,
    '',
    `Yape o Plin: ${settings.yapePhone}`,
    ...settings.bankAccounts.map(
      (account) => `${account.bank}: ${account.accountNumber} (CCI ${account.cci})`,
    ),
    `A nombre de ${settings.companyName}, RUC ${settings.companyRuc}`,
    '',
    `Envie su comprobante por WhatsApp (${whatsapp}) o a ${settings.companyEmail}, indicando ${order.number.value}.`,
    '',
    'Detalle del pedido:',
    ...order.items.map(
      (item) => `- ${item.productName} (${item.variantLabel}) x${item.quantity}: ${money(item.lineTotal.cents)}`,
    ),
    `Entrega: ${money(order.totals.shipping.cents)}`,
    `Subtotal: ${money(order.totals.subtotal.cents)}`,
    `Impuestos: ${money(order.totals.tax.cents)}`,
    `Total: ${money(order.totals.total.cents)}`,
  ];
  return lines.join('\n');
}
