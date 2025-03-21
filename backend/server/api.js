const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../models/db"); // MySQL 연결된 db 가져오기

const router = express.Router();

// 📌 회원가입 API
router.post("/signup", async (req, res) => {
  const { username, userid, email, telephone, password } = req.body;

  try {
    // 비밀번호 해싱 (보안 강화)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 데이터베이스에 사용자 정보 저장
    const query = `
      INSERT INTO users (username, userid, email, telephone, password, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())`;
    db.query(query, [username, userid, email, telephone, hashedPassword], (err, result) => {
      if (err) {
        console.error("❌ 회원가입 실패:", err);
        return res.status(500).json({ message: "회원가입 중 오류 발생" });
      }
      res.status(201).json({ message: "✅ 회원가입 성공!" });
    });
  } catch (error) {
    res.status(500).json({ message: "❌ 서버 오류 발생" });
  }
});

module.exports = router; // 라우터 내보내기
