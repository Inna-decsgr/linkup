const { dbPromise } = require('../models/db');


module.exports = (io, db) => {
  io.on("connection", (socket) => {
    // 백엔드(socket) 서버에서 클라이언트가 소켓 서버에 연결되었을 때 실행되는 코드
    // "어? 누가 나랑 연결됐네!!" 하고 소켓 받아서 대응하는 곳
    console.log("✅ WebSocket 연결됨");

    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, content } = data;
      console.log('보내는 사람', sender_id);
      console.log('받는 사람', receiver_id);
      console.log('메세지 내용', content);

      const user1 = Math.min(sender_id, receiver_id);
      const user2 = Math.max(sender_id, receiver_id);

      // 1. 이전에 대화한 기록이 있는지 확인
      const [rows] = await dbPromise.query(
        `SELECT id FROM dm_rooms WHERE user1_id = ? AND user2_id = ?`,
        [user1, user2]
      );

      let roomId;

      if (rows.length > 0) {
        // 이미 대화한 상대라면 기존 디엠룸 아이디를 roomId에 저장
        roomId = rows[0].id;
      } else {
        // 처음 대화하는 상대라면 새로 디엠룸을 만들고 그 ID 가져오기
        const [result] = await dbPromise.query(
          `INSERT INTO dm_rooms (user1_id, user2_id) VALUES (?, ?)`,
          [user1, user2]
        );
        roomId = result.insertId;
      }

      // 2. 메시지 저장
      const [insertResult] = await dbPromise.query(
        'INSERT INTO messages (dm_room_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)',
        [roomId, sender_id, receiver_id, content]
      );

      const savedMessage = {
        id: insertResult.insertId,
        dm_room_id: roomId,
        sender_id,
        receiver_id,
        content,
        created_at: new Date().toISOString(),
      };

      // 메시지 보낸 사람 정보 가져오기
      const [senderRows] = await dbPromise.query(
        `SELECT username, userid, profile_image FROM users WHERE id = ?`,
        [sender_id]
      );

      const senderInfo = senderRows[0];

      // ✅ 보낸 사람 정보 추가
      const enrichedMessage = {
        ...savedMessage,
        sender_username: senderInfo.username,
        sender_userid: senderInfo.userid,
        sender_profile_image: senderInfo.profile_image,
      };

      // 보내는 사람과 받는 사람에게만 메세지 전송
      // socket.broadcast.emit : 현재 연결된 클라이언트 외에 연결되어 있는 모든 다른 클라이언트들에게 메시지를 보내는 방식
      // io.emit : 메세지를 보낸 사람, 받은 사람 모두 실시간으로 메시지를 받을 수 있음 
      io.emit("send_message", enrichedMessage);
    });
  });
};
