import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Imageformat } from '../utils/Imageformat';
import Button from './ui/Button';

export default function FollowingInfo() {
  const { user_id } = useParams();
  const [followings, setFollowings] = useState([]);

  useEffect(() => {
    const fetchPostFollowing = async () => {
      console.log('사용자 아이디', user_id);
      const res = await fetch(`http://localhost:5000/api/users/postfollowing/${user_id}`)
      const data = await res.json();
      console.log('팔로잉 관련 정보들', data);
      setFollowings(data.followings)
    };

    fetchPostFollowing();
  }, [user_id])

  return (
    <div>
      <p>정렬 기준 기본</p>
      <div className='pt-4'>
        {followings.map((user, index) => {
          return (
            <div key={index} className='w-full flex justify-between items-center py-2'>
              <div className='flex items-center'>
                <div>
                  <img src={Imageformat(user.profile_image)} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
                </div>
                <div className='pl-2'>
                  <p>{user.userid}</p>
                  <p>{user.username}</p>
                </div>
              </div>
              <div>
                <Button text="메시지" width="w-[90px]" />
                <button className='ml-3'>
                  <i className="fa-solid fa-bars text-sm"></i>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

