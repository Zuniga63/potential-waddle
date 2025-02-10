import { MIGRATION_RESOURCE_PATH, runCommand } from './utils';

console.log('Compiling project...');
runCommand('pnpm build');

console.log('Running migrations...');
runCommand(`npm run typeorm migration:run -- -d ${MIGRATION_RESOURCE_PATH}`);

console.log('Project compiled and migrations run successfully.');
