import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function EditPost() {
  const navigate = useNavigate();
  const location = useLocation();
  const post = location.state?.post;
  const fileInputRefs = useRef([]);

  const [content, setContent] = useState(post.content || '');
  const [images, setImages] = useState(post.images || []);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageClick = (index) => {
    // 이미지를 클릭하면 파일 선택창이 뜨도록 하고 싶은데 이미지 태그에는 파일 업로드 기능이 없으니까 보이지 않게 숨겨둔 <input type="file">을 대신 클릭시켜주는 함수
    fileInputRefs.current[index]?.click();  // 전달받은 index에 해당하는 이미지 클릭 시 숨겨둔 해당 input 트리거
  }

  const handleImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);  // 선택된 파일의 프리뷰용 임시 URL 만들기
      // images 상태 업데이트
      const newImages = [...images]; // newImage 배열에 기존 이미지들을 풀어서 저장해둬서 이미지 수정 준비

      // DB에는 file.name을 저장하고, 화면에서는 blob으로 프리뷰를 보여주도록 구성
      newImages[index] = {  // newImages 배열의 변경하고 싶은 이미지(해당 index)에 새로운 정보를 다시 저장시킴 
        file,
        preview: previewURL,
        filename: file.name,
      }
      setImages(newImages);  // 그리고 새로 설정된 이미지에 대한 정보를 setImages 상태 함수로 상태 저장해서 리렌더링때 사용
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('수정된 내용', content);
    console.log('이미지 목록', images);

    const formData = new FormData();
    formData.append('postid', post.id);
    formData.append('content', content);
    images.forEach((img, index) => {
      if (typeof img !== 'string') {
        // newImages 배열에 필요한 정보들(file, preview, filename)이 저장되면서 string + 객체가 섞여있음. 그래서 typeof img !== 'string' 조건으로 새로 선택한 파일만 서버에 전송해야하니까 이것만 필터링해주는 것
        // 이미지를 변경하기 전 기존 데이터는 '174838_jisoo.jpg' 이렇게 string 형식으로 되어있기 때문에 새로 선택된 데이터들을 보내려면 배열로 묶여있기 때문에 이미지가 string이 아닐 때(=새로 선택된 파일) 보낸다라고 조건을 주면 됨!
        formData.append('images', img.file); // File 객체만 전송
      }
    })

    const res = await fetch(`http://localhost:5000/api/posts/detail/edit`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    navigate('/');
    console.log('게시글 업데이트', data);
  }

  return (
    <div className='w-[500px] mx-auto bg-red-200 p-4'>
      <div className='flex justify-between items-center'>
        <button onClick={() => navigate('/')}>취소</button>
        <p>정보 수정</p>
        <button onClick={handleSubmit}>완료</button>
      </div>
      <div>
        <div className='flex items-center'>
          <img src={post.profile_image === 'default_profile.png' ? `/images/default_profile.png` : `http://localhost:5000/images/${post.profile_image}`} alt="사용자 프로필 이미지" className='w-[30px] h-[30px] object-cover rounded-full' />
          <p>{post.userid}</p>
        </div>

        <div className='grid grid-cols-3 gap-2'>
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={typeof image === 'string' ? `http://localhost:5000/images/${image}` : image.preview }
                alt={`게시물 이미지 ${index}`}
                className='w-[200px] h-[150px] object-cover rounded'
                onClick={() => handleImageClick(index)}
              />
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                ref={(el) => (fileInputRefs.current[index] = el)}
                onChange={(e) => handleImageChange(e, index)}
              />
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            value={content}
            onChange={handleContentChange}
            rows={4}
          />
        </form>
      </div>
    </div>
  );
}

