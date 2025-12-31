import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');
const dbName = process.env.DB_NAME || 'orbia';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function ensureDatabase() {
  const connection = await mysql.createConnection(baseConfig);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.end();
}

async function getDbConnection() {
  return mysql.createConnection({ ...baseConfig, database: dbName, multipleStatements: true });
}

async function loadMigrations() {
  const files = (await fs.readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort();
  return files.map(f => ({ version: f, filepath: path.join(migrationsDir, f) }));
}

async function ensureMigrationsTable(conn) {
  await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (\n    version VARCHAR(100) PRIMARY KEY,\n    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function hasMigrationRun(conn, version) {
  const [rows] = await conn.query('SELECT 1 FROM schema_migrations WHERE version = ? LIMIT 1', [version]);
  return rows.length > 0;
}

function splitStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function applyMigration(conn, migration) {
  const sql = await fs.readFile(migration.filepath, 'utf8');
  const statements = splitStatements(sql);
  for (const statement of statements) {
    await conn.query(statement);
  }
  await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [migration.version]);
}

async function run() {
  await ensureDatabase();
  const conn = await getDbConnection();
  try {
    await ensureMigrationsTable(conn);
    const migrations = await loadMigrations();
    for (const migration of migrations) {
      const alreadyRun = await hasMigrationRun(conn, migration.version);
      if (alreadyRun) {
        console.log(`Skipping migration ${migration.version} (already applied)`);
        continue;
      }
      console.log(`Applying migration ${migration.version}...`);
      await applyMigration(conn, migration);
      console.log(`Migration ${migration.version} applied.`);
    }
    console.log('All migrations complete.');
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
