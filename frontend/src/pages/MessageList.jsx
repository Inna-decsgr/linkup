import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Imageformat } from '../utils/Imageformat';
import { formatTimeAgo } from '../utils/formatTimeage';
import { useNavigate } from 'react-router-dom';

export default function MessageList() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [messagelist, setMessageList] = useState([]);

  useEffect(() => {
    const fetchAllMessageList = async () => {
      const res = await fetch(`http://localhost:5000/api/allmessages/list/${state.user?.id}`);
      const data = await res.json();
      console.log('로그인한 사용자가 속해있는 대화방 리스트', data);
      setMessageList(data.partners);
    }
    fetchAllMessageList();
  }, [state.user?.id])


  return (
    <div className='w-[500px] mx-auto'>
      <p>다이렉트 메세지 리스트 페이지</p>
      <p>로그인한 사용자가 여태 디엠을 나눴던 모든 사용자와의 디엠 리스트 보여주는 페이지</p>
      <div>
        {messagelist.map((msg, index) => {
          return (
            <div key={index} className='flex items-center border p-2 rounded-md cursor-pointer' onClick={() => navigate(`/dm/${state.user?.id}/${msg.partner_id}`, {state: {partnername:msg.username, partner_id:msg.userid, profileimage: msg.profile_image}})}>
              <img src={Imageformat(msg.profile_image)} alt="상대방 프로필 이미지" className='w-[50px] h-[50px] rounded-full object-cover'/>
              <div className='pl-2'>
                <p className='text-sm'>{msg.username}</p>
                <p className='text-xs text-gray-500'>{ formatTimeAgo(msg.lastReadTime)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

