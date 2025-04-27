import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import socket from '../socket.js'
import { Imageformat } from '../utils/Imageformat';
import { useAuth } from '../context/AuthContext.js';
import { format, isToday, isYesterday } from 'date-fns';
import ko from 'date-fns/locale/ko';
import '../index.css'


export default function DirectMessage() {
  const { state } = useAuth();
  const { userid, partnerid } = useParams();  // 대화하는 상대방의 "id" (11)
  const [ispartner, setIsPartner] = useState(false);

  const location = useLocation();
  const partner = location.state;
  const partnername = partner?.partnername;
  const partner_id = partner?.partner_id;  // gildong_ 파트너가 지정한 아이디
  const partnerimage = partner?.profileimage;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastmessage, setLastMessage] = useState('');
  const [roomid, setRoomId] = useState('');
  const scrollRef = useRef(null);

  // 이전 대화 가져와서 보여주고 메세지 읽음 처리
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

        const savedLastMessage = localStorage.getItem(`lastMessage_${roomid}`);
        if (savedLastMessage) {
          setLastMessage(savedLastMessage);
        }

        // 새로 받은 메세지가 있다면 이 대화방에 들어왔을 때 읽음 처리를 해야함
        // 메세지 읽었다고 서버에 알리기(실시간 읽음 처리 위해서 socket으로 처리)
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

      // 로컬 스토리지에 저장
      localStorage.setItem(`lastMessage_${roomid}`, messageid);
      // 상태에도 반영
      setLastMessage(messageid);
    };

    // read_message_update 소켓 이벤트가 서버에서 발생되면, handleReadUpdate 함수를 실행해줘라는 뜻
    // 자바스크립트에서 함수는 그 자체로 값이 되기 때문에 handleReadUpdate 처럼 () 없이 전달하면 함수를 실행하지 않고
    // 참조만 전달한다는 뜻이다. 즉 handleReadUpdate 함수를 socket.io가 이벤트가 발생했을 때 실행할 콜백으로 기억해두는 것!
    socket.on('read_message_update', handleReadUpdate);
    return () => {   // 그리고 언마운트되면 read_message_update 소켓 이벤트 해지
      socket.off('read_message_update', handleReadUpdate);
    }

  }, [roomid, userid, partnerid, partner_id]);


  // 사용자가 메세지를 보내면 서버에서 메세지를 저장한 다음 "나 이 메세지 디비에 저장했어!" 하고 알려주는데
  // 우리는 디비에 저장한 이 메세지에 대한 정보가 필요하기 때문에 socket.on("send_message", { ... })로 받아와서 해당 메세지를
  // handleReceiveMessage에서 처리함.
  // 내가 보낸 메세지도 화면에 표시되어야하니까 setMessages((prev) => [...prev, msg]) 로 화면에 렌더링 함
  // 그리고 socket.join으로 대화방에 속한 두 유저가 실시간 대화중이라면 읽음 처리를 실시간으로 해줘야하기 때문에
  // read_message 소켓 이벤트를 handleReceiveMessage 함수 내에서 수행
  useEffect(() => {
    // 새로 보내는 메세지의 데이터에 id가 없어서 마지막 메세지인지 비교를 할 수 없음
    // 그래서 id가 포함된 메세지 정보를 setMessages로 해서 저장하면 비교 가능함!
    const handleReceiveMessage = (msg) => {
      console.log('실시간으로 받은 메시지:', msg);
      setMessages((prev) => {
        const exists = prev.some(m => m.id === msg.id);
        if (exists) return prev;  // 이미 같은 메세지가 있다면 추가 X
        return [...prev, msg];
      });

      // 메시지를 추가한 다음에, 내가 이 메시지를 읽었다고 알림
      socket.emit('read_message', {
        roomid: msg.dm_room_id,
        userid: Number(userid),
        messageid: msg.id
      });
    };
    
    socket.on("send_message", handleReceiveMessage);
    return () => {
      // 정확히 동일한 콜백을 제거해야 중복 방지됨!!
      socket.off("send_message", handleReceiveMessage);
    };
  }, [userid]);


  // 컴포넌트가 마운트되거나 roomid가 바뀔 때 클라이언트가 해당 대화방에 들어왔다고 소켓으로 서버에 알려야함
  useEffect(() => {
    socket.emit('join_room', roomid);  // join_room 소캣 이벤트를 보내서 서버에 "나 이 대화방에 들어갈게!"라고 알림\

    // 서버에서 대화방에 참여중인 사용자들에게 누가 참여중인지 알리면 여기서 socket.on('room_users', { ... })로 받음
    socket.on('room_users', (data) => {
      console.log('현재 방 참여자들:', data.users);

      // 지금 접속 중인 사용자 수를 기준으로 나를 제외하고 다른 사람이 있으면 = 2명 이상이면
      if (data.users.length > 1) {
        setIsPartner(true);
      } else {
        setIsPartner(false);
      }
    });

    return () => {  // 채팅방 페이지를 나가게 되거나 다른 채팅방으로 이동해서 roomid가 변경되면 자동으로 실행되면서 해당 채팅방에서는 leave 됨
      socket.emit('leave_room', roomid); // 서버에 "나 이 방에서 이제 나간다!" 라고 알림
    }
  }, [roomid])

  
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

    // socket으로 서버에 "나 메세지 보냈어!"하고 알림
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
    <div className='relative bg-red-100 w-[500px] h-[80vh] mx-auto flex flex-col border p-2'>
      <div className='absolute top-0 left-0 w-full bg-red-100 z-50 p-3'>
        <div className='flex items-center'>
          <img src={Imageformat(partnerimage)} alt="상대방 프로필 이미지" className='w-[40px] h-[40px] rounded-full object-cover mr-2' />
          <div className='relative'>
            <div className='relative'>
              <p className='text-sm font-bold'>{partnername}</p>
              <p className='text-[12px] text-gray-600'>{partner_id}</p>
            </div>
            {ispartner && (
              <div className='absolute top-[6px] left-[45px] w-[7px] h-[7px] bg-violet-500 rounded-full'></div>
            )}
          </div>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        <div className='mt-[60px]'>
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
      </div>
      <div className='flex items-center text-sm'>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='메세지 보내기...'
            className='border py-1 px-2 w-[450px]'
          />
        </form>
      </div>
    </div>
  );
}
