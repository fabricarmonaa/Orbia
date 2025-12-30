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
CREATE TABLE IF NOT EXISTS cash_sessions (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  opening_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  closing_amount DECIMAL(12,2) NULL,
  status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fixed_expenses (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  category_id CHAR(26) NOT NULL,
  name VARCHAR(120) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_day INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES cash_categories(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monthly_finance_read (
  id CHAR(26) PRIMARY KEY,
  tenant_id CHAR(26) NOT NULL,
  month VARCHAR(7) NOT NULL, -- YYYY-MM
  income_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  fixed_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  variable_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  result_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uniq_month (tenant_id, month)
) ENGINE=InnoDB;
`;

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Running migration Step 4...');
    const statements = sql.split(';');
    for (const s of statements) {
        if (s.trim()) await connection.query(s);
    }
    console.log('Migration Step 4 complete.');
    await connection.end();
}

migrate().catch(console.error);
