import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

declare global {
  var __sqlPool: sql.ConnectionPool | undefined;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!globalThis.__sqlPool) {
    globalThis.__sqlPool = await sql.connect(config);
  }
  return globalThis.__sqlPool;
}

export async function query<T>(sqlQuery: string): Promise<T[]> {
  const pool   = await getPool();
  const result = await pool.request().query<T>(sqlQuery);
  return result.recordset;
}

export { sql };