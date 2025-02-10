import { MIGRATION_RESOURCE_PATH, getArgumentValue, runCommand } from './utils';

// Obtención de argumentos de la línea de comando (excluyendo los primeros dos).
const args = process.argv.slice(2);

// Obtener el nombre de la migración a partir de los argumentos.
const migrationName = getArgumentValue(args, '--name=', 'default_migration_name');

// Proceso de construcción y ejecución de migraciones.
console.log('Compiling project...');
runCommand('pnpm build');

console.log(`Generating migrations with name: ${migrationName}`);
runCommand(`npm run typeorm -- -d ${MIGRATION_RESOURCE_PATH} migration:generate ./src/migrations/${migrationName}`);

console.log('Process completed successfully.');
