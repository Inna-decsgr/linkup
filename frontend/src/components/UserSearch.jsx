import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';


export default function UserSearch({cancel, istag, onSelectUser}) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setKeyword(e.target.value);
  }

  const handleSubmit = useCallback(async (text) => {
    if (!text.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/search?keyword=${encodeURIComponent(text)}`);
      const data = await response.json();

      if (response.ok) {
        console.log('찾은 사용자', data);
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('서버 오류:', error);
    }
  }, []);


  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [keyword]);

  // 디바운스 완료된 키워드로 검색 요청
  useEffect(() => {
    if (debouncedKeyword) {
      handleSubmit(debouncedKeyword);
    } else {
      setResults([]);
    }
  }, [debouncedKeyword, handleSubmit])

  const selectUser = (user) => {
    console.log('유저 태그', user);
    onSelectUser(user);
    cancel();
  }


  return (
    <div>
      <div>
        <div>
          <input
            type="text"
            value={keyword}
            onChange={handleChange}
            className='border w-[300px] outline-none'
            placeholder='검색'
          />
        </div>
        <Button text="취소" width="w-[60px]" onClick={cancel}/>
      </div>
      <div>
        {setResults.length > 0 ? (
          results.map((user, index) => (
            <div key={index} className='flex items-center justify-between'>
              <div  className='flex cursor-pointer' onClick={() => navigate(`/profile/${user.userid}`)}>
                <div>
                  <img src={user.profile_image === 'default_profile.png'
                  ? '/images/default_profile.png'
                  : `http://localhost:5000/images/${user.profile_image}`
                  }
                  alt="프로필 이미지"
                  className="w-[50px] h-[50px] rounded-full object-cover"
                  />
                </div>
                <div>
                  <p>{user.userid}</p>
                  <p>{user.username}</p>
                </div>
              </div>
              <div>
                <div>
                  {istag && (
                    <Button text="선택" width="w-[60px]" onClick={() => selectUser(user)}/>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>
            <p className="text-gray-500 mt-4">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

