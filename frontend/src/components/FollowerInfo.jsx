import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Imageformat } from '../utils/Imageformat';
import Button from './ui/Button';

export default function FollowerInfo() {
  const { user_id } = useParams();
  const [followers, setFollowers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

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

        {/** 사용자가 검색한 검색 키워드가 있으면서 검색 결과가 있다면 검색 결과를 보여주기 */}
        {keyword && (
          <>
            {results.length > 0 ? (
              results.map((user, index) => (
                <div key={index} className='w-full flex justify-between items-center'>
                  <div className='flex items-center w-[300px] cursor-pointer' onClick={() => {navigate(`/profile/${user.userid}/${user.id}/${user.username}`)}}>
                    <div>
                      <img src={Imageformat(user.profile_image)} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
                    </div>
                    <div className='pl-2'>
                      <p>{user.userid}</p>
                      <p>{user.username}</p>
                    </div>
                  </div>
                  <div>
                    <Button text="메시지" width="w-[90px]" onClick={() => {navigate(`/dm/${user_id}/${user.id}`)}}/>
                    <button className='ml-3'>x</button>
                  </div>
                </div>
              ))
            ) : (
              <p>사용자를 찾을 수 없습니다.</p>
            )}
          </>
        )}

        {/** useEffect 에서 팔로워 목록을 가져와서 보여주는데 keyword가 없을 때만 보여주기. 즉, 사용자가 아직 검색을 하기 전이거나 검색하다가 지워서 키워드가 없을 경우에는 팔로워 목록을 보여주고 키워드가 있을 때는 검색 결과가 보이도록 조건 추가 */}
        {!keyword && followers.map((user, index) => {
          return (
            <div key={index} className='w-full flex justify-between items-center'>
              <div className='flex items-center w-[300px] cursor-pointer' onClick={() => {navigate(`/profile/${user.userid}/${user.id}/${user.username}`)}}>
                <div>
                  <img src={Imageformat(user.profile_image)} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
                </div>
                <div className='pl-2'>
                  <p>{user.userid}</p>
                  <p>{user.username}</p>
                </div>
              </div>
              <div>
                <Button text="메시지" width="w-[90px]" onClick={() => {navigate(`/dm/${user_id}/${user.id}`)}} />
                <button className='ml-3'>x</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

