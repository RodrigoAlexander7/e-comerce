import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { APP_CONFIG, type AppConfig } from '../../../config/app-config.js';
import { EmailSender, type EmailMessage } from '../domain/ports/email-sender.port.js';

/**
 * Adaptador SMTP del puerto EmailSender.
 *
 * Funciona con cualquier proveedor que hable SMTP. En desarrollo apunta a
 * Mailpit (docker compose), cuya bandeja se consulta en http://localhost:8025,
 * de modo que nunca se envia correo real desde una maquina de trabajo.
 */
@Injectable()
export class NodemailerEmailSender extends EmailSender implements OnModuleInit {
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private transporter!: Transporter;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    super();
  }

  onModuleInit(): void {
    const { smtp } = this.config.mail;

    this.transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      // Mailpit acepta conexiones sin credenciales; en produccion siempre las hay.
      auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.mail.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    this.logger.log(`Correo enviado a ${message.to}: ${message.subject}`);
  }
}
