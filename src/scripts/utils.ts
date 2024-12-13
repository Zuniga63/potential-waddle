import { execSync } from 'child_process';

// Función para extraer el valor de un argumento con un prefijo dado, con un valor por defecto.
export function getArgumentValue(args, prefix, defaultValue) {
  for (const arg of args) {
    if (arg.startsWith(prefix)) {
      return arg.split('=')[1];
    }
  }
  return defaultValue;
}

// Función auxiliar para ejecutar un comando y heredar stdio (mostrar la salida directamente).
export function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error al ejecutar el comando "${command}":`, error);
    process.exit(1);
  }
}
