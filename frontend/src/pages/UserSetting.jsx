import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import EditUserProfile from '../components/EditUserProfile';


export default function UserSetting() {
  const { state } = useAuth();
  const [isEdit, setisEdit] = useState(false);
  const profileImageUrl = state.user.profile_image === 'default_profile.png'
  ? `/images/default_profile.png`
  : `http://localhost:5000/images/${state.user.profile_image}`;

  return (
    <div>
      {!isEdit ? (
        <div className='flex justify-between'>
          <div>
            <p>사용자 정보</p>
            <img src={profileImageUrl} alt="프로필 이미지" className='w-[100px] h-[100px] object-cover rounded-full'/>
            <p>아이디 : { state.user.userid }</p>
            <p>사용자 이름 : {state.user.username}</p>
            <p>소개 : {state.user.bio}</p>
            <p>이메일 : {state.user.email}</p>
            <p>전화번호 : {state.user.telephone}</p>
          </div>
          <div>
            <button className='border py-1 px-2 text-xs font-bold rounded-lg' onClick={() => {setisEdit(true)}}>편집</button>
          </div>
        </div>
      ) : (
        <EditUserProfile user={state.user} setisEdit={setisEdit} />
      )}
    </div>
  );
}

