import { getArgumentValue, runCommand } from './utils';

// Obtención de argumentos de la línea de comando (excluyendo los primeros dos).
const args = process.argv.slice(2);

// Obtener el nombre de la migración a partir de los argumentos.
const migrationName = getArgumentValue(args, '--name=', 'default_migration_name');

console.log(`Ejecutando migraciones con nombre: ${migrationName}`);
runCommand(`npm run typeorm -- migration:create ./src/migrations/${migrationName}`);
