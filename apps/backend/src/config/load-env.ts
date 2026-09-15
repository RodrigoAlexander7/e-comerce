/**
 * Carga el archivo .env en process.env.
 *
 * Se aisla en su propio modulo porque ES Modules evalua los imports en orden
 * antes que el cuerpo del archivo que los importa: colocarlo como primer
 * import de main.ts garantiza que las variables existan antes de que Nest
 * construya cualquier proveedor.
 *
 * Node 24 lee el archivo de forma nativa, sin necesidad de dotenv.
 */
const ENV_FILE = process.env.ENV_FILE ?? '.env';

try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // En contenedores y CI las variables llegan ya inyectadas en el entorno del
  // proceso y no existe ningun archivo que leer. La ausencia de una variable
  // obligatoria la detecta despues loadAppConfig con un mensaje explicito.
}

export {};
