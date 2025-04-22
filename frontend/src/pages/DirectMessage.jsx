import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket.js'



export default function DirectMessage() {
  const { userid, partnerid } = useParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);


  // 메시지 수신
  useEffect(() => {
    // 연결된 소켓을 통해 실시간 데이터 받음
    socket.on('send_message', (data) => { 
      console.log('💬 받은 메시지:', data);
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('send_message'); //
    };
  }, []);


  // 메시지 전송
  const sendMessage = () => {
    if (!message.trim()) return;
    console.log('메세지 내용', message);

    const newMessage = {
      sender_id: Number(userid),
      receiver_id: Number(partnerid),
      content: message,
      created_at: new Date().toISOString()
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
      <div className='pb-10'>
        <p>로그인한 사용자(디엠 건 사람) = {userid} 와 상대방(디엠 받은 사람) = {partnerid}</p>
      </div>
      <div className='bg-red-100'>
        <div>
          {messages.map((m, index) => {
            return (
              <p key={index}>{m.content}</p>
            )
          })}
        </div>
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

