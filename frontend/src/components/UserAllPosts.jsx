import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserAllPosts({ user_id, userid, post, multiple }) {
  const navigate = useNavigate();


  const handleMove = () => {
    navigate(`/profile/${userid}/${user_id}/posts`)
  }

  return (
    <div>
      <div className='grid grid-cols-3 gap-[10px] w-full'>
        {post && post.map((p) => (
          <button key={p.postid} onClick={handleMove} className='relative'>
            <img src={ `http://localhost:5000/images/${p.firstimage}`} alt="첫번째 이미지" className='w-[160px] h-[280px] object-cover' />
            {multiple && <span className='absolute top-1 right-2'><i className="fa-solid fa-square text-white"></i></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

