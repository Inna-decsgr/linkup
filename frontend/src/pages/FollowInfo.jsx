import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function FollowInfo() {
  const { userid, user_id, username } = useParams();
  console.log('사용자 아이디', user_id);
  console.log('사용자 이름', username);
  const navigate = useNavigate();

  return (
    <div className='w-[500px] mx-auto relative bg-red-100'>
      <div className='flex items-center justify-center'>
        <button onClick={() => {navigate(`/profile/${userid}/${user_id}/${username}`)}} className='absolute top-0 left-0'>
          x
        </button>
        <p className='font-semibold'>{userid}</p>
      </div>
      <div>
        
      </div>
    </div>
  );
}

