import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import UserAllPosts from './UserAllPosts';


export default function UserProfile({user, isMe}) {
  const [showallposts, setAllPosts] = useState(true);
  const [showuserinfo, setUserInfo] = useState(false);
  const profileImageUrl = user?.profile_image === 'default_profile.png'
  ? `/images/default_profile.png`
    : `http://localhost:5000/images/${user?.profile_image}`;
  
  const showAllUserPosts = () => {
    setAllPosts(true);
    setUserInfo(false);
  };
  const showUserInfo = () => {
    setAllPosts(false);
    setUserInfo(true);
  };

  useEffect(() => {
    console.log('사용자 프로필 이미지', user?.profile_image);
  })

  return (
    <div>
      <div className='flex flex-col items-center'>
        <div className='flex items-center w-[500px] '>
          <div className='pr-[40px]'>
            <img src={profileImageUrl} alt="프로필 이미지" className='w-[100px] h-[100px] object-cover rounded-full' />
          </div>
          <div className='flex gap-10'>
            <div>
              <p className='font-bold'>0</p>
              <p>게시물</p>
            </div>
            <div>
              <p className='font-bold'>0</p>
              <p>팔로워</p>
            </div>
            <div>
              <p className='font-bold'>0</p>
              <p>팔로잉</p>
            </div>
          </div>
        </div>
      </div>
      <div className='w-[500px] mx-auto'>
        <p className='text-left font-medium mt-4 mb-2'>@{user?.userid}</p>
        <div className='flex gap-2'>
          {isMe ? (
            <>
              <Button text="프로필 편집" width="w-[250px]" />
              <Button text="프로필 공유" width="w-[250px]" />
            </>
          ): (
              <>
                <Button text="팔로우" width="w-[250px]" />
                <Button text="메시지" width="w-[250px]" />
              </>
          )}
        </div>
      </div>
      <div className='flex w-[500px] mx-auto my-4 p-2'>
        <button className='basis-1/2' onClick={showAllUserPosts}>
          <span className={`inline-block px-3 ${showallposts ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
            <i className="fa-solid fa-camera-retro text-xl"></i>
          </span>
        </button>
        <button className='basis-1/2' onClick={showUserInfo}>
          <span className={`inline-block px-3 ${showuserinfo ? 'border-b-2 border-black' : 'border-b-2 border-transparent'}`}>
            <i className="fa-regular fa-user text-xl"></i>
          </span>
        </button>
      </div>
      <div className='w-[500px] mx-auto mt-5'>
        {showallposts ? (
          <UserAllPosts />
        ): (
          <p>사용자 정보 컴포넌트</p>
        )}
      </div>
    </div>
  );
}

