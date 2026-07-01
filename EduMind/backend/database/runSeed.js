/**
 * Convenience script: creates the edumind database, applies schema.sql,
 * then loads seed.sql with demo data.
 *
 * Usage:  npm run seed
 * (Requires the MySQL credentials in your .env file to have privileges
 *  to create databases.)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  try {
    console.log('Applying schema.sql ...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await connection.query(schema);

    console.log('Loading seed.sql ...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await connection.query(seed);

    console.log('Database "edumind" created and seeded successfully.');
    console.log('');
    console.log('Demo logins:');
    console.log('  Admin    -> admin@edumind.lk     / Admin@123');
    console.log('  Faculty  -> rahul.s@edumind.lk    / Faculty@123');
    console.log('  Student  -> amit.s@edumind.lk     / Student@123');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

run();
