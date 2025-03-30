import React from 'react';
import UserPosts from '../components/UserPosts';
import { useAuth } from '../context/AuthContext';


export default function Home() {
  const { state } = useAuth();
  const userid = state.user?.id

  return (
    <div className='w-[500px] mx-auto'>
      <p>SNS 메인 화면</p>
      <UserPosts userid={userid} />
    </div>
  );
}

