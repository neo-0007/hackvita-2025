const { Pool } = require("pg");
const db = new Pool({
    host: process.env.PGSQL_HOST,
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
    database: process.env.PGSQL_DATABASE,
    port: process.env.PGSQL_PORT || 5432,
});

module.exports = db;