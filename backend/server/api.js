const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../models/db"); // MySQL 연결된 db 가져오기
const { dbPromise } = require('../models/db');
const multer = require('multer');
const path = require('path');
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
    const [rows] = await dbPromise.query(
      'SELECT * FROM users WHERE userid = ?',
      [userid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    const { password: pw, ...userInfo } = user;

    return res.status(200).json({
      message: "로그인 성공",
      user: userInfo
    });
  } catch (error) {
    console.error("로그인 중 예외 발생", error);
    res.status(500).json({ message: "로그인 실패" });
  }
});


// 이미지 등록: multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname); // 확장자만 추출 (.jpg 등)
    const safeName = file.originalname
      .replace(/\s+/g, '_')         // 공백 → 언더스코어
      .replace(/[^\w.-]/g, '')      // 한글/특수문자 제거
      .replace(ext, '');            // 확장자 제거 후 다시 붙이기

    cb(null, `${timestamp}_${safeName}${ext}`);
  }
});


const upload = multer({ storage });



// 📌 사용자 정보 수정 API
router.post("/editprofile", upload.single('profile_image'), async (req, res) => {
  const { userid, username, bio, email, telephone, id } = req.body;
  const profileImage = req.file ? req.file.filename : null;


  console.log('🔍 전달받은 사용자 id:', id); // ✅ 출력해서 확인 가능!
  console.log('📷 업로드된 이미지:', profileImage);
  console.log('소개글:', bio);
  

  if (!userid || !username || !bio || !email || !telephone) {
    return res.status(400).json({ message: '빈 항목을 모두 입력해주세요.' });
  }

  try {
    // 1. 사용자 존재 확인
    const [users] = await dbPromise.query('SELECT * FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: '존재하지 않는 사용자입니다.' });
    }

    // 2. 사용자 정보 업데이트(이미지 포함 여부에 따라 분기)
    if (profileImage) {
      await dbPromise.query(
        'UPDATE users SET userid = ?, username = ?, bio = ?, email = ?, telephone = ?, profile_image = ? WHERE id = ?',
        [userid, username, bio, email, telephone, profileImage, id]
      );
    } else {
      await dbPromise.query(
        'UPDATE users SET userid = ?, username = ?, bio = ?, email = ?, telephone = ? WHERE id = ?',
        [userid, username, bio, email, telephone, id]
      );
    }
    

    // 3. 수정된 사용자 정보 다시 조회
    const [updated] = await dbPromise.query(
      'SELECT id, username, bio, email, userid, telephone, profile_image, created_at FROM users WHERE id = ?',
      [id]
    );

    return res.status(200).json(updated[0]);
  } catch (err) {
    console.error('사용자 정보 수정 중 오류:', err);
    return res.status(500).json({ message: '서버 오류로 인해 사용자 정보 수정에 실패했습니다.' });
  }
});



// 📌 모든 사용자 정보 조회
router.get("/users", async (req, res) => {
  try {
    const [users] = await dbPromise.query(
      'SELECT id, username, userid, profile_image, bio FROM users'
    );

    return res.status(200).json(users);
    
  } catch (error) {
    res.status(500).json({ message: "사용자 정보를 불러올 수 없습니다." });
  }
});


// 📌 검색한 userid로 사용자 조회
router.get("/search", async (req, res) => {
  const { keyword, userid } = req.query;
  console.log('전달받은 사용자 id:', keyword); // ✅ 출력해서 확인 가능!
  console.log('로그인한 사용자 id', userid);

  try {
    const [users] = await dbPromise.query(
      `SELECT id, username, userid, profile_image, bio
      FROM users 
      WHERE userid LIKE ? AND userid != ?`,
      [`%${keyword}%`, userid]  // keyword가 포함된 userid 검색!
    );

    return res.status(200).json(users);
    
  } catch (error) {
    console.error("검색 실패:", error);
    res.status(500).json({ message: "사용자 검색 중 오류 발생" });
  }
});


// 📌 특정 사용자에 대한 정보 조회
router.get("/users/:userid", async (req, res) => {
  const { userid } = req.params;
  try {
    const [ users ] = await dbPromise.query(
      "SELECT id, username, userid, profile_image, bio FROM users WHERE userid = ?",
      [userid]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "유저 조회 실패" });
  }
})


// 📌 팔로우, 팔로잉 토글 API
router.post('/follow', async (req, res) => {
  const { follower_id, following_id } = req.body;

  if (!follower_id || !following_id) {
    return res.status(400).json({ message: '빈 항목이 있습니다.' });
  }

  try {
    // 이미 팔로우하고 있는 상태인지 확인
    const [existing] = await dbPromise.query(
      'SELECT * FROM followers WHERE follower_id = ? AND following_id = ?',
      [follower_id, following_id]
    );

    if (existing.length > 0) {
      // 팔로우 중이면 팔로우 취소(언팔)
      await dbPromise.query(
        'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
        [follower_id, following_id]
      );
      return res.status(200).json({
        message: '언팔로우',
        following: false,
        follower_id,
        following_id,
      });
    } else {
      // 팔로우하는 상태가 아니라면 팔로잉
      await dbPromise.query(
        'INSERT INTO followers (follower_id, following_id) VALUES(?, ?)',
        [follower_id, following_id]
      );
      return res.status(201).json({
        message: '팔로잉 중',
        following: true,
        follower_id,
        following_id
      });
    }
  } catch (err) {
    console.error('팔로우 토글 중 도중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
});


// 📌 팔로우중인지 아닌지 조회
router.get('/follow/status', async (req, res) => {
  const { follower_id, following_id } = req.query;

  if (!follower_id || !following_id) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    const [rows] = await dbPromise.query(
      'SELECT * FROM followers WHERE follower_id = ? AND following_id = ?',
      [follower_id, following_id]
    );

    const isFollowing = rows.length > 0;
    res.status(200).json({ isFollowing });
  } catch (err) {
    console.error('팔로우 상태 확인 에러', err);
    res.status(500).json({ message: '서버 오류' });
  }
});


// 📌 새 게시물 작성 후 게시하기
// multer로 이미지 업로드 받기
router.post('/newpost', upload.array('images'), async (req, res) => {
  const connection = await dbPromise.getConnection(); // 트랜잭션 처리 위해 커넥션 요청

  try {
    const { caption, user_id } = req.body;
    const taggedUser = req.body.taggedUser ? JSON.parse(req.body.taggedUser) : null;
    const imageFilenames = req.files.map(file => file.filename);
    console.log('문구:', caption);
    console.log('태그된 유저:', taggedUser);
    console.log('이미지 파일 이름들:', imageFilenames);

    await connection.beginTransaction();

    // 1. posts 테이블에 저장
    const [postResult] = await connection.query(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [user_id, caption]
    );
    const postId = postResult.insertId;
    // 2. post_images 테이블에 이미지 저장
    for (const filename of imageFilenames) {
      await connection.query(
        'INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
        [postId, filename]
      );
    }
     // 3. post_tags 저장
    if (taggedUser) {
      await connection.query(
        'INSERT INTO post_tags (post_id, user_id) VALUES (?, ?)',
        [postId, taggedUser.id]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: '게시물 등록 성공',
      post: {
        id: postId,
        user_id,
        caption,
        taggedUser,
        images: imageFilenames,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('게시물 등록 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  } finally {
    connection.release();
  }
});



// 해당 사용자가 게시한 모든 포스트들 불러오기
router.get('/posts/:userid', async (req, res) => {
  const { userid } = req.params;
  console.log("요청 들어온 userid:", userid);

  try {
    const [posts] = await dbPromise.query(
      `SELECT p.id, p.user_id, p.content, u.userid, p.created_at, u.profile_image
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?`,
      [userid]
    )
    console.log('해당 사용자가 작성한 포스트 목록', posts);
    if (posts.length === 0) {
      return res.status(200).json({ message: "게시글 없음" });
    } 

    // 각 게시물에 태그된 사용자 정보와 이미지 가져오기
    const postIds = posts.map(post => post.id);
    console.log('포스트 아이디', postIds);

    const [taggedUser] = await dbPromise.query(
      `SELECT pt.post_id, u.id AS user_id, u.userid
        FROM post_tags pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.post_id IN (?)`,
      [postIds]
    );

    console.log('태그된 사람', taggedUser);

    // 이미지 정보 가져오기
    const [images] = await dbPromise.query(
      `SELECT post_id, image_url FROM post_images WHERE post_id IN (?)`, [postIds]
    );
    console.log('선택된 이미지들', images);

    // posts 배열에 tagged_users, images 추가
    const postResults = posts.map(post => {
      const tagged = taggedUser
        .filter(t => t.post_id === post.id)
        .map(t => ({ id: t.user_id, userid: t.userid }));
      
      const imgs = images
        .filter(img => img.post_id === post.id)
        .map(img => img.image_url);
      
      return {
        ...post,
        tagged_users: tagged,
        images: imgs
      };
    });

    console.log('최종 반환 포스트 데이터', postResults);
    res.status(200).json(postResults);

  } catch (error) {
    res.status(500).json({message: "게시글 조회 실패"})
  }
});




module.exports = router; // 라우터 내보내기
