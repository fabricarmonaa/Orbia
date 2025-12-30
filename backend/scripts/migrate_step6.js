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
CREATE TABLE IF NOT EXISTS products (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100),
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_sku_tenant (tenant_id, sku)
) ENGINE=InnoDB;
`;

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Running migration Step 6...');
    await connection.query(sql);
    console.log('Migration Step 6 complete.');
    await connection.end();
}

migrate().catch(console.error);
