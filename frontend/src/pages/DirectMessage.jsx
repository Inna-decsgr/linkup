import React, { useEffect, useRef, useState } from 'react';
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
  const [roomid, setRoomId] = useState('');
  const scrollRef = useRef(null);


  // 이전 대화 가져오기
  useEffect(() => {
    const fetchAllMessages = async () => {
      const res = await fetch(`http://localhost:5000/api/messages/${userid}/${partnerid}`);
      const data = await res.json();
      console.log('가져온 대화 내용', data);
      setMessages(data);

      if (data.length > 0) {
        const roomid = data[0].dm_room_id;
        setRoomId(roomid);
        const lastMessageid = data[data.length - 1].id;
        
        // 메세지 읽었다고 서버에 알리기(실시간 읽음 처리 위함)
        socket.emit('read_message', {
          roomid,
          userid: Number(userid),
          messageid: lastMessageid
        });
      }
    }
    fetchAllMessages();
    

    // 서버에서 메세지 읽음 처리를 하고 "읽음 처리 했어!"라고 다시 받아오는 로직은 따로 빼주기
    // 안 그러면 fetchAllMessages 가 다시 실행될 때 socket.on()이 중복 등록될 수도 있음
    const handleReadUpdate = ({ readerid, messageid }) => {
      console.log('상대방이 읽었음!', readerid, messageid);
      setLastMessage(messageid);
    };

    // read_message_update라는 이벤트가 서버로부터 오면, handleReadUpdate 함수를 실행해줘라는 뜻
    // 자바스크립트에서 함수는 그 자체로 값이 되기 때문에 handleReadUpdate 처럼 () 없이 전달하면 함수를 실행하지 않고
    // 참조만 전달한다는 뜻이다. 즉 handleReadUpdate 함수를 socket.io가 이벤트가 발생했을 때 실행할 콜백으로 기억해두는 것!
    socket.on('read_message_update', handleReadUpdate);
    return () => {
      socket.off('read_message_update', handleReadUpdate);
    }

  }, [userid, partnerid]);


  useEffect(() => {
    // 새로 보내는 메세지의 데이터에 id가 없어서 마지막 메세지인지 비교를 할 수 없어서
    // id가 포함된 메세지 정보를 setMessages로 해서 저장하면 비교 가능함!
    const handleReceiveMessage = (msg) => {
      console.log('실시간으로 받은 메시지:', msg);
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("send_message", handleReceiveMessage);

    return () => {
      socket.off("send_message", handleReceiveMessage);
    };
  }, []);



  // 클라이언트가 해당 대화방에 들어왔다고 소켓으로 서버에 알려야함
  useEffect(() => {
    socket.emit('join_room', roomid);  // 컴포넌트가 마운트되거나 roomid가 바뀔 때 실행됨
    return () => {  // 채팅방 페이지를 나가게 되거나 다른 채팅방으로 이동해서 roomid가 변경되면 자동으로 실행되면서 해당 채팅방에서는 leave 됨
      socket.emit('leave_room', roomid);  // 컴포넌트가 언마운트되거나, roomid가 바뀔 때 실행됨
    }
  }, [roomid])



  // 연결된 소켓을 통해 실시간으로 메시지 수신
  useEffect(() => {
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

  
  // 새로운 메세지 보내면 스크롤 이동시켜서 새로운 메세지로 포커스 보내기
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages])


  // 메시지 전송 함수
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
    setMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  }


  // 메세지를 날짜, 시간대별로 그룹화하기
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
                  <div key={index} ref={scrollRef} className={`relative flex items-center ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
                    <div className={`flex items-center ${isSender ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                      <img
                        src={Imageformat(m.sender_profile_image)}
                        alt="프로필 이미지"
                        className='w-[40px] h-[40px] rounded-full object-cover mx-2' />
                    </div>
                    <div className={`rounded-xl ${isSender ? 'bg-blue-100' : 'bg-white'} max-w-[70%] py-2 px-3`}>
                      <p className='text-sm'>{m.content}</p>
                    </div>
                    <p>{m.id}</p>
                    <p>{lastmessage}</p>
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

