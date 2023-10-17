const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "xxx123",
  host: "localhost",
  port: 5432,
  database: "DBMeetingApp",
});

module.exports = pool;
