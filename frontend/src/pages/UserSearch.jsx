import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function UserSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    setKeyword(e.target.value);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('키워드', keyword);

    try {
      const response = await fetch(`http://localhost:5000/api/search?keyword=${encodeURIComponent(keyword)}`);
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
  }



  return (
    <div className='w-[500px] mx-auto bg-yellow-100'>
      <p>사용자 검색 페이지</p>
      <div>
        <div>
          <input
            type="text"
            onChange={handleChange}
            className='border w-[300px] outline-none'
            placeholder='검색'
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button text="취소" width="w-[60px]" onClick={() => navigate('/')}/>
      </div>
      <div>
        {setResults.length > 0 ? (
          results.map((user, index) => (
            <div key={index} className='flex cursor-pointer' onClick={() => navigate(`/profile/${user.userid}`)}>
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

