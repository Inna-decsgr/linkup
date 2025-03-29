import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import UserTag from '../components/UserTag';
import { useAuth } from '../context/AuthContext';


export default function PostDetails() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [usertag, setUserTag] = useState(false);
  // useMemo로 selectedImages를 고정
  const selectedImages = useMemo(() => {
    return location.state?.images || [];
  }, [location.state]);
  const previews = useMemo(() => {
    return location.state?.previews || [];
  }, [location.state]);
  const [taggedUser, setTaggedUser] = useState(null);
  const [caption, setCaption] = useState('')


  const handleSubmit = async () => {
    // 새 게시글 작성하는 로직
    console.log('선택된 이미지', selectedImages);
    console.log('게시물 문구', caption);
    console.log('태그할 사람', taggedUser);

    const formData = new FormData();

    // 이미지 배열 추가
    selectedImages.forEach((file) => {
      formData.append('images', file);
    });

    // 문구 추가
    formData.append('caption', caption);

    // 태그된 사용자 정보
    if (taggedUser) {
      formData.append('taggedUser', JSON.stringify(taggedUser));
    }
    formData.append('user_id', state.user.id)

    try {
      const response = await fetch('http://localhost:5000/api/newpost', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📛 서버 응답 에러:', errorText);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        console.log('게시 성공', data);
        navigate('/')
      } else {
        console.error(('게시 실패', data));
      }
    } catch (error) {
      console.error('서버 응답 에러:');
    }
  }

  useEffect(() => {
    const urls = selectedImages.map(file => URL.createObjectURL(file));
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedImages]);

  return (
    <div className='w-[500px] mx-auto'>
      <div className='flex items-center justify-between'>
        <p>문구</p>
        <Button text="게시" width="w-[60px]" onClick={handleSubmit}/>  
      </div>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        {previews.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`미리보기 ${index}`}
            className="w-full rounded"
          />
        ))}

      </div>
      <div>
        <textarea
          placeholder='문구 추가 . . .'
          className='w-[500px] h-[100px] border'
          value={caption}
          onChange={(e) =>  setCaption(e.target.value)}
        />
      </div>
      <div className='flex justify-between items-center pt-5'>
        <div>
          <p><i className="fa-solid fa-user"></i> 사람태그</p>
        </div>
        <div className='flex'>
          {taggedUser && <p>{taggedUser.userid}</p>}
          <button onClick={() => {setUserTag(true)}}><i className="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
      <div>
        {usertag && (
          <UserTag cancel={() => setUserTag(false)} onSelectedUser={setTaggedUser} />
        )}
      </div>
    </div>
  );
}
