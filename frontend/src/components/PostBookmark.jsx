import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function PostBookmark({ post }) {
  const { state } = useAuth();
  const [postbookmark, setPostBookmark] = useState([]);

  const handleSubmit = async () => {
    console.log('저장할 포스트 아이디', post.id);

    const res = await fetch(`http://localhost:5000/api/posts/users/bookmarks?postid=${post.id}&userid=${state.user?.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    setPostBookmark(data.bookmarkedPostIds);

    console.log('포스트 저장 완료', data);
  }

  return (
    <div>
      <button onClick={handleSubmit}>
        <i className={`fa-${postbookmark.includes(post.id) ? "solid" : "regular"} fa-bookmark`}></i>
      </button>
    </div>
  );
}

