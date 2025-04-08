const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
require("dotenv").config();
const apiRoutes = require("./server/api");
const path = require('path');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());

// 📌 MySQL 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 연결 성공!");
});

// 📌 기본 API
app.get("/", (req, res) => {
  res.send("백엔드 서버 실행 중!");
});

app.use("/api", apiRoutes); // /api/...로 시작하는 모든 API가 api.js에서 자동으로 연결됨
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// 📌 서버 실행 (포트 5000)
app.listen(5000, () => {
  console.log("🚀 서버가 5000번 포트에서 실행 중!");
});
