import type { StoreSettings } from '../../../settings/domain/entities/store-settings.entity.js';
import type { Order } from '../../../checkout/domain/entities/order.entity.js';
import { COLORS, escapeHtml, layout, money } from './shared.js';

/**
 * Correo de pago verificado.
 *
 * Lo dispara el backend cuando un administrador marca la orden como pagada
 * tras comprobar el abono en Yape, Plin o la cuenta bancaria.
 */
export function renderOrderPaymentConfirmed(
  order: Order,
  settings: StoreSettings,
): { subject: string; html: string; text: string } {
  const number = order.number.value;

  const items = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;line-height:1.5;">
          ${escapeHtml(item.productName)}<br>
          <span style="color:${COLORS.muted};font-size:13px;">${escapeHtml(item.variantLabel)}</span>
        </td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid ${COLORS.line};font-size:15px;">${item.quantity}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${COLORS.line};font-size:15px;white-space:nowrap;">${money(item.lineTotal.cents)}</td>
      </tr>`,
    )
    .join('');

  const body = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:2px solid ${COLORS.accent};">
      <tr><td style="padding:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent};">Pago verificado</p>
        <p style="margin:8px 0 0;font-size:16px;line-height:1.6;">
          Confirmamos la recepcion de su pago de <strong>${money(order.totals.total.cents)}</strong>.
        </p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${escapeHtml(order.customer.name)},</p>

    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
      Su pedido <strong>${number}</strong> ya esta confirmado y ha pasado a preparacion.
      Le avisaremos en cuanto salga hacia la direccion indicada.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Producto</th>
        <th align="center" style="padding:0 8px 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Cant.</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid ${COLORS.ink};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Precio</th>
      </tr>
      ${items}
      <tr>
        <td colspan="2" align="right" style="padding:10px 8px 0 0;font-size:16px;font-weight:700;">Total pagado</td>
        <td align="right" style="padding:10px 0 0;font-size:16px;font-weight:700;white-space:nowrap;">${money(order.totals.total.cents)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border:1px solid ${COLORS.line};">
      <tr><td style="padding:20px;">
        <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.muted};">Direccion de entrega</p>
        <p style="margin:10px 0 0;font-size:15px;font-weight:700;">${escapeHtml(order.customer.name)}</p>
        <p style="margin:6px 0 0;font-size:14px;line-height:1.6;color:${COLORS.steel};">
          ${escapeHtml(order.shippingAddress.toSingleLine())}
        </p>
        <p style="margin:10px 0 0;font-size:14px;color:${COLORS.steel};">${escapeHtml(order.shippingMethodName)}</p>
      </td></tr>
    </table>`;

  const text = [
    `Hola ${order.customer.name},`,
    '',
    `Confirmamos la recepcion de su pago de ${money(order.totals.total.cents)}.`,
    `Su pedido ${number} ya esta en preparacion.`,
    '',
    ...order.items.map(
      (item) => `- ${item.productName} (${item.variantLabel}) x${item.quantity}: ${money(item.lineTotal.cents)}`,
    ),
    `Total pagado: ${money(order.totals.total.cents)}`,
    '',
    `Envio a: ${order.shippingAddress.toSingleLine()}`,
  ].join('\n');

  return {
    subject: `Pago confirmado: su pedido ${number} esta en preparacion`,
    html: layout({
      title: `Pago confirmado del pedido ${number}`,
      storeName: settings.companyName,
      body,
      footer: `${escapeHtml(settings.companyName)} &middot; RUC ${escapeHtml(settings.companyRuc)}`,
    }),
    text,
  };
}
