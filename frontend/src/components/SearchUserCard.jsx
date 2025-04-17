import React from 'react';
import { Imageformat } from '../utils/Imageformat';


export default function SearchUserCard({ user, history, setHistory }) {
  const RemoveHistory = () => {
    // 로컬스토리지에서 기존 검색기록 가져오기
    const existing = JSON.parse(localStorage.getItem('searchhistory')) || [];
    // user.id와 일치하지 않는 항목만 남기기
    const updated = existing.filter(item => item.id !== user.id);

    // 로컬 스토리지에 다시 저장
    localStorage.setItem('searchhistory', JSON.stringify(updated));
    setHistory(updated);

    console.log('삭제된 후 검색 기록', updated);
  }


  return (
    <div className='flex justify-between items-center'>
      <div className='flex items-center'>
        <div>
          <img src={Imageformat(user.profile_image)} alt="사용자 프로필 이미지" className="w-[50px] h-[50px] rounded-full object-cover"/>
        </div>
        <div>
          <p>{user.userid}</p>
          {!history && user.mutualFollowerName ? (
            <p className='text-xs text-gray-600'>{user.mutualFollowerName}님{user.mutualOthersCount === 0 ? '이 팔로우합니다' : ` 외 ${user.mutualOthersCount}명이 팔로우합니다`}</p>
          ) : (
            <p>{user.username}</p>
          )}
        </div>
      </div>
      <div>
        {history && (
          <button onClick={RemoveHistory}>x</button>
        )}
      </div>
    </div>
  );
}

