/**
 * Utilidades comunes de las plantillas de correo.
 *
 * Los clientes de correo no admiten hojas de estilo externas ni la mayoria de
 * CSS moderno, asi que se maquetan con tablas y estilos en linea. Es feo como
 * codigo web, pero es lo unico que se ve igual en Gmail, Outlook y Apple Mail.
 */

/** Escapa texto que entra en el HTML. Todo dato del cliente pasa por aqui. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Importe en centimos como "S/ 725.00". */
export function money(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}

export const COLORS = {
  ink: '#0a0a0a',
  steel: '#52525b',
  muted: '#71717a',
  line: '#e4e4e7',
  mist: '#f4f4f5',
  paper: '#ffffff',
  accent: '#c2410c',
} as const;

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Envuelve el cuerpo en la estructura comun de la marca. */
export function layout(options: { title: string; storeName: string; body: string; footer: string }): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.mist};font-family:${FONT};color:${COLORS.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.mist};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.paper};border:1px solid ${COLORS.line};">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid ${COLORS.line};">
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.01em;text-transform:uppercase;">${escapeHtml(options.storeName)}</p>
            </td>
          </tr>
          <tr><td style="padding:32px;">${options.body}</td></tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${COLORS.line};background-color:${COLORS.mist};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.muted};">${options.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Enlace de WhatsApp con mensaje predefinido. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
