import React, { useEffect, useState } from 'react';
import 'swiper/css';
import 'swiper/css/pagination';
import { useParams } from 'react-router-dom';
import DisplayPost from '../components/DisplayPost';


export default function UserPosts() {
  const { user_id } = useParams();
  const [allposts, setAllposts] = useState([]);


  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${user_id}`);
        const data = await res.json();
        setAllposts(data);
      } catch (err) {
        console.error('게시물 조회 중 오류 발생', err);
      }
    };

    fetchUserPosts();
  }, [user_id])


  return (
    <div className='w-[500px] mx-auto'>
      {allposts && allposts.length > 0 ? (
        <div>
          {allposts.map((post) => (
            <div key={post.id}>
              <DisplayPost post={post} />
            </div>
          ))}
        </div>
      ) : (
          <div>
            아직 작성한 게시물이 없습니다
          </div>
      )}
    </div>
  );
}

