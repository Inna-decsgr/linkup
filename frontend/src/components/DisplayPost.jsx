import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { formatDate } from '../utils/Dateformat';
import PostLike from '../components/PostLike';
import PostComments from './PostComments';


export default function DisplayPost({ post }) {
  const navigate = useNavigate();
  const [showsetting, setShowSetting] = useState(false);
  const [showcomments, setShowComments] = useState(false);
  const settingRef = useRef(null);
  const userprofileimage = post.profile_image === 'default_profile.png' ? `/images/default_profile.png`
    : `http://localhost:5000/images/${post.profile_image}`;
  const handleRemove = (postid) => {
    console.log('삭제할 포스트 아이디', postid);
  }

  const paginationRef = useRef(null);  // bullet이 붙을 DOM 위치를 가리킴
  const swiperRef = useRef(null);   // Swiper 인스턴스를 위한 별도 ref
  useEffect(() => {
    // useEffect로 DOM이 준비된 뒤에 bullet 직접 수동으로 붙이기
    if (
      paginationRef.current &&
      swiperRef.current &&
      swiperRef.current.params.pagination &&
      typeof swiperRef.current.params.pagination !== 'boolean'
    ) {
      swiperRef.current.params.pagination.el = paginationRef.current;
      swiperRef.current.pagination.init();  // bullet 초기화
      swiperRef.current.pagination.render();  // bullet DOM 생성
      swiperRef.current.pagination.update(); // bullet 위치 및 상태 업데이트
      swiperRef.current.update();  // 전체 swiper 다시 렌더링(중)
    }
  }, [post.images]);

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


  return (
    <div>
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
            pagination={{
              clickable: true,
              el: null,  // 초기에는 DOM이 없는 시점에서 swiper를 실행하니까 pagination.el = paginationRef.current 하면 오류가 남. 그래서 먼저 null로 두고 나중에 수동 연결해주기
              type: 'bullets',
            }}
            onSwiper={(swiper) => { // swiper가 처음 실행될 때 내부 기능 전체를 이 ref에 담아두기
              swiperRef.current = swiper
            }}
          >
          {post.images.map((img, index) => (
            <SwiperSlide key={index}>
              <img src={`http://localhost:5000/images/${img}`} alt={`게시한 이미지 ${index}`} />
            </SwiperSlide>
          ))}
          <div ref={paginationRef} style={{ textAlign: 'center' }} />
          </Swiper>
        </div>
        <div className='flex'>
          <div>
            <PostLike postid={post.id} />
          </div>
          <div>
            <button onClick={() => setShowComments(prev => !prev)}>
              <i className="fa-regular fa-comment"></i>
            </button>
            <span>38</span>
          </div>
          {showcomments && (
            <div>
              <PostComments post={post} />
            </div>
          )}
        </div>
        {post.likedByFollowers && (
          <p>{post.firstLikedUser}님 외 여러명이 좋아합니다</p>
        )}
        <div className='flex'>
          <p>{post.userid}</p>
          <p>{post.content}</p>
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
    </div>
  );
}

