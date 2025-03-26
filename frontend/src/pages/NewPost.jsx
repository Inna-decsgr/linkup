import React, { useRef, useState } from 'react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';


export default function NewPost() {
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef([]);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const files = e.target.files;
    if (files) {
      const newPreviews = Array.from(files).map(file =>
        URL.createObjectURL(file)
      );
       // 기존 previews + 새로운 previews 합치기
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  }

  const handleRemoveImage = (indexToRemove) => {
    setPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const handleNext = () => {
    if (previews) {
      navigate('/newpost/details', {
        state: {
        images: previews
        }
      })
    } else {
      alert('이미지를 최소 한 개 이상 선택해주세요.')
    }
  }

  return (
    <div className='w-[500px] mx-auto'>
      <div className='flex items-center justify-between'>
        <button><i className="fa-solid fa-xmark"></i></button>
        <p>새 게시물</p>
        <Button text="다음" width="w-[60px]" onClick={handleNext}/> 
      </div>

      <div>
        <input
          type="file"
          accept='image/*'
          className='hidden'
          ref={fileInputRef}
          multiple
          onChange={handleImageChange}
        />
        <div
          onClick={handleClick}
          className="flex justify-center items-center cursor-pointer w-[30px] h-[30px] border border-gray-300 rounded-full hover:bg-gray-100 transition my-5"
        >
          <i className="fa-solid fa-camera"></i>
        </div>
      </div>

      <div className=''>
        {previews && (
          <div className='grid grid-cols-2 gap-4 mt-4'>
            {previews.map((src, index) => (
              <div key={index}>
                <img
                  src={src}
                  alt={`preview-${index}`}
                  className='w-full h-auto object-cover rounded'
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

