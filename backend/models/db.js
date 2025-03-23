const mysql = require("mysql");
const mysql2 = require("mysql2/promise");
require("dotenv").config();


// 콜백 기반
// 📌 MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 📌 데이터베이스 연결 확인
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 연결 성공! (models/db.js)");
});


// Promise 기반
const dbPromise = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


module.exports = {
  db,  // 콜백 기반
  dbPromise  // async/await 기반
};
