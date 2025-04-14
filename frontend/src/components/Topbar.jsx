import React, { useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import Button from './ui/Button';


export default function Topbar() {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const profileImageUrl = state.user ? state.user.profile_image === 'default_profile.png'
  ? `/images/default_profile.png`
    : `http://localhost:5000/images/${state.user?.profile_image}`
  : '';


  useEffect(() => {
    console.log('로그인한 사용자', JSON.stringify(state.user));
  })

  const handleLogout = () => {
    // 로그아웃 로직
    dispatch({ type: 'LOGOUT' });  // 사용자 전역 상태 초기화
    localStorage.removeItem('user');  // 로컬스토리지에서 사용자 정보 삭제
    navigate('/login')
  }
  

  return (
    <header className='w-full bg-red-100 py-4 px-8 flex justify-center'>
      <div className='max-w-screen-xl w-full flex justify-between items-center'>
        <Link to="/" className="mr-4"><span className='font-bold text-xl'>Linkup</span><p className='inline-block pl-2 font-semibold text-sm'>@{state.user && <span>{state.user.userid}</span>}</p></Link>
        {state.user ? (
          <div className='flex space-x-5 items-center'>
            <Link to="/search"><i className="fa-solid fa-magnifying-glass"></i></Link>
            <Link to="/newpost"><i className="fa-solid fa-square-plus"></i></Link>
            <button onClick={() => navigate('/settings')}><i className="fa-solid fa-gear"></i></button>
            <Link to={`/profile/${state.user.userid}/${state.user.id}/${state.user.username}`}>
              <img src={profileImageUrl} alt="프로필 이미지" className='w-[40px] h-[40px] object-cover rounded-full'/>
            </Link>
            <Button text="로그아웃" width="w-[100px]" onClick={handleLogout} />  
          </div>
        ) : (
          <div className='flex space-x-4'>
            <Link to='/login'>
              <Button text="로그인" width="w-[100px]" />  
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

