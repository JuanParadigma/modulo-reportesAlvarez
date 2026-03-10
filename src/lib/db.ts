import sql from 'mssql';

const config: sql.config = {
    server: process.env.DB_SERVER!,
    port: parseInt(process.env.DB_PORT ?? '1433'),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options:{
        encrypt:false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    pool:{
        max:10,
        min: 0,
        idleTimeoutMillis:30000
    },
    connectionTimeout: 15000,
    requestTimeout: 30000,
}

//typescript 
declare global{
    var __sqlPool: sql.ConnectionPool | undefined;
}

// Singleton - a single instance of the pool across the app
// globalThis persist on hot-reloads
export async function getPool(): Promise<sql.ConnectionPool>{
    if(!globalThis.__sqlPool){
        globalThis.__sqlPool = await sql.connect(config)
    }
    return globalThis.__sqlPool;
}

// Queries only reading
export async function query<T>(
    sqlQuery:string,
    params?: Record<string, { type: sql.ISqlType; value:unknown}>
): Promise<T[]>{
    const pool = await getPool();
    const request = pool.request();

    if(params){
        for(const [ name, {type, value}] of Object.entries(params)){
            request.input(name, type, value)
        }
    }
    const result = await request.query<T>(sqlQuery);
    return result.recordset

}