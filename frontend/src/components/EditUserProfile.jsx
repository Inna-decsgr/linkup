import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';


export default function EditUserProfile({ user, setisEdit }) {
  const { dispatch } = useAuth();
  const [editUser, setEditUser] = useState({
    userid: '',
    username: '',
    email: '',
    telephone: '',
    profile_image: user.profile_image || 'default_profile.png'
  });
  const [previewImage, setPreviewImage] = useState(
    user.profile_image === 'default_profile.png'
      ? `/images/default_profile.png`
      : `http://localhost:5000/images/${user.profile_image}`
  );
  const [selectedFile, setSelectedFile] = useState(null);  // 선택된 새 이미지

  const isChanged = () => {
    return (
      user.userid !== editUser.userid ||
      user.username !== editUser.username ||
      user.email !== editUser.email ||
      user.telephone !== editUser.telephone ||
      selectedFile !== null  // 이미지가 새로 선택된 경우
    );
  }
  const handleSubmit = async () => {
    if (!isChanged()) return;

    const formData = new FormData();
    formData.append('id', user.id);
    formData.append('userid', user.userid);
    formData.append('username', user.username);
    formData.append('email', editUser.email);
    formData.append('telephone', editUser.telephone);

    if (selectedFile) {
      formData.append('profile_image', selectedFile);
    }


    const response = await fetch('http://localhost:5000/api/editprofile', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      // context랑 localStorage에 사용자 정보 업데이트
      dispatch({ type: 'LOGIN', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      console.log('수정된 사용자 정보', data);
      setisEdit(false);
    } else {
      alert(data.message || '사용자 정보 수정 실패')
    }
  }

  useEffect(() => {
    if (user) {
      setEditUser({
        userid: user.userid || '',
        username: user.username || '',
        email: user.email || '',
        telephone: user.telephone || ''
      });
    }
  }, [user]);

  return (
    <div className='flex justify-between'>
      <div>
        <p>사용자 정보 수정</p>
        <form>
          <div>
            <label>아이디</label>
            <input
              type="text"
              name="userid"
              value={editUser.userid}
              onChange={(e) => setEditUser({ ...editUser, userid: e.target.value})}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <div>
            <label>프로필 이미지</label>
            <div>
              <img src={previewImage} alt="프로필 미리보기" className='w-[100px] h-[100px] object-cover rounded-full' />
              <input
                type="file"
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSelectedFile(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label>사용자 이름</label>
            <input
              type="text"
              name="username"
              value={editUser.username}
              onChange={(e) => setEditUser({ ...editUser, username: e.target.value})}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <div>
            <label>이메일</label>
            <input
              type="email"
              name="email"
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value})}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
          <div>
            <label>전화번호</label>
            <input
              type="tel"
              name="telephone"
              value={editUser.telephone}
              onChange={(e) => setEditUser({ ...editUser, telephone: e.target.value})}
              className='border ml-2 rounded-sm'
              required
            />
          </div>
        </form>
      </div>
      <div>
        <button
        type='button'
        disabled={!isChanged()}
        className={`border py-1 px-2 text-xs font-bold rounded-lg ${!isChanged() ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSubmit}>수정 완료</button>
      </div>
    </div>
  );
}

