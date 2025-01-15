import { getArgumentValue, runCommand } from './utils';

// Obtención de argumentos de la línea de comando (excluyendo los primeros dos).
const args = process.argv.slice(2);

// Obtener el nombre de la migración a partir de los argumentos.
const migrationName = getArgumentValue(args, '--name=', 'default_migration_name');

// Proceso de construcción y ejecución de migraciones.
console.log('Compilando el proyecto...');
runCommand('pnpm build');

console.log(`Ejecutando migraciones con nombre: ${migrationName}`);
// runCommand(`npm run migration:generate --name=${migrationName}`);
runCommand(
  `npm run typeorm -- -d ./src/config/connection-source.ts migration:generate ./src/migrations/${migrationName}`,
);

console.log('Compilando el proyecto nuevamente...');
runCommand('pnpm build');

console.log('Proceso completado con éxito.');
