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
CREATE TABLE IF NOT EXISTS public_tracking_links (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  UNIQUE KEY uniq_token_hash (token_hash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_status_history (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  order_id CHAR(26) NOT NULL,
  status_id CHAR(26) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note_visible TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (status_id) REFERENCES order_statuses(id)
) ENGINE=InnoDB;
`;

async function migrate() {
    console.log('Connecting to DB...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected. Running migration...');

    const statements = sql.split(';').filter(s => s.trim());

    for (const statement of statements) {
        if (statement.trim()) {
            await connection.query(statement);
            console.log('Executed:', statement.substring(0, 50) + '...');
        }
    }

    console.log('Migration complete.');
    await connection.end();
}

migrate().catch(console.error);
