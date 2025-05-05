import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Imageformat } from '../utils/Imageformat';
import { formatTimeAgo } from '../utils/formatTimeago';
import { useNavigate } from 'react-router-dom';

export default function MessageList() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [messagelist, setMessageList] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState([]);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');


  const handleChange = (e) => {
    setKeyword(e.target.value);
    
    // 디바운스 처리
    const timer = setTimeout(() => {
      setDebouncedKeyword(e.target.value);  // 이때 keyword 말고 최신 값 e.target.value를 넘겨야함
    }, 300);
    
    return () => clearTimeout(timer);
  }
  // 그리고 이걸 따로 useEffect에서 찍어
  useEffect(() => {
    console.log('디바운스 완료된 키워드', debouncedKeyword);
  }, [debouncedKeyword]);

  useEffect(() => {
    if (debouncedKeyword) {
      const filtered = messagelist.filter(m => m.username.includes(debouncedKeyword) || m.userid.includes(debouncedKeyword));
      console.log('필터링한 결과', filtered);

      // 검색어로 필터링한 결과를 result에 저장
      setResult(filtered);
    } else {
      setResult([]);
    }
  }, [debouncedKeyword, messagelist])


  useEffect(() => {
    const fetchAllMessageList = async () => {
      const res = await fetch(`http://localhost:5000/api/allmessages/list/${state.user?.id}`);
      const data = await res.json();
      console.log('로그인한 사용자가 속해있는 대화방 리스트', data);
      setMessageList(data.partners);
    }
    fetchAllMessageList();
  }, [state.user?.id])


  const showMessage = (msg) => {
    if (!msg.isRead) return '전송됨';

    if (msg.isRead && msg.unreadCountFromPartner > 0) return '새 메시지';

    // 상대방 메시지는 다 읽었지만, 나는 아직 답장을 안 한 상태
    if (
      msg.isRead &&
      msg.unreadCountFromPartner === 0 &&
      msg.myLastReadMessageId > msg.lastMessageId
    ) {
      return msg.lastReadMessageContentFromPartner || '';
    }

    // 그 외에는 그냥 '읽음 시간' 보여주기
    return msg.lastReadTime ? formatTimeAgo(msg.lastReadTime) : '';
  };




  return (
    <div className='w-[500px] mx-auto'>
      <div>
        <form className='relative text-sm'>
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-[9px] text-gray-400"></i>
          <input
            type="text"
            value={keyword}
            onChange={handleChange}
            className='border py-1 pl-9 w-full rounded-md mb-6'
            placeholder='검색'
          />
        </form>
      </div>
      <p>메시지</p>
      <div>
        {(keyword ? result : messagelist).length > 0 ? (
          (keyword ? result : messagelist).map((msg) => (
            <div key={msg.partner_id} className='flex items-center border p-2 rounded-md cursor-pointer' onClick={() => navigate(`/dm/${state.user?.id}/${msg.partner_id}`, {state: {partnername:msg.username, partner_id:msg.userid, profileimage: msg.profile_image}})}>
              <img src={Imageformat(msg.profile_image)} alt="상대방 프로필 이미지" className='w-[50px] h-[50px] rounded-full object-cover'/>
              <div className="w-full flex justify-between items-center pl-2">
                <div>
                  <p className="text-sm font-bold">{msg.username}</p>
                  <p className='text-xs text-gray-600'>{showMessage(msg)}</p>
                </div>
                {msg.isRead && msg.unreadCountFromPartner === 0 && msg.myLastReadMessageId > msg.lastMessageId && (
                  <div className='w-[8px] h-[8px] bg-violet-500 rounded-full mr-3'></div>
                )}
              </div>
            </div>
          ))
        ) : (
            <div className='text-center text-gray-500 py-4'>
              <p>검색 결과가 없습니다.</p>
            </div>
        )}
      </div>
    </div>
  );
}

