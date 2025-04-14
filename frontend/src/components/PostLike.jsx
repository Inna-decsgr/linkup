import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PostLike({ postid, showlikecount }) {
  const { state } = useAuth();
  const [like, setLike] = useState(false);
  const [likecount, setLikeCount] = useState(null);

  const toggleLike = async () => {
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

    setLike(data.isLike);
    setLikeCount(data.likecount);
  }

  // 좋아요 초기 상태 가져오기
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!state.user?.id) return;
      
      try {
        const res = await fetch(`http://localhost:5000/api/posts/like/status?post_id=${postid}&user_id=${state.user?.id}`);
        const data = await res.json();
        setLike(data.isLike);
        setLikeCount(data.likecount);
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
      {Number(likecount) > 0 && showlikecount && (
        <span>{likecount}</span>
      )}
    </div>
  );
}

