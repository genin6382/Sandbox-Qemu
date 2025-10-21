/* Database connection setup using pg library ,
   This file is responsible for connecting to our PostgreSQL database.
*/
import {Pool} from 'pg';
import dotenv from 'dotenv'
import path from 'path';

const envPath = path.resolve(__dirname, '..', '..', '.env'); 
dotenv.config({ path: envPath });

console.log(process.env);

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
})

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err) => {
    console.error('Database connection error', err);
});

export default pool;