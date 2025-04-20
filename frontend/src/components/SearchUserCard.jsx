import React from 'react';
import { Imageformat } from '../utils/Imageformat';
import { useAuth } from '../context/AuthContext';


export default function SearchUserCard({ user, history, setHistory, onClick}) {
  const { state } = useAuth();

  const RemoveHistory = () => {
    const currentUserId = state.user?.userid;
    if (!currentUserId) return;

    // 로컬스토리지에서 기존 검색기록 가져오기
    const existingAll = JSON.parse(localStorage.getItem('searchhistory')) || {};

    // 현재 사용자 사용자 기록 중 user.id와 일치하지 않는 기록만 남기기
    const existing = existingAll[currentUserId] || [];
    // user.id와 일치하지 않는 항목만 남기기
    const filtered = existing.filter(item => item.userid !== user.userid);

    // 필터링된 기록을 다시 사용자 아이디에 저장
    existingAll[currentUserId] = filtered;

    // 로컬 스토리지에 전체 업데이트
    localStorage.setItem('searchhistory', JSON.stringify(existingAll));
    // 상태도 업데이트
    setHistory(filtered);
  }


  return (
    <div className='flex justify-between items-center' onClick={onClick}>
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
          <button onClick={(e) => { e.stopPropagation(); RemoveHistory(); }}>x</button>
        )}
      </div>
    </div>
  );
}

