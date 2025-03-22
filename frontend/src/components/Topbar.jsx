import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';


export default function Topbar() {
  const { state, dispatch } = useAuth();

  useEffect(() => {
    console.log('로그인한 사용자', JSON.stringify(state.user));
  })

  const handleLogout = () => {
    // 로그아웃 로직
    dispatch({ type: 'LOGOUT' });  // 사용자 전역 상태 초기화
    localStorage.removeItem('user');  // 로컬스토리지에서 사용자 정보 삭제
  }
  

  return (
    <header className='w-full bg-red-100 p-4 flex justify-center'>
      {state.user ? (
        <div className='max-w-screen-xl w-full flex justify-between'>
          <p>(<i class="fa-solid fa-lock"></i>){state.user.userid}</p>
          <div className='flex space-x-4'>
            <button><i class="fa-solid fa-square-plus"></i></button>
            <button><i class="fa-solid fa-gear"></i></button>
            <button onClick={handleLogout}>로그아웃</button>
          </div>
        </div>
      ) : (
        <div>
          <p>linkup</p>
          <Link to='/login'><button>로그인</button></Link>
        </div>
      )}
    </header>
  );
}

