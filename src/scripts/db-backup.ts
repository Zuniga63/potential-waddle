import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

async function ensureDir(dir: string) {
  if (existsSync(dir)) return;

  mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
}

function runCommand(cmd: string, env: NodeJS.ProcessEnv = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { env: { ...process.env, ...env } }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running command: ${cmd}`);
        console.error(stderr);
        return reject(error);
      }
      console.log(stdout);
      resolve(stdout);
    });
  });
}

async function main() {
  // 1. Create a backup directory
  const ROOT_DIR = process.cwd();
  const backupRoot = path.join(ROOT_DIR, 'backups');
  await ensureDir(backupRoot);

  // 2. Create a folder with date YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const uniqueId = Date.now();

  const dateFolder = `${year}-${month}-${day}-${uniqueId}`;
  const targetDir = path.join(backupRoot, dateFolder);
  await ensureDir(targetDir);

  // 3. Read enviroment variables
  const { DB_HOST: host, DB_PORT: port = '5432', DB_USER: user, DB_PASSWORD: password, DB_NAME: db } = process.env;

  if (!host || !user || !password || !db) {
    console.error('❌ Missing environment variables. Make sure to define DB_HOST, DB_USER, DB_PASSWORD and DB_NAME.');
    process.exit(1);
  }

  // 4. Define the output files
  const dumpFile = path.join(targetDir, `${db}.dump`);
  const sqlFile = path.join(targetDir, `${db}.sql`);

  // 5. Run pg_dump to create the dump file
  try {
    console.log('🔄 Generating dump file...');
    await runCommand(`pg_dump -h ${host} -p ${port} -U ${user} -F c -b -v -f "${dumpFile}" ${db}`, {
      PGPASSWORD: password,
    });

    console.log('🔄 Generating sql file...');
    const plainCmd =
      process.platform === 'win32'
        ? `pg_dump -h ${host} -p ${port} -U ${user} -d ${db} -f "${sqlFile}"`
        : `pg_dump -h ${host} -p ${port} -U ${user} -d ${db} > "${sqlFile}"`;

    await runCommand(plainCmd, {
      PGPASSWORD: password,
    });

    console.log(`✅ backups generated successfully in ${targetDir}`);
  } catch (error) {
    console.error('❌ Error generating backups:', error);
    process.exit(1);
  }
}

main();
