import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserAllPosts({ user_id, userid }) {
  const [allposts, setAllposts] = useState([]);
  const [multiple, setMultiple] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${user_id}`);
        const data = await res.json();
        console.log('게시물222', data);
        const hasMultipleImages = data.some(post => post.images?.length > 1);
        setMultiple(hasMultipleImages);

        const simplified = data.map(post => ({
          firstimage: post.images?.[0],
          postid: post.id
        }));
        setAllposts(simplified);
        console.log(`${userid}가 작성한 게시물들 조회하기`, simplified);
      } catch (err) {
        console.error('게시물 조회 중 오류 발생', err);
      }
    };

    fetchUserPosts();
  }, [user_id, userid]);

  const handleMove = () => {
    navigate(`/profile/${userid}/${user_id}/posts`)
  }

  return (
    <div>
      <div className='grid grid-cols-3 gap-[10px] w-full'>
        {allposts && allposts.map((p) => (
          <button key={p.postid} onClick={handleMove} className='relative'>
            <img src={ `http://localhost:5000/images/${p.firstimage}`} alt="첫번째 이미지" className='w-[160px] h-[280px] object-cover' />
            {multiple && <span className='absolute top-1 right-2'><i className="fa-solid fa-square text-white"></i></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

