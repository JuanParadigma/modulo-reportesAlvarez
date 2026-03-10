import { query } from "../lib/db";

async function testConnection(){
    console.log('Probando conexión a SQL Server...');
    console.log('Server:', process.env.DB_SERVER);
    console.log('Database:', process.env.DB_NAME);

    try{
        const result = await query<{version:string}>(
            'SELECT @@VERSION as version'
        );

        console.log('Conexion exitosa!');
        console.log('SQL Server:', result[0]?.version?.split('\n')[0]);

        const tables = await query<{name: string}>(
            `SELECT TOP 10 name FROM sys.tables ORDER BY name`
        );

        console.log('\nPrimeras tablas disponibles:');
        tables.forEach(t => console.log(' -', t.name));

        process.exit(0);
    } catch (error){
        console.error('Error de conexion:', error)
        process.exit(1);
    }

}

testConnection();