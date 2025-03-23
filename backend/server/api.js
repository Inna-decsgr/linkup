const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../models/db"); // MySQL 연결된 db 가져오기
const { dbPromise } = require('../models/db');


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


// 📌 로그인 API
router.post("/login", async (req, res) => {
  const { userid, password } = req.body;

  try {
    // 1. userid로 사용자 찾기
    const query = 'SELECT * FROM users WHERE userid = ?';
    db.query(query, [userid], async (err, results) => {
      if (err) {
        console.error("사용자 조회 실패", err);
        return res.status(500).json({ message: '서버 오류' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
      }

      const user = results[0];

      // 2. 비밀번호 비교
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
      }

      // 3. 로그인 성공 => 비밀번호 제거 후 사용자 정보 반환
      const { password: pw, ...userInfo } = user;

      return res.status(200).json({
        message: "로그인 성공",
        user: userInfo
      });
    });
  } catch (error) {
    console.error("로그인 중 예외 발생", error);
    res.status(500).json({ message: "로그인 실패" });
  }
})



// 📌 사용자 정보 수정 API
router.post("/editprofile", async (req, res) => {
  const { userid, username, email, telephone, id } = req.body;

  console.log('🔍 전달받은 사용자 id:', id); // ✅ 출력해서 확인 가능!

  if (!userid || !username || !email || !telephone) {
    return res.status(400).json({ message: '빈 항목을 모두 입력해주세요.' });
  }

  try {
    // 1. 사용자 존재 확인
    const [users] = await dbPromise.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
    }

    // 2. 사용자 정보 업데이트
    await dbPromise.query(
      'UPDATE users SET userid = ?, username = ?, email = ?, telephone = ? WHERE id = ?',
      [userid, username, email, telephone, id]
    );

    // 3. 수정된 사용자 정보 다시 조회
    const [updated] = await dbPromise.query(
      'SELECT id, username, email, userid, telephone, created_at FROM users WHERE id = ?',
      [id]
    );

    return res.status(200).json(updated[0]);
  } catch (err) {
    console.error('사용자 정보 수정 중 오류:', err);
    return res.status(500).json({ message: '서버 오류로 인해 사용자 정보 수정에 실패했습니다.' });
  }
});



module.exports = router; // 라우터 내보내기
