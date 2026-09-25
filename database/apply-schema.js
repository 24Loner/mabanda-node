
require('dotenv').config({path: require('path').join(__dirname,'..','.env')});
const fs=require('fs'),path=require('path');
const {Pool}=require('pg');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL&&/sslmode=require/i.test(process.env.DATABASE_URL)?{rejectUnauthorized:false}:undefined});
(async()=>{try{const sql=fs.readFileSync(path.join(__dirname,'schema.postgresql.sql'),'utf8');await pool.query(sql);console.log('PostgreSQL schema applied.');}catch(e){console.error(e);process.exitCode=1;}finally{await pool.end();}})();
