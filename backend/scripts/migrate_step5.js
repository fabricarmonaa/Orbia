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
CREATE TABLE IF NOT EXISTS branches (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255),
  phone VARCHAR(50),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

ALTER TABLE orders ADD COLUMN branch_id CHAR(26) NULL;
ALTER TABLE orders ADD CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

ALTER TABLE users ADD COLUMN branch_id CHAR(26) NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id);
`;

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Running migration Step 5...');
    const statements = sql.split(';');
    for (const s of statements) {
        if (s.trim()) {
            try {
                await connection.query(s);
            } catch (e) {
                console.warn('Migration warning (might be duplicate column):', e.message);
            }
        }
    }
    console.log('Migration Step 5 complete.');
    await connection.end();
}

migrate().catch(console.error);
