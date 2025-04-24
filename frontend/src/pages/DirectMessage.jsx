import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket.js'
import { Imageformat } from '../utils/Imageformat';
import { useAuth } from '../context/AuthContext.js';
import { format, isToday, isYesterday } from 'date-fns';
import ko from 'date-fns/locale/ko';




export default function DirectMessage() {
  const { state } = useAuth();
  const { userid, partnerid } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastmessage, setLastMessage] = useState('');

  // 이전 대화 가져오기
  useEffect(() => {
    const fetchAllMessages = async () => {
      const res = await fetch(`http://localhost:5000/api/messages/${userid}/${partnerid}`);
      const data = await res.json();
      console.log('가져온 대화 내용', data);
      setMessages(data);

      if (data.length > 0) {
        const roomId = data[0].dm_room_id;
        const lastMessageId = data[data.length - 1].id;


        // 읽음 처리 API 호출
        const res = await fetch(`http://localhost:5000/api/rooms/${roomId}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid: Number(userid),
            messageid: lastMessageId
          })
        })
        const readResult = await res.json();
        console.log('읽음 처리 관련 데이터', readResult.last_read_message_id);
        setLastMessage(readResult.last_read_message_id);
      }
    }
    fetchAllMessages();
  }, [userid, partnerid])



  // 메시지 수신
  useEffect(() => {
    // 연결된 소켓을 통해 실시간 데이터 받음
    socket.on('send_message', (data) => { 
      // 내가 보낸 메세지라면 messages에 추가하지 않고 무시
      if (data.sender_id === Number(userid)) return;

      console.log('💬 받은 메시지:', data);
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('send_message'); //
    };
  }, [userid]);


  // 메시지 전송
  const sendMessage = () => {
    if (!message.trim()) return;
    console.log('메세지 내용', message);

    const newMessage = {
      sender_id: state.user?.id,
      receiver_id: partnerid,
      content: message,
      created_at: new Date().toISOString(),
      sender_username: state.user?.username,
      sender_userid: state.user?.userid,
      sender_profile_image: state.user?.profile_image, 
    };

    // 👉 socket으로 서버에 전송
    socket.emit('send_message', newMessage);
    // 👉 optimistic UI: 일단 화면에 표시
    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  }


  const groupMessagesByTimeGap = (messages) => {
    const grouped = [];
    let currentGroup = [];
    let lastTimestamp = null;

    messages.forEach((msg) => {
      const currentTimestamp = new Date(msg.created_at).getTime();

      if (!lastTimestamp || (currentTimestamp - lastTimestamp) > 10 * 60 * 1000 ) {
        // 그룹 종료하고 새로운 그룹 시작
        if (currentGroup.length > 0) {
          grouped.push(currentGroup);
        }
        currentGroup = [msg]; // 새로운 그룹 시작
      } else {
        currentGroup.push(msg); // 같은 그룹에 추가
      }

      lastTimestamp = currentTimestamp;
    });

    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }
    return grouped;
  };



  return (
    <div className='bg-red-100 w-[500px] h-[80vh] mx-auto'>
      <div className='h-full overflow-y-auto p-4'>
        {groupMessagesByTimeGap(messages).map((group, index) => {
          const groupDate = new Date(group[0].created_at);
          
          // 오늘인지, 어제인지, 아니면 날짜 출력
          let dateLabel = '';
          if (isToday(groupDate)) {
            dateLabel = `오늘 ${format(groupDate, 'a h:mm', { locale: ko })}`;
          } else if (isYesterday(groupDate)) {
            dateLabel = `어제 ${format(groupDate, 'a h:mm', { locale: ko })}`;
          } else {
            dateLabel = format(groupDate, 'M월 d일 (E) a h:mm', { locale: ko });
          }

          return (
            <div key={index} className='mb-6'>
              <div className='text-center text-gray-500 text-sm mb-2'>{dateLabel}</div>
              {group.map((m, index) => {
                const isSender = m.sender_id === Number(userid);
                return (
                  <div key={index} className={`relative flex items-center ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`flex items-center ${isSender ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                      <img
                        src={Imageformat(m.sender_profile_image)}
                        alt="프로필 이미지"
                        className='w-[40px] h-[40px] rounded-full object-cover mx-2' />
                    </div>
                    <div className={`rounded-xl ${isSender ? 'bg-blue-100' : 'bg-white'} max-w-[70%] py-2 px-3`}>
                      <p className='text-sm'>{m.content}</p>
                    </div>
                    {isSender && m.id === Number(lastmessage) && (
                      <p className='absolute bottom-[-18px] right-3 text-[11px] text-gray-600'>읽음</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='메세지 보내기...'
            className='border py-1 px-2 w-[400px]'
          />
        </form>
      </div>
    </div>
  );
}

