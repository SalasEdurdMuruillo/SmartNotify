import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",

  port: Number(
    process.env.DB_PORT || 3304,
  ),

  user:
    process.env.DB_USER ||
    "root",

  password:
    process.env.DB_PASSWORD ||
    "root",

  database:
    process.env.DB_NAME ||
    "smartnotify",

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,

  charset: "utf8mb4",
});

export async function probarConexion() {
  const connection =
    await pool.getConnection();

  await connection.ping();

  connection.release();
}

export default pool;