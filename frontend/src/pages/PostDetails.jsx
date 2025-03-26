import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';


export default function PostDetails() {
  const location = useLocation();
  // useMemo로 selectedImages를 고정
  const selectedImages = useMemo(() => {
    return location.state?.images || [];
  }, [location.state]);


  return (
    <div className='w-[500px] mx-auto'>
      <div className='flex items-center justify-between'>
        <p>문구</p>
        <Button text="확인" width="w-[60px]" />  
      </div>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        {selectedImages.map((src, index) => (
          <div key={index}>
            <img
              src={src}
              alt={`선택된 이미지 ${index}`}
              className="w-full rounded"
            />
          </div>
        ))}
      </div>
      <div>
        <input
          type="textarea"
          placeholder='문구 추가..'
          className='w-[500px] h-[100px] border'
        />
      </div>
      <div className='flex justify-between items-center pt-5'>
        <div>
          <p><i class="fa-solid fa-user"></i> 사람태그</p>
        </div>
        <button><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>
  );
}
