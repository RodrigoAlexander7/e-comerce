/** Un correo listo para salir. */
export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  /** Version en texto plano, para clientes que no renderizan HTML. */
  readonly text: string;
}

/**
 * Puerto de envio de correo.
 *
 * Aisla al resto del sistema del transporte concreto. Hoy detras hay SMTP con
 * Nodemailer; migrar a un proveedor de API como Resend seria escribir otro
 * adaptador y cambiar una linea del modulo, sin tocar plantillas ni casos de uso.
 */
export abstract class EmailSender {
  abstract send(message: EmailMessage): Promise<void>;
}
