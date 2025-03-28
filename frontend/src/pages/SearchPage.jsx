import React from 'react';
import UserSearch from '../components/UserSearch';
import { useNavigate } from 'react-router-dom';


export default function SearchPage() {
  const navigate = useNavigate();

  return (
    <div className='w-[500px] mx-auto bg-yellow-100'>
      <p>사용자 검색 페이지</p>
      <UserSearch cancel={() => navigate('/')} />
    </div>
  );
}

