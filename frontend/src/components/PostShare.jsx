import React, { useCallback, useEffect, useState } from 'react';
import UserSearch from './UserSearch';
import { useAuth } from '../context/AuthContext';

export default function PostShare({ post, setShowShare }) {
  const { state } = useAuth();
  const [shareuser, setShareUser] = useState('');


  const sharePost = useCallback(async () => {
    if (shareuser && shareuser.id) {
      const res = await fetch(`http://localhost:5000/api/post/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: state.user?.id,
          partnerid: shareuser.id,
          post
        }),
      });
      const data = await res.json();
      console.log('공유한 결과', data);
    } else {
      console.log('상대방 undefined');
    }
  }, [shareuser, state.user?.id, post]);

  
  useEffect(() => {
    if (shareuser && shareuser.id) {
      sharePost();  // 상태가 설정된 다음에 실행됨
    }
  }, [shareuser, sharePost]);


  return (
    <div>
      <UserSearch isshare={true} onShareUser={setShareUser} setShowShare={setShowShare} />
    </div>
  );
}

