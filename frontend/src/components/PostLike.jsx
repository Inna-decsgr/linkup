import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PostLike({ postid }) {
  const { state } = useAuth();
  const [like, setLike] = useState(false);

  const toggleLike = async () => {
    console.log('라이크 토글', postid, state.user?.id);
    const res = await fetch('http://localhost:5000/api/posts/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_id: postid,
        user_id: state.user?.id,
      }),
    });
    const data = await res.json();
    console.log('좋아요한 결과', data);

    setLike(data.isLike)
  }

  // 좋아요 초기 상태 가져오기
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!state.user?.id) return;
      
      try {
        const res = await fetch(`http://localhost:5000/api/posts/like/status?post_id=${postid}&user_id=${state.user?.id}`);
        const data = await res.json();
        console.log('좋아요 상태', data);
        setLike(data.isLike);
      } catch (error) {
        console.error('좋아요 상태 가져오기 실패', error);
      }
    };

    fetchLikeStatus();
  }, [postid, state.user?.id]);

  return (
    <div>
      <button onClick={toggleLike}>
        <i className={`fa-${like ? 'solid' : 'regular'} fa-heart`}></i>
      </button>
      <span>1,256</span>
    </div>
  );
}

