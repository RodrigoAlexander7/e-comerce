/**
 * Configuracion tipada de la aplicacion.
 *
 * Se valida una sola vez al arrancar: si falta una variable critica el proceso
 * muere de inmediato con un mensaje claro, en lugar de fallar mas tarde en una
 * peticion de un cliente real.
 */

export interface BankAccount {
  readonly bank: string;
  readonly accountNumber: string;
  readonly cci: string;
}

export interface CompanyConfig {
  readonly name: string;
  readonly ruc: string;
  readonly email: string;
  readonly whatsapp: string;
  readonly yapePhone: string;
  readonly yapeQrUrl: string;
  readonly bankAccounts: readonly BankAccount[];
}

export interface SmtpConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
}

export interface MailConfig {
  readonly smtp: SmtpConfig;
  /** Remitente mostrado al cliente, con nombre y direccion. */
  readonly from: string;
}

export interface AuthConfig {
  readonly jwtSecret: string;
  readonly jwtLifetimeSeconds: number;
  readonly googleClientId: string;
  readonly googleClientSecret: string;
  readonly googleCallbackUrl: string;
  /** Marca la cookie de sesion como Secure. Obligatorio fuera de desarrollo. */
  readonly cookieSecure: boolean;
  readonly cookieDomain: string | undefined;
  /**
   * Habilita /auth/dev-login, un acceso sin Google para desarrollo y pruebas
   * automatizadas. Requiere ENABLE_DEV_LOGIN=true Y ademas nodeEnv distinto de
   * "production": la comprobacion doble es deliberada, para que fijar la
   * variable por error en un despliegue real no abra una puerta trasera.
   */
  readonly devLoginEnabled: boolean;
}

export interface AppConfig {
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly port: number;
  readonly frontendUrl: string;
  readonly databaseUrl: string;
  readonly currency: string;
  readonly taxRateBps: number;
  readonly paymentWindowHours: number;
  readonly company: CompanyConfig;
  readonly mail: MailConfig;
  readonly auth: AuthConfig;
  readonly uploadsDir: string;
  readonly publicAssetBaseUrl: string;
}

class MissingEnvError extends Error {
  constructor(key: string) {
    super(`Falta la variable de entorno obligatoria "${key}". Revisa tu archivo .env.`);
  }
}

function required(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') {
    throw new MissingEnvError(key);
  }
  return value.trim();
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function boolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw.trim().toLowerCase() === 'true';
}

function integer(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`La variable "${key}" debe ser un numero entero, se recibio "${raw}".`);
  }
  return parsed;
}

/**
 * Formato: "Banco|Numero|CCI" separando cada cuenta con ";".
 * Se eligio una sola variable en vez de una por campo para que anadir un banco
 * no obligue a redesplegar con tres variables nuevas.
 */
function parseBankAccounts(raw: string): BankAccount[] {
  return raw
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [bank, accountNumber, cci] = entry.split('|').map((part) => part.trim());
      if (!bank || !accountNumber || !cci) {
        throw new Error(
          `Cuenta bancaria mal formada: "${entry}". Se espera "Banco|NumeroDeCuenta|CCI".`,
        );
      }
      return { bank, accountNumber, cci };
    });
}

/** Convierte "7d", "12h" o "3600" a segundos. */
function durationSeconds(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;

  const match = /^(\d+)\s*([smhd])?$/.exec(raw);
  if (!match) {
    throw new Error(`La variable "${key}" debe ser un numero con sufijo s, m, h o d, se recibio "${raw}".`);
  }

  const value = Number.parseInt(match[1], 10);
  const unit = match[2] ?? 's';
  const multiplier = { s: 1, m: 60, h: 3_600, d: 86_400 }[unit] ?? 1;
  return value * multiplier;
}

export function loadAppConfig(): AppConfig {
  const nodeEnv = optional('NODE_ENV', 'development');
  if (nodeEnv !== 'development' && nodeEnv !== 'production' && nodeEnv !== 'test') {
    throw new Error(`NODE_ENV invalido: "${nodeEnv}".`);
  }

  const isProduction = nodeEnv === 'production';
  const jwtSecret = required('JWT_SECRET');

  // Un secreto de ejemplo en produccion equivale a no tener secreto: cualquiera
  // que lea el repositorio podria firmarse un token de administrador.
  if (isProduction && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en produccion.');
  }

  return {
    nodeEnv,
    port: integer('PORT', 3001),
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),
    databaseUrl: required('DATABASE_URL'),
    currency: optional('CURRENCY', 'PEN'),
    taxRateBps: integer('TAX_RATE_BPS', 1800),
    paymentWindowHours: integer('PAYMENT_WINDOW_HOURS', 2),
    company: {
      name: optional('COMPANY_NAME', 'Atlas Sport SAC'),
      ruc: optional('COMPANY_RUC', ''),
      email: optional('COMPANY_EMAIL', ''),
      whatsapp: optional('COMPANY_WHATSAPP', ''),
      yapePhone: optional('COMPANY_YAPE_PHONE', ''),
      yapeQrUrl: optional('COMPANY_YAPE_QR_URL', '/payment/yape-qr.png'),
      bankAccounts: parseBankAccounts(optional('COMPANY_BANK_ACCOUNTS', '')),
    },
    mail: {
      smtp: {
        host: optional('SMTP_HOST', 'localhost'),
        port: integer('SMTP_PORT', 1025),
        secure: boolean('SMTP_SECURE', false),
        user: optional('SMTP_USER', ''),
        password: optional('SMTP_PASSWORD', ''),
      },
      from: optional('MAIL_FROM', 'Atlas Sport <no-reply@atlassport.pe>'),
    },
    auth: {
      jwtSecret,
      jwtLifetimeSeconds: durationSeconds('JWT_EXPIRES_IN', 7 * 86_400),
      googleClientId: optional('GOOGLE_CLIENT_ID', ''),
      googleClientSecret: optional('GOOGLE_CLIENT_SECRET', ''),
      googleCallbackUrl: optional(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/api/auth/google/callback',
      ),
      // Sin HTTPS en desarrollo el navegador descartaria una cookie Secure.
      cookieSecure: boolean('COOKIE_SECURE', isProduction),
      cookieDomain: process.env.COOKIE_DOMAIN?.trim() || undefined,
      devLoginEnabled: !isProduction && boolean('ENABLE_DEV_LOGIN', false),
    },
    uploadsDir: optional('UPLOADS_DIR', './uploads'),
    publicAssetBaseUrl: optional('PUBLIC_ASSET_BASE_URL', 'http://localhost:3001/static'),
  };
}

/** Token de inyeccion para recibir la configuracion ya validada. */
export const APP_CONFIG = Symbol('APP_CONFIG');
