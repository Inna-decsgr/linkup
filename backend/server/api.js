const express = require("express");
const bcrypt = require("bcrypt");
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
    
    await dbPromise.query(query, [username, userid, email, telephone, hashedPassword])
    
    res.status(201).json({ message: "✅ 회원가입 성공!" });
  }catch (error) {
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
  

  if (!userid || !username || !email || !telephone) {
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
  const { keyword, user_id, userid } = req.query;
  console.log('전달받은 사용자 id:', keyword); // ✅ 출력해서 확인 가능!
  console.log('로그인한 사용자 userid', userid);
  console.log('로그인한 사용자 id', user_id);

  try {
    // 1. 검색 키워드에 해당하는 사용자들
    const [searchResults] = await dbPromise.query(
      `SELECT id, username, userid, profile_image, bio
      FROM users 
      WHERE userid LIKE ? AND userid != ?`,
      [`%${keyword}%`, userid]  // keyword가 포함된 userid를 가진 사용자들 중에서, 로그인한 사용자의 userid는 제외함
    );
    console.log('검색 결과', searchResults);

    // 2. 내가 팔로우 중인 사람들=follower_id가 userid인 following_id인 사람들
    const [myFollowing] = await dbPromise.query(
      `SELECT following_id
      FROM followers
      WHERE follower_id = ?`,
      [user_id]
    );
    const myFollowingIds = myFollowing.map(row => row.following_id);
    console.log('내가 팔로우하는 사람들 아이디', myFollowing);


    if (myFollowingIds.length === 0) {
      // 내가 팔로우하는 사람들이 없을 떄를 처리해주지 않으면 SQL문에서 IN () 에러가 나니까 꼭 필요함!
      const enrichResults = searchResults.map(user => ({
        ...user,
        mutualFollowerName: null,
        mutualOthersCount: 0,
      }));
      return res.status(200).json(enrichResults);
    }

    const enrichResults = await Promise.all(
      searchResults.map(async (user) => {
        // 3. 내가 팔로우하는 사람들이 검색한 유저를 팔로우하거나, 이 유저가 그들을 팔로우하는 경우
        // myFollowingIds가 배열형태[3, 4, 7] 라서 "?, ?, ?" 이런 식으로 바꿔서 placeholders에 저장함
        // placeholders에 따로 배열을 풀어서 저장하는 건 자바스크립트 배열을 SQL에 안전하게 넣는 트릭이라고 보면 됨
        const placeholders = myFollowingIds.map(() => '?').join(',');
        // 내가 팔로우하는 사람들 중에서 검색한 유저랑 팔로우 관계가 있는 사람들을 모두 가져옴
        const [mutuals] = await dbPromise.query(
          `SELECT DISTINCT u.userid -- 팔로우하는 사람들이 양방향으로 관계(맞팔 관계)가 있을 수도 있는데 그럼 중복이 됨. 중복 방지를 위함
            FROM users u
            JOIN followers f ON
              (f.follower_id = u.id AND f.following_id = ?) OR  -- 내가 팔로우하는 사람들 중 검색한 사용자를 팔로우하거나
              (f.following_id = u.id AND f.follower_id = ?) -- 내가 팔로우하는 사람들 중 검색한 유저가 팔로잉하는 사람의 경우만 가져옴
            WHERE u.id IN (${placeholders})`,  // u.id는 항상 내가 팔로우하는 사람들 중 한 명임
          [user.id, user.id, ...myFollowingIds]
        );

        const mutualCount = mutuals.length;
        const mutualFollowerName = mutuals[0]?.userid || null;

        return {
          ...user,
          mutualFollowerName,
          mutualOthersCount: mutualCount > 1 ? mutualCount - 1 : 0,
        };
      })
    );
    console.log('내가 팔로우하는 사람들 중 검색한 사용자를 팔로우하거나 팔로잉하는 사람들에 대한 데이터', enrichResults);

    return res.status(200).json(enrichResults);
    
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



// 사용자 관련 모든 포스트들 불러오기
router.get('/posts/:userid', async (req, res) => {
  const { userid } = req.params;
  console.log('가져올 사용자 정보', userid);

  try {
    // 사용자가 작성한 게시물들 관련 정보 모두 가져오기
    const [posts] = await dbPromise.query(
      `SELECT p.id, p.user_id, p.content, u.userid, p.created_at, u.profile_image
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC`,
      [userid]
    )
    console.log('해당 사용자가 작성한 포스트 목록', posts);

    let postResults = [];

    if (posts.length > 0) {
      // 사용자가 작성한 각 게시물에 태그된 사용자 정보와 이미지 가져오기
      const postIds = posts.map(post => post.id);
      console.log('포스트 아이디', postIds);

      const [taggedUser] = await dbPromise.query(
        `SELECT pt.post_id, u.id AS user_id, u.userid, u.username
          FROM post_tags pt
          JOIN users u ON pt.user_id = u.id
          WHERE pt.post_id IN (?)`,
        [postIds]
      );
      console.log('태그된 사람', taggedUser);
      const [images] = await dbPromise.query(
        `SELECT post_id, image_url FROM post_images WHERE post_id IN (?)`, [postIds]
      );
      console.log('선택된 이미지들', images);

      postResults = posts.map(post => {
      const tagged = taggedUser
        .filter(t => t.post_id === post.id)
        .map(t => ({ id: t.user_id, userid: t.userid, username: t.username }));
      
        
        const imgs = images
        .filter(img => img.post_id === post.id)
        .map(img => img.image_url);
        
        return {
          ...post,
          tagged_users: tagged,
          images: imgs
        };
      });
    }

    // 사용자가 북마크한 게시물들 가져오기
    const [bookmarkedPosts] = await dbPromise.query(
      `SELECT p.id, p.user_id, p.content, u.userid, p.created_at, u.profile_image
        FROM bookmarks b
        JOIN posts p ON b.post_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC`,
      [userid]
    );
    console.log('사용자가 북마크한 게시물들', bookmarkedPosts);

    const bookmarkedPostIds = bookmarkedPosts.map(post => post.id);  // 북마크한 게시물들의 아이디만 가져와서 저장
    console.log('사용자가 북마크한 게시물 아이디', bookmarkedPostIds);


    // 사용자가 북마크한 게시물들의 게시물 이미지 가져오기
    let bookmarkedImages = [];  // bookmarkedImages를 재할당해야하니까 처음 정의할 때는 let으로
    if (bookmarkedPostIds.length > 0) {
      // 북마크한 포스트가 없는 상태에서 bookmarkedImages 를 쿼리하려고 하면 IN (?)에 빈 배열이 들어가서 MYSQL 쿼리 문제가 발생할 수 있음.
      [bookmarkedImages] = await dbPromise.query(
        `SELECT post_id, image_url FROM post_images WHERE post_id IN (?)`,
        [bookmarkedPostIds]
      );
    }
    
    const enrichedBookmarkedPosts = bookmarkedPosts.map(post => {
      const imgs = bookmarkedImages
        .filter(img => img.post_id === post.id)
        .map(img => img.image_url);
      
      return {
        ...post,
        images: imgs
      };
    });

    // 응답 보내기 (항상 사용자가 작성한 게시물과 북마크한 게시물 모두 다 포함되도록)
    console.log('최종 반환 포스트 데이터', postResults);
    res.status(200).json({
      postResults,
      bookmarkedPosts: enrichedBookmarkedPosts
    });

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



// 해당 계정의 게시물 개수, 팔로워, 팔로잉 몇 명인지 누구인지 조회
router.get('/users/postfollowing/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const [posts] = await dbPromise.query(
      'SELECT * FROM posts WHERE user_id = ?',
      [user_id]
    )
    // followers 테이블에서 follower_id는 팔로우를 '하는 사람'의 id이고 following_id는 팔로우를 '당하는 사람'의 id
    // follower_id가 1이고 following_id가 2면 1이 2를 팔로우하는 관계 => 1의 팔로잉 목록에는 2가 있음 => 2의 팔로워 목록에는 1이 있음
    // 즉 follower_id는 팔로우를 거는 사람(주체)
    // following_id는 팔로우를 당하는 사람(대상)임을 기억하자

    const [followers] = await dbPromise.query(
      // 누가 나를 팔로우했는가 following_id = 나의 id
      // 팔로워 목록(나를 팔로우한 사람들) => 나를 팔로우하는 유저들(팔로워)
      `SELECT u.id, u.userid, u.username, u.profile_image
        FROM users u
        JOIN followers f ON f.follower_id = u.id
        WHERE f.following_id = ?`,
      [user_id]
    )
    const [followings] = await dbPromise.query(
      // 내가 누굴 팔로우했는가 follower_id = 나의 id
      // 팔로잉 목록(내가 팔로우하는 사람들) => 내가 팔로우한 유저들(팔로잉)
      `SELECT u.id, u.userid, u.username, u.profile_image
        FROM users u
        JOIN followers f ON f.following_id = u.id
        WHERE f.follower_id = ?`,
      [user_id]
    );
    
    res.status(200).json({ postcount: posts.length, followers, followings, followercount: followers.length, followingcount: followings.length });
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
      `SELECT following_id FROM followers WHERE follower_id = ?`,
      [userid]
    );
    // 내가 누군가를 팔로우하게 되면 팔로우 아이디가 내 아이디인 내역을 찾아야함


    const followedIds = followedUsers.map(user => user.following_id); // 팔로우하는 사용자들의 id만 따로 모아서 저장
    followedIds.push(Number(userid)); // 내 게시물도 함께 가져올거라서 userid도 push
    const placeholders = followedIds.map(() => '?').join(', ');  // followedIds를 map, join해서 placeholders라는 변수에 배열 형태로 다시 저장 => "?, ?, ?" 즉, [2, 1] 형태로 배열에 저장됨
    console.log('팔로우 아이디들', followedIds);
    

    if (followedIds.length === 0) {
      return res.status(200).json({ posts: [] });  // 팔로우한 사람이 없으면 빈 배열 반환
    }

    // 2. 팔로우한 사람들이 작성한 게시물들 가져오기
    const [posts] = await dbPromise.query(
      `SELECT p.id, p.user_id, p.content, u.userid, u.username, p.created_at, u.profile_image,
      (
        SELECT GROUP_CONCAT(uu.userid SEPARATOR ', ')
        FROM likes l
        JOIN users uu ON l.user_id = uu.id
        WHERE l.post_id = p.id AND l.user_id IN (${placeholders}) AND l.user_id != p.user_id
      ) AS likedByFollowers,
      (
        SELECT JSON_OBJECT(
          'userid', uu.userid,
          'profile_image', uu.profile_image
        )
        FROM likes l
        JOIN users uu ON l.user_id = uu.id
        WHERE l.post_id = p.id AND l.user_id IN (${placeholders}) AND l.user_id != p.user_id
        ORDER BY l.created_at DESC
        LIMIT 1
      ) AS firstLikedUser,
      (
        SELECT JSON_OBJECT(
          'id', c.id,
          'content', c.content,
          'created_at', c.created_at,
          'user_id', c.user_id,
          'userid', uu.userid,
          'profile_image', uu.profile_image
        )
        FROM comments c
        JOIN users uu ON c.user_id = uu.id
        WHERE c.post_id = p.id AND c.user_id IN (${placeholders}) AND c.user_id != p.user_id
        ORDER BY c.created_at DESC
        LIMIT 1
      )AS firstComment,
      (
        SELECT COUNT(*)
        FROM comments c
        WHERE c.post_id = p.id
      ) AS commentCount,
      (
        SELECT EXISTS (
          SELECT 1 FROM bookmarks b
          WHERE b.user_id = ? AND b.post_id = p.id
        )
      ) AS isBookmarked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id IN (${placeholders}) 
        ORDER BY p.created_at DESC`,
      // GROUP_CONCAT(uu.userid SEPARATOR ', ') 여러 개의 값을 하나의 문자열로 합쳐주는 함수. 영희, 철수, 민수가 좋아요를 눌렀다면 "영희, 철수, 민수"처럼 쉼표로 연결된 하나의 문자열로 나옴. SEPARATOR는 각 값 사이에 어떻게 연결하지 정하는 것.
      // likes 테이블에서 해당 게시글(p.id)에 좋아요를 누른 사람들 중, 내가 팔로우한 사람들만 골라서 그들의 userid를 GROUP_CONCAT으로 모아줌. AS likedByFollowers는 별칭 정리하자면 각 게시물에 대해 내가 팔로우한 사람들 중 누가 좋아요를 눌렀는지 그 사람들의 userid를 하나의 문자열로 합쳐서 보여줘!
      // 원래 ? 는 하나의 값씩 비교하는데 IN은 여러개의 값을 비교한 후 하나만 해당해도 그 값을 가져오게 되어있음 그래서 ? 를 쓰는게 아니라 map, join으로 비교할 배열을 하나 생성해서 IN 조건절에 넣어주면 됨. 그리고 이때 followedIds를 []로 감싸게 되면 배열의 값들이 문자열 하나로 묶여버리기 때문에 감싸지 않고 전달해야함. 위와 같이 코드를 해야 ? 자리에 배열의 요소들이 하나씩 매칭돼서 IN (2,1)처럼 동작하게 됨
      [...followedIds, ...followedIds, ...followedIds, userid, ...followedIds]
    );
    //console.log('게시글 조회', posts);

    const postIds = posts.map(post => post.id);
    if (postIds.length === 0) return []; 

    const [taggedUser] = await dbPromise.query(
      `SELECT pt.post_id, u.id AS user_id, u.userid, u.username
        FROM post_tags pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.post_id IN (${placeholders})`,
      postIds
    );

    // 이미지 정보 가져오기
    const [images] = await dbPromise.query(
      `SELECT post_id, image_url FROM post_images WHERE post_id IN (?)`, [postIds]
    );

    // 공유 횟수 가져오기
    const [sharecounts] = await dbPromise.query(
      `SELECT post_id, COUNT(*) AS count
      FROM post_shares
      WHERE post_id IN (?)
      GROUP BY post_id`,
      [postIds]
    )
    // 3. 공유 횟수를 post_id 기준으로 매핑
    const shareCountMap = {};
    sharecounts.forEach(row => {
      shareCountMap[row.post_id] = row.count;
    });

    // posts 배열에 tagged_users, images 추가
    const postResults = posts.map(post => {
      const tagged = taggedUser
        .filter(t => t.post_id === post.id)
        .map(t => ({ id: t.user_id, userid: t.userid, username: t.username }));
      
      const imgs = images
        .filter(img => img.post_id === post.id)
        .map(img => img.image_url);
      
      const shareCount = shareCountMap[post.id] || 0;
      
      return {
        ...post,
        tagged_users: tagged,
        images: imgs,
        shareCount: shareCount
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

// 해당 포스터에 달린 모든 댓글들 가져와서 보여주기
router.get('/posts/comments/:postid', async (req, res) => {
  const { postid } = req.params;
  console.log('댓글 조회할 포스터 아이디', postid);

  try {
    const [comments] = await dbPromise.query(
      `SELECT c.*, u.username, u.userid, u.profile_image 
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC`,
      [postid]
    );

    res.status(200).json({ comments });
  } catch (error) {
    console.error('댓글 조회 오류', error);
    res.status(500).json({ message: '서버 오류' });
  }
})



// 게시글 수정하고 업데이트하기
router.post('/posts/detail/edit', upload.array('images'), async (req, res) => {
  // upload.array('images') // ← multer가 formData의 'images' 필드들을 받음
  try {
    const { postid, content } = req.body;
    const files = req.files;

    // 파일명 추출
    // multer가 이미지 파일을 자동 처리해주는데 이때 path, originalname, filename 등이 있는데 우리는 이 중에서 file.filename만 사용함
    const filenames = files.map(file => file.filename);

    // 1. 게시물 내용 업데이트
    await dbPromise.query(
      `UPDATE posts SET content = ? WHERE id = ?`,
      [content, postid]
    );

    // 2. 기존 이미지 모두 삭제
    await dbPromise.query(
      `DELETE FROM post_images WHERE post_id = ?`,
      [postid]
    );

    // 3. 새 이미지를 다시 insert
    for (const filename of filenames) {
      await dbPromise.query(
        `INSERT INTO post_images (post_id, image_url) VALUES (?, ?)`,
        [postid, filename]
      );
    }

    // 4. 업데이트된 게시글 다시 조회해서 전달
    const [posts] = await dbPromise.query(
      `
        SELECT p.id, p.content, u.userid, u.profile_image
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id =?
      `,
      [postid]
    );
    const [imagesRows] = await dbPromise.query(
      `SELECT image_url FROM post_images WHERE post_id = ?`,
      [postid]
    );
    const updatedPost = {
      ...posts[0],
      images: imagesRows.map(row => row.image_url)
    };

    res.status(200).json({post: updatedPost})
  } catch (error) {
    console.error('게시글 수정 에러:', error);
    res.status(500).json({ message: '서버 오류로 게시글 수정에 실패했습니다.' });
  }
})


// 특정 포스트 삭제하기
router.delete('/posts/delete/:postid', async (req, res) => {
  const { postid } = req.params;
  console.log('삭제할 포스트 아이디', postid);

  try {
    const [result] = await dbPromise.query(
      `DELETE FROM posts WHERE id = ?`,
      [postid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 게시글이 존재하지 않습니다.' });
    }
    
    res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });

  } catch (error) {
    console.error('게시글 삭제 에러', error);
    res.status(500).json({ message: '서버 오류로 게시글 삭제에 실패했습니다.' });
  }
})



// 특정 댓글 수정하기
router.put('/posts/comments/edit', async (req, res) => {
  const { commentid, content } = req.body;
  console.log('수정할 댓글 아이디', commentid);
  console.log('댓글 내용', content);

  try {
    if (content) {
      await dbPromise.query(
        `UPDATE comments SET content = ?, isEdit = 1, created_at = NOW() WHERE id = ?`,
        [content, commentid]
      );
    }

    // 수정된 댓글 정보 다시 조회
    const [updated] = await dbPromise.query(
      'SELECT id, post_id, user_id, content, created_at, isEdit FROM comments WHERE id = ?',
      [commentid]
    );

    return res.status(200).json(updated[0]);
  } catch (error) {
    console.error('댓글 수정 에러', error);
    res.status(500).json({ message: '서버 오류로 댓글 수정에 실패했습니다.' })
  }
});


router.delete('/posts/comments/delete/:commentid', async (req, res) => {
  const { commentid } = req.params;
  console.log('삭제하려는 댓글 아이디', commentid);

  try {
    await dbPromise.query(
      `DELETE FROM comments WHERE id = ?`,
      [commentid]
    );

    return res.status(200).json({message: '댓글을 삭제했습니다.'});
  } catch (error) {
    console.error('댓글 삭제 에러', error);
    res.status(500).json({ message: '서버 오류로 댓글 삭제에 실패했습니다.' })
  }
})


// 📌 해당 포스트를 사용자가 저장한 포스트에 추가하기(북마크 기능)
router.post('/posts/users/bookmarks', async (req, res) => {
  const { postid, userid } = req.query;

  if (!postid || !userid) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    // 현재 북마크 상태인지 아닌지 살펴보기
    const [existing] = await dbPromise.query(
      `SELECT * FROM bookmarks WHERE user_id =? AND post_id = ?`,
      [userid, postid]
    )

    if (existing.length > 0) {
      // 이미 북마크한 상태라면 북마크 해제
      await dbPromise.query(
        `DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?`,
        [userid, postid]
      );
    } else {
      await dbPromise.query(
        `INSERT INTO bookmarks (user_id, post_id, created_at) VALUES(?, ?, NOW())`,
        [userid, postid]
      );
    }

    // 해당 사용자의 북마크된 post_id 목록 반환
    const [bookmarkList] = await dbPromise.query(
      `SELECT post_id FROM bookmarks WHERE user_id = ?`,
      [userid]
    );

    const bookmarkedPostIds = bookmarkList.map(row => row.post_id);
    
    return res.status(200).json({bookmarkedPostIds});
  } catch (err) {
    console.error('북마크 처리 중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
});


// 내가 팔로우하는 사람중에 해당 계정을 팔로우하는 사람이 있는지 조회하기
router.get('/follower/info', async (req, res) => {
  const { userid, user_id } = req.query;
  console.log('✅ 호출됨:', userid, user_id);
  console.log('로그인한 사용자 id', userid);
  console.log('해당 계정주의 id', user_id);

  try {
    // 내가 팔로우 중인 사람들=follower_id가 userid인 following_id인 사람들
    const [myFollowing] = await dbPromise.query(
      `SELECT following_id
      FROM followers
      WHERE follower_id = ?`,
      [userid]
    );
    const myFollowingIds = myFollowing.map(row => row.following_id);
    console.log('내가 팔로우하는 사람들 아이디', myFollowing);


    if (myFollowingIds.length === 0) {
      // 내가 팔로우하는 사람들이 없을 떄를 처리해주지 않으면 SQL문에서 IN () 에러가 나니까 꼭 필요함!
      const enrichResults = myFollowing.map(user => ({
        ...user,
        mutualFollowerName: null,
        mutualOthersCount: 0,
      }));
      return res.status(200).json(enrichResults);
    }

    const enrichResults = await Promise.all(
      myFollowing.map(async (user) => {
        const placeholders = myFollowingIds.map(() => '?').join(',');
        console.log('333', myFollowingIds);
        const [mutuals] = await dbPromise.query(
          `SELECT DISTINCT u.userid, u.profile_image
            FROM users u
            JOIN followers f ON
              (f.follower_id = u.id AND f.following_id = ?) OR  
              (f.following_id = u.id AND f.follower_id = ?) 
            WHERE u.id IN (${placeholders})`,  
          [user_id, user_id, ...myFollowingIds]
        );
        console.log('겹치는 사람', mutuals);
        const mutualCount = mutuals.length;
        const mutualFollowerName = mutuals[0]?.userid || null;

        return {
          ...user,
          mutuals,
          mutualFollowerName,
          mutualOthersCount: mutualCount > 1 ? mutualCount - 1 : 0,
        };
      })
    );
    console.log(`내가 팔로우하는 사람들 중 ${user_id} 사용자를 팔로우하는 사람들에 대한 데이터`, enrichResults);

    return res.status(200).json(enrichResults);
    
  } catch (error) {
    console.error("검색 실패:", error);
    res.status(500).json({ message: "사용자 검색 중 오류 발생" });
  }
})


// 전달받은 사용자 조합으로 대화 목록 가져오기
router.get('/messages/:user1/:user2', async (req, res) => {
  const { user1, user2 } = req.params;
  console.log('메세지 보낸 사람', user1);
  console.log('메세지 받은 사람', user2);

  try {
    // 1. dm_rooms 테이블에서 전달받은 두 사용자의 조합과 일치하는 디엠방 아이디 찾기
    const [roomRows] = await dbPromise.query(
      `SELECT id
        FROM dm_rooms 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
      [user1, user2, user2, user1]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ message: 'DM 기록이 없습니다.' });
    }

    const dmRoomId = roomRows[0].id;

    // 2. 해당 디엠방의 메시지 가져오기 + 두 사용자의 정보 포함
    const [messagesResult] = await dbPromise.query(
      // 메세지에 대한 모든 항목과 보낸 사람, 받은 사람의 정보를 JOIN으로 연결해서 별칭(AS) 로 가져오기
      `SELECT m.*,
              s.id AS sender_id, s.userid AS sender_userid, s.username AS sender_username, s.profile_image AS sender_profile_image,
              r.id AS receiver_id, r.userid AS receiver_userid, r.username AS receiver_username, r.profile_image AS receiver_profile_image,
              ps.post_id AS shared_post_id,
              p.content AS shared_post_content,
              GROUP_CONCAT(pi.image_url ORDER BY pi.id) AS shared_post_images
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        LEFT JOIN post_shares ps ON m.post_share_id = ps.id
        LEFT JOIN posts p ON ps.post_id = p.id
        LEFT JOIN post_images pi ON p.id = pi.post_id
        WHERE m.dm_room_id = ?
        GROUP BY m.id
        ORDER BY m.created_at ASC`,
      [dmRoomId]
    )

    //console.log(`대화 기록 조회 결과`, messagesResult  );

    return res.status(200).json(messagesResult);
    
  } catch (error) {
    console.error("메시지 불러오기 실패:", error);
    res.status(500).json({ message: "서버 에러 발생" });
  }
});




router.get('/allmessages/list/:userid', async (req, res) => {
  const { userid } = req.params;
  console.log(`${userid}가 속한 대화방 리스트 가져올거임!`);

  try {
    // 1. 나와 대화한 상대방 목록 가져오기
    const [partners] = await dbPromise.query(
      `SELECT r.id AS room_id,
              CASE
                WHEN r.user1_id = ? THEN r.user2_id
                WHEN r.user2_id = ? THEN r.user1_id
              END AS partner_id,
              u.username,
              u.userid,
              u.profile_image
      FROM dm_rooms r
      JOIN users u
        ON ((r.user1_id = ? AND u.id = r.user2_id)
          OR (r.user2_id = ? AND u.id = r.user1_id))
      WHERE r.user1_id = ? OR r.user2_id = ?`,
      [userid, userid, userid, userid, userid, userid]
    );

    // 2. 각 상대방과의 대화 정보 수집
    const result = await Promise.all(partners.map(partner => getPartnerChatInfo(partner, userid)));

    // 3. 최근 메시지 순으로 정렬
    const sortedResult = result.sort((a, b) => new Date(b.lastSentAt) - new Date(a.lastSentAt));

    if (partners.length === 0) {
      return res.status(404).json({ message: '대화 나눈 사용자를 찾을 수 없습니다.' });
    }

    res.json({ partners: sortedResult });
  } catch (error) {
    console.error("디엠방 가져오기 실패:", error);
    res.status(500).json({ message: "서버 에러 발생" });
  }
});

// 💡 리팩토링된 파트너별 채팅 정보 수집 함수
async function getPartnerChatInfo(partner, userid) {
  const roomId = partner.room_id;
  const partnerId = partner.partner_id;

  // 1. 내가 보낸 마지막 메시지
  const [lastMsgRows] = await dbPromise.query(
    `SELECT id, created_at FROM messages
    WHERE sender_id = ? AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
    ORDER BY created_at DESC
    LIMIT 1`,
    [userid, userid, partnerId, partnerId, userid]
  );
  const lastSentMessage = lastMsgRows[0];
  const lastSentMessageId = lastSentMessage?.id;
  const lastSentAt = lastSentMessage?.created_at;

  // 2. 상대방이 마지막으로 읽은 내 메시지
  const [readRows] = await dbPromise.query(
    `SELECT last_read_message_id, updated_at FROM message_reads
    WHERE user_id = ? AND room_id = ?
    ORDER BY updated_at DESC
    LIMIT 1`,
    [partnerId, roomId]
  );
  const lastReadMessageId = readRows[0]?.last_read_message_id;
  const lastReadTime = readRows[0]?.updated_at;

  // 3. 내가 읽은 마지막 메시지 ID
  const [lastReadRows] = await dbPromise.query(
    `SELECT last_read_message_id FROM message_reads
    WHERE user_id = ? AND room_id = ?`,
    [userid, roomId]
  );
  const myLastReadId = lastReadRows[0]?.last_read_message_id;

  // 4. 내가 읽은 메시지 내용 (상대방이 보낸 것 중)
  let lastReadMessageContent = null;
  if (myLastReadId) {
    const [msgRows] = await dbPromise.query(
      `SELECT content FROM messages WHERE id = ? AND sender_id = ? AND receiver_id = ?`,
      [myLastReadId, partnerId, userid]
    );
    lastReadMessageContent = msgRows[0]?.content || null;
  }

  // 5. 아직 내가 읽지 않은 메시지 (상대방이 보낸 것)
  let unreadCount = 0;
  let lastUnreadMessageContent = null;

  if (myLastReadId) {
    const [unreadRows] = await dbPromise.query(
      `SELECT content FROM messages
      WHERE sender_id = ? AND receiver_id = ? AND id > ?
      ORDER BY id ASC`,
      [partnerId, userid, myLastReadId]
    );
    unreadCount = unreadRows.length;
    lastUnreadMessageContent = unreadRows.at(-1)?.content || null;
  } else {
    const [unreadRows] = await dbPromise.query(
      `SELECT content FROM messages
      WHERE sender_id = ? AND receiver_id = ?
      ORDER BY id ASC`,
      [partnerId, userid]
    );
    unreadCount = unreadRows.length;
    lastUnreadMessageContent = unreadRows.at(-1)?.content || null;
  }

  // 6. 내가 보낸 마지막 메시지가 읽혔는지 여부
  const isRead = lastSentMessageId && lastSentMessageId === lastReadMessageId;

  return {
    ...partner,
    isRead, // 내가 보낸 메시지가 읽혔는지 여부
    lastMessageId: lastSentMessageId,
    lastSentAt,
    lastReadMessageId, // 상대방이 마지막으로 읽은 내 메시지 ID
    lastReadTime: isRead ? lastReadTime : null,
    myLastReadMessageId: myLastReadId, // 내가 마지막으로 읽은 메시지 ID
    unreadCountFromPartner: unreadCount, // 내가 아직 읽지 않은 메시지 개수
    lastUnreadMessageContent, // 읽지 않은 메시지 중 마지막 내용
    lastReadMessageContentFromPartner: lastReadMessageContent // 읽은 메시지 중 마지막 내용
  };
}





// 디엠방으로 게시물 공유
router.post('/post/share', async (req, res) => {
  const { userid, partnerid, post } = req.body;
  console.log('공유하려는 사용자', userid);
  console.log('공유받는 사용자', partnerid);
  console.log('공유하려는 게시물', post);

  if (!userid || !partnerid || !post) {
    return res.status(400).json({ message: '필수 정보가 부족합니다.' });
  }

  try {
    const [shareresult] = await dbPromise.query(
      `SELECT id FROM dm_rooms WHERE user1_id = ? AND user2_id = ?`,
      [userid, partnerid]
    );
    
    let roomId;

    if (shareresult.length > 0) {
      // 이미 대화한 상대라면 기존 디엠룸 아이디를 roomId에 저장
      roomId = shareresult[0].id;
    } else {
      // 내 자신과 대화가 되지 않도록 return
      if (userid === partnerid) {
        return
      }
      // 처음 대화하는 상대이면서 같은 사용자가 아니면 새로 디엠방을 만들고 그 ID 가져오기
      const [result] = await dbPromise.query(
        `INSERT INTO dm_rooms (user1_id, user2_id) VALUES (?, ?)`,
        [userid, partnerid]
      );
      roomId = result.insertId;
    }
    
    // 공유된 게시물 post_shares 테이블에 먼저 insert
    const [shareInsert] = await dbPromise.query(
      `INSERT INTO post_shares (sender_id, receiver_id, post_id, room_id) VALUES (?, ?, ?, ?)`,
      [userid, partnerid, post.id, roomId]
    );
    const postShareId = shareInsert.insertId

    // 메시지 테이블에 공유된 게시물 저장할 때 post_share_id 사용
    const [insertResult] = await dbPromise.query(
      'INSERT INTO messages (dm_room_id, sender_id, receiver_id, post_share_id, is_share) VALUES (?, ?, ?, ?, ?)',
      [roomId, userid, partnerid, postShareId, true]
    );

    // 메시지 보낸 사람 정보 가져오기
    const [senderRows] = await dbPromise.query(
      `SELECT username, userid, profile_image FROM users WHERE id = ?`,
      [userid]
    );

    const senderInfo = senderRows[0];

    // ✅ 보낸 사람 정보 추가
    const enrichedMessage = {
      id: insertResult.insertId,
      room_id: roomId,
      sender_id: userid,
      receiver_id: partnerid,
      post_share_id: postShareId,
      is_share: true,
      created_at: new Date().toISOString(),
      sender_username: senderInfo.username,
      sender_userid: senderInfo.userid,
      sender_profile_image: senderInfo.profile_image,
      shared_post: post
    };
    return res.status(200).json(enrichedMessage);
    
  } catch (err) {
    console.error('게시물 공유 처리 중 에러 발생', err);
    res.status(500).json({ message: '서버 오류' });
  }
});



module.exports = router; // 라우터 내보내기
