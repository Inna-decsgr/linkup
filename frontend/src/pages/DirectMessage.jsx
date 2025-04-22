import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket.js'
import { Imageformat } from '../utils/Imageformat';
import { useAuth } from '../context/AuthContext.js';




export default function DirectMessage() {
  const { state } = useAuth();
  const { userid, partnerid } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // 이전 대화 가져오기
  useEffect(() => {
    const fetchAllMessages = async () => {
      const res = await fetch(`http://localhost:5000/api/messages/${userid}/${partnerid}`);
      const data = await res.json();
      console.log('가져온 대화 내용', data);
      setMessages(data);
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

  return (
    <div className='w-[500px] mx-auto'>
      <div className='bg-red-100'>
        {messages.map((m, index) => {
          const isSender = m.sender_id === Number(userid);

          return (
            <div key={index} className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
              <div className={`flex items-center ${isSender ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                <img
                  src={Imageformat(m.sender_profile_image)}
                  alt="프로필 이미지"
                  className='w-[40px] h-[40px] rounded-full object-cover mx-2' />
              </div>
              <div className={`p-2 rounded-lg ${isSender ? 'bg-blue-100' : 'bg-white'} max-w-[70%]`}>
                <p>{m.content}</p>
              </div>
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

