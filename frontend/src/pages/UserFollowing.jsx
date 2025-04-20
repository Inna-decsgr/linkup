import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FollowerInfo from '../components/FollowerInfo';
import FollowingInfo from '../components/FollowingInfo';

export default function FollowInfo() {
  const { userid, user_id, username } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('followers');
  const [followerscount, setFollowersCount] = useState(null);
  const [followingscount, setFollowingsCount] = useState(null);

  useEffect(() => {
    const fetchPostFollowing = async () => {
      console.log('사용자 아이디', user_id);
      const res = await fetch(`http://localhost:5000/api/users/postfollowing/${user_id}`)
      const data = await res.json();
      console.log('사용자의 게시물과 팔로잉 관련 정보들', data);
      setFollowersCount(data.followercount);
      setFollowingsCount(data.followingcount)
    };

    fetchPostFollowing();
  }, [user_id])

  return (
    <div className='w-[500px] mx-auto relative bg-red-100'>
      <div className='flex items-center justify-center'>
        <button onClick={() => {navigate(`/profile/${userid}/${user_id}/${username}`)}} className='absolute top-0 left-0'>
          x
        </button>
        <p className='font-semibold'>{userid}</p>
      </div>

      <div className='p-7'>
        <div className='flex justify-between items-center'>
          <div>
            <button className='' onClick={() => setActiveSection('followers')}>
              <span className={`inline-block px-3 ${activeSection === 'posts' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
                {followerscount}팔로워
              </span>
            </button>
          </div>
          <div>
            <button className='' onClick={() => setActiveSection('followings')}>
              <span className={`inline-block px-3 ${activeSection === 'bookmarks' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
                {followingscount}팔로잉
              </span>
            </button>
          </div>
          <div>
            <button className='' onClick={() => setActiveSection('subscribe')}>
              <span className={`inline-block px-3 ${activeSection === 'userinfo' ? 'border-b-2 border-black' : 'border-b-2 border-transparent'} `}>
                구독
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className='px-7'>
        <div className='w-full mx-auto mt-5'>
          {activeSection === 'followers' && (
            <div>
              <FollowerInfo />
            </div>
          )}
          {activeSection === 'followings' && (
            <div>
              <FollowingInfo />
            </div>
          )}
          {activeSection === 'subscribe' && (
            <div>
              구독 정보
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

