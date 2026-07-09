import mysql from 'mysql2/promise';

// Singleton connection pool to reuse across API calls
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const missing = ['TIDB_HOST', 'TIDB_USER', 'TIDB_PASSWORD'].filter(
      (key) => !process.env[key]
    );
    if (missing.length > 0) {
      throw new Error(`DB 환경변수가 설정되지 않았습니다: ${missing.join(', ')} (.env.local 확인)`);
    }
    pool = mysql.createPool({
      host:     process.env.TIDB_HOST,
      port:     Number(process.env.TIDB_PORT ?? 4000),
      user:     process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE ?? 'zari',
      ssl: {
        // TiDB Cloud requires SSL; set to true in production
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
      // Connection pool settings
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}
