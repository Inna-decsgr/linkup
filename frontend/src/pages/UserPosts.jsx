import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { formatDate } from '../utils/Dateformat';
import { useNavigate, useParams } from 'react-router-dom';
import PostLike from '../components/PostLike';


export default function UserPosts() {
  const navigate = useNavigate();
  const { user_id } = useParams();
  const [allposts, setAllposts] = useState([]);
  const [showsetting, setShowSetting] = useState(false);
  const settingRef = useRef(null);
  const userprofileimage = allposts ? allposts.map(p => p.profile_image === 'default_profile.png' ? `/images/default_profile.png`
    : `http://localhost:5000/images/${p.profile_image}`) : ''
  

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingRef.current && !settingRef.current.contains(e.target)) {
        setShowSetting(false);  // 바깥 영역 클릭 시 닫기
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  const handleRemove = (postid) => {
    console.log('삭제할 포스트 아이디', postid);
  }

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/posts/${user_id}`);
        const data = await res.json();
        setAllposts(data);
      } catch (err) {
        console.error('게시물 조회 중 오류 발생', err);
      }
    };

    fetchUserPosts();
  }, [user_id])


  return (
    <div className='w-[500px] mx-auto'>
      {allposts && allposts.length > 0 ? (
        <div>
          {allposts.map((post) => (
            <div key={post.id}>
              <div className='flex justify-between items-center relative'>
                <div className='flex items-center'>
                  <img src={userprofileimage} alt="사용자 프로필 이미지" className='w-[50px] h-[50px] object-cover rounded-full' />
                  <p>{post.userid}</p>
                  <p className='pl-4'>{formatDate(post.created_at)}</p>
                </div>
                <div className='relative' ref={settingRef}>
                  <button onClick={() => {setShowSetting(true)}}>
                    <i className="fa-solid fa-gear"></i>
                  </button>
                </div>
                {showsetting && (
                  <div className='absolute top-[50px] right-[-20px] bg-red-100 z-10 p-4 text-center text-sm'>
                    <button onClick={() => {console.log('편집');}}>편집</button><br/>
                    <button onClick={() => handleRemove(post.id)}>삭제</button>
                  </div>
                )}
              </div>
              <div>
                <Swiper
                  slidesPerView={1}
                  modules={[Pagination]}
                  pagination={{clickable: true, el: '.custom-pagination'}}
                >
                  {post.images.map((img, index) => (
                  <SwiperSlide key={index}>
                    <img src={`http://localhost:5000/images/${img}`} alt={`게시한 이미지 ${index}`} />
                  </SwiperSlide>
                ))}
                </Swiper>
                <div className="custom-pagination" style={{ textAlign: 'center' }}></div>
              </div>
              <div className='flex'>
                <div>
                  <PostLike postid={post.id} />
                </div>
                <div>
                  <button>
                    <i className="fa-regular fa-comment"></i>
                  </button>
                  <span>38</span>
                </div>
              </div>
              <div>
                <p>님 외 여러명이 좋아합니다</p>
                <div className='flex'>
                  <p>{post.userid}</p>
                  <p>{post.content}</p>
                </div>
              </div>
              <div>
                <p>(팔로우 하는 사람중에 댓글 쓴 사람의 아이디와 댓글 내용)</p>
              </div>
              <div>
                {post.tagged_users.map(((u, index) => (
                  <button key={index} onClick={() => navigate(`/profile/${u.userid}`)}>@{u.userid}</button>
                )))}
              </div>
            </div>
            
          ))}
        </div>
      ) : (
          <div>
            아직 작성한 게시물이 없습니다
          </div>
      )}
    </div>
  );
}

