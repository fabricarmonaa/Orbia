import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

const sql = `
CREATE TABLE IF NOT EXISTS tenant_settings (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_tenant_key (tenant_id, setting_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_preferences (
  id CHAR(26) PRIMARY KEY,
  user_id CHAR(26) NOT NULL,
  pref_key VARCHAR(100) NOT NULL,
  pref_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uniq_user_key (user_id, pref_key)
) ENGINE=InnoDB;
`;

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Running migration Step 7...');
    const statements = sql.split(';');
    for (const s of statements) {
        if (s.trim()) await connection.query(s);
    }
    console.log('Migration Step 7 complete.');
    await connection.end();
}

migrate().catch(console.error);
