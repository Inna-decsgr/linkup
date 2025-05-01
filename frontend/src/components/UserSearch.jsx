import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import SearchUserCard from './SearchUserCard';



export default function UserSearch({cancel, istag, onSelectUser, isshare, onShareUser, setShowShare}) {
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


  const handlenavigate = ({user, isSelect}) => {
    // 기존 전체 검색 기록 불러오기
    const existingAll = JSON.parse(localStorage.getItem('searchhistory')) || {}
    // 현재 사용자 id에 해당하는 기록만 가져오기
    const existing = existingAll[state.user?.userid] || [];
    console.log('로컬스토리지에서 해당 사용자 검색 기록 가져오기', existing);
    // 중복 제거 후 filtered에 저장
    const filtered = existing.filter(item => item.userid !== user.userid);
    // 맨 앞에 새로 검색한 사용자 추가
    const updated = [user, ...filtered];
    // 전체 기록에도 새로 추가된 검색 기록 업데이트
    existingAll[state.user?.userid] = updated;
    // 새로 검색한 사용자가 포함된 updated 배열을 로컬 스토리지에 저장
    localStorage.setItem('searchhistory', JSON.stringify(existingAll));
    // 로컬스토리지에서 검색 기록 가져와서 stored에 저장 후 history 상태에 저장

    console.log('검색기록 업데이트', updated);
    setHistory(updated);

    if (!isSelect) {
      navigate(`/profile/${user.userid}/${user.id}/${user.username}`)
    }
  }

  useEffect(() => {
    if (!state.user?.userid) return;

    const existingAll = JSON.parse(localStorage.getItem('searchhistory')) || {}
    const stored = existingAll[state.user?.userid] || [];

    setHistory(stored);
  }, [state.user?.userid]);



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
    console.log('유저 선택됨', user);
    if (istag ) {
      onSelectUser(user);  // 태그할 사용자 선택
      cancel();  // 태그 컴포넌트 닫기
    } else if (isshare) {
      onShareUser(user);  // 공유할 사용자 선택
      setShowShare(false); // 공유 컴포넌트 닫기
    } else {
      cancel();
    }
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
            <div key={index} className='flex items-center justify-between cursor-pointer' onClick={() => handlenavigate({user, isSelect: false})}>
              <div>
                <SearchUserCard user={user} />
              </div>
              <div>
                {(istag) && (
                  <Button text="선택" width="w-[60px]" onClick={(e) => { e.stopPropagation(); selectUser(user) }} />
                )}
                {(isshare) && (
                  <Button text="보내기" width="w-[60px]" onClick={(e) => { e.stopPropagation(); selectUser(user) }} />
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
      {!istag && !isshare && history.length > 0 && (
        <div className='mt-7'>
          <div className='flex items-center justify-between text-sm'>
            <p>최근 검색</p>
            <button>모두 보기</button>
          </div>
          <div>
            {history.map((user, index) => (
              <div key={index} className='cursor-pointer'>
                <SearchUserCard user={user} history={true} setHistory={setHistory} onClick={() => navigate(`/profile/${user.userid}/${user.id}/${user.username}`)}/>
              </div>
            ))}
        </div>
      </div>
      )}
    </div>
  );
}

