const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
require("dotenv").config();
const apiRoutes = require("./server/api");
const path = require('path');
const http = require("http"); // 💡 추가
const { Server } = require("socket.io"); // 💡 추가


const app = express();


// 1. http, io 생성
const server = http.createServer(app); // 💡 http 서버로 감싸기
// 💡 socket.io 세팅
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // 프론트 주소
    methods: ["GET", "POST"]
  }
});


app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());


// MySQL DB 연결 설정
const db = mysql.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4' 
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL 연결 실패:", err);
    return;
  }
  console.log("✅ MySQL 연결 성공!");
});


// 3. socket 핸들러 연결
// socket.js와 연결되어있어서 로직 실행 가능
const socketHandler = require('./server/socket');
socketHandler(io, db); // io와 db 넘겨줌



// 기본 API 및 미들웨어 설정
app.get("/", (req, res) => {
  res.send("백엔드 서버 실행 중!");
});

app.use("/api", apiRoutes); // /api/...로 시작하는 모든 API가 api.js에서 자동으로 연결됨
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// 📌 서버 실행 (포트 5000)
server.listen(5000, () => {
  console.log("🚀 Express + Socket.IO 서버가 5000번 포트에서 실행 중!");
});
