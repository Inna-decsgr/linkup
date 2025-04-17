import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import SearchUserCard from './SearchUserCard';



export default function UserSearch({cancel, istag, onSelectUser}) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState([]);
  const { state } = useAuth();

  const handleChange = (e) => {
    setKeyword(e.target.value);
  }

  const handleSubmit = useCallback(async (text) => {
    if (!text.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/search?keyword=${encodeURIComponent(text)}&user_id=${state.user?.id}&userid=${state.user?.userid}`);
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
  }, [state.user?.id, state.user?.userid]);


  const handlenavigate = (user) => {
    // 기존 검색 기록 가져와서 중복 제거 후 filtered에 저장
    const existing = JSON.parse(localStorage.getItem('searchhistory')) || [];
    const filtered = existing.filter(item => item.userid !== user.userid);
    // 맨 앞에 새로 검색한 사용자 추가
    const updated = [user, ...filtered];
    // 새로 검색한 사용자가 포함된 updated 배열을 로컬 스토리지에 저장
    localStorage.setItem('searchhistory', JSON.stringify(updated));
    // 로컬스토리지에서 검색 기록 가져와서 stored에 저장 후 history 상태에 저장
    const stored = JSON.parse(localStorage.getItem('searchhistory')) || [];
    console.log('검색기록에 추가된 사용자', stored);
    setHistory(stored);
    navigate(`/profile/${user.userid}/${user.id}/${user.username}`)
  }

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('searchhistory')) || [];
    setHistory(stored);
    console.log('검색 기록', stored);
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
        <div className='flex'>
          <input
            type="text"
            value={keyword}
            onChange={handleChange}
            className='border w-[300px] outline-none'
            placeholder='검색'
          />
          <Button text="취소" width="w-[60px]" onClick={cancel}/>
        </div>
      </div>
      <div>
        {setResults.length > 0 ? (
          results.map((user, index) => (
            <div key={index} className='flex items-center justify-between cursor-pointer' onClick={() => handlenavigate(user)}>
              <div>
                <SearchUserCard user={user} />
              </div>
              <div>
                {istag && (
                  <Button text="선택" width="w-[60px]" onClick={() => selectUser(user)}/>
                )}
              </div>
            </div>
          ))
        ) : (
          <div>
            <p className="text-gray-500 mt-4">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
      {!istag && history.length > 0 && (
        <div className='mt-7'>
          <div className='flex items-center justify-between text-sm'>
            <p>최근 검색</p>
            <button>모두 보기</button>
          </div>
          <div>
            {history.map((user, index) => (
              <div key={index} className='cursor-pointer' onClick={() => navigate(`/profile/${user.userid}/${user.id}/${user.username}`)}>
                <SearchUserCard user={user} history={true} setHistory={setHistory} />
              </div>
            ))}
        </div>
      </div>
      )}
    </div>
  );
}

