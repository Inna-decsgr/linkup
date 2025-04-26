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
      // io.emit은 모든 소켓에게 메세지를 보내는 거라서 채팅방에 없는 다른 사용자에게도 메세지가 전송되기 때문에 해당 room에 join(입장)한 소켓들에게만 전송되도록 => 딱 그 대화방 안에 있는 두 사람에게만 메세지를 보내도록 io.to(roomId).emit을 사용
      io.to(roomId).emit("send_message", enrichedMessage);
    });

    
    
    // 대화방에 입장, 퇴장을 서버에서도 처리하고 다시 클라이언트에 알리기
    // socket.to(roomid).emit()을 하려면 socket.join을 반드시 해줘야함 이게 안 돼 있으면 socket.to는 허공에다가 말하는게 됨!
    socket.on('join_room', (roomid) => {
      socket.join(roomid);  // 전달받은 roomid를 사용해 socket.join(roomid)로 소켓을 방에 집어넣음
      console.log('소켓이 룸에 참여함', roomid);

      // 서버가 관리하는 room 정보를 가져옴
      //// io에서 기본으로 제공하는 sockets.adapter.rooms 함수인데 소켓 서박 자동으로 관리해주는 방 목록을 말함
      const room = io.sockets.adapter.rooms.get(roomid);  // 소켓 서버가 관리하는 방 목록들 중에서 get(roomid)로 특정 방을 찾아서 room에 저장

      if (room) {
        const users = Array.from(room);  // 가져온 방에 참여중인 소켓 ID(대화에 참여중인 사용자들)들을 Array.from(room)으로 배열로 변환(['소켓ID1', '소켓ID2', ...] 이런식으로)해서 users에 저장
        io.to(roomid).emit('room_users', { users }); // 대화에 참여중인 users 리스트를 io.to(roomid).emit('room_users', {users}) 로 대화방에 있는 모든 사람에게 누가 대화방에 참여중인지 알림
      }
    });

    // 프론트에서 대화방에서 나간다고 알리면 여기에서 "방에서 나간다고? 처리할게!"하고 받음
    socket.on('leave_room', (roomid) => {
      socket.leave(roomid); // 소켓에서 해당 대화방을 내보냄
      console.log('소켓이 룸에서 나감', roomid);

      const room = io.sockets.adapter.rooms.get(roomid);  // 입장했을때랑 마찬가지로 해당 대화방을 가져온 후에 
      if (room) {
        const users = Array.from(room);  // 현재 누가 대화방에 남아있는지를 확인한다음
        io.to(roomid).emit('room_users', { users });  // 다시 이 대화방에 속해 있는 사람들에게 "대화방을 나간 사람이 있어! 지금 남아있는 사람들은 이 사람들이야!" 하고 알림
      } else {
        // 방에 아무도 없으면 빈 배열
        io.to(roomid).emit('room_users', { users: [] });
      }
    });


    // 실시간 읽음 처리 하는 read_message 함수
    socket.on("read_message", async (data) => {
      const { roomid, userid, messageid } = data;

      console.log('읽음 처리할 대화 방', roomid);
      console.log('읽은 사람', userid);
      console.log('어떤 메세지 읽음 처리할 지', messageid);

      // 기존에 읽음 기록이 있는지 확인
      const [existing] = await dbPromise.query(
        `SELECT * FROM message_reads WHERE room_id = ? AND user_id = ?`,
        [roomid, userid]
      );

      if (existing.length > 0) {
        // 기존 기록이 있다면 업데이트
        await dbPromise.query(
          `UPDATE message_reads SET last_read_message_id = ?, updated_at = NOW()
          WHERE room_id = ? AND user_id = ?`,
          [messageid, roomid, userid]
        );
      } else {
        // 없으면 읽음 기록 새로 삽입
        await dbPromise.query(
          `INSERT INTO message_reads (room_id, user_id, last_read_message_id)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          last_read_message_id = VALUES(last_read_message_id),
          updated_at = NOW();`,
          [roomid, userid, messageid]
        );
      }


      // 메세지 읽음 처리 후 상대방에게 읽었다고 알려주기!
      socket.to(roomid).emit("read_message_update", {
        readerid: userid,
        messageid: messageid,
      })
    });

  })
};
