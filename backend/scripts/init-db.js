
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

async function initDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    const dbName = process.env.DB_NAME || 'Orbia';
    console.log(`Creating database ${dbName} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log('Reading schema.sql...');
    const schemaPath = path.resolve(process.cwd(), '../sql/schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');

    // Split by semicolon but ignore comments/strings... simplistic split might fail on triggers/procedures
    // But the schema provided looks simple enough.
    const statements = schemaSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} statements...`);
    for (const statement of statements) {
        try {
            await connection.query(statement);
        } catch (err) {
            // Ignore "table exists" errors if re-running
            if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
                console.warn(`Error executing statement: ${statement.slice(0, 50)}...`, err.message);
            }
        }
    }

    console.log('Database initialized successfully.');
    await connection.end();
}

initDb().catch(console.error);
