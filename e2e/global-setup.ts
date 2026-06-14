import { execSync } from 'child_process';
import * as path from 'path';

const MIGRATION_DIR = path.join(__dirname, '../backend/src/main/resources/db/migration');
const CONTAINER = 'daily-fleece-e2e-mongodb-1';
const DB = 'daily_fleece_e2e';
const SCRIPTS = [
  'V1__init_players.js',
  'V2__init_sessions.js',
  'V3__add_photo_ids_and_gridfs_ttl.js',
];

export default async function globalSetup() {
  for (const script of SCRIPTS) {
    const localPath = path.join(MIGRATION_DIR, script);
    execSync(`docker cp "${localPath}" ${CONTAINER}:/tmp/${script}`);
    execSync(
      `docker exec ${CONTAINER} mongosh mongodb://localhost:27017/${DB} --file /tmp/${script} --quiet`,
      { env: { ...process.env, DOCKER_HOST: 'unix:///var/run/docker.sock' } },
    );
  }
}
