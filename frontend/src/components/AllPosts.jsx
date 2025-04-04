import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DisplayPost from './DisplayPost';

export default function AllPosts() {
  const { state } = useAuth();
  const [posts, setPosts] = useState([]);
  const userid = state.user?.id;
  useEffect(() => {
    const fetchFollowersPost = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/followers/posts/${userid}`);
        const data = await res.json();
        console.log('팔로워들 게시물 조회', data.postResults);
        setPosts(data.postResults);
      } catch (error) {
        console.error('서버 에러', error);
      }
    };

    fetchFollowersPost();
  }, [userid])


  return (
    <div>
      {posts && posts.map((post) => {
        return (
          <div key={post.id}>
            <DisplayPost post={post} />
          </div>
        )
      })}
    </div>
  );
}

