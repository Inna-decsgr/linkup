import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PostFollowing() {
  const { user_id, username } = useParams();
  const [postcount, setPostCount] = useState(null);
  const [followerscount, setFollowersCount] = useState(null);
  const [followingscount, setFollowingsCount] = useState(null);
  

  useEffect(() => {
    const fetchPostFollowing = async () => {
      console.log('사용자 아이디', user_id);
      const res = await fetch(`http://localhost:5000/api/users/postfollowing/${user_id}`)
      const data = await res.json();
      console.log('사용자의 게시물과 팔로잉 관련 정보들', data);
      setPostCount(data.postcount);
      setFollowersCount(data.followercount);
      setFollowingsCount(data.followingcount)
    };

    fetchPostFollowing();
  }, [user_id])

  return (
    <div>
      <div>
        <div>
          <p className='font-bold text-sm mb-2'>{username}</p>
        </div>
        <div className='flex gap-10'>
          <div>
            <p className='font-bold'>{postcount}</p>
            <p>게시물</p>
          </div>
          <div>
            <p className='font-bold'>{followerscount}</p>
            <p>팔로워</p>
          </div>
          <div>
            <p className='font-bold'>{followingscount}</p>
            <p>팔로잉</p>
          </div>
        </div>
      </div>
    </div>
  );
}

