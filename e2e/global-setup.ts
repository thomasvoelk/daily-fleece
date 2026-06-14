import { execSync } from 'child_process';
import * as path from 'path';

const MIGRATION_DIR = path.join(__dirname, '../backend/src/main/resources/db/migration');
const CONTAINER = 'daily-fleece-e2e-mongodb-1';
const DB = 'daily_fleece_e2e';
const SCRIPT = 'V1__init.js';

export default async function globalSetup() {
  const localPath = path.join(MIGRATION_DIR, SCRIPT);
  execSync(`docker cp "${localPath}" ${CONTAINER}:/tmp/${SCRIPT}`);
  execSync(
    `docker exec ${CONTAINER} mongosh mongodb://localhost:27017/${DB} --file /tmp/${SCRIPT} --quiet`,
    { env: { ...process.env, DOCKER_HOST: 'unix:///var/run/docker.sock' } },
  );
}
