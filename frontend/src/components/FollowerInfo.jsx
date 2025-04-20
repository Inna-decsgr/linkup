import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Imageformat } from '../utils/Imageformat';
import Button from './ui/Button';

export default function FollowerInfo() {
  const { user_id } = useParams();
  const [followers, setFollowers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setKeyword(value);

    const filtered = followers.filter((user) =>
      user.userid.toLowerCase().includes(value.toLowerCase()) ||
      user.username.toLowerCase().includes(value.toLowerCase())
    );

    setResults(filtered);
  }


  useEffect(() => {
    const fetchPostFollowing = async () => {
      console.log('사용자 아이디', user_id);
      const res = await fetch(`http://localhost:5000/api/users/postfollowing/${user_id}`)
      const data = await res.json();
      console.log('팔로워 관련 정보들', data.followers);
      setFollowers(data.followers);
    };

    fetchPostFollowing();
  }, [user_id])


  return (
    <div>
      팔로워 정보
      <div className='pt-5'>
        <div>
          <div className='flex'>
            <input
              type="text"
              value={keyword}
              onChange={handleChange}
              className='border w-[300px] outline-none'
              placeholder='검색'
            />
            <Button text="취소" width="w-[60px]" />
          </div>
        </div>

        {keyword && (
          <>
            {results.length > 0 ? (
              results.map((user, index) => (
                <div key={index} className='w-full flex justify-between items-center'>
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
                    <button className='ml-3'>x</button>
                  </div>
                </div>
              ))
            ) : (
              <p>사용자를 찾을 수 없습니다.</p>
            )}
          </>
        )}

        {!keyword && followers.map((user, index) => {
          return (
            <div key={index} className='w-full flex justify-between items-center'>
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
                <button className='ml-3'>x</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

