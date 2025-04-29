import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import UserProfile from  '../components/UserProfile'

export default function MyProfile() {
  const { userid } = useParams();
  const { state } = useAuth();
  const [user, setUser] = useState(null);

  const isMe = state.user?.userid === userid;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('파라미터', userid);
        const res = await fetch(`http://localhost:5000/api/users/${userid}`);
        const data = await res.json();
        console.log('특정 사용자 정보', data);
        setUser(data);
      } catch (error) {
        console.error('유저 정보 가져오기 실패', error);
      }
    };
    fetchUser();
  }, [userid])


  return (
    <>
      <UserProfile user={user} isMe={isMe} />
    </>
  );
}

