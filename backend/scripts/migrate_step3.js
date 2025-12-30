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
CREATE TABLE IF NOT EXISTS order_status_transitions (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  from_status_id CHAR(26) NOT NULL,
  to_status_id CHAR(26) NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (from_status_id) REFERENCES order_statuses(id),
  FOREIGN KEY (to_status_id) REFERENCES order_statuses(id),
  UNIQUE KEY uniq_transition (tenant_id, from_status_id, to_status_id)
) ENGINE=InnoDB;
`;

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Running migration Step 3...');
    await connection.query(sql);
    console.log('Migration Step 3 complete.');
    await connection.end();
}

migrate().catch(console.error);
