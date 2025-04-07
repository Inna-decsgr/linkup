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
      return res.status(200).json([]);
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

    //console.log('최종 반환 포스트 데이터', postResults);
    res.status(200).json(postResults);

  } catch (error) {
    res.status(500).json({message: "게시글 조회 실패"})
  }
});



// 📌 좋아요 토글
router.post('/posts/like', async (req, res) => {
  const { post_id, user_id } = req.body;
  console.log('좋아요할 포스트 아이디', post_id);
  console.log('좋아요하는 사용자 아이디', user_id);


  if (!post_id || !user_id) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    // 1. 이미 좋아요 했는지 확인
    const [existing] = await dbPromise.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [post_id, user_id]
    );

    if (existing.length > 0) {
      // 좋아요 해제
      await dbPromise.query(
        'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
        [post_id, user_id]
      );
      // 삭제한 후 좋아요 개수 다시 가져오기
      const [likecountresult] = await dbPromise.query(
        'SELECT * FROM likes WHERE post_id = ?',
        [post_id]
      );
      const likecount = likecountresult.length;
      console.log('좋아요 개수 다시 가져오기', likecount);

      return res.status(200).json({ isLike: false, likecount: likecount });  
    }

    // 아직 좋아요를 누르지 않았다면 좋아요 추가
    await dbPromise.query(
      `INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, NOW())`,
      [post_id, user_id]
    );

    const [rows] = await dbPromise.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [post_id, user_id]
    );

    const [likes] = await dbPromise.query(
      'SELECT * FROM likes WHERE post_id = ?',
      [post_id]
    )
    const isLike = rows.length > 0;
    const likecount = likes.length

    res.status(200).json({ isLike, data: rows[0], likecount: likecount });

  } catch (err) {
    console.error('좋아요 추가 중 에러 발생', err);
    res.status(500).json({message: '서버 오류'})
  }
});



// 📌 로그인한 사용자가 해당 포스트에 좋아요를 눌렀는지 안눌렀는지 조회
router.get('/posts/like/status', async (req, res) => {
  const { post_id, user_id } = req.query;

  if (!post_id || !user_id) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    const [rows] = await dbPromise.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [post_id, user_id]
    );
    const [likes] = await dbPromise.query(
      'SELECT * FROM likes WHERE post_id = ?',
      [post_id]
    )

    const isLike = rows.length > 0;
    const likecount = likes.length
    res.status(200).json({ isLike, likecount: likecount });
  } catch (err) {
    console.error('좋아요 처리 중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
});



// 해당 계정의 게시물 개수, 팔로워, 팔로잉 몇 명인지 조회
router.get('/users/postfollowing/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [posts] = await dbPromise.query(
      'SELECT * FROM posts WHERE user_id = ?',
      [user_id]
    )
    const [followings] = await dbPromise.query(
      // 내가 누굴 팔로우했는가 following_id = 나의 id
      // 팔로잉 목록(내가 팔로우한 사람들) => 내가 팔로우한 유저들(팔로잉)
      'SELECT * FROM followers WHERE following_id = ?',
      [user_id]
    )
    const [followers] = await dbPromise.query(
      // 누가 나를 팔로우했는가 follower_id = 나의 id
      // 팔로워 목록(나를 팔로우한 사람들) => 나를 팔로우하는 유저들(팔로워)
      'SELECT * FROM followers WHERE follower_id = ?',
      [user_id]
    );
    
    res.status(200).json({ postcount: posts.length, followercount: followers.length, followingcount: followings.length });
  } catch (err) {
    console.error('해당 계정의 정보 불러오는 도중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
})



// 사용자가 팔로우하는 유저들의 모든 게시물들 조회
router.get('/users/followers/posts/:userid', async (req, res) => {
  const { userid } = req.params;
  console.log('조회할 사용자 아이디', userid);

  try {
    // 1. 해당 사용자가 팔로우한 사용자들의 id 가져오기
    const [followedUsers] = await dbPromise.query(
      `SELECT follower_id FROM followers WHERE following_id = ?`,
      [userid]
    );

    const followedIds = followedUsers.map(user => user.follower_id); // 팔로우하는 사용자들의 id만 따로 모아서 저장
    followedIds.push(Number(userid)); // 내 게시물도 함께 가져올거라서 userid도 push
    const placeholders = followedIds.map(() => '?').join(', ');  // followedIds를 map, join해서 placeholders라는 변수에 배열 형태로 다시 저장 => "?, ?, ?" 즉, [2, 1] 형태로 배열에 저장됨
    console.log('팔로우 아이디들', followedIds);
    

    if (followedIds.length === 0) {
      return res.status(200).json({ posts: [] });  // 팔로우한 사람이 없으면 빈 배열 반환
    }

    // 2. 팔로우한 사람들이 작성한 게시물들 가져오기
    const [posts] = await dbPromise.query(
      `SELECT p.id, p.user_id, p.content, u.userid, p.created_at, u.profile_image,
      (
        SELECT GROUP_CONCAT(uu.userid SEPARATOR ', ')
        FROM likes l
        JOIN users uu ON l.user_id = uu.id
        WHERE l.post_id = p.id AND l.user_id IN (${placeholders}) AND l.user_id != p.user_id
      ) AS likedByFollowers,
      (
        SELECT uu.userid
        FROM likes l
        JOIN users uu ON l.user_id = uu.id
        WHERE l.post_id = p.id AND l.user_id IN (${placeholders}) AND l.user_id != p.user_id
        ORDER BY l.created_at DESC
        LIMIT 1
      ) AS firstLikedUser
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (${placeholders}) 
        ORDER BY p.created_at DESC`,
      // GROUP_CONCAT(uu.userid SEPARATOR ', ') 여러 개의 값을 하나의 문자열로 합쳐주는 함수. 영희, 철수, 민수가 좋아요를 눌렀다면 "영희, 철수, 민수"처럼 쉼표로 연결된 하나의 문자열로 나옴. SEPARATOR는 각 값 사이에 어떻게 연결하지 정하는 것.
      // likes 테이블에서 해당 게시글(p.id)에 좋아요를 누른 사람들 중, 내가 팔로우한 사람들만 골라서 그들의 userid를 GROUP_CONCAT으로 모아줌. AS likedByFollowers는 별칭 정리하자면 각 게시물에 대해 내가 팔로우한 사람들 중 누가 좋아요를 눌렀는지 그 사람들의 userid를 하나의 문자열로 합쳐서 보여줘!
      // 원래 ? 는 하나의 값씩 비교하는데 IN은 여러개의 값을 비교한 후 하나만 해당해도 그 값을 가져오게 되어있음 그래서 ? 를 쓰는게 아니라 map, join으로 비교할 배열을 하나 생성해서 IN 조건절에 넣어주면 됨. 그리고 이때 followedIds를 []로 감싸게 되면 배열의 값들이 문자열 하나로 묶여버리기 때문에 감싸지 않고 전달해야함. 위와 같이 코드를 해야 ? 자리에 배열의 요소들이 하나씩 매칭돼서 IN (2,1)처럼 동작하게 됨
      [...followedIds, ...followedIds, ...followedIds]
    );

    const postIds = posts.map(post => post.id);

    const [taggedUser] = await dbPromise.query(
      `SELECT pt.post_id, u.id AS user_id, u.userid
        FROM post_tags pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.post_id IN (?)`,
      [postIds]
    );

    // 이미지 정보 가져오기
    const [images] = await dbPromise.query(
      `SELECT post_id, image_url FROM post_images WHERE post_id IN (?)`, [postIds]
    );

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
    
    res.status(200).json({ postResults });
  } catch (err) {
    console.error('해당 포스트들에 대한 정보 불러오는 도중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
})



// 해당 게시글에 댓글 추가하기
router.post('/posts/comments', async (req, res) => {
  const { postid, userid, comment } = req.body;
  console.log('댓글을 달 포스트 아이디', postid);
  console.log('댓글 작성한 사용자 아이디', userid);
  console.log('댓글 내용', comment);

  if (!postid || !userid || !comment) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    // comments 테이블에 post_id, user_id, content, created_at 생성해서 넣기
    await dbPromise.query(
      `INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())`,
      [postid, userid, comment]
    );

    const [comments] = await dbPromise.query(
      `SELECT c.*, u.username, u.profile_image 
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ? AND c.user_id = ?
        ORDER BY c.created_at DESC
        LIMIT 1`,
      [postid, userid]
    );

    res.status(200).json({ data: comments });
  } catch (err) {
    console.error('댓글 추가 중 에러 발생', err);
    res.status(500).json({message: '서버 오류'})
  }
});




module.exports = router; // 라우터 내보내기
